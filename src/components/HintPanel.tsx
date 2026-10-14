import { useEffect, useRef, useState } from 'react'
import type { BadgeTone, HintPanelState } from '../lib/sudoku'

interface HintPanelProps {
  panel: HintPanelState
  disabled?: boolean
  onHint: () => void
  onHintNext: () => void
  onHintClose: () => void
}

const BADGE_TONES: Record<BadgeTone, string> = {
  default: 'bg-brand-50 text-brand-600 dark:bg-brand-950 dark:text-brand-300',
  amber: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300',
  rose: 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300',
}

const TECHNIQUES = [
  { name: '唯一の候補 (Naked Single)', desc: 'そのマスに入れる数字が1通りしかない状態。' },
  { name: '隠れ一択 (Hidden Single)', desc: '行・列・ブロック内でその数字が入れるマスが1つしかない状態。' },
]

export default function HintPanel({
  panel,
  disabled = false,
  onHint,
  onHintNext,
  onHintClose,
}: HintPanelProps) {
  const { step, hint } = panel
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
    <div className="rounded-2xl p-3.5 sm:p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative">
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <h2 className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <i className="fa-regular fa-lightbulb text-amber-500"></i> ヒント
          </h2>
          <div className="relative inline-block" ref={helpRef}>
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              className="w-5 h-5 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="解法技法の解説を見る"
              aria-label="解法技法について"
              aria-expanded={showHelp}
            >
              <i className="fa-regular fa-circle-question text-xs"></i>
            </button>

            {showHelp && (
              <div className="absolute left-0 top-full mt-2 w-64 p-3 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 dark:border-slate-700">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <i className="fa-solid fa-graduation-cap text-brand-500"></i> 解法の手がかり
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
                <ul className="space-y-1.5 text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
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

        {step > 0 && (
          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded ${BADGE_TONES[panel.tone]}`}
          >
            {step === 1 ? 'Step 1: 着眼点' : 'Step 2: 注目マス'}
          </span>
        )}
      </div>

      {/* Message Body */}
      <div className="py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 min-h-[58px] flex items-center">
        {step === 1 && hint ? (
          <div className="flex items-start gap-2 text-left">
            <span className="text-amber-500 text-sm mt-0.5 shrink-0">
              <i className="fa-solid fa-magnifying-glass"></i>
            </span>
            <p className="text-slate-700 dark:text-slate-200 font-medium">
              {panel.text}
            </p>
          </div>
        ) : step === 2 && hint ? (
          <div className="flex items-start gap-2 text-left">
            <span className="text-brand-500 text-sm mt-0.5 shrink-0">
              <i className="fa-solid fa-crosshairs"></i>
            </span>
            <p className="text-slate-700 dark:text-slate-200 font-medium">
              {panel.text}
            </p>
          </div>
        ) : (
          <p className="text-center w-full text-slate-500 dark:text-slate-400 text-[11px] sm:text-xs">
            {panel.text}
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="pt-1">
        {step === 0 ? (
          <button
            type="button"
            onClick={onHint}
            disabled={disabled}
            className={`w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-md shadow-brand-500/20 active:scale-[0.98] flex items-center justify-center gap-1.5 transition ${disabledCls}`}
          >
            <i className="fa-regular fa-lightbulb"></i> ヒントを見る
          </button>
        ) : step === 1 ? (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onHintNext}
              disabled={disabled}
              className={`py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs shadow-sm active:scale-95 flex items-center justify-center gap-1.5 transition ${disabledCls}`}
            >
              <i className="fa-solid fa-magnifying-glass-plus"></i> さらに詳しく
            </button>
            <button
              type="button"
              onClick={onHintClose}
              disabled={disabled}
              className={`py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs active:scale-95 flex items-center justify-center gap-1 transition ${disabledCls}`}
            >
              閉じる
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onHint}
              disabled={disabled}
              className={`py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs active:scale-95 flex items-center justify-center gap-1.5 transition ${disabledCls}`}
            >
              <i className="fa-solid fa-rotate-right text-slate-500"></i> 別のヒント
            </button>
            <button
              type="button"
              onClick={onHintClose}
              disabled={disabled}
              className={`py-2 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium text-xs active:scale-95 flex items-center justify-center gap-1 transition ${disabledCls}`}
            >
              閉じる
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
