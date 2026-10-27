import { useEffect, useMemo, useRef, useState } from 'react'
import ActionTools from './components/ActionTools'
import ApiKeyModal from './components/ApiKeyModal'
import Board from './components/Board'
import DifficultyBar from './components/DifficultyBar'
import Header from './components/Header'
import HintPanel from './components/HintPanel'
import ImportModal from './components/ImportModal'
import MyPuzzlesModal from './components/MyPuzzlesModal'
import NewGameModal from './components/NewGameModal'
import Numpad from './components/Numpad'
import PwaUpdateToast from './components/PwaUpdateToast'
import VictoryModal from './components/VictoryModal'
import { useApiKey } from './hooks/useApiKey'
import { useInputMode } from './hooks/useInputMode'
import { useSavedPuzzles } from './hooks/useSavedPuzzles'
import { useSudokuGame } from './hooks/useSudokuGame'
import { useTheme } from './hooks/useTheme'
import { formatTime } from './hooks/useTimer'
import { DIFFICULTY_LABELS, MAX_MISTAKES } from './lib/sudoku'
import { createEmptyNotes } from './lib/sudoku/board'
import { serializeNotes } from './lib/sudoku/savedPuzzles'

interface ToastState {
  text: string
  type: 'success' | 'info'
}

export default function App() {
  const { toggle: toggleTheme } = useTheme()
  const { inputMode, toggleInputMode } = useInputMode()
  const { apiKey, hasCustomApiKey, saveApiKey, clearApiKey } = useApiKey()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isMyPuzzlesOpen, setIsMyPuzzlesOpen] = useState(false)
  const [isNewGameOpen, setIsNewGameOpen] = useState(false)
  const [isVictoryClosed, setIsVictoryClosed] = useState(false)
  const [toast, setToast] = useState<ToastState | null>(null)

  const { state, won, seconds, remaining, activeSavedPuzzleId, newGame, importPuzzle, actions } =
    useSudokuGame()
  const { savedPuzzles, savePuzzle, removePuzzle, markCompleted, checkExists } = useSavedPuzzles()
  const time = formatTime(seconds)

  // Track victory to automatically update saved puzzle status once per win
  const wonProcessedRef = useRef(false)
  useEffect(() => {
    if (won && !wonProcessedRef.current) {
      wonProcessedRef.current = true
      markCompleted(activeSavedPuzzleId || state.initial, seconds)
    } else if (!won) {
      wonProcessedRef.current = false
    }
  }, [won, activeSavedPuzzleId, state.initial, seconds, markCompleted])

  // Has player made moves in the current game
  const hasUnsavedGame = useMemo(() => {
    return state.board.some((row, r) => row.some((val, c) => val !== state.initial[r][c]))
  }, [state.board, state.initial])

  // Reset victory modal visibility on new game
  const handleNewGame = (diff?: typeof state.difficulty) => {
    setIsVictoryClosed(false)
    if (diff) newGame(diff)
    else newGame(state.difficulty)
  }

  const handleImportPuzzle = (initial: number[][], solution: number[][], difficulty: typeof state.difficulty) => {
    setIsVictoryClosed(false)
    importPuzzle(initial, solution, difficulty)
  }

  const handleSaveCurrentPuzzle = () => {
    // Check if identical puzzle already exists in My Puzzles
    const existing = checkExists(state.initial)
    if (existing) {
      setToast({
        text: 'このパズルは既にマイパズルに登録されています',
        type: 'info',
      })
      setTimeout(() => setToast(null), 2500)
      return
    }

    const diffLabel = state.source === 'imported' ? '取り込み' : DIFFICULTY_LABELS[state.difficulty]
    const dateStr = new Date().toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric' })
    const title = `${diffLabel} (${dateStr})`

    savePuzzle({
      title,
      difficulty: state.difficulty,
      source: state.source,
      initial: state.initial,
      solution: state.solution,
      currentBoard: state.initial.map((row) => [...row]),
      currentNotes: serializeNotes(createEmptyNotes()),
      elapsedSeconds: 0,
      mistakes: 0,
      isCompleted: won,
      clearTime: won ? seconds : undefined,
    })

    setToast({
      text: 'マイパズルに登録しました！',
      type: 'success',
    })
    setTimeout(() => setToast(null), 2500)
  }

  const showVictoryModal = won && !isVictoryClosed

  const displayDifficultyLabel =
    state.source === 'imported' ? '取り込み問題' : DIFFICULTY_LABELS[state.difficulty]

  const isInteractiveDisabled = won || state.isPaused

  return (
    <>
      <Header
        hasCustomApiKey={hasCustomApiKey}
        savedCount={savedPuzzles.length}
        inputMode={inputMode}
        onToggleTheme={toggleTheme}
        onToggleInputMode={toggleInputMode}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSavedPuzzles={() => setIsMyPuzzlesOpen(true)}
        onSavePuzzle={handleSaveCurrentPuzzle}
        onOpenImport={() => setIsImportOpen(true)}
      />

      {toast && (
        <div
          className={`fixed top-4 left-1/2 -translate-x-1/2 z-50 py-2 px-4 rounded-2xl text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600' : 'bg-slate-700 dark:bg-slate-800'
          }`}
        >
          <i
            className={`fa-solid ${
              toast.type === 'success' ? 'fa-circle-check text-emerald-200' : 'fa-circle-info text-sky-300'
            }`}
          ></i>
          {toast.text}
        </div>
      )}

      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start justify-center">
        <div className="flex flex-col items-center w-full max-w-[430px]">
          <DifficultyBar
            difficulty={state.difficulty}
            isImported={state.source === 'imported'}
            time={time}
            isPaused={state.isPaused}
            mistakes={state.mistakes}
            maxMistakes={MAX_MISTAKES}
            onTogglePause={actions.togglePause}
            onOpenNewGame={() => setIsNewGameOpen(true)}
          />
          <Board
            state={state}
            readOnly={won}
            inputMode={inputMode}
            remaining={remaining}
            onSelect={(row, col) => actions.select({ row, col })}
            onResume={actions.resume}
            onInput={actions.input}
            onErase={actions.erase}
            onClosePalette={() => actions.select(null)}
          />
          <ActionTools
            noteMode={state.noteMode}
            disabled={isInteractiveDisabled}
            onUndo={actions.undo}
            onErase={actions.erase}
            onToggleNote={actions.toggleNoteMode}
            onCheck={actions.check}
          />
          {inputMode === 'numpad' && (
            <Numpad remaining={remaining} disabled={isInteractiveDisabled} onInput={actions.input} />
          )}
        </div>

        <div className="w-full max-w-[430px] lg:max-w-none lg:w-80 flex flex-col gap-3">
          <HintPanel
            panel={state.hintPanel}
            disabled={isInteractiveDisabled}
            onHint={actions.hint}
            onHintNext={actions.hintNext}
            onHintClose={actions.hintClose}
          />
        </div>
      </main>

      <ApiKeyModal
        isOpen={isSettingsOpen}
        currentKey={apiKey}
        onSave={saveApiKey}
        onClear={clearApiKey}
        onClose={() => setIsSettingsOpen(false)}
      />

      <ImportModal
        isOpen={isImportOpen}
        apiKey={apiKey}
        hasUnsavedGame={hasUnsavedGame}
        onClose={() => setIsImportOpen(false)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onImport={handleImportPuzzle}
      />

      <MyPuzzlesModal
        isOpen={isMyPuzzlesOpen}
        puzzles={savedPuzzles}
        onClose={() => setIsMyPuzzlesOpen(false)}
        onLoadPuzzle={actions.loadPuzzle}
        onDeletePuzzle={removePuzzle}
      />

      <NewGameModal
        isOpen={isNewGameOpen}
        currentDifficulty={state.difficulty}
        hasUnsavedProgress={hasUnsavedGame}
        onSelectDifficulty={(diff) => {
          setIsNewGameOpen(false)
          handleNewGame(diff)
        }}
        onClose={() => setIsNewGameOpen(false)}
      />

      {showVictoryModal && (
        <VictoryModal
          time={time}
          difficultyLabel={displayDifficultyLabel}
          onRestart={() => handleNewGame(state.difficulty)}
          onClose={() => setIsVictoryClosed(true)}
        />
      )}

      {/* PWA更新通知トースト */}
      <PwaUpdateToast />
    </>
  )
}
