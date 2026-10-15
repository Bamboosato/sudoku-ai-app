import { useRegisterSW } from 'virtual:pwa-register/react'

export function PwaUpdateToast() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      if (r) {
        // 定期的に更新をチェック (1時間毎)
        setInterval(() => {
          r.update()
        }, 60 * 60 * 1000)
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error)
    },
  })

  const close = () => {
    setNeedRefresh(false)
  }

  if (!needRefresh) return null

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm bg-slate-900 text-white p-4 rounded-2xl shadow-xl flex items-center justify-between gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4 duration-200 select-none">
      <div className="flex items-center gap-2.5">
        <i className="fa-solid fa-arrows-rotate w-5 h-5 text-indigo-400 animate-spin flex items-center justify-center text-sm"></i>
        <span className="text-sm font-medium">新しいバージョンがあります</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => updateServiceWorker(true)}
          className="text-xs bg-brand-600 hover:bg-brand-500 text-white font-semibold px-3 py-1.5 rounded-lg transition-colors shadow-sm active:scale-95"
        >
          更新
        </button>
        <button
          type="button"
          onClick={close}
          className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
          aria-label="通知を閉じる"
        >
          <i className="fa-solid fa-xmark w-4 h-4 flex items-center justify-center text-sm"></i>
        </button>
      </div>
    </div>
  )
}

export default PwaUpdateToast
