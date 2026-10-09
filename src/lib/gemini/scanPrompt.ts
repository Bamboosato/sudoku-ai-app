import type { BoardScanResponse } from './types'

export const SCAN_PROMPT = `あなたは数独（ナンプレ）の盤面画像を読み取る専門家です。
与えられた画像から 9x9 の数独盤面の初期配置（問題として印刷された数字）を正確に抽出し、JSON 形式で出力してください。

【厳格な指示】
1. 出力形式:
   - JSON オブジェクトのみを出力してください（Markdown のバッククォート \`\`\`json も不要です）。
   - キー:
     - "found": 画像内に 9x9 の数独盤面が存在すれば true、存在しなければ false。
     - "grid": 9行9列の整数配列（空マスは必ず 0、1〜9 の数字が入る）。
     - "uncertainCells": 判読に自信がないマスの座標配列（例: [{"row": 0, "col": 1}]。インデックスは 0 始まり）。
2. 数字の抽出ルール:
   - 【最重要】印刷された初期の数字（黒インクで印刷された問題の手がかり）のみを抽出してください。
   - プレイヤーが手書きした文字、メモ、丸印、チェックマーク、消しゴムの跡などは一切読み取らず、空マス（0）として扱ってください。
   - 推測で数字を補完したり、パズルを解いた結果を埋めたりしないでください。見えている数字のみを忠実に写してください。
   - 判読が難しいマスは、最も可能性の高い数字を grid に入れ、その座標を uncertainCells に含めてください。
3. 盤面の検出ルール:
   - 画像内に複数の盤面がある場合は、最も大きく中央に写っている 1 つの盤面を対象としてください。
   - 画像が傾いている場合でも、格子の交差をたどって正しい行・列の対応を取ってください。
   - 画像内に数独盤面が見つからない場合は、found を false とし、grid は全て 0（9x9）としてください。`

export const SCAN_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    found: {
      type: 'boolean',
      description: '画像内に 9x9 数独盤面が見つかったかどうか',
    },
    grid: {
      type: 'array',
      description: '9x9 の盤面数字。空マスは 0',
      minItems: 9,
      maxItems: 9,
      items: {
        type: 'array',
        minItems: 9,
        maxItems: 9,
        items: {
          type: 'integer',
          minimum: 0,
          maximum: 9,
        },
      },
    },
    uncertainCells: {
      type: 'array',
      description: '読み取りに自信がないマスのリスト',
      items: {
        type: 'object',
        properties: {
          row: { type: 'integer', minimum: 0, maximum: 8 },
          col: { type: 'integer', minimum: 0, maximum: 8 },
        },
        required: ['row', 'col'],
      },
    },
  },
  required: ['found', 'grid', 'uncertainCells'],
}

/**
 * Validates and parses raw Gemini output into BoardScanResponse.
 * Returns null if the structure is invalid.
 */
export function parseScanResponse(rawText: string): BoardScanResponse | null {
  if (!rawText || typeof rawText !== 'string') return null

  // Clean code fences if any
  let cleaned = rawText.trim()
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
  }

  let data: unknown
  try {
    data = JSON.parse(cleaned)
  } catch {
    return null
  }

  if (!data || typeof data !== 'object') return null
  const obj = data as Record<string, unknown>

  if (typeof obj.found !== 'boolean') return null

  if (!obj.found) {
    return {
      found: false,
      grid: Array.from({ length: 9 }, () => new Array(9).fill(0)),
      uncertainCells: [],
    }
  }

  if (!Array.isArray(obj.grid) || obj.grid.length !== 9) return null

  const grid: number[][] = []
  for (let r = 0; r < 9; r++) {
    const row = obj.grid[r]
    if (!Array.isArray(row) || row.length !== 9) return null
    const rowNums: number[] = []
    for (let c = 0; c < 9; c++) {
      const val = row[c]
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 9) {
        return null
      }
      rowNums.push(val)
    }
    grid.push(rowNums)
  }

  const uncertainCells: { row: number; col: number }[] = []
  if (Array.isArray(obj.uncertainCells)) {
    for (const item of obj.uncertainCells) {
      if (
        item &&
        typeof item === 'object' &&
        typeof item.row === 'number' &&
        Number.isInteger(item.row) &&
        item.row >= 0 &&
        item.row <= 8 &&
        typeof item.col === 'number' &&
        Number.isInteger(item.col) &&
        item.col >= 0 &&
        item.col <= 8
      ) {
        uncertainCells.push({ row: item.row, col: item.col })
      }
    }
  }

  return { found: true, grid, uncertainCells }
}
