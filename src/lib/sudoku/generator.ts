import { cloneGrid, createEmptyGrid, shuffleArray } from './board'
import { solveSudoku } from './solver'
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

  for (let i = 0; i < CELLS_TO_REMOVE[difficulty]; i++) {
    const { r, c } = positions[i]
    initial[r][c] = 0
  }
  return { solution, initial }
}
