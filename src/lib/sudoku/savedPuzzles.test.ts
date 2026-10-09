import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteSavedPuzzle,
  deserializeNotes,
  loadSavedPuzzlesFromStorage,
  MAX_SAVED_PUZZLES,
  SAVED_PUZZLES_STORAGE_KEY,
  saveOrUpdatePuzzle,
  serializeNotes,
  validateSavedPuzzle,
  type SavedPuzzle,
} from './savedPuzzles'
import { createEmptyGrid } from './board'

// Polyfill in-memory localStorage for Node.js test environment
const memoryStore = new Map<string, string>()
const mockLocalStorage = {
  getItem: (key: string) => memoryStore.get(key) ?? null,
  setItem: (key: string, val: string) => {
    memoryStore.set(key, String(val))
  },
  removeItem: (key: string) => {
    memoryStore.delete(key)
  },
  clear: () => {
    memoryStore.clear()
  },
}
Object.defineProperty(globalThis, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('savedPuzzles storage and serialization', () => {
  beforeEach(() => {
    mockLocalStorage.clear()
  })

  it('correctly serializes and deserializes Notes bidirectionally', () => {
    const originalNotes = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set<number>()),
    )
    originalNotes[0][0].add(1).add(4).add(9)
    originalNotes[4][5].add(2).add(7)

    const serialized = serializeNotes(originalNotes)
    expect(serialized[0][0]).toEqual([1, 4, 9])
    expect(serialized[4][5]).toEqual([2, 7])
    expect(serialized[1][1]).toEqual([])

    const deserialized = deserializeNotes(serialized)
    expect(deserialized[0][0]).toEqual(new Set([1, 4, 9]))
    expect(deserialized[4][5]).toEqual(new Set([2, 7]))
    expect(deserialized[1][1]).toEqual(new Set())
  })

  it('validates saved puzzle schema and rejects corrupted entries', () => {
    const validPuzzle: SavedPuzzle = {
      id: 'p1',
      title: '初級 (01:23)',
      createdAt: '2026-10-09T00:00:00Z',
      updatedAt: '2026-10-09T00:00:00Z',
      difficulty: 'easy',
      source: 'generated',
      initial: createEmptyGrid(),
      solution: createEmptyGrid(),
      currentBoard: createEmptyGrid(),
      currentNotes: Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => [])),
      elapsedSeconds: 83,
      mistakes: 1,
      isCompleted: false,
    }

    expect(validateSavedPuzzle(validPuzzle)).toBe(true)

    // Invalid difficulty
    expect(validateSavedPuzzle({ ...validPuzzle, difficulty: 'impossible' })).toBe(false)
    // Missing fields
    expect(validateSavedPuzzle({ ...validPuzzle, id: '' })).toBe(false)
    // Invalid board shape
    expect(validateSavedPuzzle({ ...validPuzzle, initial: [[1]] })).toBe(false)
    // Non-number elapsed seconds
    expect(validateSavedPuzzle({ ...validPuzzle, elapsedSeconds: -10 })).toBe(false)
  })

  it('safely handles corrupted localStorage content without throwing', () => {
    localStorage.setItem(SAVED_PUZZLES_STORAGE_KEY, 'invalid json {!')
    const loaded = loadSavedPuzzlesFromStorage()
    expect(loaded).toEqual([])
  })

  it('saves and updates puzzles in localStorage', () => {
    let puzzles: SavedPuzzle[] = []
    const dummyGrid = createEmptyGrid()
    const dummyNotes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []))

    // Add 1st puzzle
    puzzles = saveOrUpdatePuzzle(puzzles, {
      title: 'パズル 1',
      difficulty: 'easy',
      source: 'generated',
      initial: dummyGrid,
      solution: dummyGrid,
      currentBoard: dummyGrid,
      currentNotes: dummyNotes,
      elapsedSeconds: 30,
      mistakes: 0,
      isCompleted: false,
    })
    expect(puzzles.length).toBe(1)
    expect(puzzles[0].title).toBe('パズル 1')

    // Update puzzle
    const puzzleId = puzzles[0].id
    puzzles = saveOrUpdatePuzzle(puzzles, {
      id: puzzleId,
      title: '更新タイトル',
      difficulty: 'easy',
      source: 'generated',
      initial: dummyGrid,
      solution: dummyGrid,
      currentBoard: dummyGrid,
      currentNotes: dummyNotes,
      elapsedSeconds: 45,
      mistakes: 1,
      isCompleted: true,
    })
    expect(puzzles.length).toBe(1)
    expect(puzzles[0].title).toBe('更新タイトル')
    expect(puzzles[0].elapsedSeconds).toBe(45)

    // Delete puzzle
    puzzles = deleteSavedPuzzle(puzzles, puzzleId)
    expect(puzzles.length).toBe(0)
  })

  it('enforces maximum 50 capacity and evicts oldest items', () => {
    let puzzles: SavedPuzzle[] = []
    const dummyGrid = createEmptyGrid()
    const dummyNotes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => []))

    for (let i = 0; i < MAX_SAVED_PUZZLES + 5; i++) {
      puzzles = saveOrUpdatePuzzle(puzzles, {
        title: `パズル ${i}`,
        difficulty: 'beginner',
        source: 'generated',
        initial: dummyGrid,
        solution: dummyGrid,
        currentBoard: dummyGrid,
        currentNotes: dummyNotes,
        elapsedSeconds: i,
        mistakes: 0,
        isCompleted: i % 2 === 0,
      })
    }

    expect(puzzles.length).toBe(MAX_SAVED_PUZZLES)
  })
})
