import { useCallback, useEffect, useRef, useState } from 'react'
import { preprocessImage } from '../lib/image/preprocess'
import { BoardScanClientError, requestBoardScan } from '../lib/gemini/scanClient'
import type { BoardScanErrorCode, BoardScanResponse } from '../lib/gemini/types'

export type ScanStatus = 'idle' | 'selected' | 'preprocessing' | 'scanning' | 'review' | 'error'

export interface BoardScanState {
  status: ScanStatus
  file: File | null
  previewUrl: string | null
  response: BoardScanResponse | null
  errorCode: BoardScanErrorCode | null
  errorMessage: string | null
}

const INITIAL_STATE: BoardScanState = {
  status: 'idle',
  file: null,
  previewUrl: null,
  response: null,
  errorCode: null,
  errorMessage: null,
}

export function useBoardScan(apiKey?: string) {
  const [state, setState] = useState<BoardScanState>(INITIAL_STATE)
  const abortRef = useRef<AbortController | null>(null)
  const previewUrlRef = useRef<string | null>(null)

  // Revoke object url helper
  const clearPreviewUrl = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current)
      previewUrlRef.current = null
    }
  }, [])

  // Cleanup on unmount or apiKey change
  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      clearPreviewUrl()
    }
  }, [clearPreviewUrl])

  useEffect(() => {
    abortRef.current?.abort()
  }, [apiKey])

  const selectFile = useCallback(
    (file: File) => {
      abortRef.current?.abort()
      clearPreviewUrl()
      const url = URL.createObjectURL(file)
      previewUrlRef.current = url
      setState({
        status: 'selected',
        file,
        previewUrl: url,
        response: null,
        errorCode: null,
        errorMessage: null,
      })
    },
    [clearPreviewUrl],
  )

  const cancel = useCallback(() => {
    abortRef.current?.abort()
    setState((prev) => ({
      ...prev,
      status: prev.file ? 'selected' : 'idle',
      errorCode: null,
      errorMessage: null,
    }))
  }, [])

  const reset = useCallback(() => {
    abortRef.current?.abort()
    clearPreviewUrl()
    setState(INITIAL_STATE)
  }, [clearPreviewUrl])

  const startScan = useCallback(async () => {
    if (!state.file) return

    abortRef.current?.abort()
    const controller = new AbortController()
    abortRef.current = controller

    // Step 1: Preprocessing
    setState((prev) => ({ ...prev, status: 'preprocessing', errorCode: null, errorMessage: null }))

    let base64 = ''
    try {
      const pre = await preprocessImage(state.file)
      base64 = pre.base64
    } catch (e: unknown) {
      if (controller.signal.aborted) return
      const code = (e as { code?: BoardScanErrorCode })?.code ?? 'UNSUPPORTED_IMAGE'
      const message = (e as Error).message || '画像の処理に失敗しました。'
      setState((prev) => ({ ...prev, status: 'error', errorCode: code, errorMessage: message }))
      return
    }

    if (controller.signal.aborted) return

    // Step 2: Gemini Scan
    setState((prev) => ({ ...prev, status: 'scanning' }))

    try {
      const res = await requestBoardScan(
        { imageBase64: base64, mimeType: 'image/jpeg' },
        { apiKey, signal: controller.signal },
      )
      if (controller.signal.aborted) return
      setState((prev) => ({
        ...prev,
        status: 'review',
        response: res,
        errorCode: null,
        errorMessage: null,
      }))
    } catch (e: unknown) {
      if (controller.signal.aborted) return
      const code = (e as BoardScanClientError)?.code ?? 'UPSTREAM_ERROR'
      const message = (e as Error).message || '盤面の読み取りに失敗しました。'
      setState((prev) => ({
        ...prev,
        status: 'error',
        errorCode: code,
        errorMessage: message,
      }))
    }
  }, [state.file, apiKey])

  return {
    state,
    selectFile,
    startScan,
    cancel,
    reset,
  }
}
