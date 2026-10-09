import { DIFFICULTY_LABELS } from '../lib/sudoku'
import type { Difficulty } from '../lib/sudoku'

interface DifficultyBarProps {
  difficulty: Difficulty
  onSelect: (d: Difficulty) => void
  onNewGame: () => void
  onOpenImport?: () => void
}

const ORDER: Difficulty[] = ['easy', 'medium', 'hard']

export default function DifficultyBar({
  difficulty,
  onSelect,
  onNewGame,
  onOpenImport,
}: DifficultyBarProps) {
  return (
    <div className="w-full flex items-center justify-between gap-2 mb-3 px-1">
      <div className="inline-flex p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-xs font-semibold">
        {ORDER.map((d) => (
          <button
            key={d}
            onClick={() => onSelect(d)}
            className={
              d === difficulty
                ? 'px-2.5 py-1 rounded-lg transition bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'px-2.5 py-1 rounded-lg transition text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }
          >
            {DIFFICULTY_LABELS[d]}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1.5">
        {onOpenImport && (
          <button
            type="button"
            onClick={onOpenImport}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition flex items-center gap-1"
            title="新聞や写真の数独画像を読み込む"
          >
            <i className="fa-solid fa-camera"></i>
            <span className="hidden xs:inline">画像から取り込み</span>
            <span className="xs:hidden">取り込み</span>
          </button>
        )}

        <button
          type="button"
          onClick={onNewGame}
          className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-indigo-900 transition flex items-center gap-1"
        >
          <i className="fa-solid fa-rotate-right"></i> 新規
        </button>
      </div>
    </div>
  )
}
