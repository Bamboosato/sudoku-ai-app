import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import App from './App'
import { useSudokuGame } from './hooks/useSudokuGame'
import { useSavedPuzzles } from './hooks/useSavedPuzzles'
import { createEmptyNotes } from './lib/sudoku/board'
import { createGameState } from './lib/sudoku/gameReducer'
import { deserializeNotes, loadSavedPuzzlesFromStorage, saveOrUpdatePuzzle, validateSavedPuzzle } from './lib/sudoku/savedPuzzles'

const header = vi.hoisted(() => ({ onSavePuzzle: () => {} }))
vi.mock('./components/Header', () => ({
  default: (props: typeof header) => { header.onSavePuzzle = props.onSavePuzzle; return null },
}))
vi.mock('./components/PwaUpdateToast', () => ({ default: () => null }))
vi.mock('./hooks/useTheme', () => ({ useTheme: () => ({ toggle: () => {} }) }))
vi.mock('./hooks/useSudokuGame')
vi.mock('./hooks/useSavedPuzzles')

beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  })
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

it.each([false, true])('saves the initial puzzle in reloadable form from App (won: %s)', (won) => {
  const state = createGameState('beginner')
  // Register the initial puzzle even when the current game has progress.
  state.board = state.solution.map((row) => [...row])
  state.notes[0][0].add(4)
  state.mistakes = 2
  vi.mocked(useSudokuGame).mockReturnValue({
    state, won, gameOver: false, seconds: 95, remaining: [], activeSavedPuzzleId: null,
    newGame: vi.fn(), importPuzzle: vi.fn(), actions: {} as ReturnType<typeof useSudokuGame>['actions'],
  })
  const savePuzzle = vi.fn((data: Parameters<typeof saveOrUpdatePuzzle>[1]) => {
    saveOrUpdatePuzzle([], data)
  })
  vi.mocked(useSavedPuzzles).mockReturnValue({
    savedPuzzles: [], savePuzzle, removePuzzle: vi.fn(), markCompleted: vi.fn(),
    checkExists: vi.fn(),
  })

  renderToStaticMarkup(<App />)
  header.onSavePuzzle()

  expect(savePuzzle).toHaveBeenCalledOnce()
  // Check the writer itself so legacy recovery cannot hide broken new saves.
  const written = savePuzzle.mock.calls[0][0]
  expect(written.currentNotes).toHaveLength(9)
  expect(written.currentNotes.every((row) => row.length === 9 && row.every((cell) => cell.length === 0))).toBe(true)
  const [loaded] = loadSavedPuzzlesFromStorage()
  expect(validateSavedPuzzle(loaded)).toBe(true)
  expect(loaded.currentBoard).toEqual(state.initial)
  expect(loaded.solution).toEqual(state.solution)
  expect(deserializeNotes(loaded.currentNotes)).toEqual(createEmptyNotes())
  expect(loaded.elapsedSeconds).toBe(0)
  expect(loaded.mistakes).toBe(0)
  expect(loaded.isCompleted).toBe(won)
  expect(loaded.clearTime).toBe(won ? 95 : undefined)
})
