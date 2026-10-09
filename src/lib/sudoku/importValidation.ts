import { cloneGrid } from './board'
import { gradePuzzleDifficulty, type DifficultyGradingResult } from './difficultyClassifier'
import { countSolutions, solveSudoku } from './solver'
import type { Grid, Position } from './types'

export type ImportValidation =
  | { status: 'ok'; solution: Grid; clues: number; grading: DifficultyGradingResult }
  | { status: 'invalid-shape' }
  | { status: 'conflict'; cells: Position[]; clues: number }
  | { status: 'no-solution'; clues: number }
  | { status: 'multiple-solutions'; clues: number }

/**
 * Finds all cell coordinates that violate row, column, or 3x3 block uniqueness.
 */
export function findConflictCells(grid: Grid): Position[] {
  const conflictSet = new Set<string>()

  // 1. Check rows
  for (let r = 0; r < 9; r++) {
    const seen = new Map<number, number[]>()
    for (let c = 0; c < 9; c++) {
      const val = grid[r][c]
      if (val !== 0) {
        if (!seen.has(val)) seen.set(val, [])
        seen.get(val)!.push(c)
      }
    }
    for (const cols of seen.values()) {
      if (cols.length > 1) {
        for (const c of cols) conflictSet.add(`${r},${c}`)
      }
    }
  }

  // 2. Check columns
  for (let c = 0; c < 9; c++) {
    const seen = new Map<number, number[]>()
    for (let r = 0; r < 9; r++) {
      const val = grid[r][c]
      if (val !== 0) {
        if (!seen.has(val)) seen.set(val, [])
        seen.get(val)!.push(r)
      }
    }
    for (const rows of seen.values()) {
      if (rows.length > 1) {
        for (const r of rows) conflictSet.add(`${r},${c}`)
      }
    }
  }

  // 3. Check 3x3 blocks
  for (let b = 0; b < 9; b++) {
    const startR = Math.floor(b / 3) * 3
    const startC = (b % 3) * 3
    const seen = new Map<number, Position[]>()
    for (let dr = 0; dr < 3; dr++) {
      for (let dc = 0; dc < 3; dc++) {
        const r = startR + dr
        const c = startC + dc
        const val = grid[r][c]
        if (val !== 0) {
          if (!seen.has(val)) seen.set(val, [])
          seen.get(val)!.push({ row: r, col: c })
        }
      }
    }
    for (const positions of seen.values()) {
      if (positions.length > 1) {
        for (const pos of positions) conflictSet.add(`${pos.row},${pos.col}`)
      }
    }
  }

  const result: Position[] = []
  for (const item of conflictSet) {
    const [r, c] = item.split(',').map(Number)
    result.push({ row: r, col: c })
  }

  // Sort coordinates for deterministic ordering (row then col)
  return result.sort((a, b) => (a.row === b.row ? a.col - b.col : a.row - b.row))
}

/**
 * Validates an imported board:
 * 1. Checks 9x9 shape, integer types, 0-9 values.
 * 2. Checks for conflicts in row/col/block.
 * 3. Uses countSolutions(board, 2) to ensure strictly 1 solution.
 * 4. Solves and returns complete solution grid.
 */
export function validateImportedBoard(grid: unknown): ImportValidation {
  // Shape and type validation
  if (!Array.isArray(grid) || grid.length !== 9) {
    return { status: 'invalid-shape' }
  }

  let clues = 0
  for (let r = 0; r < 9; r++) {
    const row = grid[r]
    if (!Array.isArray(row) || row.length !== 9) {
      return { status: 'invalid-shape' }
    }
    for (let c = 0; c < 9; c++) {
      const val = row[c]
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 9) {
        return { status: 'invalid-shape' }
      }
      if (val !== 0) clues++
    }
  }

  const typedGrid = grid as Grid

  // Conflict check
  const conflicts = findConflictCells(typedGrid)
  if (conflicts.length > 0) {
    return { status: 'conflict', cells: conflicts, clues }
  }

  // Count solutions
  const solutions = countSolutions(typedGrid, 2)
  if (solutions === 0) {
    return { status: 'no-solution', clues }
  }
  if (solutions >= 2) {
    return { status: 'multiple-solutions', clues }
  }

  // Strictly 1 solution - compute solution
  const solution = cloneGrid(typedGrid)
  const solved = solveSudoku(solution)
  if (!solved) {
    return { status: 'no-solution', clues }
  }

  const grading = gradePuzzleDifficulty(typedGrid, solution)

  return { status: 'ok', solution, clues, grading }
}
