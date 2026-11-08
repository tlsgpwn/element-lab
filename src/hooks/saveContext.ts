import { createContext } from 'react'
import type { SaveData } from '../types/save'
import type { Difficulty } from '../lib/spacedRepetition'

export interface SaveActions {
  /** 원소 학습 완료 → 해금 + 오늘의 학습 기록에 추가 */
  completeLearning: (atomicNumber: number) => void
  setDailyGoal: (goal: number) => void
  /** 플래시카드 응답 기록 (간격 반복 가중치 갱신) */
  recordReview: (atomicNumber: number, difficulty: Difficulty, wasCorrect: boolean) => void
  /** [3D 분자 도감]에 분자 등록 (이미 있으면 무시) */
  discoverMolecules: (ids: string[]) => void
  resetAll: () => void
}

export interface SaveContextValue extends SaveActions {
  save: SaveData
  /** 오늘 학습한 원소 수 */
  learnedTodayCount: number
}

export const SaveContext = createContext<SaveContextValue | null>(null)
