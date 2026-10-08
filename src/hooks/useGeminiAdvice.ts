import { useCallback, useEffect, useRef, useState } from 'react'
import { GeminiHintClientError, requestGeminiHint } from '../lib/gemini/hintClient'
import type { HintLevel } from '../lib/gemini/types'
import type { GameState } from '../lib/sudoku'

export type GeminiAdviceState =
  | { status: 'idle' }
  | { status: 'loading'; level: HintLevel }
  | { status: 'success'; level: HintLevel; advice: string }
  | { status: 'error'; level: HintLevel; message: string }

/** On-demand Gemini advice for the current game. Resets automatically on a new game. */
export function useGeminiAdvice(game: GameState) {
  const [advice, setAdvice] = useState<GeminiAdviceState>({ status: 'idle' })
  const abortRef = useRef<AbortController | null>(null)
  const gameRef = useRef(game)
  gameRef.current = game

  useEffect(() => {
    abortRef.current?.abort()
    setAdvice({ status: 'idle' })
  }, [game.gameId])

  useEffect(() => () => abortRef.current?.abort(), [])

  const ask = useCallback(async (level: HintLevel) => {
    const g = gameRef.current
    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller
    setAdvice({ status: 'loading', level })
    try {
      const res = await requestGeminiHint(
        {
          level,
          board: g.board,
          initial: g.initial,
          solution: g.solution,
          notes: g.notes.map((row) => row.map((set) => [...set])),
          mistakes: g.mistakes,
        },
        controller.signal,
      )
      if (controller.signal.aborted) return
      setAdvice({ status: 'success', level, advice: res.advice })
    } catch (e) {
      if (controller.signal.aborted) return
      const message =
        e instanceof GeminiHintClientError ? e.message : '予期しないエラーが発生しました。もう一度お試しください。'
      setAdvice({ status: 'error', level, message })
    }
  }, [])

  return { advice, ask }
}
