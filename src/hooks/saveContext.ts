import { createContext } from 'react'
import type { PuzzleRange, SaveData } from '../types/save'

export interface SaveContextValue {
  save: SaveData
  /** 오답 플래시에 넣거나 빼기. 넣었으면 true */
  toggleReview: (atomicNumber: number) => boolean
  removeReview: (atomicNumber: number) => void
  clearReview: () => void
  setPuzzleRange: (range: PuzzleRange) => void
}

export const SaveContext = createContext<SaveContextValue | null>(null)
