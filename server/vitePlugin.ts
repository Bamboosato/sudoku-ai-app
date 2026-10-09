import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import { GeminiHintError, generateGeminiHint, parseHintRequest } from './geminiHint'
import { GeminiScanError, generateGeminiScan, parseScanServerRequest } from './geminiScan'

const MAX_HINT_BODY_BYTES = 100 * 1024
const MAX_SCAN_BODY_BYTES = 10 * 1024 * 1024 // 10 MB for base64 image

function readJson(req: IncomingMessage, maxBytes: number): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > maxBytes) {
        reject(new GeminiHintError('INVALID_REQUEST', 'リクエストが大きすぎます。', 413))
        req.destroy()
        return
      }
      chunks.push(chunk)
    })
    req.on('end', () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
      } catch {
        reject(new GeminiHintError('INVALID_REQUEST', 'JSON を解析できません。', 400))
      }
    })
    req.on('error', () => reject(new GeminiHintError('INVALID_REQUEST', 'リクエストの読み取りに失敗しました。', 400)))
  })
}

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

/**
 * Vite plugin exposing POST /api/hint and POST /api/scan for both `vite dev` and `vite preview`.
 * GEMINI_API_KEY / GEMINI_MODEL are read server-side only (no VITE_ prefix => never bundled).
 */
export function geminiHintPlugin(): Plugin {
  let env: Record<string, string> = {}

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url?.startsWith('/api/hint')) {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return sendJson(res, 405, { error: { code: 'INVALID_REQUEST', message: 'POST メソッドのみ対応しています。' } })
      }
      try {
        const clientApiKey = req.headers['x-gemini-api-key']
        const effectiveApiKey =
          (typeof clientApiKey === 'string' && clientApiKey.trim()) || env.GEMINI_API_KEY

        const request = parseHintRequest(await readJson(req, MAX_HINT_BODY_BYTES))
        const result = await generateGeminiHint(request, {
          apiKey: effectiveApiKey,
          model: env.GEMINI_MODEL,
        })
        return sendJson(res, 200, result)
      } catch (e) {
        if (e instanceof GeminiHintError) {
          return sendJson(res, e.httpStatus, { error: { code: e.code, message: e.message } })
        }
        console.error('[api/hint] unexpected error:', e)
        return sendJson(res, 500, { error: { code: 'UPSTREAM_ERROR', message: 'サーバー内部エラーが発生しました。' } })
      }
    }

    if (req.url?.startsWith('/api/scan')) {
      if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST')
        return sendJson(res, 405, { error: { code: 'INVALID_REQUEST', message: 'POST メソッドのみ対応しています。' } })
      }
      try {
        const clientApiKey = req.headers['x-gemini-api-key']
        const effectiveApiKey =
          (typeof clientApiKey === 'string' && clientApiKey.trim()) || env.GEMINI_API_KEY

        const request = parseScanServerRequest(await readJson(req, MAX_SCAN_BODY_BYTES))
        const result = await generateGeminiScan(request, {
          apiKey: effectiveApiKey,
          model: env.GEMINI_MODEL,
        })
        return sendJson(res, 200, result)
      } catch (e) {
        if (e instanceof GeminiScanError) {
          return sendJson(res, e.httpStatus, { error: { code: e.code, message: e.message } })
        }
        console.error('[api/scan] unexpected error:', e)
        return sendJson(res, 500, { error: { code: 'UPSTREAM_ERROR', message: 'サーバー内部エラーが発生しました。' } })
      }
    }

    return next()
  }

  return {
    name: 'gemini-hint-api',
    config(_, { mode }) {
      env = loadEnv(mode, process.cwd(), '')
    },
    configureServer(server) {
      server.middlewares.use(handler)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handler)
    },
  }
}

