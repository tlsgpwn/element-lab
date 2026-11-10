import type { BlockClass, MetalClass } from '../lib/classify'

/**
 * 분류 보기 색 (CLAUDE.md §4) — dataviz 기준 팔레트.
 * 범주 색은 1~3번 슬롯 고정 순서(파랑·주황·청록): 모든 쌍 CVD ΔE ≥ 9.2 검증 통과.
 * 청록은 흰 배경 대비 3:1 미만이므로 범례에 글자 라벨·개수를 항상 함께 표시한다.
 */
export const SLOT = {
  blue: '#2a78d6',
  orange: '#eb6834',
  aqua: '#1baf7a',
} as const

export interface ClassStyle {
  label: string
  color: string
  /** 칸 배경용 옅은 색 */
  tint: string
}

export const BLOCK_STYLE: Record<BlockClass, ClassStyle> = {
  main: { label: '전형 원소', color: SLOT.blue, tint: '#e3eefb' },
  transition: { label: '전이 원소', color: SLOT.orange, tint: '#fde9e0' },
}

export const METAL_STYLE: Record<MetalClass, ClassStyle> = {
  metal: { label: '금속', color: SLOT.blue, tint: '#e3eefb' },
  nonmetal: { label: '비금속', color: SLOT.orange, tint: '#fde9e0' },
  metalloid: { label: '준금속', color: SLOT.aqua, tint: '#ddf4eb' },
}

/** 전기음성도 순차 색 (파랑 100 → 700 단계) */
export const EN_RAMP = [
  '#cde2fb', '#b7d3f6', '#9ec5f4', '#86b6ef', '#6da7ec', '#5598e7', '#3987e5',
  '#2a78d6', '#256abf', '#1c5cab', '#184f95', '#104281', '#0d366b',
] as const

/** 이 단계부터는 흰 글자 (진한 배경) */
export const EN_DARK_FROM = 7

/** 값이 없는 칸 */
export const NO_DATA = { fill: '#f0efec', text: '#8a8983' } as const
