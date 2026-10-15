import { useCallback, useState } from 'react'

export type InputMode = 'popup' | 'numpad'

const STORAGE_KEY = 'sudoku_input_mode'

function getInitialMode(): InputMode {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved === 'numpad' || saved === 'popup') return saved
  return 'popup'
}

export function useInputMode() {
  const [inputMode, setInputModeState] = useState<InputMode>(getInitialMode)

  const setInputMode = useCallback((mode: InputMode) => {
    setInputModeState(mode)
    localStorage.setItem(STORAGE_KEY, mode)
  }, [])

  const toggleInputMode = useCallback(() => {
    setInputModeState((prev) => {
      const next = prev === 'popup' ? 'numpad' : 'popup'
      localStorage.setItem(STORAGE_KEY, next)
      return next
    })
  }, [])

  return { inputMode, setInputMode, toggleInputMode }
}
