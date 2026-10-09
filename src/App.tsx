import { useMemo, useState } from 'react'
import ActionTools from './components/ActionTools'
import ApiKeyModal from './components/ApiKeyModal'
import Board from './components/Board'
import DifficultyBar from './components/DifficultyBar'
import GeminiAdvisor from './components/GeminiAdvisor'
import Header from './components/Header'
import HintPanel from './components/HintPanel'
import ImportModal from './components/ImportModal'
import MyPuzzlesModal from './components/MyPuzzlesModal'
import Numpad from './components/Numpad'
import VictoryModal from './components/VictoryModal'
import { useApiKey } from './hooks/useApiKey'
import { useGeminiAdvice } from './hooks/useGeminiAdvice'
import { useSavedPuzzles } from './hooks/useSavedPuzzles'
import { useSudokuGame } from './hooks/useSudokuGame'
import { useTheme } from './hooks/useTheme'
import { formatTime } from './hooks/useTimer'
import { DIFFICULTY_LABELS, MAX_MISTAKES, serializeNotes } from './lib/sudoku'

export default function App() {
  const { toggle: toggleTheme } = useTheme()
  const { apiKey, hasCustomApiKey, saveApiKey, clearApiKey } = useApiKey()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [isMyPuzzlesOpen, setIsMyPuzzlesOpen] = useState(false)
  const [isVictoryClosed, setIsVictoryClosed] = useState(false)
  const [saveSuccessMessage, setSaveSuccessMessage] = useState<string | null>(null)

  const { state, won, seconds, remaining, newGame, importPuzzle, actions } = useSudokuGame()
  const { savedPuzzles, savePuzzle, removePuzzle } = useSavedPuzzles()
  const { advice, ask: askGemini } = useGeminiAdvice(state, apiKey)
  const time = formatTime(seconds)

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
    const diffLabel = DIFFICULTY_LABELS[state.difficulty]
    const title = `${diffLabel} (${formatTime(seconds)})`
    savePuzzle({
      title,
      difficulty: state.difficulty,
      source: state.source,
      initial: state.initial,
      solution: state.solution,
      currentBoard: state.board,
      currentNotes: serializeNotes(state.notes),
      elapsedSeconds: seconds,
      mistakes: state.mistakes,
      isCompleted: won,
    })
    setSaveSuccessMessage('パズルを保存しました！')
    setTimeout(() => setSaveSuccessMessage(null), 2500)
  }

  const showVictoryModal = won && !isVictoryClosed

  const displayDifficultyLabel =
    state.source === 'imported' ? '取り込み問題' : DIFFICULTY_LABELS[state.difficulty]

  const isInteractiveDisabled = won || state.isPaused

  return (
    <>
      <Header
        time={time}
        mistakes={state.mistakes}
        maxMistakes={MAX_MISTAKES}
        hasCustomApiKey={hasCustomApiKey}
        isPaused={state.isPaused}
        savedCount={savedPuzzles.length}
        onTogglePause={actions.togglePause}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenSavedPuzzles={() => setIsMyPuzzlesOpen(true)}
      />

      {saveSuccessMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 py-2 px-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2 duration-200 flex items-center gap-2">
          <i className="fa-solid fa-circle-check"></i>
          {saveSuccessMessage}
        </div>
      )}

      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start justify-center">
        <div className="flex flex-col items-center w-full max-w-[430px]">
          <DifficultyBar
            difficulty={state.difficulty}
            onSelect={handleNewGame}
            onNewGame={() => handleNewGame(state.difficulty)}
            onOpenImport={() => setIsImportOpen(true)}
            onSavePuzzle={handleSaveCurrentPuzzle}
          />
          <Board
            state={state}
            readOnly={won}
            onSelect={(row, col) => actions.select({ row, col })}
            onResume={actions.resume}
          />
          <ActionTools
            noteMode={state.noteMode}
            disabled={isInteractiveDisabled}
            onUndo={actions.undo}
            onErase={actions.erase}
            onToggleNote={actions.toggleNoteMode}
            onCheck={actions.check}
          />
          <Numpad remaining={remaining} disabled={isInteractiveDisabled} onInput={actions.input} />
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-3">
          <HintPanel
            panel={state.hintPanel}
            disabled={isInteractiveDisabled}
            onHint={actions.hint}
            onAutoNotes={actions.autoNotes}
            onSolveAll={actions.solveAll}
          />
          <GeminiAdvisor
            advice={advice}
            hasCustomApiKey={hasCustomApiKey}
            disabled={isInteractiveDisabled}
            onAsk={askGemini}
            onOpenSettings={() => setIsSettingsOpen(true)}
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

      {showVictoryModal && (
        <VictoryModal
          time={time}
          difficultyLabel={displayDifficultyLabel}
          onRestart={() => handleNewGame(state.difficulty)}
          onClose={() => setIsVictoryClosed(true)}
        />
      )}
    </>
  )
}
