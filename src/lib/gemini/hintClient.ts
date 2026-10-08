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
 * Calls the backend proxy (POST /api/hint). The API key never reaches the browser.
 * Throws GeminiHintClientError with a user-presentable (Japanese) message.
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

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }
  if (options?.apiKey) {
    headers['x-gemini-api-key'] = options.apiKey
  }

  try {
    let res: Response
    try {
      res = await fetch('/api/hint', {
        method: 'POST',
        headers,
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
