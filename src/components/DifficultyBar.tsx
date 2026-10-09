import { DIFFICULTY_LABELS } from '../lib/sudoku'
import type { Difficulty } from '../lib/sudoku'

interface DifficultyBarProps {
  difficulty: Difficulty
  onSelect: (d: Difficulty) => void
  onNewGame: () => void
  onOpenImport?: () => void
  onSavePuzzle?: () => void
}

const ORDER: Difficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert']

export default function DifficultyBar({
  difficulty,
  onSelect,
  onNewGame,
  onOpenImport,
  onSavePuzzle,
}: DifficultyBarProps) {
  return (
    <div className="w-full flex items-center justify-between gap-1.5 sm:gap-2 mb-3 px-1">
      <div className="inline-flex p-0.5 sm:p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-[11px] sm:text-xs font-semibold">
        {ORDER.map((d) => (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={
              d === difficulty
                ? 'px-1.5 sm:px-2.5 py-1 rounded-lg transition bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'px-1.5 sm:px-2.5 py-1 rounded-lg transition text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 sm:gap-1.5">
        {onSavePuzzle && (
          <button
            type="button"
            onClick={onSavePuzzle}
            className="text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition flex items-center gap-1"
            title="現在の途中盤面を保存"
          >
            <i className="fa-regular fa-floppy-disk"></i>
            <span className="hidden sm:inline">保存</span>
          </button>
        )}

        {onOpenImport && (
          <button
            type="button"
            onClick={onOpenImport}
            className="text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center gap-1"
            title="新聞や写真の数独画像を読み込む"
          >
            <i className="fa-solid fa-camera"></i>
            <span className="hidden sm:inline">画像読込</span>
          </button>
        )}

        <button
          type="button"
          onClick={onNewGame}
          className="text-xs font-semibold px-2 sm:px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-indigo-900 transition flex items-center gap-1"
        >
          <i className="fa-solid fa-rotate-right"></i> 新規
        </button>
      </div>
    </div>
  )
}
