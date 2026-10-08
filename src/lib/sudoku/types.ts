export type Grid = number[][]
export type Notes = Set<number>[][]
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface Position {
  row: number
  col: number
}

export interface Hint {
  type: string
  badge: string
  row: number
  col: number
  num: number
  reason: string
}
