import type { IncomingMessage, ServerResponse } from 'node:http'
import { loadEnv, type Plugin } from 'vite'
import { GeminiHintError, generateGeminiHint, parseHintRequest } from './geminiHint'

const MAX_BODY_BYTES = 100 * 1024

function readJson(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_BODY_BYTES) {
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
 * Vite plugin exposing POST /api/hint for both `vite dev` and `vite preview`.
 * GEMINI_API_KEY / GEMINI_MODEL are read server-side only (no VITE_ prefix => never bundled).
 */
export function geminiHintPlugin(): Plugin {
  let env: Record<string, string> = {}

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (!req.url?.startsWith('/api/hint')) return next()
    if (req.method !== 'POST') {
      res.setHeader('Allow', 'POST')
      return sendJson(res, 405, { error: { code: 'INVALID_REQUEST', message: 'POST メソッドのみ対応しています。' } })
    }
    try {
      const clientApiKey = req.headers['x-gemini-api-key']
      const effectiveApiKey =
        (typeof clientApiKey === 'string' && clientApiKey.trim()) || env.GEMINI_API_KEY

      const request = parseHintRequest(await readJson(req))
      const result = await generateGeminiHint(request, {
        apiKey: effectiveApiKey,
        model: env.GEMINI_MODEL,
      })
      sendJson(res, 200, result)
    } catch (e) {
      if (e instanceof GeminiHintError) {
        sendJson(res, e.httpStatus, { error: { code: e.code, message: e.message } })
      } else {
        console.error('[api/hint] unexpected error:', e)
        sendJson(res, 500, { error: { code: 'UPSTREAM_ERROR', message: 'サーバー内部エラーが発生しました。' } })
      }
    }
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
