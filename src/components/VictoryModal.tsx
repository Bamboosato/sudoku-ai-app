interface VictoryModalProps {
  time: string
  difficultyLabel: string
  onRestart: () => void
}

export default function VictoryModal({ time, difficultyLabel, onRestart }: VictoryModalProps) {
  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-sm w-full p-6 text-center border border-slate-200 dark:border-slate-800 shadow-2xl transform transition-all">
        <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-500 mx-auto flex items-center justify-center text-3xl mb-3 shadow-inner">
          <i className="fa-solid fa-trophy"></i>
        </div>
        <h2 className="text-2xl font-black text-slate-800 dark:text-white">クリアおめでとうございます！</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">見事にすべてのマスを解き明かしました！</p>

        <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl mb-5 text-left">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">タイム</span>
            <p className="font-mono font-bold text-base text-slate-700 dark:text-slate-200">{time}</p>
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400">難易度</span>
            <p className="font-bold text-base text-slate-700 dark:text-slate-200">{difficultyLabel}</p>
          </div>
        </div>

        <button
          onClick={onRestart}
          className="w-full py-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-sm shadow-lg shadow-brand-500/30 transition"
        >
          次のパズルへ挑戦
        </button>
      </div>
    </div>
  )
}
