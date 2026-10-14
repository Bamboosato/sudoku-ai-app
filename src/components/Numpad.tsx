interface NumpadProps {
  /** Indexed 1..9: how many of each digit are still missing */
  remaining: number[]
  disabled?: boolean
  onInput: (num: number) => void
}

export default function Numpad({ remaining, disabled = false, onInput }: NumpadProps) {
  return (
    <div className="w-full mt-3 select-none">
      {/* Mobile view: 2-row circular buttons (Row 1: 1-5, Row 2: 6-9) */}
      <div className="flex sm:hidden flex-col items-center gap-2.5 w-full">
        {/* Row 1: 1..5 */}
        <div className="flex justify-center gap-2 min-[380px]:gap-3 w-full">
          {[1, 2, 3, 4, 5].map((n) => {
            const isExhausted = remaining[n] === 0
            return (
              <button
                key={n}
                type="button"
                onClick={() => onInput(n)}
                disabled={disabled || isExhausted}
                aria-label={`数字 ${n} (残り ${remaining[n]}個)`}
                title={`残り ${remaining[n]}個`}
                className={`touch-btn w-12 h-12 min-[380px]:w-[52px] min-[380px]:h-[52px] min-[420px]:w-14 min-[420px]:h-14 rounded-full aspect-square bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-2xl min-[380px]:text-[1.65rem] min-[420px]:text-[1.75rem] shadow-sm shadow-slate-200/80 dark:shadow-none border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-90 active:bg-brand-50 dark:active:bg-slate-700 touch-manipulation transition select-none ${
                  disabled || isExhausted
                    ? 'opacity-20 pointer-events-none bg-slate-100 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800'
                    : ''
                }`}
              >
                <span className="leading-none">{n}</span>
              </button>
            )
          })}
        </div>

        {/* Row 2: 6..9 (centered beneath row 1) */}
        <div className="flex justify-center gap-2 min-[380px]:gap-3 w-full">
          {[6, 7, 8, 9].map((n) => {
            const isExhausted = remaining[n] === 0
            return (
              <button
                key={n}
                type="button"
                onClick={() => onInput(n)}
                disabled={disabled || isExhausted}
                aria-label={`数字 ${n} (残り ${remaining[n]}個)`}
                title={`残り ${remaining[n]}個`}
                className={`touch-btn w-12 h-12 min-[380px]:w-[52px] min-[380px]:h-[52px] min-[420px]:w-14 min-[420px]:h-14 rounded-full aspect-square bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-black text-2xl min-[380px]:text-[1.65rem] min-[420px]:text-[1.75rem] shadow-sm shadow-slate-200/80 dark:shadow-none border border-slate-200 dark:border-slate-700 flex items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-90 active:bg-brand-50 dark:active:bg-slate-700 touch-manipulation transition select-none ${
                  disabled || isExhausted
                    ? 'opacity-20 pointer-events-none bg-slate-100 dark:bg-slate-800/40 border-slate-200/50 dark:border-slate-800'
                    : ''
                }`}
              >
                <span className="leading-none">{n}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Desktop view (sm+): 1-row 9-column grid with remaining count */}
      <div className="hidden sm:grid grid-cols-9 gap-1.5 w-full">
        {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => {
          const isExhausted = remaining[n] === 0
          return (
            <button
              key={n}
              type="button"
              onClick={() => onInput(n)}
              disabled={disabled || isExhausted}
              aria-label={`数字 ${n} (残り ${remaining[n]}個)`}
              className={`touch-btn min-h-[56px] h-14 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95 active:bg-brand-50 dark:active:bg-slate-700 touch-manipulation transition select-none ${
                disabled || isExhausted ? 'opacity-30 pointer-events-none' : ''
              }`}
            >
              <span className="leading-none">{n}</span>
              <span className="text-[9px] font-mono text-slate-400 font-normal leading-none mt-0.5">
                {remaining[n]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
