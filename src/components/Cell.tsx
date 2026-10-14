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
  isHintArea?: boolean
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
  isHintArea = false,
  onSelect,
}: CellProps) {
  // Thick borders between 3x3 blocks
  let borders = 'border-slate-300 dark:border-slate-700'
  if ((col + 1) % 3 === 0 && col !== 8) borders += ' border-r-thick border-r-slate-400 dark:border-r-slate-500'
  if ((row + 1) % 3 === 0 && row !== 8) borders += ' border-b-thick border-b-slate-400 dark:border-b-slate-500'

  // Background / ring (priority: hint cell > selected > same value > hint area > related > default)
  let bg = 'bg-white dark:bg-slate-900'
  if (isHint) bg = 'hint-highlight ring-2 ring-amber-500 bg-amber-100 dark:bg-amber-950/60'
  else if (isSelected) bg = 'bg-brand-500/20 dark:bg-brand-500/30 ring-2 ring-brand-500'
  else if (value !== 0 && isSameValue) bg = 'bg-brand-500/15 dark:bg-brand-500/25'
  else if (isHintArea) bg = 'bg-amber-50/90 dark:bg-amber-950/30 ring-1 ring-amber-300/40 dark:ring-amber-600/30'
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
      className={`relative w-full h-full aspect-square min-w-0 min-h-0 overflow-hidden flex items-center justify-center cursor-pointer select-none touch-manipulation transition-all duration-100 ${borders} ${bg} ${text}`}
    >
      {value !== 0 ? (
        <span className="leading-none select-none text-[clamp(1.65rem,7.5vw,2rem)] sm:text-[2.15rem]">
          {value}
        </span>
      ) : notes.size > 0 ? (
        <div className="note-grid w-full h-full p-[1px]">
          {Array.from({ length: 9 }, (_, i) => i + 1).map((n) =>
            notes.has(n) ? (
              <span
                key={n}
                className="flex items-center justify-center text-[clamp(10.5px,3vw,12.5px)] sm:text-[13.5px] leading-none text-slate-600 dark:text-slate-200 font-bold font-mono select-none"
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
