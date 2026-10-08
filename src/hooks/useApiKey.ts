import { useEffect, useState } from 'react'

const STORAGE_KEY = 'sudoku_gemini_api_key'

export function useApiKey() {
  const [apiKey, setApiKey] = useState<string>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || ''
    } catch {
      return ''
    }
  })

  useEffect(() => {
    try {
      if (apiKey) {
        localStorage.setItem(STORAGE_KEY, apiKey)
      } else {
        localStorage.removeItem(STORAGE_KEY)
      }
    } catch {
      // Ignore localStorage access issues (e.g. incognito restrictions)
    }
  }, [apiKey])

  const saveApiKey = (key: string) => {
    setApiKey(key.trim())
  }

  const clearApiKey = () => {
    setApiKey('')
  }

  return {
    apiKey,
    hasCustomApiKey: Boolean(apiKey),
    saveApiKey,
    clearApiKey,
  }
}
