import { useEffect, useState } from 'react'

interface ApiKeyModalProps {
  isOpen: boolean
  currentKey: string
  onSave: (key: string) => void
  onClear: () => void
  onClose: () => void
}

export default function ApiKeyModal({
  isOpen,
  currentKey,
  onSave,
  onClear,
  onClose,
}: ApiKeyModalProps) {
  const [inputVal, setInputVal] = useState(currentKey)
  const [showPassword, setShowPassword] = useState(false)
  const [savedSuccess, setSavedSuccess] = useState(false)

  useEffect(() => {
    setInputVal(currentKey)
  }, [currentKey, isOpen])

  if (!isOpen) return null

  const handleSave = () => {
    onSave(inputVal)
    setSavedSuccess(true)
    setTimeout(() => {
      setSavedSuccess(false)
      onClose()
    }, 600)
  }

  const handleClear = () => {
    setInputVal('')
    onClear()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold">
              <i className="fa-solid fa-key"></i>
            </div>
            <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">
              Gemini API 設定
            </h2>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          AIアドバイザー機能を利用するための Gemini API キーを設定します。キーはお使いのブラウザ（ローカル環境）にのみ保存され、外部に保存されることはありません。
        </p>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            API キー
          </label>
          <div className="relative flex items-center">
            <input
              type={showPassword ? 'text' : 'password'}
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 pr-10 text-xs sm:text-sm font-mono rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
              title={showPassword ? '非表示' : '表示'}
            >
              <i className={`fa-regular ${showPassword ? 'fa-eye-slash' : 'fa-eye'} text-xs`}></i>
            </button>
          </div>
        </div>

        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
          <i className="fa-solid fa-circle-info text-brand-500"></i>
          <span>
            キーをお持ちでない場合は、
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 dark:text-brand-400 font-medium underline hover:text-brand-700 ml-0.5"
            >
              Google AI Studio
            </a>
            から無料で発行できます。
          </span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800">
          {currentKey ? (
            <button
              type="button"
              onClick={handleClear}
              className="text-xs font-medium text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 py-1.5 px-2.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition"
            >
              キーを削除
            </button>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              className={`px-4 py-1.5 text-xs font-bold rounded-xl text-white transition flex items-center gap-1.5 shadow-sm ${
                savedSuccess
                  ? 'bg-emerald-600'
                  : 'bg-brand-600 hover:bg-brand-700 shadow-brand-500/20'
              }`}
            >
              {savedSuccess ? (
                <>
                  <i className="fa-solid fa-check"></i> 保存完了
                </>
              ) : (
                '保存'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
