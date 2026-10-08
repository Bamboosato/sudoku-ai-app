import { cloneGrid, createEmptyNotes, isValidPlacement, shuffleArray } from './board'
import type { Grid, Notes } from './types'

/** Check if the current board has any placement violations. */
export function isBoardValid(board: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c]
      if (val !== 0 && !isValidPlacement(board, r, c, val)) return false
    }
  }
  return true
}

/** Randomized backtracking solver. Fills `board` in place; returns true when solved. */
export function solveSudoku(board: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const numbers = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9])
        for (const num of numbers) {
          if (isValidPlacement(board, r, c, num)) {
            board[r][c] = num
            if (solveSudoku(board)) return true
            board[r][c] = 0
          }
        }
        return false
      }
    }
  }
  return true
}

/**
 * Counts the number of valid solutions up to `limit`.
 * Does NOT mutate `board` (operates on an internal clone).
 * Uses MRV (Minimum Remaining Values) heuristic and early termination.
 */
export function countSolutions(board: Grid, limit = 2): number {
  if (!isBoardValid(board)) return 0

  const working = cloneGrid(board)
  let count = 0

  function backtrack(): boolean {
    let minCandidates = 10
    let bestR = -1
    let bestC = -1
    let bestNums: number[] = []

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (working[r][c] === 0) {
          const candidates: number[] = []
          for (let num = 1; num <= 9; num++) {
            if (isValidPlacement(working, r, c, num)) candidates.push(num)
          }
          if (candidates.length === 0) return false
          if (candidates.length < minCandidates) {
            minCandidates = candidates.length
            bestR = r
            bestC = c
            bestNums = candidates
            if (minCandidates === 1) break
          }
        }
      }
      if (minCandidates === 1) break
    }

    if (bestR === -1) {
      count++
      return count >= limit
    }

    for (const num of bestNums) {
      working[bestR][bestC] = num
      const stop = backtrack()
      working[bestR][bestC] = 0
      if (stop) return true
    }

    return false
  }

  backtrack()
  return count
}

/** Candidate digits for every empty cell. */
export function computeCellCandidates(board: Grid): Notes {
  const candidates = createEmptyNotes()
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(board, r, c, num)) candidates[r][c].add(num)
        }
      }
    }
  }
  return candidates
}

