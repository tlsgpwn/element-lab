import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SaveContext, type SaveContextValue } from '../hooks/saveContext'
import { clampRange, loadSave, writeSave } from '../lib/storage'
import type { PuzzleRange, SaveData } from '../types/save'

export function SaveProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(loadSave)
  /** 이벤트 핸들러에서 최신 값을 바로 읽기 위한 ref */
  const latest = useRef(save)
  useLayoutEffect(() => {
    latest.current = save
  }, [save])

  useEffect(() => {
    writeSave(save)
  }, [save])

  const toggleReview = useCallback((z: number) => {
    const has = latest.current.reviewElements.includes(z)
    setSave((prev) => ({
      ...prev,
      reviewElements: has
        ? prev.reviewElements.filter((x) => x !== z)
        : [...prev.reviewElements.filter((x) => x !== z), z].sort((a, b) => a - b),
    }))
    return !has
  }, [])

  const removeReview = useCallback((z: number) => {
    setSave((prev) => ({ ...prev, reviewElements: prev.reviewElements.filter((x) => x !== z) }))
  }, [])

  const clearReview = useCallback(() => setSave((prev) => ({ ...prev, reviewElements: [] })), [])

  const setPuzzleRange = useCallback((range: PuzzleRange) => {
    setSave((prev) => ({ ...prev, puzzleRange: clampRange(range) }))
  }, [])

  const value = useMemo<SaveContextValue>(
    () => ({ save, toggleReview, removeReview, clearReview, setPuzzleRange }),
    [save, toggleReview, removeReview, clearReview, setPuzzleRange],
  )
  return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>
}
