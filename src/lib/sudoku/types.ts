export type Grid = number[][]
export type Notes = Set<number>[][]
export type Difficulty = 'beginner' | 'easy' | 'medium' | 'hard' | 'expert'

export interface Position {
  row: number
  col: number
}

export interface BaseHint {
  type: string
  badge: string
  row: number
  col: number
  reason: string
}

export interface PlacementHint extends BaseHint {
  kind: 'placement'
  num: number
}

export interface CorrectionHint extends BaseHint {
  kind: 'correction'
  currentNum: number
}

export type Hint = PlacementHint | CorrectionHint

