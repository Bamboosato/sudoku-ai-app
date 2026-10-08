interface CellProps {
  row: number
  col: number
  value: number
  isInitial: boolean
  notes: Set<number>
  isSelected: boolean
  isSameValue: boolean
  isRelated: boolean
  isHint: boolean
  onSelect: (row: number, col: number) => void
}

export default function Cell({
  row,
  col,
  value,
  isInitial,
  notes,
  isSelected,
  isSameValue,
  isRelated,
  isHint,
  onSelect,
}: CellProps) {
  // Thick borders between 3x3 blocks
  let borders = 'border-slate-300 dark:border-slate-700'
  if ((col + 1) % 3 === 0 && col !== 8) borders += ' border-r-thick border-r-slate-400 dark:border-r-slate-500'
  if ((row + 1) % 3 === 0 && row !== 8) borders += ' border-b-thick border-b-slate-400 dark:border-b-slate-500'

  // Background / ring (priority: hint > selected > same value > related > default)
  let bg = 'bg-white dark:bg-slate-900'
  if (isHint) bg = 'hint-highlight ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-950/60'
  else if (isSelected) bg = 'bg-brand-500/20 dark:bg-brand-500/30 ring-2 ring-brand-500'
  else if (value !== 0 && isSameValue) bg = 'bg-brand-500/15 dark:bg-brand-500/25'
  else if (isRelated) bg = 'bg-slate-100 dark:bg-slate-800/60'

  let text = ''
  if (value !== 0) {
    if (isInitial) text = 'text-slate-900 dark:text-white font-black'
    else text = 'text-blue-600 dark:text-sky-300 font-bold'
  } else {
    text = 'font-bold'
  }

  return (
    <div
      onClick={() => onSelect(row, col)}
      className={`relative w-full h-full aspect-square min-w-0 min-h-0 overflow-hidden flex items-center justify-center text-lg sm:text-2xl cursor-pointer select-none touch-manipulation transition-all duration-100 ${borders} ${bg} ${text}`}
    >
      {value !== 0 ? (
        <span className="leading-none select-none">{value}</span>
      ) : notes.size > 0 ? (
        <div className="note-grid w-full h-full p-[1px]">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) =>
            notes.has(n) ? (
              <span
                key={n}
                className="flex items-center justify-center text-[8px] sm:text-[10px] leading-none text-slate-500 dark:text-slate-300 font-mono select-none"
              >
                {n}
              </span>
            ) : (
              <span key={n}></span>
            ),
          )}
        </div>
      ) : null}
    </div>
  )
}
