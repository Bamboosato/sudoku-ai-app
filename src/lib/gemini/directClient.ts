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

const LEVEL_INSTRUCTIONS: Record<HintLevel, string> = {
  1: '【レベル1: ノーヒント】具体的なマスも数字も言わないこと。「今は焦らず、ブロックや行を一つ選んで、すでに入っている数字を見直してみましょう」のように、着眼点の方向だけを促す。',
  2: '【レベル2: 着眼点】注目すべき範囲（「第◯ブロック」「行◯」「列◯」のいずれか）と、使える考え方（例: 隠れ1択、唯一候補）だけを伝える。特定のマスと答えの数字は言わないこと。',
  3: '【レベル3: マス特定】注目すべき具体的なマス（行・列）と、そこを決める根拠を説明する。ただし入る数字そのものは直接言わず、ユーザー自身が気づけるように導くこと。',
  4: '【レベル4: 直接回答】注目すべきマスと入る数字を明示し、なぜそうなるのかを論理的にステップで解説する。',
}

const SYSTEM_INSTRUCTION = `あなたは数独アプリの親切なコーチです。日本語で、人間味のある温かく簡潔なトーンで話してください（最大4文程度、絵文字は多くても1つ）。
- 「確定情報」に書かれたマスと数字は正解であり、それ以外の答えを推測しないこと。
- 指定されたヒントレベルを厳守し、レベルが許す範囲を超えて答えを漏らさないこと。
- 行・列は 1 始まりで表現すること（例: 「行3、列5」）。
- 盤面にミス（誤入力）がある場合は、先にそれを見直すよう優しく促すこと。`

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
  const target = local
    ? `行${local.row + 1}、列${local.col + 1} に「${local.num}」（手法: ${local.type}。根拠メモ: ${local.reason}）`
    : 'なし（盤面は完成済みか矛盾あり）'

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

# 確定情報（正解。ヒントレベルが許す範囲でのみ利用すること）
- 次に決めるべきマス: ${target}

# 依頼
${LEVEL_INSTRUCTIONS[req.level]}`
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
