import { cloneGrid } from './board'
import { computeCellCandidates } from './solver'
import type { Difficulty, Grid } from './types'

export interface DifficultyGradingResult {
  difficulty: Difficulty
  label: string
  highestTechnique: string
  reason: string
  clues: number
}

type TechniqueRank = 'naked-single' | 'hidden-single' | 'pairs' | 'intersections' | 'advanced-or-trial'

const TECHNIQUE_ORDER: Record<TechniqueRank, number> = {
  'naked-single': 1,
  'hidden-single': 2,
  'pairs': 3,
  'intersections': 4,
  'advanced-or-trial': 5,
}

function updateRank(current: TechniqueRank, candidate: TechniqueRank): TechniqueRank {
  return TECHNIQUE_ORDER[candidate] > TECHNIQUE_ORDER[current] ? candidate : current
}

/**
 * Deterministically grades a puzzle's difficulty by simulating logical deduction techniques
 * from simplest to most advanced without guessing:
 * 1. Naked Singles
 * 2. Hidden Singles (Block, Row, Col)
 * 3. Naked Pairs & Hidden Pairs (subset elimination)
 * 4. Pointing / Claiming (intersection reductions)
 * 5. Advanced logic or trial & error
 */
export function gradePuzzleDifficulty(initialGrid: Grid, _solutionGrid?: Grid): DifficultyGradingResult {
  // Count initial clues
  let clues = 0
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (initialGrid[r][c] !== 0) clues++
    }
  }

  const workBoard = cloneGrid(initialGrid)
  let highestTechnique: TechniqueRank = 'naked-single'

  let changed = true
  while (changed) {
    changed = false

    // Check if board is already completed
    let hasEmpty = false
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (workBoard[r][c] === 0) {
          hasEmpty = true
          break
        }
      }
      if (hasEmpty) break
    }
    if (!hasEmpty) break

    const candidates = computeCellCandidates(workBoard)

    // 1. Naked Single
    let foundNaked = false
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (workBoard[r][c] === 0 && candidates[r][c].size === 1) {
          const val = [...candidates[r][c]][0]
          workBoard[r][c] = val
          foundNaked = true
          changed = true
          break
        }
      }
      if (foundNaked) break
    }
    if (foundNaked) continue

    // 2. Hidden Single (Block)
    let foundHidden = false
    for (let b = 0; b < 9; b++) {
      const startR = Math.floor(b / 3) * 3
      const startC = (b % 3) * 3
      for (let num = 1; num <= 9; num++) {
        const spots: { r: number; c: number }[] = []
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            const r = startR + dr
            const c = startC + dc
            if (workBoard[r][c] === 0 && candidates[r][c].has(num)) {
              spots.push({ r, c })
            }
          }
        }
        if (spots.length === 1) {
          workBoard[spots[0].r][spots[0].c] = num
          highestTechnique = updateRank(highestTechnique, 'hidden-single')
          foundHidden = true
          changed = true
          break
        }
      }
      if (foundHidden) break
    }
    if (foundHidden) continue

    // 2. Hidden Single (Row)
    for (let r = 0; r < 9; r++) {
      for (let num = 1; num <= 9; num++) {
        const cols: number[] = []
        for (let c = 0; c < 9; c++) {
          if (workBoard[r][c] === 0 && candidates[r][c].has(num)) cols.push(c)
        }
        if (cols.length === 1) {
          workBoard[r][cols[0]] = num
          highestTechnique = updateRank(highestTechnique, 'hidden-single')
          foundHidden = true
          changed = true
          break
        }
      }
      if (foundHidden) break
    }
    if (foundHidden) continue

    // 2. Hidden Single (Col)
    for (let c = 0; c < 9; c++) {
      for (let num = 1; num <= 9; num++) {
        const rows: number[] = []
        for (let r = 0; r < 9; r++) {
          if (workBoard[r][c] === 0 && candidates[r][c].has(num)) rows.push(r)
        }
        if (rows.length === 1) {
          workBoard[rows[0]][c] = num
          highestTechnique = updateRank(highestTechnique, 'hidden-single')
          foundHidden = true
          changed = true
          break
        }
      }
      if (foundHidden) break
    }
    if (foundHidden) continue

    // 3. Naked Pairs (in any row, col, or block)
    // If two cells in the same unit have exactly the same 2 candidates, remove those candidates from other cells in unit
    let foundPair = false
    // Helper to test pairs in a set of positions
    const testNakedPairs = (cells: { r: number; c: number }[]): boolean => {
      const emptyCells = cells.filter((p) => workBoard[p.r][p.c] === 0 && candidates[p.r][p.c].size === 2)
      for (let i = 0; i < emptyCells.length; i++) {
        for (let j = i + 1; j < emptyCells.length; j++) {
          const c1 = candidates[emptyCells[i].r][emptyCells[i].c]
          const c2 = candidates[emptyCells[j].r][emptyCells[j].c]
          const nums1 = [...c1]
          if (c2.has(nums1[0]) && c2.has(nums1[1])) {
            // Found naked pair! Check if other cells in unit contain either digit
            let removedAny = false
            for (const p of cells) {
              if (
                (p.r !== emptyCells[i].r || p.c !== emptyCells[i].c) &&
                (p.r !== emptyCells[j].r || p.c !== emptyCells[j].c) &&
                workBoard[p.r][p.c] === 0
              ) {
                if (candidates[p.r][p.c].has(nums1[0]) || candidates[p.r][p.c].has(nums1[1])) {
                  candidates[p.r][p.c].delete(nums1[0])
                  candidates[p.r][p.c].delete(nums1[1])
                  removedAny = true
                }
              }
            }
            if (removedAny) return true
          }
        }
      }
      return false
    }

    // Rows
    for (let r = 0; r < 9; r++) {
      const rowCells = Array.from({ length: 9 }, (_, c) => ({ r, c }))
      if (testNakedPairs(rowCells)) {
        highestTechnique = updateRank(highestTechnique, 'pairs')
        foundPair = true
        changed = true
        break
      }
    }
    if (foundPair) continue

    // Cols
    for (let c = 0; c < 9; c++) {
      const colCells = Array.from({ length: 9 }, (_, r) => ({ r, c }))
      if (testNakedPairs(colCells)) {
        highestTechnique = updateRank(highestTechnique, 'pairs')
        foundPair = true
        changed = true
        break
      }
    }
    if (foundPair) continue

    // Blocks
    for (let b = 0; b < 9; b++) {
      const startR = Math.floor(b / 3) * 3
      const startC = (b % 3) * 3
      const blockCells: { r: number; c: number }[] = []
      for (let dr = 0; dr < 3; dr++) {
        for (let dc = 0; dc < 3; dc++) {
          blockCells.push({ r: startR + dr, c: startC + dc })
        }
      }
      if (testNakedPairs(blockCells)) {
        highestTechnique = updateRank(highestTechnique, 'pairs')
        foundPair = true
        changed = true
        break
      }
    }
    if (foundPair) continue

    // 4. Pointing / Claiming intersections (Block vs Row/Col)
    let foundIntersection = false
    for (let b = 0; b < 9; b++) {
      const startR = Math.floor(b / 3) * 3
      const startC = (b % 3) * 3
      for (let num = 1; num <= 9; num++) {
        const spots: { r: number; c: number }[] = []
        for (let dr = 0; dr < 3; dr++) {
          for (let dc = 0; dc < 3; dc++) {
            const r = startR + dr
            const c = startC + dc
            if (workBoard[r][c] === 0 && candidates[r][c].has(num)) {
              spots.push({ r, c })
            }
          }
        }
        if (spots.length >= 2 && spots.length <= 3) {
          // Check if all spots share same row
          const sameRow = spots.every((p) => p.r === spots[0].r)
          if (sameRow) {
            const row = spots[0].r
            let eliminated = false
            for (let c = 0; c < 9; c++) {
              if (Math.floor(c / 3) !== b % 3 && workBoard[row][c] === 0 && candidates[row][c].has(num)) {
                candidates[row][c].delete(num)
                eliminated = true
              }
            }
            if (eliminated) {
              highestTechnique = updateRank(highestTechnique, 'intersections')
              foundIntersection = true
              changed = true
              break
            }
          }

          // Check if all spots share same col
          const sameCol = spots.every((p) => p.c === spots[0].c)
          if (sameCol) {
            const col = spots[0].c
            let eliminated = false
            for (let r = 0; r < 9; r++) {
              if (Math.floor(r / 3) !== Math.floor(b / 3) && workBoard[r][col] === 0 && candidates[r][col].has(num)) {
                candidates[r][col].delete(num)
                eliminated = true
              }
            }
            if (eliminated) {
              highestTechnique = updateRank(highestTechnique, 'intersections')
              foundIntersection = true
              changed = true
              break
            }
          }
        }
      }
      if (foundIntersection) break
    }
    if (foundIntersection) continue

    // If we reach here and board still has empty cells, we require advanced chains or trial & error
    highestTechnique = 'advanced-or-trial'
    break
  }

  // Check if fully solved during simulation
  let unsolved = false
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (workBoard[r][c] === 0) {
        unsolved = true
        break
      }
    }
    if (unsolved) break
  }

  if (unsolved && highestTechnique !== 'advanced-or-trial') {
    highestTechnique = 'advanced-or-trial'
  }

  // Mapping rules into 5 Difficulty levels
  let difficulty: Difficulty
  let label: string
  let highestTechName: string
  let reason: string

  switch (highestTechnique) {
    case 'naked-single':
      if (clues >= 40) {
        difficulty = 'beginner'
        label = '入門'
        highestTechName = '唯一候補マス (Naked Single)'
        reason = `手がかりが多く (${clues}マス)、基本の確定候補のみで最後まで素直に解き進められる入門パズルです。`
      } else {
        difficulty = 'easy'
        label = '初級'
        highestTechName = '唯一候補マス (Naked Single)'
        reason = `唯一候補を中心に解き進められる初級レベルのパズルです（手がかり数: ${clues}）。`
      }
      break

    case 'hidden-single':
      if (clues >= 32) {
        difficulty = 'easy'
        label = '初級'
        highestTechName = '隠れ一択 (Hidden Single)'
        reason = `行・列・3x3ブロック内を見渡し、各数字が1箇所だけに入るマスを見つけることで解ける初級レベルです。`
      } else {
        difficulty = 'medium'
        label = '中級'
        highestTechName = '隠れ一択 (Hidden Single)'
        reason = `盤面全体を広く走査して隠れ一択（単数候補）を発見する探索力が必要な中級レベルです。`
      }
      break

    case 'pairs':
      difficulty = 'hard'
      label = '上級'
      highestTechName = '同盟ペア (Naked Pair)'
      reason = `2つのマスが同じ2つの候補を共有する同盟ペア等による候補の絞り込みが必要です。`
      break

    case 'intersections':
      difficulty = 'hard'
      label = '上級'
      highestTechName = '交差排除 (Pointing / Claiming)'
      reason = `ブロックと行・列の交差関係から候補を排除する高度な観察力が必要です。`
      break

    case 'advanced-or-trial':
    default:
      difficulty = 'expert'
      label = 'エキスパート'
      highestTechName = '高度技法 / 背理法 (Advanced / Trial)'
      reason = `X-Wing等の高度な論理鎖や、背理的探索（仮定法）を要する最高難度のパズルです。`
      break
  }

  return {
    difficulty,
    label,
    highestTechnique: highestTechName,
    reason,
    clues,
  }
}
