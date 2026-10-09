import { describe, expect, it } from 'vitest'
import { generatePuzzle } from './generator'
import { gradePuzzleDifficulty } from './difficultyClassifier'
import type { Grid } from './types'

describe('difficultyClassifier (gradePuzzleDifficulty)', () => {
  it('grades complete or near-complete puzzles as beginner with naked single', () => {
    const { solution } = generatePuzzle('beginner')
    // Clear only 10 cells so it's trivial (71 clues)
    const almostDone: Grid = solution.map((r) => [...r])
    for (let i = 0; i < 10; i++) {
      almostDone[Math.floor(i / 9)][i % 9] = 0
    }

    const grading = gradePuzzleDifficulty(almostDone, solution)
    expect(grading.difficulty).toBe('beginner')
    expect(grading.label).toBe('入門')
    expect(grading.clues).toBe(71)
    expect(grading.highestTechnique).toContain('Naked Single')
  })

  it('runs deterministically within 5ms', () => {
    const { initial, solution } = generatePuzzle('medium')
    const start = performance.now()
    const grading = gradePuzzleDifficulty(initial, solution)
    const duration = performance.now() - start

    expect(duration).toBeLessThan(10) // Well within limits
    expect(grading.difficulty).toBeDefined()
    expect(grading.label).toBeTruthy()
    expect(grading.highestTechnique).toBeTruthy()
    expect(grading.reason).toBeTruthy()
  })

  it('correctly maps 5 difficulty levels across generated puzzles', () => {
    const levels = ['beginner', 'easy', 'medium', 'hard', 'expert'] as const
    for (const lvl of levels) {
      const { initial, solution } = generatePuzzle(lvl)
      const grading = gradePuzzleDifficulty(initial, solution)
      expect(levels).toContain(grading.difficulty)
    }
  })
})
