import { DIFFICULTY_LABELS } from '../lib/sudoku'
import type { Difficulty } from '../lib/sudoku'

interface DifficultyBarProps {
  difficulty: Difficulty
  isImported?: boolean
  time: string
  isPaused: boolean
  mistakes: number
  maxMistakes: number
  onTogglePause: () => void
  onOpenNewGame: () => void
}

export default function DifficultyBar({
  difficulty,
  isImported = false,
  time,
  isPaused,
  mistakes,
  maxMistakes,
  onTogglePause,
  onOpenNewGame,
}: DifficultyBarProps) {
  const label = isImported ? '取り込み問題' : DIFFICULTY_LABELS[difficulty]

  return (
    <div className="w-full flex items-center justify-between gap-2 mb-3 px-1">
      {/* Top-left: currently selected difficulty display */}
      <div className="flex items-center px-3 py-1.5 rounded-xl bg-indigo-50/80 dark:bg-indigo-950/60 border border-brand-200/70 dark:border-indigo-800/60 text-brand-600 dark:text-brand-300 font-bold text-xs sm:text-sm shadow-sm select-none whitespace-nowrap shrink-0">
        {label}
      </div>

      {/* Top-right: Prominent Timer, Reset Count, & New Game Button */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Prominent Timer */}
        <div
          className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl border shadow-sm transition select-none whitespace-nowrap ${
            isPaused
              ? 'bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-300 ring-2 ring-amber-400/50'
              : 'bg-white dark:bg-slate-800 border-slate-200/90 dark:border-slate-700 text-slate-800 dark:text-slate-100 shadow-slate-200/60 dark:shadow-none'
          }`}
        >
          <i
            className={`fa-regular fa-clock text-xs sm:text-sm ${
              isPaused ? 'text-amber-500 animate-pulse' : 'text-brand-500 dark:text-brand-400'
            }`}
          ></i>
          <span className="font-mono text-xs sm:text-sm font-bold tracking-tight">
            {time}
          </span>
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? 'ゲームを再開' : 'タイマーを一時停止'}
            title={isPaused ? 'ゲームを再開' : 'タイマーを一時停止'}
            className="w-5 h-5 sm:w-6 sm:h-6 rounded-md sm:rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-90 transition ml-0.5"
          >
            <i
              className={`fa-solid ${
                isPaused ? 'fa-play text-xs text-emerald-500' : 'fa-pause text-[10px] sm:text-[11px]'
              }`}
            ></i>
          </button>
        </div>

        {/* Reset Count (between Timer and New Game button) */}
        <div
          className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200/80 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 font-mono text-xs sm:text-sm font-bold shadow-sm select-none whitespace-nowrap"
          title={`リセット回数: ${mistakes} / ${maxMistakes}`}
        >
          <i className="fa-solid fa-heart text-xs text-rose-500"></i>
          <span>
            {mistakes}/{maxMistakes}
          </span>
        </div>

        {/* New Game Button */}
        <button
          type="button"
          onClick={onOpenNewGame}
          className="text-xs sm:text-sm font-bold px-3 sm:px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-sm shadow-brand-500/25 active:scale-95 transition flex items-center gap-1.5 whitespace-nowrap"
          title="難易度を選んで新しいゲームを開始"
        >
          <i className="fa-solid fa-rotate-right text-xs"></i>
          <span>新規</span>
        </button>
      </div>
    </div>
  )
}
