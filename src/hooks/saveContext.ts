import { createContext } from 'react'
import type { PuzzleRange, SaveData } from '../types/save'

export interface SaveContextValue {
  save: SaveData
  /** 오답 플래시에 넣거나 빼기. 넣었으면 true */
  toggleReview: (atomicNumber: number) => boolean
  removeReview: (atomicNumber: number) => void
  /** 여러 원소를 오답 플래시에 추가 (이미 있으면 그대로). 새로 추가된 개수를 돌려준다 */
  addReview: (atomicNumbers: number[]) => number
  clearReview: () => void
  setPuzzleRange: (range: PuzzleRange) => void
}

export const SaveContext = createContext<SaveContextValue | null>(null)
