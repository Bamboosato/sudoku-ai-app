import { useCallback, useEffect, useState } from 'react'
import type { Grid } from '../lib/sudoku/types'
import {
  deleteSavedPuzzle,
  findExistingPuzzle,
  loadSavedPuzzlesFromStorage,
  markPuzzleCompleted,
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

  const markCompleted = useCallback((idOrInitial: string | Grid, clearTime?: number) => {
    setSavedPuzzles((prev) => {
      const next = markPuzzleCompleted(prev, idOrInitial, clearTime)
      return [...next]
    })
  }, [])

  const checkExists = useCallback(
    (initial: Grid): SavedPuzzle | undefined => {
      return findExistingPuzzle(savedPuzzles, initial)
    },
    [savedPuzzles],
  )

  return {
    savedPuzzles,
    savePuzzle,
    removePuzzle,
    markCompleted,
    checkExists,
  }
}
