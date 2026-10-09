import { parseScanResponse, SCAN_PROMPT, SCAN_RESPONSE_SCHEMA } from './scanPrompt'
import type { BoardScanErrorCode, BoardScanRequest, BoardScanResponse } from './types'

export const DEFAULT_SCAN_MODEL = 'gemini-2.5-flash'
const SCAN_TIMEOUT_MS = 60000

export class BoardScanClientError extends Error {
  constructor(
    public code: BoardScanErrorCode,
    message: string,
  ) {
    super(message)
    this.name = 'BoardScanClientError'
  }
}

/**
 * Direct REST API call to Google Generative Language API.
 * Passes image via inline_data and requests structured JSON output.
 */
export async function scanBoardDirect(
  req: BoardScanRequest,
  apiKey: string,
  signal?: AbortSignal,
): Promise<BoardScanResponse> {
  if (!apiKey.trim()) {
    throw new BoardScanClientError('NO_API_KEY', 'Gemini API キーが設定されていません。')
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${DEFAULT_SCAN_MODEL}:generateContent?key=${encodeURIComponent(
    apiKey.trim(),
  )}`

  const payload = {
    contents: [
      {
        parts: [
          { text: SCAN_PROMPT },
          {
            inline_data: {
              mime_type: req.mimeType,
              data: req.imageBase64,
            },
          },
        ],
      },
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: SCAN_RESPONSE_SCHEMA,
      temperature: 0,
    },
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal,
  })

  const data = await res.json().catch(() => null)

  if (!res.ok) {
    const errorMsg = data?.error?.message || ''
    if (res.status === 400 || /API key not valid/i.test(errorMsg)) {
      throw new BoardScanClientError('AUTH', '入力された Gemini API キーが無効です。設定を確認してください。')
    }
    if (res.status === 429) {
      throw new BoardScanClientError('QUOTA', 'Gemini API の利用上限に達しました。少し待ってから再度お試しください。')
    }
    throw new BoardScanClientError('UPSTREAM_ERROR', `Gemini API エラー: ${errorMsg || res.statusText}`)
  }

  const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
  if (!rawText) {
    throw new BoardScanClientError('INVALID_RESPONSE', 'Gemini から回答を得られませんでした。もう一度お試しください。')
  }

  const parsed = parseScanResponse(rawText)
  if (!parsed) {
    throw new BoardScanClientError('INVALID_RESPONSE', '盤面データの解析に失敗しました。もう一度お試しください。')
  }

  if (!parsed.found) {
    throw new BoardScanClientError('NOT_FOUND', '画像から数独の盤面が見つかりませんでした。盤面全体が写るように撮影・選択してください。')
  }

  return parsed
}

/**
 * Main router for board scanning:
 * - If user provided custom apiKey, calls Google Generative Language REST API directly.
 * - Otherwise falls back to /api/scan proxy on development server.
 * - Handles 60s timeout, abort, and error translation.
 */
export async function requestBoardScan(
  payload: BoardScanRequest,
  options?: { apiKey?: string; signal?: AbortSignal },
): Promise<BoardScanResponse> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    throw new BoardScanClientError('OFFLINE', 'オフラインのため画像の読み取りができません。インターネット接続を確認してください。')
  }

  const controller = new AbortController()
  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, SCAN_TIMEOUT_MS)
  const onAbort = () => controller.abort()
  options?.signal?.addEventListener('abort', onAbort)

  try {
    // 1. Direct REST call if user entered API key
    if (options?.apiKey && options.apiKey.trim()) {
      try {
        return await scanBoardDirect(payload, options.apiKey, controller.signal)
      } catch (e: unknown) {
        if (timedOut) throw new BoardScanClientError('TIMEOUT', 'AIの応答がタイムアウトしました。もう一度お試しください。')
        if ((e as Error).name === 'AbortError') throw new BoardScanClientError('ABORTED', 'リクエストをキャンセルしました。')
        if (e instanceof BoardScanClientError) throw e
        const message = (e as Error).message || 'Gemini API との通信に失敗しました。'
        throw new BoardScanClientError('UPSTREAM_ERROR', message)
      }
    }

    // Production check: if on production without custom API key, fail with NO_API_KEY
    if (!import.meta.env.DEV) {
      throw new BoardScanClientError('NO_API_KEY', '画像の読み取りには Gemini API キーの設定が必要です。')
    }

    // 2. Fallback to /api/scan proxy on dev server
    let res: Response
    try {
      res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })
    } catch (e) {
      if (timedOut) throw new BoardScanClientError('TIMEOUT', 'AIの応答がタイムアウトしました。もう一度お試しください。')
      if ((e as Error).name === 'AbortError') throw new BoardScanClientError('ABORTED', 'リクエストをキャンセルしました。')
      throw new BoardScanClientError('NETWORK', 'サーバーに接続できません。ネットワークを確認してください。')
    }

    const body = await res.json().catch(() => null)

    if (!res.ok) {
      const err = (body as { error?: { code?: BoardScanErrorCode; message?: string } } | null)?.error
      throw new BoardScanClientError(err?.code ?? 'UPSTREAM_ERROR', err?.message ?? `サーバーエラーが発生しました (HTTP ${res.status})。`)
    }

    const data = body as BoardScanResponse | null
    if (!data || typeof data.found !== 'boolean') {
      throw new BoardScanClientError('INVALID_RESPONSE', 'サーバーから不正な応答を受け取りました。')
    }
    if (!data.found) {
      throw new BoardScanClientError('NOT_FOUND', '画像から数独の盤面が見つかりませんでした。盤面全体が写るように撮影・選択してください。')
    }
    return data
  } finally {
    clearTimeout(timer)
    options?.signal?.removeEventListener('abort', onAbort)
  }
}
