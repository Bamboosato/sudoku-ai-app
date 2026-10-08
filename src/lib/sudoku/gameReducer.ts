import {
  cleanPeerNotes,
  cloneGrid,
  cloneNotes,
  countMistakes,
  createEmptyNotes,
} from './board'
import { generatePuzzle } from './generator'
import { findSmartAIHint } from './hints'
import { computeCellCandidates } from './solver'
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

export interface GameState {
  gameId: number
  difficulty: Difficulty
  solution: Grid
  initial: Grid
  board: Grid
  notes: Notes
  selected: Position | null
  noteMode: boolean
  history: Snapshot[]
  mistakes: number
  activeHint: Hint | null
  hintPanel: HintPanelState
}

export type GameAction =
  | { type: 'NEW_GAME'; difficulty: Difficulty; solution: Grid; initial: Grid }
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
  return newGameState(gameId, difficulty, solution, initial)
}

function newGameState(
  gameId: number,
  difficulty: Difficulty,
  solution: Grid,
  initial: Grid,
): GameState {
  return {
    gameId,
    difficulty,
    solution,
    initial,
    board: cloneGrid(initial),
    notes: createEmptyNotes(),
    selected: null,
    noteMode: false,
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
  switch (action.type) {
    case 'NEW_GAME':
      return newGameState(state.gameId + 1, action.difficulty, action.solution, action.initial)

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

      let mistakes = state.mistakes
      let hintPanel = state.hintPanel
      if (num !== state.solution[row][col]) {
        mistakes++
        if (mistakes >= MAX_MISTAKES) {
          hintPanel = {
            ...hintPanel,
            hint: undefined,
            text: 'ミスの制限上限に達しました。新規ゲームでリスタートしましょう！',
          }
        }
      }
      return { ...state, history, board, notes, mistakes, hintPanel, activeHint: null }
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
            text: 'すべてのマスが埋まっているか、現在の盤面に矛盾があります。「ミス診断」で誤りがないか確認してください。',
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
      const found = countMistakes(state.board, state.solution)
      const hintPanel: HintPanelState =
        found === 0
          ? {
              ...state.hintPanel,
              badge: '診断正常',
              hint: undefined,
              text: '現在入力されている数字に矛盾や間違いはありません！順調です。',
            }
          : {
              badge: 'エラー発見',
              tone: 'rose',
              text: `現在、赤文字で表示されている ${found} 箇所の数字が誤っています。消去してやり直しましょう。`,
            }
      return { ...state, hintPanel }
    }
  }
}
