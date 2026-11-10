import type { PuzzleRange, SaveData } from '../types/save'

/** localStorage 키 — 이 상수 외의 키를 사용하지 않는다 (CLAUDE.md §2) */
export const SAVE_KEY = 'element_lab_save_v2'
/** 이전 버전 키 (마이그레이션 후 삭제) */
const LEGACY_KEY_V1 = 'element_lab_save_v1'

export const ELEMENT_COUNT = 118

export function createDefaultSave(): SaveData {
  return { version: 2, reviewElements: [], puzzleRange: { from: 1, to: 20 } }
}

const isAtomicNumber = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v) && v >= 1 && v <= ELEMENT_COUNT

export function clampRange(range: PuzzleRange): PuzzleRange {
  const a = Math.min(ELEMENT_COUNT, Math.max(1, Math.round(range.from)))
  const b = Math.min(ELEMENT_COUNT, Math.max(1, Math.round(range.to)))
  return { from: Math.min(a, b), to: Math.max(a, b) }
}

/** 저장 데이터를 기본값과 병합한다 (필드 누락·잘못된 값에도 앱이 깨지지 않게) */
export function normalizeSave(raw: unknown): SaveData {
  const base = createDefaultSave()
  if (typeof raw !== 'object' || raw === null) return base
  const r = raw as Partial<Record<keyof SaveData, unknown>>
  const review = Array.isArray(r.reviewElements) ? [...new Set(r.reviewElements.filter(isAtomicNumber))] : []
  let range = base.puzzleRange
  if (typeof r.puzzleRange === 'object' && r.puzzleRange !== null) {
    const p = r.puzzleRange as Partial<PuzzleRange>
    if (typeof p.from === 'number' && typeof p.to === 'number') range = clampRange({ from: p.from, to: p.to })
  }
  return { version: 2, reviewElements: review, puzzleRange: range }
}

/** v1(학습 앱 시절) → v2: 퀴즈에서 틀린 적 있는 원소를 오답 플래시로 옮긴다 */
export function migrateV1(raw: unknown): SaveData {
  const save = createDefaultSave()
  if (typeof raw !== 'object' || raw === null) return save
  const progress = (raw as { elementProgress?: unknown }).elementProgress
  if (typeof progress === 'object' && progress !== null) {
    for (const [k, v] of Object.entries(progress as Record<string, unknown>)) {
      const wrong = typeof v === 'object' && v !== null ? (v as { wrongCount?: unknown }).wrongCount : 0
      const z = Number(k)
      if (isAtomicNumber(z) && typeof wrong === 'number' && wrong > 0) save.reviewElements.push(z)
    }
  }
  save.reviewElements.sort((a, b) => a - b)
  return save
}

export function loadSave(): SaveData {
  try {
    const json = localStorage.getItem(SAVE_KEY)
    if (json) return normalizeSave(JSON.parse(json))
    const legacy = localStorage.getItem(LEGACY_KEY_V1)
    if (legacy) {
      const migrated = migrateV1(JSON.parse(legacy))
      localStorage.setItem(SAVE_KEY, JSON.stringify(migrated))
      localStorage.removeItem(LEGACY_KEY_V1)
      return migrated
    }
  } catch {
    // 파싱 실패·접근 불가: 기본값으로 시작
  }
  return createDefaultSave()
}

export function writeSave(data: SaveData): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    // 저장 공간 부족·프라이빗 모드 등: 메모리 상태로 계속한다
  }
}
