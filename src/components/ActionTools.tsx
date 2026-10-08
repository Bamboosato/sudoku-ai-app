interface ActionToolsProps {
  noteMode: boolean
  disabled?: boolean
  onUndo: () => void
  onErase: () => void
  onToggleNote: () => void
  onCheck: () => void
}

const toolBase =
  'touch-btn min-h-[44px] flex flex-col items-center justify-center py-2 px-1 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:scale-95 border border-slate-200 dark:border-slate-700 shadow-sm touch-manipulation transition select-none'
const labelCls = 'text-[11px] font-medium text-slate-500 dark:text-slate-400 select-none'

export default function ActionTools({
  noteMode,
  disabled = false,
  onUndo,
  onErase,
  onToggleNote,
  onCheck,
}: ActionToolsProps) {
  const disabledCls = disabled ? 'opacity-40 pointer-events-none' : ''

  return (
    <div className="w-full grid grid-cols-4 gap-2 mt-3">
      <button onClick={onUndo} disabled={disabled} className={`${toolBase} ${disabledCls}`}>
        <i className="fa-solid fa-arrow-rotate-left text-base text-slate-700 dark:text-slate-200 mb-1"></i>
        <span className={labelCls}>元に戻す</span>
      </button>
      <button onClick={onErase} disabled={disabled} className={`${toolBase} ${disabledCls}`}>
        <i className="fa-solid fa-eraser text-base text-slate-700 dark:text-slate-200 mb-1"></i>
        <span className={labelCls}>消去</span>
      </button>
      <button
        onClick={onToggleNote}
        disabled={disabled}
        className={`${toolBase} ${disabledCls} relative ${noteMode ? 'ring-2 ring-brand-500' : ''}`}
      >
        <span
          className={`absolute top-1.5 right-2 px-1 py-0.2 text-[9px] font-bold rounded uppercase ${
            noteMode ? 'bg-brand-500 text-white' : 'bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200'
          }`}
        >
          {noteMode ? 'ON' : 'OFF'}
        </span>
        <i className="fa-solid fa-pencil text-base text-slate-700 dark:text-slate-200 mb-1"></i>
        <span className={labelCls}>メモ</span>
      </button>
      <button onClick={onCheck} disabled={disabled} className={`${toolBase} ${disabledCls}`}>
        <i className="fa-solid fa-shield-halved text-base text-brand-600 dark:text-brand-400 mb-1"></i>
        <span className={labelCls}>誤入力リセット</span>
      </button>
    </div>
  )
}
