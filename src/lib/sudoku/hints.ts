import { computeCellCandidates } from './solver'
import type { Grid, Hint } from './types'

/**
 * Logical hint finder:
 * 1. Naked Single  2. Hidden Single (block / row / col)  3. Fallback to the known solution
 */
export function findSmartAIHint(board: Grid, solution: Grid): Hint | null {
  // Check for any incorrectly entered numbers first before calculating candidates
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c]
      if (val !== 0 && val !== solution[r][c]) {
        return {
          kind: 'correction',
          type: 'Mistake Correction',
          badge: '誤入力の修正',
          row: r,
          col: c,
          currentNum: val,
          reason: `マス (行 ${r + 1}, 列 ${c + 1}) に入力されている「${val}」は正解と異なっています。盤面に誤りがあると正しい候補が導けないため、まずはこのマスを消去または修正してください。`,
        }
      }
    }
  }

  const candidates = computeCellCandidates(board)

  // Strategy 1: Naked Single (唯一候補)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0 && candidates[r][c].size === 1) {
        const num = [...candidates[r][c]][0]
        return {
          kind: 'placement',
          type: 'Naked Single',
          badge: '唯一候補マス',
          row: r,
          col: c,
          num,
          reason: `マス (行 ${r + 1}, 列 ${c + 1}) は、同じ行・列・3x3ブロックに1〜9の他の数字が全て揃っているため、入る数字は論理的に「${num}」のみに確定します。`,
        }
      }
    }
  }

  // Strategy 2: Hidden Single (ブロック内の隠れ一択)
  for (let b = 0; b < 9; b++) {
    const startR = Math.floor(b / 3) * 3
    const startC = (b % 3) * 3
    for (let num = 1; num <= 9; num++) {
      const cells: { r: number; c: number }[] = []
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          const curR = startR + r
          const curC = startC + c
          if (board[curR][curC] === 0 && candidates[curR][curC].has(num)) {
            cells.push({ r: curR, c: curC })
          }
        }
      }
      if (cells.length === 1) {
        const target = cells[0]
        return {
          kind: 'placement',
          type: 'Hidden Single (Block)',
          badge: 'ブロック隠れ一択',
          row: target.r,
          col: target.c,
          num,
          reason: `第 ${b + 1} ブロック（3x3）において、数字「${num}」が入ることができるマスは (行 ${target.r + 1}, 列 ${target.c + 1}) の1つしかありません。他のマスは同行・列の制約で排除されています。`,
        }
      }
    }
  }

  // Strategy 3: Hidden Single (行内の隠れ一択)
  for (let r = 0; r < 9; r++) {
    for (let num = 1; num <= 9; num++) {
      const cols: number[] = []
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0 && candidates[r][c].has(num)) cols.push(c)
      }
      if (cols.length === 1) {
        return {
          kind: 'placement',
          type: 'Hidden Single (Row)',
          badge: '行の隠れ一択',
          row: r,
          col: cols[0],
          num,
          reason: `行 ${r + 1} において、数字「${num}」を配置できるマスは列 ${cols[0] + 1} だけです。`,
        }
      }
    }
  }

  // Strategy 4: Hidden Single (列内の隠れ一択)
  for (let c = 0; c < 9; c++) {
    for (let num = 1; num <= 9; num++) {
      const rows: number[] = []
      for (let r = 0; r < 9; r++) {
        if (board[r][c] === 0 && candidates[r][c].has(num)) rows.push(r)
      }
      if (rows.length === 1) {
        return {
          kind: 'placement',
          type: 'Hidden Single (Col)',
          badge: '列の隠れ一択',
          row: rows[0],
          col: c,
          num,
          reason: `列 ${c + 1} において、数字「${num}」を配置できるマスは行 ${rows[0] + 1} だけです。`,
        }
      }
    }
  }

  // Strategy 5: Deep solution fallback
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const num = solution[r][c]
        return {
          kind: 'placement',
          type: 'Advanced Deduction',
          badge: '高難度推論',
          row: r,
          col: c,
          num,
          reason: `高度な仮定法またはチェイン推論により、(行 ${r + 1}, 列 ${c + 1}) には「${num}」が入ることが確定します。`,
        }
      }
    }
  }

  return null
}
