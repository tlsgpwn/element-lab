import { useCallback, useEffect, useRef, useState } from 'react'
import { scoreFor } from '../lib/puzzle'

export interface GameStats {
  score: number
  combo: number
  maxCombo: number
  correct: number
  wrong: number
  /** 경과 시간 (ms) */
  elapsed: number
  started: boolean
  finished: boolean
}

/**
 * 퍼즐 게임 세션: 점수 · 콤보 · 정답률 · 스톱워치.
 * 첫 시도(정답/오답) 때 타이머가 시작되고 finish() 시 멈춘다.
 */
export function useGameSession() {
  const [startAt, setStartAt] = useState<number | null>(null)
  const [endAt, setEndAt] = useState<number | null>(null)
  const [now, setNow] = useState(() => Date.now())
  const [s, setS] = useState({ score: 0, combo: 0, maxCombo: 0, correct: 0, wrong: 0 })
  /** 이벤트 핸들러에서 즉시 최신 콤보를 알기 위한 ref */
  const comboRef = useRef(0)

  const running = startAt !== null && endAt === null
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setNow(Date.now()), 250)
    return () => clearInterval(id)
  }, [running])

  const ensureStarted = useCallback(() => {
    setStartAt((v) => v ?? Date.now())
  }, [])

  /** 정답 처리 후 이번에 얻은 점수와 콤보를 돌려준다 */
  const hit = useCallback((): { gained: number; combo: number } => {
    ensureStarted()
    const combo = comboRef.current + 1
    comboRef.current = combo
    const gained = scoreFor(combo)
    setS((p) => ({
      ...p,
      score: p.score + gained,
      combo,
      maxCombo: Math.max(p.maxCombo, combo),
      correct: p.correct + 1,
    }))
    return { gained, combo }
  }, [ensureStarted])

  const miss = useCallback(() => {
    ensureStarted()
    comboRef.current = 0
    setS((p) => ({ ...p, combo: 0, wrong: p.wrong + 1 }))
  }, [ensureStarted])

  const finish = useCallback(() => {
    setEndAt((v) => v ?? Date.now())
  }, [])

  const elapsed = startAt === null ? 0 : (endAt ?? now) - startAt

  const stats: GameStats = { ...s, elapsed: Math.max(0, elapsed), started: startAt !== null, finished: endAt !== null }
  return { stats, hit, miss, finish }
}
