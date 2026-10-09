import type { Position } from '../lib/sudoku'

interface ImportPreviewGridProps {
  grid: number[][]
  selected: Position | null
  conflictCells: Position[]
  uncertainCells: Position[]
  onSelect: (pos: Position) => void
}

export default function ImportPreviewGrid({
  grid,
  selected,
  conflictCells,
  uncertainCells,
  onSelect,
}: ImportPreviewGridProps) {
  const isConflict = (r: number, c: number) =>
    conflictCells.some((cell) => cell.row === r && cell.col === c)

  const isUncertain = (r: number, c: number) =>
    uncertainCells.some((cell) => cell.row === r && cell.col === c)

  const isSelected = (r: number, c: number) =>
    selected?.row === r && selected?.col === c

  return (
    <div className="w-full max-w-[340px] aspect-square mx-auto bg-slate-300 dark:bg-slate-700 p-1 rounded-xl shadow-inner grid grid-cols-9 gap-[1px]">
      {grid.map((row, r) =>
        row.map((val, c) => {
          const selectedCell = isSelected(r, c)
          const conflict = isConflict(r, c)
          const uncertain = isUncertain(r, c)

          // 3x3 block borders
          const rightBorder = (c + 1) % 3 === 0 && c !== 8 ? 'border-r-2 border-r-slate-400 dark:border-r-slate-600' : ''
          const bottomBorder = (r + 1) % 3 === 0 && r !== 8 ? 'border-b-2 border-b-slate-400 dark:border-b-slate-600' : ''

          let bgClass = 'bg-white dark:bg-slate-900'
          if (conflict) {
            bgClass = 'bg-rose-100 dark:bg-rose-950/70 text-rose-600 dark:text-rose-400 font-bold'
          } else if (uncertain) {
            bgClass = 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 font-semibold'
          }

          let ringClass = ''
          if (selectedCell) {
            ringClass = 'ring-2 ring-brand-500 z-10'
          } else if (uncertain && !conflict) {
            ringClass = 'ring-1 ring-amber-400/80'
          }

          return (
            <button
              key={`${r}-${c}`}
              type="button"
              onClick={() => onSelect({ row: r, col: c })}
              className={`relative flex items-center justify-center font-mono text-sm sm:text-base transition select-none ${bgClass} ${ringClass} ${rightBorder} ${bottomBorder} hover:bg-brand-50 dark:hover:bg-slate-800`}
              aria-label={`行${r + 1} 列${c + 1} 数字: ${val === 0 ? '空' : val}`}
            >
              {val !== 0 ? (
                <span>{val}</span>
              ) : (
                <span className="text-slate-300 dark:text-slate-700 text-xs">·</span>
              )}
            </button>
          )
        }),
      )}
    </div>
  )
}
