import type { GameState } from '../lib/sudoku'
import Cell from './Cell'

interface BoardProps {
  state: GameState
  readOnly?: boolean
  onSelect: (row: number, col: number) => void
  onResume?: () => void
}

export default function Board({ state, readOnly = false, onSelect, onResume }: BoardProps) {
  const { board, initial, notes, selected, activeHint, isPaused } = state
  const selVal = selected ? board[selected.row][selected.col] : 0

  return (
    <div className="relative w-full aspect-square bg-slate-300 dark:bg-slate-700 p-1 sm:p-1.5 rounded-lg shadow-lg shadow-slate-200 dark:shadow-none border border-slate-300 dark:border-slate-800 overflow-hidden">
      <div className={`w-full h-full grid grid-cols-9 grid-rows-9 [grid-template-columns:repeat(9,minmax(0,1fr))] [grid-template-rows:repeat(9,minmax(0,1fr))] gap-[1px] bg-slate-300 dark:bg-slate-700 rounded-sm overflow-hidden transition-all duration-200 ${isPaused ? 'filter blur-md opacity-20 pointer-events-none' : ''}`}>
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
                value={isPaused ? 0 : value}
                isInitial={initial[r][c] !== 0}
                notes={isPaused ? new Set<number>() : notes[r][c]}
                isSelected={!isPaused && isSelected}
                isSameValue={!isPaused && selVal !== 0 && value === selVal}
                isRelated={!isPaused && isRelated}
                isHint={!isPaused && activeHint?.row === r && activeHint?.col === c}
                onSelect={(row, col) => {
                  if (!readOnly && !isPaused) onSelect(row, col)
                }}
              />
            )
          }),
        )}
      </div>

      {/* Anti-cheat Frosted Glass Pause Overlay */}
      {isPaused && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200 select-none">
          <div className="w-12 h-12 rounded-2xl bg-white/10 text-white flex items-center justify-center text-xl mb-3 shadow-inner">
            <i className="fa-solid fa-pause"></i>
          </div>
          <p className="text-sm font-bold text-white mb-1">一時停止中</p>
          <p className="text-xs text-slate-300 mb-4 text-center">タイマーと盤面の表示を一時停止しています</p>
          {onResume && (
            <button
              type="button"
              onClick={onResume}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-brand-500/30 active:scale-95 transition flex items-center gap-2"
            >
              <i className="fa-solid fa-play"></i> ゲームを再開する
            </button>
          )}
        </div>
      )}
    </div>
  )
}
