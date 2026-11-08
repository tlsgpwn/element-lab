import type { ElementProgress, SaveData } from '../types/save'
import { todayKey } from './format'

/** localStorage 키 — 이 상수 외의 키를 사용하지 않는다 (CLAUDE.md §2) */
export const SAVE_KEY = 'element_lab_save_v1'

export const DAILY_GOAL_OPTIONS = [3, 5, 10] as const

export function createDefaultSave(): SaveData {
  return {
    version: 1,
    unlockedElements: [],
    dailyGoal: 5,
    elementProgress: {},
    discoveredMolecules: [],
    dailyLog: { date: todayKey(), learned: [] },
  }
}

export function defaultProgress(): ElementProgress {
  return { weight: 1, wrongCount: 0, reviewCount: 0, lastReviewedAt: null }
}

const isNumberArray = (v: unknown): v is number[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'number')

const isStringArray = (v: unknown): v is string[] =>
  Array.isArray(v) && v.every((x) => typeof x === 'string')

/** 저장 데이터를 기본값과 병합하고, 날짜가 바뀌었으면 dailyLog를 초기화한다 */
export function normalizeSave(raw: unknown): SaveData {
  const base = createDefaultSave()
  if (typeof raw !== 'object' || raw === null) return base
  const r = raw as Partial<Record<keyof SaveData, unknown>>

  const progress: Record<number, ElementProgress> = {}
  if (typeof r.elementProgress === 'object' && r.elementProgress !== null) {
    for (const [k, v] of Object.entries(r.elementProgress as Record<string, unknown>)) {
      if (typeof v !== 'object' || v === null) continue
      const p = v as Partial<ElementProgress>
      progress[Number(k)] = {
        weight: typeof p.weight === 'number' ? p.weight : 1,
        wrongCount: typeof p.wrongCount === 'number' ? p.wrongCount : 0,
        reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
        lastReviewedAt: typeof p.lastReviewedAt === 'number' ? p.lastReviewedAt : null,
      }
    }
  }

  let dailyLog = base.dailyLog
  if (typeof r.dailyLog === 'object' && r.dailyLog !== null) {
    const log = r.dailyLog as { date?: unknown; learned?: unknown }
    if (log.date === todayKey() && isNumberArray(log.learned)) {
      dailyLog = { date: log.date, learned: log.learned }
    }
  }

  return {
    version: 1,
    unlockedElements: isNumberArray(r.unlockedElements) ? [...new Set(r.unlockedElements)] : [],
    dailyGoal: typeof r.dailyGoal === 'number' && r.dailyGoal > 0 ? r.dailyGoal : base.dailyGoal,
    elementProgress: progress,
    discoveredMolecules: isStringArray(r.discoveredMolecules) ? r.discoveredMolecules : [],
    dailyLog,
  }
}

export function loadSave(): SaveData {
  try {
    const json = localStorage.getItem(SAVE_KEY)
    return normalizeSave(json ? JSON.parse(json) : null)
  } catch {
    return createDefaultSave()
  }
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // 저장 공간 부족·프라이빗 모드 등: 앱 동작은 메모리 상태로 계속한다
  }
}
