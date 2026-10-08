import { describe, expect, it } from 'vitest'
import {
  cleanPeerNotes,
  cloneGrid,
  countMistakes,
  countRemaining,
  createEmptyGrid,
  isSolved,
  isValidPlacement,
} from './board'
import { findSmartAIHint } from './hints'
import { computeCellCandidates, solveSudoku } from './solver'
import type { Grid } from './types'

// Valid full solution board for test cases
const SAMPLE_SOLUTION: Grid = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
]

describe('board.ts & solver.ts', () => {
  it('correctly validates placement rules (isValidPlacement)', () => {
    const board = createEmptyGrid()
    board[0][0] = 5

    // Same row conflict
    expect(isValidPlacement(board, 0, 4, 5)).toBe(false)
    // Same col conflict
    expect(isValidPlacement(board, 4, 0, 5)).toBe(false)
    // Same 3x3 block conflict
    expect(isValidPlacement(board, 1, 1, 5)).toBe(false)
    // Valid spot (different row, col, and block)
    expect(isValidPlacement(board, 4, 4, 5)).toBe(true)
    // Self check should be valid
    expect(isValidPlacement(board, 0, 0, 5)).toBe(true)
  })

  it('detects solved state correctly (isSolved)', () => {
    const solved = cloneGrid(SAMPLE_SOLUTION)
    expect(isSolved(solved, SAMPLE_SOLUTION)).toBe(true)

    // Modify one cell
    solved[0][0] = 9
    expect(isSolved(solved, SAMPLE_SOLUTION)).toBe(false)
  })

  it('counts mistakes accurately (countMistakes)', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    expect(countMistakes(board, SAMPLE_SOLUTION)).toBe(0)

    board[0][0] = 1 // wrong (solution is 5)
    board[0][1] = 2 // wrong (solution is 3)
    board[0][2] = 0 // empty, not counted as mistake
    expect(countMistakes(board, SAMPLE_SOLUTION)).toBe(2)
  })

  it('calculates remaining counts correctly (countRemaining)', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    const remaining = countRemaining(board)
    // When completely solved, remaining for all digits 1..9 should be 0
    for (let i = 1; i <= 9; i++) {
      expect(remaining[i]).toBe(0)
    }

    // Clear two 5s
    board[0][0] = 0 // was 5
    board[4][4] = 0 // was 5
    const remainingAfter = countRemaining(board)
    expect(remainingAfter[5]).toBe(2)
  })

  it('cleans peer notes correctly (cleanPeerNotes)', () => {
    const notes = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set<number>([1, 2, 3])),
    )

    cleanPeerNotes(notes, 0, 0, 1)

    // Row 0 peers have 1 removed
    expect(notes[0][1].has(1)).toBe(false)
    expect(notes[0][8].has(1)).toBe(false)
    // Col 0 peers have 1 removed
    expect(notes[1][0].has(1)).toBe(false)
    expect(notes[8][0].has(1)).toBe(false)
    // Block (0,0) peers have 1 removed
    expect(notes[1][1].has(1)).toBe(false)
    expect(notes[2][2].has(1)).toBe(false)
    // Outside block, outside row & col retains 1
    expect(notes[4][4].has(1)).toBe(true)
  })

  it('solves empty and partial boards via solveSudoku', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    // Remove several cells
    board[0][0] = 0
    board[1][1] = 0
    board[2][2] = 0
    board[3][3] = 0

    const solved = solveSudoku(board)
    expect(solved).toBe(true)
    expect(isSolved(board, SAMPLE_SOLUTION)).toBe(true)
  })

  it('computes candidates accurately for empty cells (computeCellCandidates)', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    // Leave only (0, 0) empty (which must be 5)
    board[0][0] = 0

    const candidates = computeCellCandidates(board)
    expect(candidates[0][0].size).toBe(1)
    expect(candidates[0][0].has(5)).toBe(true)

    // Non-empty cells have 0 candidates
    expect(candidates[0][1].size).toBe(0)
  })

  it('identifies Naked Single logic hint (findSmartAIHint)', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    board[0][0] = 0 // Only 5 can fit here

    const hint = findSmartAIHint(board, SAMPLE_SOLUTION)
    expect(hint).not.toBeNull()
    expect(hint?.row).toBe(0)
    expect(hint?.col).toBe(0)
    expect(hint?.num).toBe(5)
    expect(hint?.type).toBe('Naked Single')
  })
})
