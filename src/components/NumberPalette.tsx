import type { CSSProperties } from 'react'
import type { Position } from '../lib/sudoku'

interface NumberPaletteProps {
  selected: Position
  currentValue: number
  notes: Set<number>
  noteMode: boolean
  remaining: number[]
  onInput: (num: number) => void
  onErase: () => void
  onClose: () => void
}

/**
 * 盤面のブロック(1〜9)に基づいてパレットの配置スタイルを決定する。
 * 入力対象のブロックに重ならない限界まで、そのブロックへ寄せて配置する。
 */
function getPaletteStyle(row: number, col: number): CSSProperties {
  const bRow = Math.floor(row / 3) // 0: 上, 1: 中, 2: 下
  const bCol = Math.floor(col / 3) // 0: 左, 1: 中, 2: 右

  // ブロック境界 (33.33%) から約半マス分の快適な余白を空けた位置
  const EDGE = '38%'

  // ブロック1 (左上) -> ブロック1の右下角のすぐ外側 (適度な余白あり)
  if (bRow === 0 && bCol === 0) {
    return { top: EDGE, left: EDGE }
  }
  // ブロック2 (上中) -> ブロック2の真下のすぐ外側
  if (bRow === 0 && bCol === 1) {
    return { top: EDGE, left: '50%', transform: 'translateX(-50%)' }
  }
  // ブロック3 (右上) -> ブロック3の左下角のすぐ外側
  if (bRow === 0 && bCol === 2) {
    return { top: EDGE, right: EDGE }
  }

  // ブロック4 (左中) -> ブロック4のすぐ右隣 (中央寄り)
  if (bRow === 1 && bCol === 0) {
    return { top: '50%', left: EDGE, transform: 'translateY(-50%)' }
  }
  // ブロック5 (中央ブロック) -> 入力するマスの位置に応じて、マスが隠れない反対側にシフト
  if (bRow === 1 && bCol === 1) {
    const inRow = row - 3 // 0: 上, 1: 中, 2: 下
    const inCol = col - 3 // 0: 左, 1: 中, 2: 右
    const SHIFT = '46%'

    // 左上 (3, 3) -> 右下にシフト (左上が見える)
    if (inRow === 0 && inCol === 0) return { top: SHIFT, left: SHIFT }
    // 上中 (3, 4) -> 下にシフト (上が見える)
    if (inRow === 0 && inCol === 1) return { top: SHIFT, left: '50%', transform: 'translateX(-50%)' }
    // 右上 (3, 5) -> 左下にシフト (右上が見える)
    if (inRow === 0 && inCol === 2) return { top: SHIFT, right: SHIFT }

    // 左中 (4, 3) -> 右にシフト (左が見える)
    if (inRow === 1 && inCol === 0) return { top: '50%', left: SHIFT, transform: 'translateY(-50%)' }
    // 右中 (4, 5) -> 左にシフト (右が見える)
    if (inRow === 1 && inCol === 2) return { top: '50%', right: SHIFT, transform: 'translateY(-50%)' }

    // 左下 (5, 3) -> 右上にシフト (左下が見える)
    if (inRow === 2 && inCol === 0) return { bottom: SHIFT, left: SHIFT }
    // 下中 (5, 4) -> 上にシフト (下が見える)
    if (inRow === 2 && inCol === 1) return { bottom: SHIFT, left: '50%', transform: 'translateX(-50%)' }
    // 右下 (5, 5) -> 左上にシフト (右下が見える)
    if (inRow === 2 && inCol === 2) return { bottom: SHIFT, right: SHIFT }

    // ど真ん中 (4, 4) -> 上にシフト (マス4,4の上端44.4%より上にパレット下端43%を配置して完全に露出)
    return { bottom: '57%', left: '50%', transform: 'translateX(-50%)' }
  }
  // ブロック6 (右中) -> ブロック6のすぐ左隣 (中央寄り)
  if (bRow === 1 && bCol === 2) {
    return { top: '50%', right: EDGE, transform: 'translateY(-50%)' }
  }

  // ブロック7 (左下) -> ブロック7の右上角のすぐ外側
  if (bRow === 2 && bCol === 0) {
    return { bottom: EDGE, left: EDGE }
  }
  // ブロック8 (下中) -> ブロック8の真上のすぐ外側
  if (bRow === 2 && bCol === 1) {
    return { bottom: EDGE, left: '50%', transform: 'translateX(-50%)' }
  }
  // ブロック9 (右下) -> ブロック9の左上角のすぐ外側
  if (bRow === 2 && bCol === 2) {
    return { bottom: EDGE, right: EDGE }
  }

  return { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }
}

export default function NumberPalette({
  selected,
  currentValue,
  notes,
  noteMode,
  remaining,
  onInput,
  onErase,
  onClose,
}: NumberPaletteProps) {
  const paletteStyle = getPaletteStyle(selected.row, selected.col)

  const handleNumberClick = (n: number) => {
    if (noteMode) {
      onInput(n)
      onClose()
    } else {
      if (currentValue === n) {
        // トグル消去: 既に入力されている数字と同じ数字を押すとクリア
        onErase()
      } else {
        onInput(n)
      }
      onClose()
    }
  }

  return (
    <div
      className="absolute inset-0 z-20 select-none bg-slate-900/20 dark:bg-black/45 backdrop-blur-[1px] animate-in fade-in duration-100"
      onClick={onClose}
    >
      {/* 3x3 パレット本体 (フローティング・グロー＆コントラスト強化) */}
      <div
        style={paletteStyle}
        className="absolute w-[43%] sm:w-[41%] aspect-square rounded-2xl bg-white dark:bg-slate-900 shadow-[0_12px_36px_-6px_rgba(79,70,229,0.35),0_4px_16px_rgba(0,0,0,0.15)] dark:shadow-[0_16px_40px_-6px_rgba(0,0,0,0.8),0_0_20px_rgba(99,102,241,0.2)] ring-2 ring-brand-500/50 dark:ring-brand-400/60 border border-brand-200/80 dark:border-brand-500/30 p-1.5 sm:p-2 flex flex-col animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="grid grid-cols-3 grid-rows-3 gap-1.5 sm:gap-2 w-full h-full [grid-template-columns:repeat(3,minmax(0,1fr))] [grid-template-rows:repeat(3,minmax(0,1fr))]">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => {
            const isExhausted = remaining[n] === 0
            const isCurrent = !noteMode && currentValue === n
            const isNoted = noteMode && notes.has(n)

            let buttonStyle =
              'bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 font-bold hover:bg-brand-50 dark:hover:bg-slate-700 hover:text-brand-600 dark:hover:text-brand-300 border border-slate-200 dark:border-slate-700 shadow-sm'

            if (isCurrent) {
              // 既に数字が入っている場合は鮮やかなブランドグラデーション＋太字
              buttonStyle =
                'bg-gradient-to-tr from-brand-600 to-indigo-500 text-white font-black ring-2 ring-brand-400 border-transparent shadow-md shadow-brand-500/40'
            } else if (isNoted) {
              buttonStyle =
                'bg-brand-100 dark:bg-brand-950/70 text-brand-700 dark:text-brand-300 font-black ring-2 ring-brand-400 border-transparent'
            }

            if (isExhausted) {
              buttonStyle =
                'opacity-20 pointer-events-none bg-slate-100 dark:bg-slate-800/40 border-slate-200/40 dark:border-slate-800 text-slate-400'
            }

            return (
              <button
                key={n}
                type="button"
                onClick={() => handleNumberClick(n)}
                disabled={isExhausted}
                aria-label={`数字 ${n}`}
                className={`touch-btn w-full h-full rounded-xl flex items-center justify-center text-xl sm:text-2xl active:scale-90 touch-manipulation transition select-none ${buttonStyle}`}
              >
                <span className="leading-none">{n}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
