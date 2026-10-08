import { describe, expect, it, vi } from 'vitest'
import { useGeminiAdvice } from './useGeminiAdvice'
import * as hintClient from '../lib/gemini/hintClient'
import type { GameState } from '../lib/sudoku'
import { createEmptyGrid, createEmptyNotes } from '../lib/sudoku/board'
import { IDLE_HINT_PANEL } from '../lib/sudoku/gameReducer'

const dummyGame: GameState = {
  gameId: 1,
  difficulty: 'easy',
  solution: createEmptyGrid(),
  initial: createEmptyGrid(),
  board: createEmptyGrid(),
  notes: createEmptyNotes(),
  selected: null,
  noteMode: false,
  history: [],
  mistakes: 0,
  activeHint: null,
  hintPanel: IDLE_HINT_PANEL,
}

// Lightweight Hook Simulator to test React Hook semantics without DOM dependencies
class HookSimulator<P, R> {
  private hookFn: (props: P) => R
  private props: P
  public result!: R

  private stateSlots: any[] = []
  private stateIndex = 0

  private refSlots: any[] = []
  private refIndex = 0

  private effectSlots: { effect: () => void | (() => void); deps?: any[]; cleanup?: () => void }[] = []
  private effectIndex = 0

  private callbackSlots: { callback: any; deps: any[] }[] = []
  private callbackIndex = 0

  private updateQueued = false

  constructor(hookFn: (props: P) => R, initialProps: P) {
    this.hookFn = hookFn
    this.props = initialProps
    this.runCycle()
  }

  private areDepsEqual(prev?: any[], next?: any[]) {
    if (!prev || !next) return false
    if (prev.length !== next.length) return false
    return prev.every((p, i) => Object.is(p, next[i]))
  }

  private scheduleUpdate() {
    if (this.updateQueued) return
    this.updateQueued = true
    queueMicrotask(() => {
      this.updateQueued = false
      this.runCycle()
    })
  }

  runCycle() {
    this.stateIndex = 0
    this.refIndex = 0
    this.effectIndex = 0
    this.callbackIndex = 0

    const self = this
    const pendingEffects: Array<() => void> = []

    const mockDispatcher = {
      useState(initial: any) {
        const idx = self.stateIndex++
        if (self.stateSlots.length <= idx) {
          self.stateSlots[idx] = typeof initial === 'function' ? initial() : initial
        }
        const setState = (next: any) => {
          const nextVal = typeof next === 'function' ? next(self.stateSlots[idx]) : next
          if (Object.is(self.stateSlots[idx], nextVal)) return
          self.stateSlots[idx] = nextVal
          self.scheduleUpdate()
        }
        return [self.stateSlots[idx], setState]
      },
      useRef(initial: any) {
        const idx = self.refIndex++
        if (self.refSlots.length <= idx) {
          self.refSlots[idx] = { current: initial }
        }
        return self.refSlots[idx]
      },
      useCallback(callback: any, deps: any[]) {
        const idx = self.callbackIndex++
        const prev = self.callbackSlots[idx]
        if (!prev || !self.areDepsEqual(prev.deps, deps)) {
          self.callbackSlots[idx] = { callback, deps }
          return callback
        }
        return prev.callback
      },
      useEffect(effect: any, deps?: any[]) {
        const idx = self.effectIndex++
        const prev = self.effectSlots[idx]
        if (!prev || !self.areDepsEqual(prev.deps, deps)) {
          pendingEffects.push(() => {
            prev?.cleanup?.()
            const cleanup = effect()
            self.effectSlots[idx] = { effect, deps, cleanup: typeof cleanup === 'function' ? cleanup : undefined }
          })
        }
      },
    }

    const ReactModule: any = awaitReact()
    const internals =
      ReactModule.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE ||
      ReactModule.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
    const prevDispatcher = internals.H
    internals.H = mockDispatcher

    try {
      this.result = this.hookFn(this.props)
    } finally {
      internals.H = prevDispatcher
    }

    // Run pending effects after render is complete
    for (const runEffect of pendingEffects) {
      runEffect()
    }
  }

  rerender(newProps: P) {
    this.props = newProps
    this.runCycle()
  }

  unmount() {
    for (const slot of this.effectSlots) {
      slot?.cleanup?.()
    }
  }
}

function awaitReact() {
  return require('react')
}

describe('useGeminiAdvice', () => {
  it('updates apiKey dynamically and passes new key without reload', async () => {
    const mockRequest = vi.spyOn(hintClient, 'requestGeminiHint').mockResolvedValue({
      advice: 'Test advice',
      level: 1,
      model: 'gemini-2.5-flash',
    })

    const harness = new HookSimulator<string, ReturnType<typeof useGeminiAdvice>>(
      (key: string) => useGeminiAdvice(dummyGame, key),
      'initial-key',
    )

    // Call ask with initial key
    await harness.result.ask(1)
    expect(mockRequest).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ apiKey: 'initial-key' }),
    )

    // Rerender with updated key
    harness.rerender('updated-key')

    await harness.result.ask(1)
    expect(mockRequest).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ apiKey: 'updated-key' }),
    )

    harness.unmount()
    mockRequest.mockRestore()
  })

  it('aborts ongoing request and resets to idle when apiKey changes or is cleared', async () => {
    let capturedSignal: AbortSignal | undefined
    let resolvePromise: (val: any) => void = () => {}

    vi.spyOn(hintClient, 'requestGeminiHint').mockImplementation((_req, opts) => {
      capturedSignal = opts?.signal
      return new Promise((resolve) => {
        resolvePromise = resolve
      })
    })

    const harness = new HookSimulator<string, ReturnType<typeof useGeminiAdvice>>(
      (key: string) => useGeminiAdvice(dummyGame, key),
      'key-1',
    )

    // Start request (in flight)
    harness.result.ask(1)
    await Promise.resolve()
    expect(harness.result.advice.status).toBe('loading')
    expect(capturedSignal?.aborted).toBe(false)

    // Key changes during communication
    harness.rerender('key-2')
    await Promise.resolve()

    // Old request should be aborted and advice reset to idle
    expect(capturedSignal?.aborted).toBe(true)
    expect(harness.result.advice.status).toBe('idle')

    // Even if previous promise resolves afterwards, advice should NOT be updated to success
    resolvePromise({ advice: 'Late response', level: 1, model: 'gemini-2.5-flash' })
    // Allow any microtasks to run
    await new Promise((r) => setTimeout(r, 10))

    expect(harness.result.advice.status).toBe('idle')

    harness.unmount()
    vi.restoreAllMocks()
  })
})
