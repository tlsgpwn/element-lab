import { ELEMENT_BY_Z } from '../data/elements'
import type { PuzzleRange } from '../types/save'
import { ELEMENT_COUNT } from './storage'

/** 범위 빠른 선택 (퍼즐·퀴즈 공용) */
export const RANGE_PRESETS: { label: string; sub: string; range: PuzzleRange }[] = [
  { label: '1~20', sub: '기초', range: { from: 1, to: 20 } },
  { label: '1~36', sub: '4주기까지', range: { from: 1, to: 36 } },
  { label: '1~54', sub: '5주기까지', range: { from: 1, to: 54 } },
  { label: '21~30', sub: '첫째 전이 금속', range: { from: 21, to: 30 } },
  { label: '57~71', sub: '란타넘족', range: { from: 57, to: 71 } },
  { label: '1~118', sub: '전체', range: { from: 1, to: ELEMENT_COUNT } },
]

/** 입력칸 문자열 → 범위 (잘못되면 null) */
export function parseRange(fromText: string, toText: string): PuzzleRange | null {
  if (fromText.trim() === '' || toText.trim() === '') return null
  const from = Number(fromText)
  const to = Number(toText)
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1 || to > ELEMENT_COUNT || from > to) return null
  return { from, to }
}

/** "26. 철(Fe)" */
export function elementLabel(z: number): string {
  const el = ELEMENT_BY_Z.get(z)
  return el ? `${z}. ${el.nameKo}(${el.symbol})` : String(z)
}

export function rangeLabel(r: PuzzleRange): string {
  return `${elementLabel(r.from)} ~ ${elementLabel(r.to)} · ${r.to - r.from + 1}개`
}
