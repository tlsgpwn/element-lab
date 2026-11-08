import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { SaveContext, type SaveContextValue } from '../hooks/saveContext'
import { createDefaultSave, defaultProgress, loadSave, writeSave } from '../lib/storage'
import { applyReview, type Difficulty } from '../lib/spacedRepetition'
import { todayKey } from '../lib/format'
import type { SaveData } from '../types/save'

/** 날짜가 바뀌었으면 오늘의 학습 기록을 새로 시작한다 */
function withFreshLog(s: SaveData): SaveData {
  const today = todayKey()
  return s.dailyLog.date === today ? s : { ...s, dailyLog: { date: today, learned: [] } }
}

export function SaveProvider({ children }: { children: ReactNode }) {
  const [save, setSave] = useState<SaveData>(loadSave)

  useEffect(() => {
    writeSave(save)
  }, [save])

  const completeLearning = useCallback((z: number) => {
    setSave((prev) => {
      const s = withFreshLog(prev)
      return {
        ...s,
        unlockedElements: s.unlockedElements.includes(z) ? s.unlockedElements : [...s.unlockedElements, z],
        elementProgress: s.elementProgress[z] ? s.elementProgress : { ...s.elementProgress, [z]: defaultProgress() },
        dailyLog: s.dailyLog.learned.includes(z)
          ? s.dailyLog
          : { ...s.dailyLog, learned: [...s.dailyLog.learned, z] },
      }
    })
  }, [])

  const setDailyGoal = useCallback((goal: number) => {
    setSave((prev) => ({ ...prev, dailyGoal: Math.max(1, Math.round(goal)) }))
  }, [])

  const recordReview = useCallback((z: number, difficulty: Difficulty, wasCorrect: boolean) => {
    setSave((prev) => ({
      ...prev,
      elementProgress: {
        ...prev.elementProgress,
        [z]: applyReview(prev.elementProgress[z] ?? defaultProgress(), difficulty, wasCorrect),
      },
    }))
  }, [])

  const discoverMolecules = useCallback((ids: string[]) => {
    setSave((prev) => {
      const fresh = ids.filter((id) => !prev.discoveredMolecules.includes(id))
      return fresh.length ? { ...prev, discoveredMolecules: [...prev.discoveredMolecules, ...fresh] } : prev
    })
  }, [])

  const resetAll = useCallback(() => setSave(createDefaultSave()), [])

  const value = useMemo<SaveContextValue>(() => {
    const learnedTodayCount = save.dailyLog.date === todayKey() ? save.dailyLog.learned.length : 0
    return { save, learnedTodayCount, completeLearning, setDailyGoal, recordReview, discoverMolecules, resetAll }
  }, [save, completeLearning, setDailyGoal, recordReview, discoverMolecules, resetAll])

  return <SaveContext.Provider value={value}>{children}</SaveContext.Provider>
}
