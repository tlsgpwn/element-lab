import type { ElementProgress } from '../types/save'

export type Difficulty = 'easy' | 'normal' | 'hard'

export const MIN_WEIGHT = 0.3
export const MAX_WEIGHT = 12

const clamp = (v: number) => Math.min(MAX_WEIGHT, Math.max(MIN_WEIGHT, v))

/**
 * 자가 평가 + 정답 여부로 출제 가중치를 갱신한다.
 * - 쉬움: 가중치 ×0.5 (덜 자주 출제)
 * - 보통: 가중치를 1을 향해 서서히 회귀
 * - 어려움: 가중치 ×2 + 1 (훨씬 자주 출제)
 * - 오답이면 평가와 무관하게 틀린 횟수 +1, 가중치 추가 +1
 */
export function applyReview(
  prev: ElementProgress,
  difficulty: Difficulty,
  wasCorrect: boolean,
  now = Date.now(),
): ElementProgress {
  let weight: number
  switch (difficulty) {
    case 'easy':
      weight = prev.weight * 0.5
      break
    case 'normal':
      weight = prev.weight + (1 - prev.weight) * 0.3
      break
    case 'hard':
      weight = prev.weight * 2 + 1
      break
  }
  if (!wasCorrect) weight += 1
  return {
    weight: Math.round(clamp(weight) * 100) / 100,
    wrongCount: prev.wrongCount + (wasCorrect ? 0 : 1),
    reviewCount: prev.reviewCount + 1,
    lastReviewedAt: now,
  }
}

/**
 * 가중치 비례 무작위 추출(룰렛 선택).
 * 직전에 낸 문제(excludeId)는 후보가 2개 이상일 때 제외한다.
 */
export function pickWeighted<T>(
  items: T[],
  getWeight: (item: T) => number,
  getId: (item: T) => number,
  excludeId: number | null,
  random: () => number = Math.random,
): T | null {
  const pool = items.length > 1 && excludeId !== null ? items.filter((i) => getId(i) !== excludeId) : items
  if (pool.length === 0) return null
  const total = pool.reduce((sum, i) => sum + Math.max(getWeight(i), MIN_WEIGHT), 0)
  let r = random() * total
  for (const item of pool) {
    r -= Math.max(getWeight(item), MIN_WEIGHT)
    if (r <= 0) return item
  }
  return pool[pool.length - 1]
}

export function shuffle<T>(arr: T[], random: () => number = Math.random): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
