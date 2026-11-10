export interface PuzzleRange {
  /** 시작 원자 번호 (1~118) */
  from: number
  /** 끝 원자 번호 (1~118, from 이상) */
  to: number
}

export interface SaveData {
  version: 2
  /** 플래시카드 '오답 플래시'(나중에 다시 볼 원소) 원자 번호 */
  reviewElements: number[]
  /** 마지막으로 고른 퍼즐 범위 */
  puzzleRange: PuzzleRange
}
