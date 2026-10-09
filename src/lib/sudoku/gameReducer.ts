import {
  cleanPeerNotes,
  cloneGrid,
  cloneNotes,
  createEmptyNotes,
} from './board'
import { generatePuzzle } from './generator'
import { findSmartAIHint } from './hints'
import { computeCellCandidates } from './solver'
import type { LoadedPuzzlePayload } from './savedPuzzles'
import type { Difficulty, Grid, Hint, Notes, Position } from './types'

export const MAX_MISTAKES = 3
const HISTORY_LIMIT = 30

export type BadgeTone = 'default' | 'amber' | 'rose'

export interface HintPanelState {
  badge: string
  tone: BadgeTone
  /** Plain text message (used when `hint` is undefined) */
  text?: string
  hint?: Hint
}

interface Snapshot {
  board: Grid
  notes: Notes
  mistakes: number
}

export type PuzzleSource = 'generated' | 'imported'

export interface GameState {
  gameId: number
  difficulty: Difficulty
  source: PuzzleSource
  solution: Grid
  initial: Grid
  board: Grid
  notes: Notes
  selected: Position | null
  noteMode: boolean
  isPaused: boolean
  history: Snapshot[]
  mistakes: number
  activeHint: Hint | null
  hintPanel: HintPanelState
}

export type GameAction =
  | { type: 'NEW_GAME'; difficulty: Difficulty; solution: Grid; initial: Grid }
  | { type: 'IMPORT_PUZZLE'; difficulty: Difficulty; solution: Grid; initial: Grid }
  | { type: 'LOAD_PUZZLE'; puzzle: LoadedPuzzlePayload }
  | { type: 'TOGGLE_PAUSE' }
  | { type: 'RESUME' }
  | { type: 'SELECT'; pos: Position }
  | { type: 'MOVE'; dRow: number; dCol: number }
  | { type: 'INPUT'; num: number }
  | { type: 'ERASE' }
  | { type: 'UNDO' }
  | { type: 'TOGGLE_NOTE_MODE' }
  | { type: 'HINT' }
  | { type: 'AUTO_NOTES' }
  | { type: 'SOLVE_ALL' }
  | { type: 'CHECK' }

export const IDLE_HINT_PANEL: HintPanelState = {
  badge: '待機中',
  tone: 'default',
  text: '「次の一手と論理解説」を押すと、盤面全体の数字と候補を論理的にスキャンして次に解くべきマスと論理的理由を解説します。',
}

export function createGameState(difficulty: Difficulty, gameId = 0): GameState {
  const { solution, initial } = generatePuzzle(difficulty)
  return newGameState(gameId, difficulty, solution, initial, 'generated')
}

function newGameState(
  gameId: number,
  difficulty: Difficulty,
  solution: Grid,
  initial: Grid,
  source: PuzzleSource = 'generated',
): GameState {
  return {
    gameId,
    difficulty,
    source,
    solution,
    initial,
    board: cloneGrid(initial),
    notes: createEmptyNotes(),
    selected: null,
    noteMode: false,
    isPaused: false,
    history: [],
    mistakes: 0,
    activeHint: null,
    hintPanel: IDLE_HINT_PANEL,
  }
}

function withSnapshot(state: GameState): Snapshot[] {
  const history = [
    ...state.history,
    { board: cloneGrid(state.board), notes: cloneNotes(state.notes), mistakes: state.mistakes },
  ]
  if (history.length > HISTORY_LIMIT) history.shift()
  return history
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  // Global pause guard for mutations
  const editingActions = ['INPUT', 'ERASE', 'UNDO', 'TOGGLE_NOTE_MODE', 'HINT', 'AUTO_NOTES', 'SOLVE_ALL', 'CHECK', 'SELECT', 'MOVE']
  if (state.isPaused && editingActions.includes(action.type)) {
    return state
  }

  switch (action.type) {
    case 'NEW_GAME':
      return newGameState(state.gameId + 1, action.difficulty, action.solution, action.initial, 'generated')

    case 'IMPORT_PUZZLE':
      return newGameState(state.gameId + 1, action.difficulty, action.solution, action.initial, 'imported')

    case 'LOAD_PUZZLE': {
      const { puzzle } = action
      return {
        gameId: state.gameId + 1,
        difficulty: puzzle.difficulty,
        source: puzzle.source,
        solution: cloneGrid(puzzle.solution),
        initial: cloneGrid(puzzle.initial),
        board: cloneGrid(puzzle.board),
        notes: cloneNotes(puzzle.notes),
        selected: null,
        noteMode: false,
        isPaused: false,
        history: [],
        mistakes: puzzle.mistakes,
        activeHint: null,
        hintPanel: IDLE_HINT_PANEL,
      }
    }

    case 'TOGGLE_PAUSE':
      return { ...state, isPaused: !state.isPaused, selected: null, activeHint: null }

    case 'RESUME':
      return { ...state, isPaused: false }

    case 'SELECT':
      return { ...state, selected: action.pos }

    case 'MOVE': {
      if (!state.selected) return state
      const row = state.selected.row + action.dRow
      const col = state.selected.col + action.dCol
      if (row < 0 || row > 8 || col < 0 || col > 8) return state
      return { ...state, selected: { row, col } }
    }

    case 'INPUT': {
      if (!state.selected) return state
      const { row, col } = state.selected
      // Fixed initial clues cannot be edited
      if (state.initial[row][col] !== 0) return state
      const { num } = action

      if (state.noteMode) {
        const notes = cloneNotes(state.notes)
        if (notes[row][col].has(num)) notes[row][col].delete(num)
        else notes[row][col].add(num)
        return { ...state, history: withSnapshot(state), notes }
      }

      if (state.board[row][col] === num) return state

      const history = withSnapshot(state)
      const board = cloneGrid(state.board)
      const notes = cloneNotes(state.notes)
      board[row][col] = num
      notes[row][col].clear()
      cleanPeerNotes(notes, row, col, num)

      return { ...state, history, board, notes, activeHint: null }
    }

    case 'ERASE': {
      if (!state.selected) return state
      const { row, col } = state.selected
      if (state.initial[row][col] !== 0) return state
      if (state.board[row][col] === 0 && state.notes[row][col].size === 0) return state

      const history = withSnapshot(state)
      const board = cloneGrid(state.board)
      const notes = cloneNotes(state.notes)
      board[row][col] = 0
      notes[row][col].clear()
      return { ...state, history, board, notes }
    }

    case 'UNDO': {
      if (state.history.length === 0) return state
      const history = state.history.slice(0, -1)
      const prev = state.history[state.history.length - 1]
      return { ...state, history, board: prev.board, notes: prev.notes, mistakes: prev.mistakes }
    }

    case 'TOGGLE_NOTE_MODE':
      return { ...state, noteMode: !state.noteMode }

    case 'HINT': {
      const hint = findSmartAIHint(state.board, state.solution)
      if (!hint) {
        return {
          ...state,
          hintPanel: {
            ...state.hintPanel,
            hint: undefined,
            text: 'すべてのマスが埋まっているか、現在の盤面に矛盾があります。「誤入力リセット」で誤りがないか確認してください。',
          },
        }
      }
      return {
        ...state,
        activeHint: hint,
        selected: { row: hint.row, col: hint.col },
        hintPanel: {
          badge: hint.badge,
          tone: hint.kind === 'correction' ? 'rose' : 'amber',
          hint,
        },
      }
    }

    case 'AUTO_NOTES': {
      const history = withSnapshot(state)
      const candidates = computeCellCandidates(state.board)
      const notes = cloneNotes(state.notes)
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (state.board[r][c] === 0) notes[r][c] = new Set(candidates[r][c])
        }
      }
      return { ...state, history, notes }
    }

    case 'SOLVE_ALL':
      return {
        ...state,
        history: withSnapshot(state),
        board: cloneGrid(state.solution),
        notes: createEmptyNotes(),
      }

    case 'CHECK': {
      let found = 0
      const board = cloneGrid(state.board)
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (board[r][c] !== 0 && board[r][c] !== state.solution[r][c]) {
            board[r][c] = 0
            found++
          }
        }
      }

      if (found === 0) {
        return {
          ...state,
          hintPanel: {
            ...state.hintPanel,
            badge: '診断正常',
            tone: 'default',
            hint: undefined,
            text: '現在入力されている数字に矛盾や間違いはありません！順調です。',
          },
        }
      }

      const history = withSnapshot(state)
      const mistakes = state.mistakes + 1
      const isGameOver = mistakes >= MAX_MISTAKES
      const hintPanel: HintPanelState = {
        badge: '誤入力リセット',
        tone: 'rose',
        text: isGameOver
          ? `誤って入力されていた ${found} 箇所の数字をリセットしましたが、ミス制限上限（${MAX_MISTAKES}回）に達しました。新規ゲームでリスタートしましょう！`
          : `誤って入力されていた ${found} 箇所の数字をリセットしました（ミス: ${mistakes}/${MAX_MISTAKES}）。`,
      }

      return {
        ...state,
        history,
        board,
        mistakes,
        hintPanel,
        activeHint: null,
      }
    }
  }
}
