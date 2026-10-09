import { describe, expect, it } from 'vitest'
import { createEmptyGrid } from './board'
import { generatePuzzle } from './generator'
import { findConflictCells, validateImportedBoard } from './importValidation'
import type { Grid } from './types'

describe('importValidation', () => {
  it('rejects invalid shapes and values', () => {
    expect(validateImportedBoard(null)).toEqual({ status: 'invalid-shape' })
    expect(validateImportedBoard([])).toEqual({ status: 'invalid-shape' })
    expect(validateImportedBoard(new Array(8).fill(new Array(9).fill(0)))).toEqual({ status: 'invalid-shape' })
    
    // Row of wrong length
    const wrongCol = createEmptyGrid()
    wrongCol[0] = [1, 2, 3]
    expect(validateImportedBoard(wrongCol)).toEqual({ status: 'invalid-shape' })

    // Non-integer or out of range
    const nonInt = createEmptyGrid()
    nonInt[0][0] = 1.5
    expect(validateImportedBoard(nonInt)).toEqual({ status: 'invalid-shape' })

    const outOfRange = createEmptyGrid()
    outOfRange[0][0] = 10
    expect(validateImportedBoard(outOfRange)).toEqual({ status: 'invalid-shape' })
  })

  it('detects row, column, and block conflicts accurately', () => {
    const grid = createEmptyGrid()
    // Row conflict: row 0 has two 5s at col 1 and col 8
    grid[0][1] = 5
    grid[0][8] = 5

    // Col conflict: col 3 has two 7s at row 2 and row 6
    grid[2][3] = 7
    grid[6][3] = 7

    // Block conflict: top-left block (0..2, 0..2) has two 9s at (1, 0) and (2, 2)
    grid[1][0] = 9
    grid[2][2] = 9

    const conflicts = findConflictCells(grid)
    expect(conflicts).toEqual([
      { row: 0, col: 1 },
      { row: 0, col: 8 },
      { row: 1, col: 0 },
      { row: 2, col: 2 },
      { row: 2, col: 3 },
      { row: 6, col: 3 },
    ])

    const res = validateImportedBoard(grid)
    expect(res.status).toBe('conflict')
    if (res.status === 'conflict') {
      expect(res.cells).toEqual(conflicts)
      expect(res.clues).toBe(6)
    }
  })

  it('validates a known unique-solution puzzle as ok', () => {
    const { initial, solution } = generatePuzzle('easy')
    const start = performance.now()
    const res = validateImportedBoard(initial)
    const elapsed = performance.now() - start

    expect(elapsed).toBeLessThan(50) // requirement: within 50ms
    expect(res.status).toBe('ok')
    if (res.status === 'ok') {
      expect(res.solution).toEqual(solution)
      expect(res.clues).toBeGreaterThanOrEqual(17)
    }
  })

  it('detects boards with multiple solutions', () => {
    // Empty board has tons of solutions
    const empty = createEmptyGrid()
    const res = validateImportedBoard(empty)
    expect(res).toEqual({ status: 'multiple-solutions', clues: 0 })
  })

  it('detects unsolvable boards without row/col duplicate conflicts', () => {
    // A board that has no immediate row/col duplicate, but logical contradiction
    // e.g. placing digits such that a cell has 0 possible candidates
    const grid: Grid = [
      [5, 3, 4, 6, 7, 8, 9, 1, 2],
      [6, 7, 2, 1, 9, 5, 3, 4, 8],
      [1, 9, 8, 3, 4, 2, 5, 6, 7],
      [8, 5, 9, 7, 6, 1, 4, 2, 3],
      [4, 2, 6, 8, 5, 3, 7, 9, 1],
      [7, 1, 3, 9, 2, 4, 8, 5, 6],
      [9, 6, 1, 5, 3, 7, 2, 8, 4],
      [2, 8, 7, 4, 1, 9, 6, 3, 5],
      [3, 4, 5, 2, 8, 6, 1, 7, 0], // missing last cell: must be 9, but let's change (8, 0) to 9 which clashes with col 0
    ]
    // Here (8,8) is 0. If we put 9 at (8,6) where 1 is:
    grid[8][6] = 9 // clash in row 8
    const res = validateImportedBoard(grid)
    expect(res.status).toBe('conflict')
  })

  it('does not mutate the input board', () => {
    const { initial } = generatePuzzle('medium')
    const original = initial.map((r) => [...r])
    validateImportedBoard(initial)
    expect(initial).toEqual(original)
  })
})
