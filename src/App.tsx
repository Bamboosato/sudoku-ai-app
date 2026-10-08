import { useState } from 'react'
import ActionTools from './components/ActionTools'
import ApiKeyModal from './components/ApiKeyModal'
import Board from './components/Board'
import DifficultyBar from './components/DifficultyBar'
import GeminiAdvisor from './components/GeminiAdvisor'
import Header from './components/Header'
import HintPanel from './components/HintPanel'
import Numpad from './components/Numpad'
import TechniqueInfo from './components/TechniqueInfo'
import VictoryModal from './components/VictoryModal'
import { useApiKey } from './hooks/useApiKey'
import { useGeminiAdvice } from './hooks/useGeminiAdvice'
import { useSudokuGame } from './hooks/useSudokuGame'
import { useTheme } from './hooks/useTheme'
import { formatTime } from './hooks/useTimer'
import { DIFFICULTY_LABELS, MAX_MISTAKES } from './lib/sudoku'

export default function App() {
  const { toggle: toggleTheme } = useTheme()
  const { apiKey, hasCustomApiKey, saveApiKey, clearApiKey } = useApiKey()
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const { state, won, seconds, remaining, newGame, actions } = useSudokuGame()
  const { advice, ask: askGemini } = useGeminiAdvice(state, apiKey)
  const time = formatTime(seconds)

  return (
    <>
      <Header
        time={time}
        mistakes={state.mistakes}
        maxMistakes={MAX_MISTAKES}
        hasCustomApiKey={hasCustomApiKey}
        onToggleTheme={toggleTheme}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <main className="flex-1 w-full max-w-4xl mx-auto px-2 sm:px-4 py-3 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-8 items-center lg:items-start justify-center">
        <div className="flex flex-col items-center w-full max-w-[430px]">
          <DifficultyBar
            difficulty={state.difficulty}
            onSelect={newGame}
            onNewGame={() => newGame(state.difficulty)}
          />
          <Board state={state} onSelect={(row, col) => actions.select({ row, col })} />
          <ActionTools
            noteMode={state.noteMode}
            onUndo={actions.undo}
            onErase={actions.erase}
            onToggleNote={actions.toggleNoteMode}
            onCheck={actions.check}
          />
          <Numpad remaining={remaining} onInput={actions.input} />
        </div>

        <div className="w-full lg:w-80 flex flex-col gap-3">
          <HintPanel
            panel={state.hintPanel}
            onHint={actions.hint}
            onAutoNotes={actions.autoNotes}
            onSolveAll={actions.solveAll}
          />
          <GeminiAdvisor
            advice={advice}
            hasCustomApiKey={hasCustomApiKey}
            onAsk={askGemini}
            onOpenSettings={() => setIsSettingsOpen(true)}
          />
          <TechniqueInfo />
        </div>
      </main>

      <ApiKeyModal
        isOpen={isSettingsOpen}
        currentKey={apiKey}
        onSave={saveApiKey}
        onClear={clearApiKey}
        onClose={() => setIsSettingsOpen(false)}
      />

      {won && (
        <VictoryModal
          time={time}
          difficultyLabel={DIFFICULTY_LABELS[state.difficulty]}
          onRestart={() => newGame(state.difficulty)}
        />
      )}
    </>
  )
}
