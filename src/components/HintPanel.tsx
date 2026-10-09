import { useEffect, useRef, useState } from 'react'
import type { BadgeTone, HintPanelState } from '../lib/sudoku'

interface HintPanelProps {
  panel: HintPanelState
  disabled?: boolean
  onHint: () => void
  onAutoNotes: () => void
  onSolveAll: () => void
}

const BADGE_TONES: Record<BadgeTone, string> = {
  default: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}

const TECHNIQUES = [
  { name: 'Naked Single (唯一候補)', desc: 'そのマスに入れる数字が1通りしかない状態。' },
  { name: 'Hidden Single (隠れ1択)', desc: '行・列・ブロック内でその数字が入れるマスが1つしかない状態。' },
  { name: 'Naked Pair (同盟ペア)', desc: '同じ2つの候補を持つマスが2つあり他を除外。' },
]

const secondaryBtn =
  'py-2 px-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition flex items-center justify-center gap-1'

export default function HintPanel({
  panel,
  disabled = false,
  onHint,
  onAutoNotes,
  onSolveAll,
}: HintPanelProps) {
  const { hint } = panel
  const disabledCls = disabled ? 'opacity-40 pointer-events-none' : ''
  const [showHelp, setShowHelp] = useState(false)
  const helpRef = useRef<HTMLDivElement>(null)

  // Close popover when clicking outside or pressing Escape
  useEffect(() => {
    if (!showHelp) return
    const handleClickOutside = (e: MouseEvent) => {
      if (helpRef.current && !helpRef.current.contains(e.target as Node)) {
        setShowHelp(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowHelp(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [showHelp])

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <i className="fa-regular fa-lightbulb text-brand-500"></i> 論理ヒント
          </h2>
          <div className="relative inline-block" ref={helpRef}>
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="検出する解法技法の解説を見る"
              aria-label="解法技法について"
              aria-expanded={showHelp}
            >
              <i className="fa-regular fa-circle-question text-xs"></i>
            </button>

            {showHelp && (
              <div className="absolute left-0 top-full mt-2 w-72 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <i className="fa-solid fa-graduation-cap text-brand-500"></i> 検出する解法技法
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowHelp(false)}
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs px-1"
                    aria-label="閉じる"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
                <ul className="space-y-2 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
                  {TECHNIQUES.map((t) => (
                    <li key={t.name} className="flex items-start gap-1.5">
                      <span className="text-brand-500 font-bold">•</span>
                      <span>
                        <strong className="text-slate-700 dark:text-slate-200">{t.name}</strong>: {t.desc}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
        <span
          className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded ${BADGE_TONES[panel.tone]}`}
        >
          {panel.badge}
        </span>
      </div>

      <div className="py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 min-h-[90px] flex items-center justify-center text-center">
        {hint ? (
          hint.kind === 'placement' ? (
            <div className="text-left space-y-1.5">
              <p className="font-bold text-slate-800 dark:text-slate-100">
                🎯 おすすめのマス:{' '}
                <span className="text-brand-600 dark:text-brand-400 font-mono">
                  行 {hint.row + 1}, 列 {hint.col + 1}
                </span>{' '}
                (正解: <span className="text-emerald-600 dark:text-emerald-400 font-bold">{hint.num}</span>)
              </p>
              <p className="text-slate-600 dark:text-slate-300">{hint.reason}</p>
            </div>
          ) : (
            <div className="text-left space-y-1.5">
              <p className="font-bold text-rose-600 dark:text-rose-400">
                ⚠️ 誤入力の修正:{' '}
                <span className="font-mono">
                  行 {hint.row + 1}, 列 {hint.col + 1}
                </span>{' '}
                (現在: <span className="line-through">{hint.currentNum}</span>)
              </p>
              <p className="text-slate-600 dark:text-slate-300">{hint.reason}</p>
            </div>
          )
        ) : (
          panel.text
        )}
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          onClick={onHint}
          disabled={disabled}
          className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-brand-500/25 flex items-center justify-center gap-1.5 transition ${disabledCls}`}
        >
          <i className="fa-regular fa-lightbulb"></i> 次の一手と論理解説
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onAutoNotes} disabled={disabled} className={`${secondaryBtn} ${disabledCls}`}>
            <i className="fa-solid fa-list-ol"></i> 全メモ自動入力
          </button>
          <button onClick={onSolveAll} disabled={disabled} className={`${secondaryBtn} ${disabledCls}`}>
            <i className="fa-solid fa-wand-magic-sparkles text-amber-500"></i> 全自動で解く
          </button>
        </div>
      </div>
    </div>
  )
}
