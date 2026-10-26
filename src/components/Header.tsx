import { useEffect, useState } from 'react'

import type { InputMode } from '../hooks/useInputMode'

interface HeaderProps {
  hasCustomApiKey: boolean
  savedCount?: number
  inputMode: InputMode
  onToggleTheme: () => void
  onToggleInputMode: () => void
  onOpenSettings: () => void
  onOpenSavedPuzzles?: () => void
  onSavePuzzle?: () => void
  onOpenImport?: () => void
}

export default function Header({
  hasCustomApiKey,
  savedCount = 0,
  inputMode,
  onToggleTheme,
  onToggleInputMode,
  onOpenSettings,
  onOpenSavedPuzzles,
  onSavePuzzle,
  onOpenImport,
}: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  useEffect(() => {
    if (!isMenuOpen) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMenuOpen(false)
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isMenuOpen])

  return (
    <header className="w-full max-w-4xl mx-auto px-2 sm:px-4 py-2.5 sm:py-4 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80 select-none">
      {/* Brand Logo */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-400 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
          <i className="fa-solid fa-brain text-base sm:text-lg"></i>
        </div>
        <div>
          <h1 className="font-extrabold text-base sm:text-xl tracking-tight flex items-center gap-1 sm:gap-1.5">
            Sudoku <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-indigo-500">AI</span>
          </h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden sm:block">
            AIスキャン機能付き・本格思考数独
          </p>
        </div>
      </div>

      {/* Header Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 画像読込み (PC: アイコン＋テキスト, スマホ: アイコンのみ) */}
        {onOpenImport && (
          <button
            type="button"
            onClick={onOpenImport}
            aria-label="画像読込み"
            title="新聞や写真の数独をAIスキャン"
            className="flex items-center justify-center gap-1.5 h-8 sm:h-9 px-2.5 sm:px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200/80 dark:border-emerald-800 text-xs font-semibold shadow-sm transition active:scale-95 whitespace-nowrap"
          >
            <i className="fa-solid fa-camera text-sm text-emerald-600 dark:text-emerald-400"></i>
            <span className="hidden sm:inline">画像読込み</span>
          </button>
        )}

        {/* Overflow Menu (・・・) */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="その他のメニュー"
            aria-expanded={isMenuOpen}
            className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition ${
              isMenuOpen
                ? 'bg-brand-500/15 text-brand-600 dark:text-brand-300 ring-2 ring-brand-500/40'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800'
            }`}
            title="その他のメニュー"
          >
            <i className="fa-solid fa-ellipsis text-base sm:text-lg"></i>
            {savedCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-brand-500 ring-2 ring-white dark:ring-slate-900"></span>
            )}
          </button>

          {/* Dropdown Menu */}
          {isMenuOpen && (
            <>
              {/* Invisible backdrop to dismiss */}
              <div
                className="fixed inset-0 z-40 bg-slate-950/20 backdrop-blur-[1px]"
                onClick={() => setIsMenuOpen(false)}
              />

              <div
                className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/90 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="px-2.5 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  メニュー
                </div>

                {/* 1. マイパズル一覧 */}
                {onOpenSavedPuzzles && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onOpenSavedPuzzles()
                    }}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-300 flex items-center justify-center text-sm shrink-0">
                      <i className="fa-regular fa-bookmark"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                          マイパズル一覧
                        </span>
                        {savedCount > 0 && (
                          <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-brand-500 text-white">
                            {savedCount}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        保存したパズルの挑戦・管理
                      </div>
                    </div>
                  </button>
                )}

                {/* 2. マイパズルに追加 */}
                {onSavePuzzle && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false)
                      onSavePuzzle()
                    }}
                    className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  >
                    <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm shrink-0">
                      <i className="fa-regular fa-floppy-disk"></i>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        マイパズルに追加
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        現在の問題をマイパズルに登録
                      </div>
                    </div>
                  </button>
                )}

                <div className="h-px bg-slate-100 dark:bg-slate-800 my-1" />

                {/* 入力方式切替え */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleInputMode()
                  }}
                  className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm shrink-0">
                    <i className={inputMode === 'popup' ? 'fa-solid fa-table-cells text-brand-600 dark:text-brand-400' : 'fa-solid fa-calculator'}></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        入力方式
                      </span>
                      <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-300">
                        {inputMode === 'popup' ? 'ポップアップ' : '下部テンキー'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      {inputMode === 'popup'
                        ? '3×3パレット（タップでテンキー切替え）'
                        : '下部テンキー（タップでパレット切替え）'}
                    </div>
                  </div>
                </button>

                {/* [PC & Mobile] テーマ切替え */}
                <button
                  type="button"
                  onClick={() => {
                    onToggleTheme()
                  }}
                  className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm shrink-0">
                    <i className="fa-solid fa-moon dark:hidden"></i>
                    <i className="fa-solid fa-sun hidden dark:inline"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                      テーマ切替え
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400">
                      <span className="dark:hidden">現在: ライトモード</span>
                      <span className="hidden dark:inline">現在: ダークモード</span>
                    </div>
                  </div>
                </button>

                {/* [PC & Mobile] Gemini API 設定 */}
                <button
                  type="button"
                  onClick={() => {
                    setIsMenuOpen(false)
                    onOpenSettings()
                  }}
                  className="w-full px-2.5 py-2 rounded-xl flex items-center gap-3 text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 flex items-center justify-center text-sm shrink-0">
                    <i className="fa-solid fa-gear"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-100">
                        Gemini API 設定
                      </span>
                      {hasCustomApiKey && (
                        <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
                          設定済
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {hasCustomApiKey ? 'カスタムキー有効' : 'AIスキャン用キー設定'}
                    </div>
                  </div>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
