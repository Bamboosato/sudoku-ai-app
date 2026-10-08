import { generateGeminiHintDirect } from './directClient'
import type { GeminiHintClientErrorCode, GeminiHintRequest, GeminiHintResponse } from './types'

export class GeminiHintClientError extends Error {
  constructor(
    public code: GeminiHintClientErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'GeminiHintClientError'
  }
}

const CLIENT_TIMEOUT_MS = 30000

/**
 * Requests Gemini hint.
 * - If user provided custom apiKey (localStorage), calls Google Generative Language REST API directly.
 *   This avoids serverless function cold starts, payload limits, and backend failures on static/Vercel hosting.
 * - Otherwise falls back to /api/hint backend proxy.
 */
export async function requestGeminiHint(
  payload: GeminiHintRequest,
  options?: { apiKey?: string; signal?: AbortSignal },
): Promise<GeminiHintResponse> {
  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, CLIENT_TIMEOUT_MS)
  const onAbort = () => controller.abort()
  options?.signal?.addEventListener('abort', onAbort)

  try {
    // 1. Direct REST call if user entered API key
    if (options?.apiKey && options.apiKey.trim()) {
      try {
        return await generateGeminiHintDirect(payload, options.apiKey, controller.signal)
      } catch (e: unknown) {
        if (timedOut) throw new GeminiHintClientError('TIMEOUT', 'AIの応答がタイムアウトしました。もう一度お試しください。')
        if ((e as Error).name === 'AbortError') throw new GeminiHintClientError('ABORTED', 'リクエストをキャンセルしました。')
        const code = (e as { code?: GeminiHintClientErrorCode })?.code ?? 'UPSTREAM_ERROR'
        const message = (e as Error).message || 'Gemini API との通信に失敗しました。'
        throw new GeminiHintClientError(code, message)
      }
    }

    // 2. Fallback to /api/hint proxy if no user key (e.g. server env key)
    let res: Response
    try {
      res = await fetch('/api/hint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch (e) {
      if (timedOut) throw new GeminiHintClientError('TIMEOUT', 'AIの応答がタイムアウトしました。もう一度お試しください。')
      if ((e as Error).name === 'AbortError') throw new GeminiHintClientError('ABORTED', 'リクエストをキャンセルしました。')
      throw new GeminiHintClientError('NETWORK', 'サーバーに接続できません。ネットワークを確認してください。')
    }

    let body: unknown = null
    try {
      body = await res.json()
    } catch {
      /* non-JSON response */
    }

    if (!res.ok) {
      const err = (body as { error?: { code?: GeminiHintClientErrorCode; message?: string } } | null)?.error
      throw new GeminiHintClientError(err?.code ?? 'UNKNOWN', err?.message ?? `サーバーエラーが発生しました (HTTP ${res.status})。`)
    }

    const data = body as GeminiHintResponse | null
    if (!data || typeof data.advice !== 'string') {
      throw new GeminiHintClientError('UNKNOWN', 'サーバーから不正な応答を受け取りました。')
    }
    return data
  } finally {
    clearTimeout(timer)
    options?.signal?.removeEventListener('abort', onAbort)
  }
}
