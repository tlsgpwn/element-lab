import type { ChemicalElement } from '../types/chemistry'

/** 전형 원소(1·2·13~18족) / 전이 원소(3~12족 + 란타넘족·악티늄족) */
export type BlockClass = 'main' | 'transition'
export type MetalClass = 'metal' | 'nonmetal' | 'metalloid'

export function blockClassOf(el: ChemicalElement): BlockClass {
  if (el.isFBlock || el.group === null) return 'transition'
  return el.group >= 3 && el.group <= 12 ? 'transition' : 'main'
}

export function metalClassOf(el: ChemicalElement): MetalClass {
  if (el.category === 'metalloid') return 'metalloid'
  if (el.category === 'reactive-nonmetal' || el.category === 'halogen' || el.category === 'noble-gas') return 'nonmetal'
  return 'metal'
}

/** 전기음성도 색 단계 범위 (폴링 척도 최소 Fr 0.7 ~ 최대 F 3.98) */
export const EN_MIN = 0.7
export const EN_MAX = 3.98

/** 전기음성도 → 0 ~ steps-1 단계 (값이 없으면 null) */
export function enStep(en: number | null, steps: number): number | null {
  if (en === null) return null
  const t = (en - EN_MIN) / (EN_MAX - EN_MIN)
  return Math.min(steps - 1, Math.max(0, Math.round(t * (steps - 1))))
}
