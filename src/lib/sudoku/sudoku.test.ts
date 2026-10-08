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
import { generatePuzzle } from './generator'
import { createGameState, gameReducer } from './gameReducer'
import { findSmartAIHint } from './hints'
import { computeCellCandidates, countSolutions, solveSudoku } from './solver'
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
    expect(hint?.kind).toBe('placement')
    if (hint && hint.kind === 'placement') {
      expect(hint.row).toBe(0)
      expect(hint.col).toBe(0)
      expect(hint.num).toBe(5)
      expect(hint.type).toBe('Naked Single')
    }
  })
})

describe('countSolutions accuracy & safety', () => {
  it('does not mutate the input board', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    board[0][0] = 0
    board[0][1] = 0
    const snapshot = cloneGrid(board)

    countSolutions(board, 2)
    expect(board).toEqual(snapshot)
  })

  it('returns 0 for an unsolvable / contradictory board', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    board[0][0] = 0
    // Fill row 0 with values that make (0,0) have 0 candidates
    // Place 5 in (0, 1) creating row conflict
    board[0][1] = 5
    expect(countSolutions(board, 2)).toBe(0)
  })

  it('returns 0 for a duplicate-filled completed board', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    // Create a conflict in completed board
    board[0][1] = board[0][0] // two 5s in row 0
    expect(countSolutions(board, 2)).toBe(0)
  })

  it('returns 1 for a board with a known unique solution', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    // Clear a few cells that are uniquely determined
    board[0][0] = 0
    board[1][1] = 0
    expect(countSolutions(board, 2)).toBe(1)
  })

  it('returns 2 (capped limit) for an empty or ambiguous board with multiple solutions', () => {
    const empty = createEmptyGrid()
    expect(countSolutions(empty, 2)).toBe(2)

    // A board with 4 cells forming an ambiguous interchangeable rectangle
    const board = cloneGrid(SAMPLE_SOLUTION)
    // Clear 4 corners of an interchangeable rectangle if possible, or clear many cells
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        board[r][c] = 0
      }
    }
    expect(countSolutions(board, 2)).toBe(2)
  })
})

describe('generatePuzzle uniqueness & clue integrity', () => {
  const difficulties: Array<'easy' | 'medium' | 'hard'> = ['easy', 'medium', 'hard']

  for (const diff of difficulties) {
    it(`generates unique solution puzzle for difficulty: ${diff}`, () => {
      const start = performance.now()
      const { initial, solution } = generatePuzzle(diff)
      const duration = performance.now() - start

      // 1. Solution is a solved board
      expect(isSolved(solution, solution)).toBe(true)

      // 2. Initial clues strictly match solution
      let clueCount = 0
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (initial[r][c] !== 0) {
            clueCount++
            expect(initial[r][c]).toBe(solution[r][c])
          }
        }
      }
      expect(clueCount).toBeGreaterThan(17) // Sudoku requires at least 17 clues

      // 3. Exactly one solution exists
      expect(countSolutions(initial, 2)).toBe(1)

      console.log(`[Perf] generatePuzzle(${diff}) took ${duration.toFixed(1)}ms with ${clueCount} clues`)
    })
  }

  it('measures countSolutions and generatePuzzle timings over multiple iterations', () => {
    const testBoard = cloneGrid(SAMPLE_SOLUTION)
    for (let i = 0; i < 30; i++) {
      testBoard[Math.floor(i / 9)][i % 9] = 0
    }

    // Benchmark countSolutions
    const runs = 20
    const times: number[] = []
    for (let i = 0; i < runs; i++) {
      const t0 = performance.now()
      countSolutions(testBoard, 2)
      times.push(performance.now() - t0)
    }
    const avg = times.reduce((a, b) => a + b, 0) / runs
    const max = Math.max(...times)
    console.log(`[Perf] countSolutions: avg=${avg.toFixed(2)}ms, max=${max.toFixed(2)}ms across ${runs} runs`)
    expect(avg).toBeLessThan(50) // should be fast
  })

  // Reproducible 100 puzzles test per difficulty
  for (const diff of difficulties) {
    it(`verifies 100 consecutive puzzles are 100% unique for ${diff} with seeded PRNG`, () => {
      // Mulberry32 seeded PRNG for reproducible test runs
      let seed = 123456789
      const origRandom = Math.random
      Math.random = () => {
        seed |= 0
        seed = (seed + 0x6d2b79f5) | 0
        let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296
      }

      try {
        const count = 100
        const durations: number[] = []
        let multiSolutionCount = 0

        for (let i = 0; i < count; i++) {
          const t0 = performance.now()
          const { initial, solution } = generatePuzzle(diff)
          durations.push(performance.now() - t0)

          const numSolutions = countSolutions(initial, 2)
          if (numSolutions !== 1) {
            multiSolutionCount++
          }

          // Initial clues match solution
          for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
              if (initial[r][c] !== 0) {
                expect(initial[r][c]).toBe(solution[r][c])
              }
            }
          }
        }

        const avg = durations.reduce((a, b) => a + b, 0) / count
        const max = Math.max(...durations)
        console.log(`[Batch 100x ${diff}] Multi-solutions: ${multiSolutionCount}/100. Time: avg=${avg.toFixed(2)}ms, max=${max.toFixed(2)}ms`)

        expect(multiSolutionCount).toBe(0)
      } finally {
        Math.random = origRandom
      }
    })
  }
})

describe('findSmartAIHint with mistake detection & type discrimination', () => {
  it('returns CorrectionHint when user entered wrong digits', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    board[0][0] = 9 // Wrong! Correct is 5
    board[0][1] = 0 // empty

    const hint = findSmartAIHint(board, SAMPLE_SOLUTION)
    expect(hint).not.toBeNull()
    expect(hint?.kind).toBe('correction')
    if (hint && hint.kind === 'correction') {
      expect(hint.row).toBe(0)
      expect(hint.col).toBe(0)
      expect(hint.currentNum).toBe(9)
      expect(hint.badge).toBe('誤入力の修正')
      // Ensure 'num' does not exist on CorrectionHint
      expect('num' in hint).toBe(false)
      expect(hint.reason).toContain('正解と異なっています')
    }
  })

  it('returns CorrectionHint when all cells are filled but some are wrong', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    board[8][8] = 1 // Wrong! Correct is 9

    const hint = findSmartAIHint(board, SAMPLE_SOLUTION)
    expect(hint).not.toBeNull()
    expect(hint?.kind).toBe('correction')
    if (hint && hint.kind === 'correction') {
      expect(hint.row).toBe(8)
      expect(hint.col).toBe(8)
      expect(hint.currentNum).toBe(1)
    }
  })

  it('switches back to PlacementHint once mistake is cleared', () => {
    const board = cloneGrid(SAMPLE_SOLUTION)
    board[0][0] = 9 // Wrong!
    board[1][1] = 0 // empty

    // While wrong, returns correction hint
    const wrongHint = findSmartAIHint(board, SAMPLE_SOLUTION)
    expect(wrongHint?.kind).toBe('correction')

    // Fix the error by clearing the cell
    board[0][0] = 0

    // Now returns placement hint
    const correctedHint = findSmartAIHint(board, SAMPLE_SOLUTION)
    expect(correctedHint?.kind).toBe('placement')
    if (correctedHint && correctedHint.kind === 'placement') {
      expect(correctedHint.num).toBe(5)
    }
  })
})

describe('gameReducer action mechanics (no instant spoiler & mistake reset)', () => {
  it('does NOT increment mistakes or trigger game over on wrong INPUT', () => {
    let state = createGameState('easy')
    // Find an empty cell
    let targetR = -1
    let targetC = -1
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (state.initial[r][c] === 0) {
          targetR = r
          targetC = c
          break
        }
      }
      if (targetR !== -1) break
    }

    const wrongNum = (state.solution[targetR][targetC] % 9) + 1 // guaranteed wrong
    state = gameReducer(state, { type: 'SELECT', pos: { row: targetR, col: targetC } })
    state = gameReducer(state, { type: 'INPUT', num: wrongNum })

    // Mistakes count should remain 0! (No instant spoilers)
    expect(state.mistakes).toBe(0)
    expect(state.board[targetR][targetC]).toBe(wrongNum)
  })

  it('resets wrong cells and increments mistakes on CHECK action', () => {
    let state = createGameState('easy')
    // Find two empty cells and enter wrong numbers
    const emptyCells: { r: number; c: number }[] = []
    for (let r = 0; r < 9 && emptyCells.length < 2; r++) {
      for (let c = 0; c < 9 && emptyCells.length < 2; c++) {
        if (state.initial[r][c] === 0) emptyCells.push({ r, c })
      }
    }

    for (const { r, c } of emptyCells) {
      const wrong = (state.solution[r][c] % 9) + 1
      state = gameReducer(state, { type: 'SELECT', pos: { row: r, col: c } })
      state = gameReducer(state, { type: 'INPUT', num: wrong })
    }

    expect(state.mistakes).toBe(0)

    // Execute mistake reset action (CHECK)
    state = gameReducer(state, { type: 'CHECK' })

    // 1. Mistakes should increment by 1
    expect(state.mistakes).toBe(1)
    // 2. Both wrong cells should be reset to 0
    for (const { r, c } of emptyCells) {
      expect(state.board[r][c]).toBe(0)
    }
    // 3. Panel badge should indicate reset
    expect(state.hintPanel.badge).toBe('誤入力リセット')
  })

  it('does NOT increment mistakes on CHECK when board has no mistakes', () => {
    let state = createGameState('easy')
    expect(state.mistakes).toBe(0)

    state = gameReducer(state, { type: 'CHECK' })

    // Mistakes should stay 0
    expect(state.mistakes).toBe(0)
    expect(state.hintPanel.badge).toBe('診断正常')
  })
})


