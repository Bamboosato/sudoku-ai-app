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

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></span>
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
            <i className="fa-solid fa-wand-magic-sparkles text-brand-500"></i> AI 論理ヒント
          </h2>
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
          <i className="fa-solid fa-lightbulb"></i> 次の一手と論理解説
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button onClick={onAutoNotes} disabled={disabled} className={`${secondaryBtn} ${disabledCls}`}>
            <i className="fa-solid fa-list-ol"></i> 全メモ自動入力
          </button>
          <button onClick={onSolveAll} disabled={disabled} className={`${secondaryBtn} ${disabledCls}`}>
            <i className="fa-solid fa-bolt text-amber-500"></i> AI自動解答
          </button>
        </div>
      </div>
    </div>
  )
}
