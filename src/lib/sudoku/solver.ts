import { isValidPlacement, shuffleArray } from './board'
import type { Grid, Notes } from './types'
import { createEmptyNotes } from './board'

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
