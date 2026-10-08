import { describe, expect, it } from 'vitest'
import { buildPrompt as buildPromptDirect } from './directClient'
import { buildPrompt as buildPromptServer } from '../../../server/geminiHint'
import type { GeminiHintRequest } from './types'
import type { Grid } from '../sudoku/types'

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

describe('buildPrompt across both channels (direct & server)', () => {
  const builders = [
    { name: 'directClient', fn: buildPromptDirect },
    { name: 'server/geminiHint', fn: buildPromptServer },
  ]

  for (const { name, fn } of builders) {
    describe(`${name}`, () => {
      it('handles normal board (no mistakes) across hint levels 1..4', () => {
        const board = SAMPLE_SOLUTION.map((r) => [...r])
        board[0][0] = 0 // empty cell

        const req: GeminiHintRequest = {
          level: 1,
          board,
          initial: board,
          solution: SAMPLE_SOLUTION,
          mistakes: 0,
        }

        const promptL1 = fn({ ...req, level: 1 })
        expect(promptL1).toContain('ノーヒント')
        expect(promptL1).toContain('指導対象: 行1、列1 に「5」')

        const promptL2 = fn({ ...req, level: 2 })
        expect(promptL2).toContain('着眼点')

        const promptL3 = fn({ ...req, level: 3 })
        expect(promptL3).toContain('マス特定')

        const promptL4 = fn({ ...req, level: 4 })
        expect(promptL4).toContain('直接回答')
      })

      it('handles board with user mistake across hint levels 1..4 without fictitious reasoning', () => {
        const board = SAMPLE_SOLUTION.map((r) => [...r])
        board[0][0] = 9 // WRONG! Correct is 5

        const req: GeminiHintRequest = {
          level: 1,
          board,
          initial: SAMPLE_SOLUTION.map((r) => [...r]),
          solution: SAMPLE_SOLUTION,
          mistakes: 1,
        }
        req.initial[0][0] = 0

        const promptL1 = fn({ ...req, level: 1 })
        expect(promptL1).toContain('誤入力の存在のみ')
        expect(promptL1).toContain('誤入力の見直し')
        expect(promptL1).toContain('行1、列1 の入力「9」は誤り')
        expect(promptL1).toContain('保存済みの正解は「5」')
        expect(promptL1).toContain('架空の論理解説は作らず')

        const promptL2 = fn({ ...req, level: 2 })
        expect(promptL2).toContain('誤入力の範囲')

        const promptL3 = fn({ ...req, level: 3 })
        expect(promptL3).toContain('誤入力マスの特定')

        const promptL4 = fn({ ...req, level: 4 })
        expect(promptL4).toContain('誤入力の正解提示')
      })
    })
  }
})
