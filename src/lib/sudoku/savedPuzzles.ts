import type { Difficulty, Grid, Notes } from './types'
import type { PuzzleSource } from './gameReducer'

export const SAVED_PUZZLES_STORAGE_KEY = 'sudoku_saved_puzzles_v1'
export const MAX_SAVED_PUZZLES = 50

export interface SavedPuzzle {
  id: string
  title: string
  createdAt: string
  updatedAt: string
  difficulty: Difficulty
  source: PuzzleSource
  initial: Grid
  solution: Grid
  currentBoard: Grid
  currentNotes: number[][][]
  elapsedSeconds: number
  mistakes: number
  isCompleted: boolean
}

export interface LoadedPuzzlePayload {
  difficulty: Difficulty
  source: PuzzleSource
  initial: Grid
  solution: Grid
  board: Grid
  notes: Notes
  elapsedSeconds: number
  mistakes: number
}

/** Serializes a 9x9 Notes structure (Set<number>[][]) to a JSON-safe number[][][] */
export function serializeNotes(notes: Notes): number[][][] {
  return notes.map((row) =>
    row.map((cellSet) => Array.from(cellSet).sort((a, b) => a - b)),
  )
}

/** Deserializes a number[][][] back into a 9x9 Notes structure (Set<number>[][]) */
export function deserializeNotes(raw: unknown): Notes {
  if (!Array.isArray(raw) || raw.length !== 9) {
    return Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()))
  }
  return raw.map((row) => {
    if (!Array.isArray(row) || row.length !== 9) {
      return Array.from({ length: 9 }, () => new Set<number>())
    }
    return row.map((cell) => {
      if (!Array.isArray(cell)) return new Set<number>()
      const nums = cell.filter((n) => typeof n === 'number' && n >= 1 && n <= 9)
      return new Set<number>(nums)
    })
  })
}

function isValidGrid(g: unknown): g is Grid {
  if (!Array.isArray(g) || g.length !== 9) return false
  for (let r = 0; r < 9; r++) {
    const row = g[r]
    if (!Array.isArray(row) || row.length !== 9) return false
    for (let c = 0; c < 9; c++) {
      const val = row[c]
      if (typeof val !== 'number' || !Number.isInteger(val) || val < 0 || val > 9) return false
    }
  }
  return true
}

const VALID_DIFFICULTIES: Set<string> = new Set(['beginner', 'easy', 'medium', 'hard', 'expert'])

export function validateSavedPuzzle(item: unknown): item is SavedPuzzle {
  if (!item || typeof item !== 'object') return false
  const p = item as Partial<SavedPuzzle>

  if (typeof p.id !== 'string' || !p.id.trim()) return false
  if (typeof p.title !== 'string') return false
  if (typeof p.createdAt !== 'string' || typeof p.updatedAt !== 'string') return false
  if (typeof p.difficulty !== 'string' || !VALID_DIFFICULTIES.has(p.difficulty)) return false
  if (p.source !== 'generated' && p.source !== 'imported') return false
  if (!isValidGrid(p.initial) || !isValidGrid(p.solution) || !isValidGrid(p.currentBoard)) return false
  if (!Array.isArray(p.currentNotes) || p.currentNotes.length !== 9) return false
  if (typeof p.elapsedSeconds !== 'number' || p.elapsedSeconds < 0) return false
  if (typeof p.mistakes !== 'number' || p.mistakes < 0) return false
  if (typeof p.isCompleted !== 'boolean') return false

  return true
}

/** Reads all saved puzzles from localStorage safely */
export function loadSavedPuzzlesFromStorage(): SavedPuzzle[] {
  try {
    if (typeof localStorage === 'undefined') return []
    const raw = localStorage.getItem(SAVED_PUZZLES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter(validateSavedPuzzle)
  } catch {
    return []
  }
}

/** Saves puzzle list to localStorage */
export function persistSavedPuzzlesToStorage(puzzles: SavedPuzzle[]): void {
  try {
    if (typeof localStorage === 'undefined') return
    localStorage.setItem(SAVED_PUZZLES_STORAGE_KEY, JSON.stringify(puzzles))
  } catch (err) {
    console.error('Failed to save puzzles to localStorage', err)
  }
}

/** Adds or updates a saved puzzle, keeping total <= MAX_SAVED_PUZZLES */
export function saveOrUpdatePuzzle(
  puzzles: SavedPuzzle[],
  puzzleToSave: Omit<SavedPuzzle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string },
): SavedPuzzle[] {
  const now = new Date().toISOString()
  let next = [...puzzles]

  if (puzzleToSave.id) {
    const index = next.findIndex((p) => p.id === puzzleToSave.id)
    if (index !== -1) {
      const updated: SavedPuzzle = {
        ...next[index],
        ...puzzleToSave,
        id: next[index].id,
        createdAt: next[index].createdAt,
        updatedAt: now,
      }
      next[index] = updated
      persistSavedPuzzlesToStorage(next)
      return next
    }
  }

  // Create new puzzle entry
  const newId = `puzzle_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const newPuzzle: SavedPuzzle = {
    ...puzzleToSave,
    id: newId,
    createdAt: now,
    updatedAt: now,
  }

  next.unshift(newPuzzle)

  // Enforce MAX_SAVED_PUZZLES limit
  if (next.length > MAX_SAVED_PUZZLES) {
    // Evict completed ones first, starting from oldest
    const completedIndices = next
      .map((p, idx) => ({ idx, isCompleted: p.isCompleted, createdAt: p.createdAt }))
      .filter((p) => p.isCompleted)

    if (completedIndices.length > 0) {
      // Find oldest completed
      completedIndices.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
      const removeIdx = completedIndices[0].idx
      next.splice(removeIdx, 1)
    } else {
      // Evict oldest puzzle (last item)
      next.pop()
    }
  }

  persistSavedPuzzlesToStorage(next)
  return next
}

/** Deletes a puzzle by ID */
export function deleteSavedPuzzle(puzzles: SavedPuzzle[], id: string): SavedPuzzle[] {
  const next = puzzles.filter((p) => p.id !== id)
  persistSavedPuzzlesToStorage(next)
  return next
}
