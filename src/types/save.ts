export interface ElementProgress {
  /** 암기 가중치 (높을수록 더 자주 출제). 기본 1 */
  weight: number
  /** 틀린 횟수 */
  wrongCount: number
  /** 복습(퀴즈 응답) 횟수 */
  reviewCount: number
  /** 마지막 복습 시각 (epoch ms) */
  lastReviewedAt: number | null
}

export interface DailyLog {
  /** 로컬 날짜 YYYY-MM-DD */
  date: string
  /** 해당 날짜에 학습 완료한 원소 번호 */
  learned: number[]
}

export interface SaveData {
  version: 1
  /** 해금된 원소 번호 배열 */
  unlockedElements: number[]
  /** 일일 학습 목표량 */
  dailyGoal: number
  /** atomicNumber → 암기 가중치/틀린 횟수 */
  elementProgress: Record<number, ElementProgress>
  /** 발견한 분자 도감 ID 목록 */
  discoveredMolecules: string[]
  /** 오늘의 학습 기록 (날짜가 바뀌면 초기화) */
  dailyLog: DailyLog
}
