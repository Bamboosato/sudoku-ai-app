import { GoogleGenAI } from '@google/genai'
import { countMistakes } from '../src/lib/sudoku/board'
import { findSmartAIHint } from '../src/lib/sudoku/hints'
import type { Grid, Hint } from '../src/lib/sudoku/types'
import { HINT_LEVELS, type GeminiHintRequest, type GeminiHintResponse, type HintLevel } from '../src/lib/gemini/types'

export const DEFAULT_MODEL = 'gemini-2.5-flash'

export type GeminiHintErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_REQUEST'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'EMPTY_RESPONSE'

export class GeminiHintError extends Error {
  constructor(
    public code: GeminiHintErrorCode,
    message: string,
    public httpStatus: number,
  ) {
    super(message)
    this.name = 'GeminiHintError'
  }
}

// ---------- Request validation ----------

function isGrid(v: unknown): v is Grid {
  return (
    Array.isArray(v) &&
    v.length === 9 &&
    v.every((row) => Array.isArray(row) && row.length === 9 && row.every((n) => Number.isInteger(n) && n >= 0 && n <= 9))
  )
}

export function parseHintRequest(raw: unknown): GeminiHintRequest {
  const bad = (msg: string) => new GeminiHintError('INVALID_REQUEST', msg, 400)
  if (typeof raw !== 'object' || raw === null) throw bad('リクエスト形式が不正です。')
  const r = raw as Record<string, unknown>
  if (!isGrid(r.board)) throw bad('board は 9x9 の数値配列である必要があります。')
  if (!isGrid(r.initial)) throw bad('initial は 9x9 の数値配列である必要があります。')
  if (!isGrid(r.solution)) throw bad('solution は 9x9 の数値配列である必要があります。')
  if (!HINT_LEVELS.includes(r.level as HintLevel)) throw bad('level は 1〜4 の整数である必要があります。')

  let notes: number[][][] | undefined
  if (r.notes !== undefined) {
    const ok =
      Array.isArray(r.notes) &&
      r.notes.length === 9 &&
      r.notes.every(
        (row) =>
          Array.isArray(row) &&
          row.length === 9 &&
          row.every((cell) => Array.isArray(cell) && cell.every((n) => Number.isInteger(n) && n >= 1 && n <= 9)),
      )
    if (!ok) throw bad('notes の形式が不正です。')
    notes = r.notes as number[][][]
  }

  return {
    board: r.board,
    initial: r.initial,
    solution: r.solution,
    notes,
    level: r.level as HintLevel,
    mistakes: typeof r.mistakes === 'number' ? r.mistakes : 0,
  }
}

// ---------- Prompt construction ----------

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

  // Ground truth: reuse the local logic engine so the model never has to solve the puzzle itself.
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

// ---------- Gemini call ----------

function mapUpstreamError(e: unknown): GeminiHintError {
  const status = (e as { status?: number })?.status
  const msg = e instanceof Error ? e.message : String(e)
  console.error('[gemini] upstream error:', status ?? '', msg.slice(0, 500))
  if (status === 429) return new GeminiHintError('RATE_LIMITED', 'Gemini API の利用上限に達しました。少し待ってからもう一度お試しください。', 429)
  if (status === 401 || status === 403 || /API key/i.test(msg))
    return new GeminiHintError('AUTH_FAILED', 'Gemini API キーが無効、または権限がありません。.env の GEMINI_API_KEY を確認してください。', 502)
  return new GeminiHintError('UPSTREAM_ERROR', 'Gemini API との通信に失敗しました。時間をおいて再度お試しください。', 502)
}

export interface GenerateOptions {
  apiKey: string | undefined
  model?: string
}

export async function generateGeminiHint(
  req: GeminiHintRequest,
  { apiKey, model }: GenerateOptions,
): Promise<GeminiHintResponse> {
  if (!apiKey) {
    throw new GeminiHintError('MISSING_API_KEY', 'GEMINI_API_KEY が設定されていません。.env.example を参考に .env を作成してください。', 503)
  }
  // Sanity: refuse puzzles whose "solution" is not consistent with the given board's clues.
  if (countMistakes(req.initial, req.solution) > 0) {
    throw new GeminiHintError('INVALID_REQUEST', 'initial と solution が矛盾しています。', 400)
  }

  const client = new GoogleGenAI({ apiKey })
  const modelName = model || DEFAULT_MODEL

  try {
    const response = await client.models.generateContent({
      model: modelName,
      contents: buildPrompt(req),
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    })
    const advice = response.text?.trim()
    if (!advice) throw new GeminiHintError('EMPTY_RESPONSE', 'Gemini から有効な回答を得られませんでした。もう一度お試しください。', 502)
    return { advice, level: req.level, model: modelName }
  } catch (e) {
    if (e instanceof GeminiHintError) throw e
    throw mapUpstreamError(e)
  }
}
