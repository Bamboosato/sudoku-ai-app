import { useCallback, useEffect, useMemo, useReducer, useState } from 'react'
import confetti from 'canvas-confetti'
import {
  MAX_MISTAKES,
  countRemaining,
  createGameState,
  gameReducer,
  generatePuzzle,
  isSolved,
} from '../lib/sudoku'
import type { Difficulty, Grid, Position } from '../lib/sudoku'
import type { LoadedPuzzlePayload } from '../lib/sudoku/savedPuzzles'
import { useTimer } from './useTimer'

export function useSudokuGame() {
  const [state, dispatch] = useReducer(gameReducer, 'easy' as Difficulty, (d) => createGameState(d))
  const [timerInitialSeconds, setTimerInitialSeconds] = useState(0)

  const won = useMemo(() => isSolved(state.board, state.solution), [state.board, state.solution])
  const gameOver = state.mistakes >= MAX_MISTAKES
  const isTimerRunning = !won && !gameOver && !state.isPaused
  const seconds = useTimer(isTimerRunning, state.gameId, timerInitialSeconds)
  const remaining = useMemo(() => countRemaining(state.board), [state.board])

  useEffect(() => {
    if (won) confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } })
  }, [won])

  const newGame = useCallback((difficulty: Difficulty) => {
    setTimerInitialSeconds(0)
    const { solution, initial } = generatePuzzle(difficulty)
    dispatch({ type: 'NEW_GAME', difficulty, solution, initial })
  }, [])

  const importPuzzle = useCallback((initial: Grid, solution: Grid, difficulty: Difficulty) => {
    setTimerInitialSeconds(0)
    dispatch({ type: 'IMPORT_PUZZLE', difficulty, initial, solution })
  }, [])

  const loadPuzzle = useCallback((payload: LoadedPuzzlePayload) => {
    setTimerInitialSeconds(payload.elapsedSeconds)
    dispatch({ type: 'LOAD_PUZZLE', puzzle: payload })
  }, [])

  const togglePause = useCallback(() => {
    dispatch({ type: 'TOGGLE_PAUSE' })
  }, [])

  const resume = useCallback(() => {
    dispatch({ type: 'RESUME' })
  }, [])

  const actions = useMemo(
    () => ({
      select: (pos: Position) => dispatch({ type: 'SELECT', pos }),
      move: (dRow: number, dCol: number) => dispatch({ type: 'MOVE', dRow, dCol }),
      input: (num: number) => dispatch({ type: 'INPUT', num }),
      erase: () => dispatch({ type: 'ERASE' }),
      undo: () => dispatch({ type: 'UNDO' }),
      toggleNoteMode: () => dispatch({ type: 'TOGGLE_NOTE_MODE' }),
      hint: () => dispatch({ type: 'HINT' }),
      autoNotes: () => dispatch({ type: 'AUTO_NOTES' }),
      solveAll: () => dispatch({ type: 'SOLVE_ALL' }),
      check: () => dispatch({ type: 'CHECK' }),
      togglePause,
      resume,
      loadPuzzle,
    }),
    [togglePause, resume, loadPuzzle],
  )

  // Keyboard shortcuts (active only while a cell is selected and game is not paused)
  const hasSelection = state.selected !== null && !state.isPaused
  useEffect(() => {
    if (!hasSelection) return
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key
      if (key >= '1' && key <= '9') actions.input(parseInt(key, 10))
      else if (key === 'Backspace' || key === 'Delete') actions.erase()
      else if (key === 'n' || key === 'N') actions.toggleNoteMode()
      else if (key === 'ArrowUp') actions.move(-1, 0)
      else if (key === 'ArrowDown') actions.move(1, 0)
      else if (key === 'ArrowLeft') actions.move(0, -1)
      else if (key === 'ArrowRight') actions.move(0, 1)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [hasSelection, actions])

  return { state, won, gameOver, seconds, remaining, newGame, importPuzzle, actions }
}
