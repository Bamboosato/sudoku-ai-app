import type { Grid, Notes } from './types'

export const createEmptyGrid = (): Grid =>
  Array.from({ length: 9 }, () => Array<number>(9).fill(0))

export const createEmptyNotes = (): Notes =>
  Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()))

export const cloneGrid = (grid: Grid): Grid => grid.map((row) => [...row])

export const cloneNotes = (notes: Notes): Notes =>
  notes.map((row) => row.map((set) => new Set(set)))

export function isValidPlacement(board: Grid, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num && i !== col) return false
    if (board[i][col] === num && i !== row) return false
  }
  const startRow = Math.floor(row / 3) * 3
  const startCol = Math.floor(col / 3) * 3
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const curR = startRow + r
      const curC = startCol + c
      if (board[curR][curC] === num && (curR !== row || curC !== col)) return false
    }
  }
  return true
}

export function shuffleArray<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** Remove `num` from the notes of every peer (row, column, block) of the given cell. Mutates `notes`. */
export function cleanPeerNotes(notes: Notes, row: number, col: number, num: number): void {
  for (let i = 0; i < 9; i++) {
    notes[row][i].delete(num)
    notes[i][col].delete(num)
  }
  const bR = Math.floor(row / 3) * 3
  const bC = Math.floor(col / 3) * 3
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      notes[bR + r][bC + c].delete(num)
    }
  }
}

/** Returns an array indexed 1..9 with the number of remaining (unplaced) digits. */
export function countRemaining(board: Grid): number[] {
  const counts = Array<number>(10).fill(0)
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = board[r][c]
      if (val > 0) counts[val]++
    }
  }
  return counts.map((placed) => Math.max(0, 9 - placed))
}

export function isSolved(board: Grid, solution: Grid): boolean {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== solution[r][c]) return false
    }
  }
  return true
}

export function countMistakes(board: Grid, solution: Grid): number {
  let n = 0
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] !== 0 && board[r][c] !== solution[r][c]) n++
    }
  }
  return n
}
