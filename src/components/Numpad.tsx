interface NumpadProps {
  /** Indexed 1..9: how many of each digit are still missing */
  remaining: number[]
  onInput: (num: number) => void
}

export default function Numpad({ remaining, onInput }: NumpadProps) {
  return (
    <div className="w-full grid grid-cols-9 gap-1 sm:gap-1.5 mt-2.5">
      {Array.from({ length: 9 }, (_, i) => i + 1).map((n) => (
        <button
          key={n}
          onClick={() => onInput(n)}
          className={`touch-btn min-h-[48px] sm:min-h-[56px] h-12 sm:h-14 rounded-xl bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold text-lg sm:text-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center hover:bg-indigo-50 dark:hover:bg-slate-700 active:scale-95 active:bg-brand-50 dark:active:bg-slate-700 touch-manipulation transition select-none ${
            remaining[n] === 0 ? 'opacity-30 pointer-events-none' : ''
          }`}
        >
          <span className="leading-none">{n}</span>
          <span className="text-[9px] font-mono text-slate-400 font-normal leading-none mt-0.5">{remaining[n]}</span>
        </button>
      ))}
    </div>
  )
}
