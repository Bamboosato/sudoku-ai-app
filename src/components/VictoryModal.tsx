interface VictoryModalProps {
  time: string
  difficultyLabel: string
  onRestart: () => void
  onClose: () => void
}

export default function VictoryModal({
  time,
  difficultyLabel,
  onRestart,
  onClose,
}: VictoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in select-none">
      <div className="relative bg-white dark:bg-slate-900 rounded-3xl max-w-xs sm:max-w-sm w-full p-5 sm:p-6 text-center border border-slate-200 dark:border-slate-800 shadow-2xl transform transition-all">
        <button
          onClick={onClose}
          aria-label="閉じる"
          className="absolute top-3.5 right-3.5 w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
        >
          <i className="fa-solid fa-xmark text-base"></i>
        </button>

        <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-500 mx-auto flex items-center justify-center text-2xl mb-2.5 shadow-inner">
          <i className="fa-solid fa-trophy"></i>
        </div>
        <h2 className="text-xl font-black text-slate-800 dark:text-white whitespace-nowrap">
          おめでとうございます！
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-3.5">
          見事にすべてのマスを解き明かしました！
        </p>

        {/* 成績カード (中央揃え・仕切り線・コンパクト) */}
        <div className="grid grid-cols-2 divide-x divide-slate-200 dark:divide-slate-700/60 bg-slate-50 dark:bg-slate-800/50 py-2.5 px-2 rounded-2xl mb-4 border border-slate-200/80 dark:border-slate-700/80">
          <div className="flex flex-col items-center justify-center text-center px-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-400">
              <i className="fa-regular fa-clock text-[10px]"></i>
              <span>タイム</span>
            </span>
            <p className="font-mono font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200 mt-0.5">
              {time}
            </p>
          </div>
          <div className="flex flex-col items-center justify-center text-center px-2">
            <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-400">
              <i className="fa-solid fa-layer-group text-[10px]"></i>
              <span>難易度</span>
            </span>
            <p className="font-bold text-base sm:text-lg text-slate-700 dark:text-slate-200 mt-0.5">
              {difficultyLabel}
            </p>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-2.5 sm:py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-md shadow-brand-500/25 active:scale-95 transition"
        >
          次のパズルへ挑戦
        </button>
      </div>
    </div>
  )
}
