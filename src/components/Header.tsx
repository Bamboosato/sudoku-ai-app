interface HeaderProps {
  time: string
  mistakes: number
  maxMistakes: number
  hasCustomApiKey: boolean
  isPaused: boolean
  savedCount?: number
  onTogglePause: () => void
  onToggleTheme: () => void
  onOpenSettings: () => void
  onOpenSavedPuzzles?: () => void
}

export default function Header({
  time,
  mistakes,
  maxMistakes,
  hasCustomApiKey,
  isPaused,
  savedCount = 0,
  onTogglePause,
  onToggleTheme,
  onOpenSettings,
  onOpenSavedPuzzles,
}: HeaderProps) {
  return (
    <header className="w-full max-w-4xl mx-auto px-4 py-3 sm:py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <i className="fa-solid fa-brain text-lg"></i>
        </div>
        <div>
          <h1 className="font-extrabold text-lg sm:text-xl tracking-tight flex items-center gap-1.5">
            Sudoku <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">AI</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">論理思考を育てるAI数独アシスタント</p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <div className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-slate-200/60 dark:bg-slate-800/60 font-mono text-xs sm:text-sm font-semibold">
          <i className="fa-regular fa-clock text-slate-500 text-xs"></i>
          <span>{time}</span>
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={isPaused ? '再開' : '一時停止'}
            title={isPaused ? 'ゲームを再開' : 'タイマーを一時停止'}
            className="ml-1 text-slate-500 hover:text-brand-600 dark:hover:text-brand-300 transition"
          >
            <i className={`fa-solid ${isPaused ? 'fa-play text-emerald-500' : 'fa-pause'}`}></i>
          </button>
        </div>

        <div className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-semibold">
          <i className="fa-solid fa-heart"></i>
          <span>{mistakes}/{maxMistakes}</span>
        </div>

        {onOpenSavedPuzzles && (
          <button
            type="button"
            onClick={onOpenSavedPuzzles}
            aria-label="マイパズル一覧"
            title="保存したパズルの一覧"
            className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
          >
            <i className="fa-regular fa-bookmark text-sm sm:text-base"></i>
            {savedCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 px-1 min-w-[16px] h-4 text-[10px] font-bold rounded-full bg-brand-500 text-white flex items-center justify-center ring-2 ring-white dark:ring-slate-900">
                {savedCount}
              </span>
            )}
          </button>
        )}

        <button
          onClick={onToggleTheme}
          aria-label="テーマ切替"
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          <i className="fa-solid fa-moon dark:hidden text-sm sm:text-base"></i>
          <i className="fa-solid fa-sun hidden dark:inline text-sm sm:text-base"></i>
        </button>

        <button
          onClick={onOpenSettings}
          aria-label="Gemini API 設定"
          title={hasCustomApiKey ? 'Gemini API キー設定済み' : 'Gemini API 設定（各自のキーを入力）'}
          className="relative w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition"
        >
          <i className="fa-solid fa-gear text-sm sm:text-base"></i>
          {hasCustomApiKey && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900"></span>
          )}
        </button>
      </div>
    </header>
  )
}
