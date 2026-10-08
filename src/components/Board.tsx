import type { GameState } from '../lib/sudoku'
import Cell from './Cell'

interface BoardProps {
  state: GameState
  onSelect: (row: number, col: number) => void
}

export default function Board({ state, onSelect }: BoardProps) {
  const { board, initial, solution, notes, selected, activeHint } = state
  const selVal = selected ? board[selected.row][selected.col] : 0

  return (
    <div className="relative w-full aspect-square bg-slate-300 dark:bg-slate-700 p-1 sm:p-1.5 rounded-2xl shadow-xl shadow-slate-200 dark:shadow-none border border-slate-300 dark:border-slate-800">
      <div className="w-full h-full grid grid-cols-9 grid-rows-9 [grid-template-columns:repeat(9,minmax(0,1fr))] [grid-template-rows:repeat(9,minmax(0,1fr))] gap-[1px] bg-slate-300 dark:bg-slate-700 rounded-xl overflow-hidden">
        {board.map((rowCells, r) =>
          rowCells.map((value, c) => {
            const isSelected = selected?.row === r && selected?.col === c
            const isRelated =
              !!selected &&
              (selected.row === r ||
                selected.col === c ||
                (Math.floor(selected.row / 3) === Math.floor(r / 3) &&
                  Math.floor(selected.col / 3) === Math.floor(c / 3)))
            return (
              <Cell
                key={`${r}-${c}`}
                row={r}
                col={c}
                value={value}
                isInitial={initial[r][c] !== 0}
                isError={value !== 0 && value !== solution[r][c]}
                notes={notes[r][c]}
                isSelected={isSelected}
                isSameValue={selVal !== 0 && value === selVal}
                isRelated={isRelated}
                isHint={activeHint?.row === r && activeHint?.col === c}
                onSelect={onSelect}
              />
            )
          }),
        )}
      </div>
    </div>
  )
}
