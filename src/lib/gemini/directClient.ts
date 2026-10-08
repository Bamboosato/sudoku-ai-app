import { countMistakes } from '../sudoku/board'
import { findSmartAIHint } from '../sudoku/hints'
import type { Grid, Hint } from '../sudoku/types'
import {
  type GeminiHintClientErrorCode,
  type GeminiHintRequest,
  type GeminiHintResponse,
  type HintLevel,
} from './types'

export const DEFAULT_MODEL = 'gemini-2.5-flash'

const LEVEL_INSTRUCTIONS_NORMAL: Record<HintLevel, string> = {
  1: '【レベル1: ノーヒント】具体的なマスも数字も言わないこと。「今は焦らず、ブロックや行を一つ選んで、すでに入っている数字を見直してみましょう」のように、着眼点の方向だけを促す。',
  2: '【レベル2: 着眼点】注目すべき範囲（「第◯ブロック」「行◯」「列◯」のいずれか）と、使える考え方（例: 隠れ1択、唯一候補）だけを伝える。特定のマスと答えの数字は言わないこと。',
  3: '【レベル3: マス特定】注目すべき具体的なマス（行・列）と、そこを決める根拠を説明する。ただし入る数字そのものは直接言わず、ユーザー自身が気づけるように導くこと。',
  4: '【レベル4: 直接回答】注目すべきマスと入る数字を明示し、なぜそうなるのかを論理的にステップで解説する。',
}

const LEVEL_INSTRUCTIONS_MISTAKE: Record<HintLevel, string> = {
  1: '【レベル1: 誤入力の存在のみ】具体的なマス（行・列）や数字は絶対に言わないこと。「入力済みの数字の中に誤りがあるようです。まずは各ブロックや行を落ち着いて見直してみましょう」のように、誤入力の存在と見直しだけを促す。',
  2: '【レベル2: 誤入力の範囲】誤入力が存在する大まかな範囲（「第◯ブロック」「行◯」「列◯」のいずれか）だけを伝える。具体的なマス（行・列）や数字は言わないこと。',
  3: '【レベル3: 誤入力マスの特定】誤入力が存在する具体的なマス（行・列）を特定し、そのマスを消去または見直すよう促す。ただし、正解の数字そのものは絶対に言わないこと。',
  4: '【レベル4: 誤入力の正解提示】誤入力が存在するマス（行・列）を特定し、「保存済みの正解では、このマスは◯です」と伝えること。推論根拠が存在しない場合は架空の推論や手法を捏造せず、保存済みの正解として案内すること。',
}

const SYSTEM_INSTRUCTION = `あなたは数独アプリの親切なコーチです。日本語で、人間味のある温かく簡潔なトーンで話してください（最大4文程度、絵文字は多くても1つ）。
- 「確定情報」に書かれた内容を厳守し、それ以外の答えを推測しないこと。
- 指定されたヒントレベルを厳守し、レベルが許す範囲を超えてマスや数字を漏らさないこと。
- 行・列は 1 始まりで表現すること（例: 「行3、列5」）。
- 盤面にミス（誤入力）がある場合は、次に進む前にまず誤入力の修正を優しく促すこと。`

function boardToText(board: Grid): string {
  return board
    .map((row, r) => `行${r + 1}: ` + row.map((n) => (n === 0 ? '.' : String(n))).join(' '))
    .join('\n')
}

export function buildPrompt(req: GeminiHintRequest): string {
  const wrongCells: string[] = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = req.board[r][c]
      if (v !== 0 && v !== req.solution[r][c]) wrongCells.push(`行${r + 1}列${c + 1}(入力: ${v})`)
    }
  }

  const local: Hint | null = findSmartAIHint(req.board, req.solution)
  const isMistakeMode = local?.kind === 'correction' || wrongCells.length > 0

  let target: string
  if (local?.kind === 'correction') {
    const block = Math.floor(local.row / 3) * 3 + Math.floor(local.col / 3) + 1
    const correctVal = req.solution[local.row][local.col]
    target = `【誤入力の見直し】行${local.row + 1}、列${local.col + 1} の入力「${local.currentNum}」は誤り（第${block}ブロック）。保存済みの正解は「${correctVal}」。※推論根拠は未導出のため、架空の論理解説は作らず「保存済みの正解では${correctVal}」と案内すること。`
  } else if (local?.kind === 'placement') {
    target = `行${local.row + 1}、列${local.col + 1} に「${local.num}」（手法: ${local.type}。根拠メモ: ${local.reason}）`
  } else {
    target = 'なし（盤面は完成済みか矛盾あり）'
  }

  const emptyCount = req.board.flat().filter((n) => n === 0).length
  const noteLines: string[] = []
  if (req.notes) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (req.notes[r][c].length > 0) noteLines.push(`(${r + 1},${c + 1}): ${req.notes[r][c].join('')}`)
      }
    }
  }

  return `# 現在の盤面（'.' は空きマス）
${boardToText(req.board)}

# 状況
- 空きマス数: ${emptyCount}
- ユーザーのミス回数: ${req.mistakes ?? 0}
- 誤って入力されているマス: ${wrongCells.length ? wrongCells.join(', ') : 'なし'}
${noteLines.length ? `- ユーザーのメモ(行,列: 候補): ${noteLines.slice(0, 40).join(' / ')}` : ''}

# 確定情報（ヒントレベルが許す範囲でのみ利用すること）
- 指導対象: ${target}

# 依頼
${isMistakeMode ? LEVEL_INSTRUCTIONS_MISTAKE[req.level] : LEVEL_INSTRUCTIONS_NORMAL[req.level]}`
}

/**
 * Call Google Generative Language REST API directly from the browser using the user's custom API key.
 * This ensures 100% reliable execution on Vercel without serverless cold-start or Node.js runtime limits.
 */
export async function generateGeminiHintDirect(
  req: GeminiHintRequest,
  apiKey: string,
  signal?: AbortSignal,
): Promise<GeminiHintResponse> {
  if (!apiKey.trim()) {
    throw new Error('MISSING_API_KEY')
  }

  if (countMistakes(req.initial, req.solution) > 0) {
    throw new Error('INVALID_PUZZLE')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_MODEL}:generateContent?key=${encodeURIComponent(
    apiKey.trim(),
  )}`

  const payload = {
    system_instruction: {
      parts: [{ text: SYSTEM_INSTRUCTION }],
    },
    contents: [
      {
        parts: [{ text: buildPrompt(req) }],
      },
    ],
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  const data = await res.json()

  if (!res.ok) {
    const errorMsg = data?.error?.message || ''
    if (res.status === 400 || /API key not valid/i.test(errorMsg)) {
      const err = new Error('入力された Gemini API キーが無効です。設定を確認してください。')
      ;(err as unknown as { code: GeminiHintClientErrorCode }).code = 'AUTH_FAILED'
      throw err
    }
    if (res.status === 429) {
      const err = new Error('Gemini API の利用上限に達しました。少し待ってから再度お試しください。')
      ;(err as unknown as { code: GeminiHintClientErrorCode }).code = 'RATE_LIMITED'
      throw err
    }
    const err = new Error(`Gemini API エラー: ${errorMsg || res.statusText}`)
    ;(err as unknown as { code: GeminiHintClientErrorCode }).code = 'UPSTREAM_ERROR'
    throw err
  }

  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!text) {
    const err = new Error('Gemini から有効な回答を得られませんでした。もう一度お試しください。')
    ;(err as unknown as { code: GeminiHintClientErrorCode }).code = 'EMPTY_RESPONSE'
    throw err
  }

  return {
    advice: text,
    level: req.level,
    model: DEFAULT_MODEL,
  }
}
