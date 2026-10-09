import { GoogleGenAI } from '@google/genai'
import { parseScanResponse, SCAN_PROMPT, SCAN_RESPONSE_SCHEMA } from '../src/lib/gemini/scanPrompt'
import type { BoardScanErrorCode, BoardScanRequest, BoardScanResponse } from '../src/lib/gemini/types'

export const DEFAULT_SCAN_MODEL = 'gemini-2.5-flash'

export class GeminiScanError extends Error {
  constructor(
    public code: BoardScanErrorCode,
    message: string,
    public httpStatus: number,
  ) {
    super(message)
    this.name = 'GeminiScanError'
  }
}

export function parseScanServerRequest(raw: unknown): BoardScanRequest {
  if (typeof raw !== 'object' || raw === null) {
    throw new GeminiScanError('INVALID_RESPONSE', 'リクエスト形式が不正です。', 400)
  }
  const r = raw as Record<string, unknown>
  if (typeof r.imageBase64 !== 'string' || !r.imageBase64.trim()) {
    throw new GeminiScanError('INVALID_RESPONSE', 'imageBase64 は必須です。', 400)
  }
  return {
    imageBase64: r.imageBase64.trim(),
    mimeType: 'image/jpeg',
  }
}

export async function generateGeminiScan(
  req: BoardScanRequest,
  options: { apiKey?: string; model?: string },
): Promise<BoardScanResponse> {
  const apiKey = options.apiKey?.trim()
  if (!apiKey) {
    throw new GeminiScanError('NO_API_KEY', 'GEMINI_API_KEY が設定されていません。', 500)
  }

  const model = options.model?.trim() || DEFAULT_SCAN_MODEL
  const ai = new GoogleGenAI({ apiKey })

  let response: any
  try {
    response = await ai.models.generateContent({
      model,
      contents: [
        {
          role: 'user',
          parts: [
            { text: SCAN_PROMPT },
            {
              inlineData: {
                mimeType: req.mimeType,
                data: req.imageBase64,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: 'application/json',
        responseSchema: SCAN_RESPONSE_SCHEMA,
        temperature: 0,
      },
    })
  } catch (e: any) {
    const msg = e?.message || ''
    if (/API key not valid/i.test(msg)) {
      throw new GeminiScanError('AUTH', 'APIキーが無効です。', 401)
    }
    if (/quota|RESOURCE_EXHAUSTED/i.test(msg)) {
      throw new GeminiScanError('QUOTA', 'Gemini API の利用上限に達しました。', 429)
    }
    throw new GeminiScanError('UPSTREAM_ERROR', `Gemini API エラー: ${msg}`, 502)
  }

  const text = response?.text?.trim()
  if (!text) {
    throw new GeminiScanError('INVALID_RESPONSE', 'Gemini から回答を得られませんでした。', 502)
  }

  const parsed = parseScanResponse(text)
  if (!parsed) {
    throw new GeminiScanError('INVALID_RESPONSE', '盤面データの解析に失敗しました。', 502)
  }

  return parsed
}
