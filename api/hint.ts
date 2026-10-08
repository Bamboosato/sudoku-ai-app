import type { IncomingMessage, ServerResponse } from 'node:http'
import {
  GeminiHintError,
  generateGeminiHint,
  parseHintRequest,
} from '../server/geminiHint'

interface VercelApiRequest extends IncomingMessage {
  body: unknown
  query: Record<string, string | string[]>
  cookies: Record<string, string>
}

interface VercelApiResponse extends ServerResponse {
  status: (statusCode: number) => VercelApiResponse
  json: (body: unknown) => VercelApiResponse
  send: (body: unknown) => VercelApiResponse
}

export default async function handler(req: VercelApiRequest, res: VercelApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST')
    return res.status(405).json({
      error: { code: 'INVALID_REQUEST', message: 'POST メソッドのみ対応しています。' },
    })
  }

  try {
    const clientApiKey = req.headers['x-gemini-api-key']
    const effectiveApiKey =
      (typeof clientApiKey === 'string' && clientApiKey.trim()) || process.env.GEMINI_API_KEY

    const request = parseHintRequest(req.body)
    const result = await generateGeminiHint(request, {
      apiKey: effectiveApiKey,
      model: process.env.GEMINI_MODEL,
    })

    return res.status(200).json(result)
  } catch (e) {
    if (e instanceof GeminiHintError) {
      return res.status(e.httpStatus).json({
        error: { code: e.code, message: e.message },
      })
    }
    console.error('[api/hint] serverless error:', e)
    return res.status(500).json({
      error: { code: 'UPSTREAM_ERROR', message: 'サーバー内部エラーが発生しました。' },
    })
  }
}
