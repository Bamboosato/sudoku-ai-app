import { useMemo, useState } from 'react'
import { DIFFICULTY_LABELS } from '../lib/sudoku'
import { formatTime } from '../hooks/useTimer'
import type { SavedPuzzle, LoadedPuzzlePayload } from '../lib/sudoku/savedPuzzles'
import { deserializeNotes } from '../lib/sudoku/savedPuzzles'

interface MyPuzzlesModalProps {
  isOpen: boolean
  puzzles: SavedPuzzle[]
  onClose: () => void
  onLoadPuzzle: (puzzle: LoadedPuzzlePayload) => void
  onDeletePuzzle: (id: string) => void
}

type FilterStatus = 'all' | 'uncompleted' | 'completed'

export default function MyPuzzlesModal({
  isOpen,
  puzzles,
  onClose,
  onLoadPuzzle,
  onDeletePuzzle,
}: MyPuzzlesModalProps) {
  const [filter, setFilter] = useState<FilterStatus>('all')

  const completedCount = useMemo(() => puzzles.filter((p) => p.isCompleted).length, [puzzles])
  const uncompletedCount = puzzles.length - completedCount

  const filteredPuzzles = useMemo(() => {
    if (filter === 'completed') return puzzles.filter((p) => p.isCompleted)
    if (filter === 'uncompleted') return puzzles.filter((p) => !p.isCompleted)
    return puzzles
  }, [puzzles, filter])

  if (!isOpen) return null

  const handlePlay = (p: SavedPuzzle) => {
    onLoadPuzzle({
      id: p.id,
      difficulty: p.difficulty,
      source: p.source,
      initial: p.initial,
      solution: p.solution,
      board: p.initial.map((row) => [...row]),
      notes: deserializeNotes([]),
      elapsedSeconds: 0,
      mistakes: 0,
    })
    onClose()
  }

  // Count given clues in the initial board
  const countClues = (initial: number[][]) => {
    let clues = 0
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (initial[r][c] !== 0) clues++
      }
    }
    return clues
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg">
              <i className="fa-regular fa-bookmark"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">マイパズル</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                保存したパズル一覧（最大50問・初期状態から挑戦）
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center transition"
            aria-label="閉じる"
          >
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>

        {/* Filter Bar */}
        {puzzles.length > 0 && (
          <div className="px-4 sm:px-5 pt-3 pb-1 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2 text-xs">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-xl font-medium transition ${
                filter === 'all'
                  ? 'bg-brand-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              すべて ({puzzles.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('uncompleted')}
              className={`px-3 py-1 rounded-xl font-medium transition ${
                filter === 'uncompleted'
                  ? 'bg-brand-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              未クリア ({uncompletedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1 rounded-xl font-medium transition ${
                filter === 'completed'
                  ? 'bg-brand-500 text-white font-bold shadow-xs'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              クリア済 ({completedCount})
            </button>
          </div>
        )}

        {/* List Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-3 flex-1">
          {puzzles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
              <i className="fa-regular fa-folder-open text-4xl mb-1 block"></i>
              <p className="text-sm font-semibold">登録されたパズルはありません</p>
              <p className="text-xs">
                ゲーム画面右上のメニュー「マイパズルに追加」から、いつでもパズルを登録できます。
              </p>
            </div>
          ) : filteredPuzzles.length === 0 ? (
            <div className="text-center py-12 text-slate-400 dark:text-slate-500 space-y-2">
              <i className="fa-solid fa-filter text-3xl mb-1 block"></i>
              <p className="text-sm font-semibold">条件に一致するパズルはありません</p>
            </div>
          ) : (
            filteredPuzzles.map((p) => {
              const dateStr = new Date(p.createdAt || p.updatedAt).toLocaleString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
              const clues = countClues(p.initial)

              return (
                <div
                  key={p.id}
                  className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-brand-300 dark:hover:border-brand-700 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-white dark:bg-slate-700 text-brand-600 dark:text-brand-300 text-xs font-bold border border-slate-200 dark:border-slate-600">
                        {DIFFICULTY_LABELS[p.difficulty]}
                      </span>
                      {p.source === 'imported' && (
                        <span className="px-1.5 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px] font-semibold">
                          取り込み
                        </span>
                      )}
                      {p.isCompleted ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold flex items-center gap-1 border border-emerald-200 dark:border-emerald-800/60">
                          <i className="fa-solid fa-check text-[9px]"></i>
                          クリア済
                          {p.clearTime !== undefined && ` (${formatTime(p.clearTime)})`}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700/80 text-slate-600 dark:text-slate-400 text-[10px] font-medium flex items-center gap-1">
                          <i className="fa-regular fa-circle text-[8px]"></i>
                          未クリア
                        </span>
                      )}
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                        {p.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        <i className="fa-solid fa-hashtag mr-1 text-slate-400"></i>
                        ヒント {clues}マス
                      </span>
                      <span>
                        <i className="fa-regular fa-calendar mr-1 text-slate-400"></i>
                        {dateStr}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handlePlay(p)}
                      className="py-1.5 px-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition flex items-center gap-1.5 active:scale-95"
                    >
                      <i className="fa-solid fa-play text-[10px]"></i> プレイ
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePuzzle(p.id)}
                      className="py-1.5 px-2.5 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs transition"
                      title="削除"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
          <span>
            保存件数: {puzzles.length}/50 （クリア: {completedCount} / 未クリア: {uncompletedCount}）
          </span>
          <button
            type="button"
            onClick={onClose}
            className="py-1.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 font-semibold transition"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  )
}
