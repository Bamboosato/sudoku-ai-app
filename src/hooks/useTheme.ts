import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'sudoku_theme'

function getInitialDark(): boolean {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) return saved === 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches
}

export function useTheme() {
  const [dark, setDark] = useState(getInitialDark)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark)
  }, [dark])

  const toggle = useCallback(() => {
    setDark((prev) => {
      localStorage.setItem(STORAGE_KEY, prev ? 'light' : 'dark')
      return !prev
    })
  }, [])

  return { dark, toggle }
}
