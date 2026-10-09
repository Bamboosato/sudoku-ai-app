import { cloneGrid, createEmptyGrid, shuffleArray } from './board'
import { countSolutions, solveSudoku } from './solver'
import type { Difficulty, Grid } from './types'

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  beginner: '入門',
  easy: '初級',
  medium: '中級',
  hard: '上級',
  expert: 'エキスパート',
}

// Beginner: 42-45 clues (remove 36-39)
// Easy: 36-38 clues (remove 43-45)
// Medium: 30-32 clues (remove 49-51)
// Hard: 25-27 clues (remove 54-56)
// Expert: 22-24 clues (remove 57-59)
const CELLS_TO_REMOVE: Record<Difficulty, number> = {
  beginner: 37,
  easy: 44,
  medium: 50,
  hard: 55,
  expert: 58,
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

