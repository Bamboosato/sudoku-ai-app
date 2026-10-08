import { cloneGrid, createEmptyGrid, shuffleArray } from './board'
import { countSolutions, solveSudoku } from './solver'
import type { Difficulty, Grid } from './types'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: '簡単',
  medium: '普通',
  hard: '難問',
}

// Easy: ~39 clues remain, Medium: ~31 clues, Hard: ~25 clues
const CELLS_TO_REMOVE: Record<Difficulty, number> = {
  easy: 42,
  medium: 50,
  hard: 56,
}

export interface Puzzle {
  solution: Grid
  initial: Grid
}

export function generatePuzzle(difficulty: Difficulty): Puzzle {
  const solution = createEmptyGrid()
  solveSudoku(solution)

  const initial = cloneGrid(solution)
  const positions: { r: number; c: number }[] = []
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) positions.push({ r, c })
  }
  shuffleArray(positions)

  const targetToRemove = CELLS_TO_REMOVE[difficulty]
  let removedCount = 0

  for (const { r, c } of positions) {
    const backup = initial[r][c]
    initial[r][c] = 0

    // Check if the puzzle still has exactly one solution
    if (countSolutions(initial, 2) === 1) {
      removedCount++
      if (removedCount >= targetToRemove) break
    } else {
      // Multiple or zero solutions: restore the cell
      initial[r][c] = backup
    }
  }

  return { solution, initial }
}

