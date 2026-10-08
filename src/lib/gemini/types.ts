export const HINT_LEVELS = [1, 2, 3, 4] as const
export type HintLevel = (typeof HINT_LEVELS)[number]

export const HINT_LEVEL_LABELS: Record<HintLevel, string> = {
  1: 'ノーヒント',
  2: '着眼点',
  3: 'マス特定',
  4: '直接回答',
}

/** Wire format (JSON-serializable; notes are arrays instead of Sets). */
export interface GeminiHintRequest {
  board: number[][]
  initial: number[][]
  solution: number[][]
  notes?: number[][][]
  level: HintLevel
  mistakes?: number
}

export interface GeminiHintResponse {
  advice: string
  level: HintLevel
  model: string
}

export type GeminiHintClientErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_REQUEST'
  | 'AUTH_FAILED'
  | 'RATE_LIMITED'
  | 'UPSTREAM_ERROR'
  | 'EMPTY_RESPONSE'
  | 'NETWORK'
  | 'TIMEOUT'
  | 'ABORTED'
  | 'UNKNOWN'
