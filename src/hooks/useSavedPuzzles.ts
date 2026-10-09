import { useCallback, useEffect, useState } from 'react'
import {
  deleteSavedPuzzle,
  loadSavedPuzzlesFromStorage,
  saveOrUpdatePuzzle,
  type SavedPuzzle,
} from '../lib/sudoku/savedPuzzles'

export function useSavedPuzzles() {
  const [savedPuzzles, setSavedPuzzles] = useState<SavedPuzzle[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    setSavedPuzzles(loadSavedPuzzlesFromStorage())
  }, [])

  const savePuzzle = useCallback(
    (puzzleData: Omit<SavedPuzzle, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }) => {
      setSavedPuzzles((prev) => {
        const next = saveOrUpdatePuzzle(prev, puzzleData)
        return [...next]
      })
    },
    [],
  )

  const removePuzzle = useCallback((id: string) => {
    setSavedPuzzles((prev) => {
      const next = deleteSavedPuzzle(prev, id)
      return [...next]
    })
  }, [])

  return {
    savedPuzzles,
    savePuzzle,
    removePuzzle,
  }
}
