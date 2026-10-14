import { useEffect } from 'react'
import { DIFFICULTY_LABELS } from '../lib/sudoku'
import type { Difficulty } from '../lib/sudoku'

interface NewGameModalProps {
  isOpen: boolean
  currentDifficulty: Difficulty
  hasUnsavedProgress?: boolean
  onSelectDifficulty: (difficulty: Difficulty) => void
  onClose: () => void
}

interface DifficultyOption {
  key: Difficulty
  stars: string
  desc: string
  colorBadge: string
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  {
    key: 'beginner',
    stars: '★☆☆☆☆',
    desc: 'ヒントが多く、初心者やお子様でも安心して楽しめます',
    colorBadge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
  },
  {
    key: 'easy',
    stars: '★★☆☆☆',
    desc: '基本テクニックでサクサク解ける標準的なパズル',
    colorBadge: 'bg-sky-50 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300 border-sky-200/80 dark:border-sky-800/60',
  },
  {
    key: 'medium',
    stars: '★★★☆☆',
    desc: '複数の候補を絞り込む論理的思考が楽しめます',
    colorBadge: 'bg-indigo-50 text-brand-600 dark:bg-indigo-950/60 dark:text-brand-300 border-indigo-200/80 dark:border-indigo-800/60',
  },
  {
    key: 'hard',
    stars: '★★★★☆',
    desc: '高度な解法テクニックが求められる手応えあるレベル',
    colorBadge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
  },
  {
    key: 'expert',
    stars: '★★★★★',
    desc: '極限まで手がかりを削ぎ落とした最高難度の挑戦',
    colorBadge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/80 dark:border-rose-800/60',
  },
]

export default function NewGameModal({
  isOpen,
  currentDifficulty,
  hasUnsavedProgress = false,
  onSelectDifficulty,
  onClose,
}: NewGameModalProps) {
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center text-sm font-bold shadow-inner">
              <i className="fa-solid fa-rotate-right"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
                新規ゲーム
              </h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                難易度を選択してください
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            aria-label="閉じる"
          >
            <i className="fa-solid fa-xmark text-sm"></i>
          </button>
        </div>

        {/* Warning if current game has progress */}
        {hasUnsavedProgress && (
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/60 text-amber-800 dark:text-amber-200 text-xs flex items-center gap-2">
            <i className="fa-solid fa-circle-exclamation text-amber-500 shrink-0"></i>
            <span className="text-[11px] leading-tight">
              現在の途中盤面はリセットされます（保存したい場合はキャンセルして「保存」を押してください）。
            </span>
          </div>
        )}

        {/* Difficulty Selection Buttons */}
        <div className="flex flex-col gap-2">
          {DIFFICULTY_OPTIONS.map((opt) => {
            const isCurrent = opt.key === currentDifficulty
            return (
              <button
                key={opt.key}
                type="button"
                onClick={() => onSelectDifficulty(opt.key)}
                className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between gap-3 active:scale-[0.98] ${
                  isCurrent
                    ? 'border-brand-500 dark:border-brand-500 bg-brand-50/50 dark:bg-brand-950/30 ring-2 ring-brand-500/30'
                    : 'border-slate-200 dark:border-slate-700/80 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-100/80 dark:hover:bg-slate-800/80 hover:border-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800 dark:text-slate-100">
                      {DIFFICULTY_LABELS[opt.key]}
                    </span>
                    <span className="text-[10px] text-amber-500 tracking-wider font-mono">
                      {opt.stars}
                    </span>
                    {isCurrent && (
                      <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-brand-500 text-white">
                        現在
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">
                    {opt.desc}
                  </p>
                </div>
                <i className="fa-solid fa-chevron-right text-xs text-slate-400 dark:text-slate-500 shrink-0"></i>
              </button>
            )
          })}
        </div>

        {/* Cancel Button */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-center"
          >
            キャンセル
          </button>
        </div>
      </div>
    </div>
  )
}
