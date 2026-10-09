import { useEffect, useMemo, useRef, useState } from 'react'
import { useBoardScan } from '../hooks/useBoardScan'
import { validateImportedBoard, type ImportValidation } from '../lib/sudoku/importValidation'
import type { Difficulty, Grid, Position } from '../lib/sudoku/types'
import ImportPreviewGrid from './ImportPreviewGrid'

interface ImportModalProps {
  isOpen: boolean
  apiKey?: string
  hasUnsavedGame: boolean
  onClose: () => void
  onOpenSettings: () => void
  onImport: (initial: Grid, solution: Grid, difficulty: Difficulty) => void
}

export default function ImportModal({
  isOpen,
  apiKey,
  hasUnsavedGame,
  onClose,
  onOpenSettings,
  onImport,
}: ImportModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { state: scanState, selectFile, startScan, cancel, reset } = useBoardScan(apiKey)

  // Local editable grid during review
  const [editableGrid, setEditableGrid] = useState<number[][]>(() =>
    Array.from({ length: 9 }, () => new Array(9).fill(0)),
  )
  const [selectedCell, setSelectedCell] = useState<Position | null>(null)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  // Sync scan response into editable grid when scan succeeds
  useEffect(() => {
    if (scanState.response?.found && scanState.response.grid) {
      setEditableGrid(scanState.response.grid.map((row) => [...row]))
      setSelectedCell(null)
    }
  }, [scanState.response])

  // Reset when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      reset()
      setSelectedCell(null)
      setShowDiscardConfirm(false)
    }
  }, [isOpen, reset])

  // Validate the current editable grid
  const validation: ImportValidation = useMemo(() => {
    if (scanState.status !== 'review') {
      return { status: 'invalid-shape' }
    }
    return validateImportedBoard(editableGrid)
  }, [scanState.status, editableGrid])

  // Conflict cells list
  const conflictCells = useMemo(() => {
    if (validation.status === 'conflict') return validation.cells
    return []
  }, [validation])

  // Handle number input in preview
  const handleDigitInput = (num: number) => {
    if (!selectedCell) return
    const { row, col } = selectedCell
    setEditableGrid((prev) => {
      const next = prev.map((r) => [...r])
      next[row][col] = num
      return next
    })
  }

  // Handle file change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      selectFile(file)
    }
  }

  // Handle drag and drop
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      selectFile(file)
    }
  }

  const handleStartGame = () => {
    if (validation.status !== 'ok') return

    if (hasUnsavedGame) {
      setShowDiscardConfirm(true)
      return
    }

    commitImport()
  }

  const commitImport = () => {
    if (validation.status !== 'ok') return
    const initial = editableGrid.map((row) => [...row])
    onImport(initial, validation.solution, validation.grading.difficulty)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 flex items-center justify-center text-lg">
              <i className="fa-solid fa-camera"></i>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">盤面画像から取り込み</h2>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">新聞や写真の数読を Gemini が自動認識</p>
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

        {/* Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Step 1 & 2: Image Selection and Confirmation */}
          {scanState.status === 'idle' && (
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-brand-500 dark:hover:border-brand-400 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 bg-slate-50/50 dark:bg-slate-800/20"
            >
              <div className="w-14 h-14 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-600 dark:text-brand-400 flex items-center justify-center text-2xl">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  写真を選ぶ、または撮影する
                </p>
                <p className="text-xs text-slate-400">
                  クリックして写真ライブラリ・カメラを起動、またはファイルをドロップ
                </p>
              </div>
              <span className="text-[10px] text-slate-400">対応形式: JPEG / PNG / WebP</span>
            </div>
          )}

          {scanState.status === 'selected' && scanState.previewUrl && (
            <div className="space-y-3">
              <div className="relative rounded-2xl overflow-hidden bg-slate-950 max-h-64 flex items-center justify-center">
                <img
                  src={scanState.previewUrl}
                  alt="選択した数独画像"
                  className="max-h-64 w-auto object-contain"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-2 right-2 py-1 px-2.5 rounded-lg bg-black/60 hover:bg-black/80 text-white text-[11px] backdrop-blur-sm transition flex items-center gap-1"
                >
                  <i className="fa-solid fa-arrows-rotate"></i> 選び直す
                </button>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 text-center">
                ※ 盤面全体が平行に収まるように写っていると、高精度に読み取れます。
              </p>
            </div>
          )}

          {/* Step 3: Loading (Preprocessing / Scanning) */}
          {(scanState.status === 'preprocessing' || scanState.status === 'scanning') && (
            <div className="py-12 flex flex-col items-center justify-center gap-4 text-center">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-brand-200 dark:border-brand-900 border-t-brand-600 animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center text-brand-600 dark:text-brand-400 text-lg">
                  <i className="fa-solid fa-wand-magic-sparkles"></i>
                </div>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                  {scanState.status === 'preprocessing'
                    ? '画像を最適化しています…'
                    : 'Gemini が盤面の数字を解析中…'}
                </p>
                <p className="text-xs text-slate-400">通常数秒〜十数秒で完了します</p>
              </div>
              <button
                type="button"
                onClick={cancel}
                className="mt-2 py-1.5 px-4 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-600 dark:text-slate-300 transition"
              >
                キャンセル
              </button>
            </div>
          )}

          {/* Error View */}
          {scanState.status === 'error' && (
            <div className="rounded-2xl p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 space-y-3">
              <div className="flex items-start gap-3">
                <i className="fa-solid fa-circle-exclamation text-rose-500 text-lg mt-0.5"></i>
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-rose-800 dark:text-rose-200">読み取りエラー</h3>
                  <p className="text-xs text-rose-600 dark:text-rose-300 leading-relaxed">
                    {scanState.errorMessage}
                  </p>
                </div>
              </div>

              {scanState.errorCode === 'NO_API_KEY' && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose()
                      onOpenSettings()
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-sm transition flex items-center justify-center gap-1.5"
                  >
                    <i className="fa-solid fa-key"></i> Gemini API キーを設定する
                  </button>
                </div>
              )}

              {scanState.errorCode !== 'NO_API_KEY' && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={startScan}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition"
                  >
                    再試行
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 py-1.5 px-3 rounded-xl border border-rose-300 dark:border-rose-700 text-rose-700 dark:text-rose-300 text-xs font-medium hover:bg-rose-100 dark:hover:bg-rose-900/40 transition"
                  >
                    写真を選び直す
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review and Edit */}
          {scanState.status === 'review' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-1">
                <span className="flex items-center gap-1.5">
                  <i className="fa-solid fa-pen-to-square text-brand-500"></i>
                  マスをタップして数字を修正できます
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1"
                >
                  <i className="fa-solid fa-image"></i> 写真を選び直す
                </button>
              </div>

              {/* Preview Grid */}
              <ImportPreviewGrid
                grid={editableGrid}
                selected={selectedCell}
                conflictCells={conflictCells}
                uncertainCells={scanState.response?.uncertainCells ?? []}
                onSelect={(pos) => setSelectedCell(pos)}
              />

              {/* Mini Numpad for Editing */}
              <div className="grid grid-cols-10 gap-1 pt-1 max-w-[340px] mx-auto">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleDigitInput(num)}
                    disabled={!selectedCell}
                    className="h-9 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 font-mono font-bold text-sm text-slate-800 dark:text-slate-200 transition"
                  >
                    {num}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => handleDigitInput(0)}
                  disabled={!selectedCell}
                  className="h-9 rounded-lg bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 disabled:opacity-40 text-xs transition"
                  title="消去"
                >
                  <i className="fa-solid fa-eraser"></i>
                </button>
              </div>

              {/* Validation Status Banner */}
              <div className="pt-1">
                {validation.status === 'ok' && (
                  <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-circle-check text-emerald-500 text-base"></i>
                        <span className="font-bold">盤面チェック完了！唯一解が確認されました</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-600 text-white font-bold text-[11px] shadow-sm">
                        難易度: {validation.grading.label}
                      </span>
                    </div>
                    <div className="text-[11px] text-emerald-700 dark:text-emerald-300 space-y-0.5 pl-6">
                      <p>
                        <span className="font-semibold">手がかり:</span> {validation.clues} マス
                        {validation.clues < 17 && ' (手がかりが少なめです)'}
                        <span className="mx-1.5 opacity-60">|</span>
                        <span className="font-semibold">必要技法:</span> {validation.grading.highestTechnique}
                      </p>
                      <p className="opacity-90">{validation.grading.reason}</p>
                    </div>
                  </div>
                )}

                {validation.status === 'conflict' && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200 flex items-center gap-2">
                    <i className="fa-solid fa-triangle-exclamation text-rose-500 text-base"></i>
                    <div>
                      <p className="font-bold">同じ行・列・3x3ブロックに重複する数字があります</p>
                      <p className="text-[11px] text-rose-700 dark:text-rose-300">
                        赤くハイライトされたマスの数字を確認・修正してください。
                      </p>
                    </div>
                  </div>
                )}

                {validation.status === 'no-solution' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation text-amber-500 text-base"></i>
                    <div>
                      <p className="font-bold">この盤面には解が存在しません（矛盾あり）</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        読み取り間違いの数字がないか、黄色の注意マスを中心にご確認ください。
                      </p>
                    </div>
                  </div>
                )}

                {validation.status === 'multiple-solutions' && (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-200 flex items-center gap-2">
                    <i className="fa-solid fa-circle-exclamation text-amber-500 text-base"></i>
                    <div>
                      <p className="font-bold">解が複数存在します（数字が不足しています）</p>
                      <p className="text-[11px] text-amber-700 dark:text-amber-300">
                        読み落とされた数字がないか写真と照合してください（現在: {validation.clues} マス）。
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Discard Confirmation Dialog */}
          {showDiscardConfirm && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-700 space-y-2 animate-in fade-in duration-150">
              <p className="text-xs font-bold text-amber-900 dark:text-amber-100 flex items-center gap-1.5">
                <i className="fa-solid fa-triangle-exclamation text-amber-500"></i>
                プレイ中のゲームが存在します
              </p>
              <p className="text-xs text-amber-800 dark:text-amber-200 leading-relaxed">
                取り込みを開始すると、現在のゲーム盤面とタイマーは破棄されます。よろしいですか？
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={commitImport}
                  className="py-1.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
                >
                  破棄して取り込み開始
                </button>
                <button
                  type="button"
                  onClick={() => setShowDiscardConfirm(false)}
                  className="py-1.5 px-3 rounded-xl border border-amber-300 dark:border-amber-700 text-xs text-amber-800 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition"
                >
                  キャンセル
                </button>
              </div>
            </div>
          )}

          {/* Privacy Note */}
          <div className="text-[10px] text-slate-400 dark:text-slate-500 text-center pt-1 border-t border-slate-100 dark:border-slate-800">
            <i className="fa-solid fa-shield-halved"></i> 画像は盤面の読み取りのため Google Gemini API へ送信されます。自前サーバーには保存されません。
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition"
          >
            閉じる
          </button>

          {scanState.status === 'selected' && (
            <button
              type="button"
              onClick={startScan}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-md shadow-brand-500/25 flex items-center gap-1.5 transition"
            >
              <i className="fa-solid fa-wand-magic-sparkles"></i> 盤面を読み取る
            </button>
          )}

          {scanState.status === 'review' && (
            <button
              type="button"
              onClick={handleStartGame}
              disabled={validation.status !== 'ok'}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:pointer-events-none text-white font-bold text-xs shadow-md shadow-emerald-500/25 flex items-center gap-1.5 transition"
            >
              <i className="fa-solid fa-play"></i> この盤面でゲーム開始
            </button>
          )}
        </div>

        {/* Hidden File Input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  )
}
