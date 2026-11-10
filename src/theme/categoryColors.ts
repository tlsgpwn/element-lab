import type { ElementCategory } from '../types/chemistry'

export interface CategoryTheme {
  label: string
  /** 대표 색 (HEX) */
  hex: string
  /** 카드 테두리 */
  border: string
  /** 카드 배경 */
  bg: string
  /** 강조 텍스트 */
  text: string
  /** 작은 배지 */
  badge: string
}

/**
 * 카테고리 → 테마 색상 단일 정의 지점 (CLAUDE.md §4). 라이트 모드용.
 * Tailwind가 클래스를 감지할 수 있도록 완전한 클래스 문자열로 작성한다.
 */
export const CATEGORY_THEME: Record<ElementCategory, CategoryTheme> = {
  'alkali-metal': { label: '알칼리 금속', hex: '#dc2626', border: 'border-red-300', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-800' },
  'alkaline-earth': { label: '알칼리 토금속', hex: '#ea580c', border: 'border-orange-300', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800' },
  'transition-metal': { label: '전이 금속', hex: '#ca8a04', border: 'border-yellow-300', bg: 'bg-yellow-50', text: 'text-yellow-800', badge: 'bg-yellow-100 text-yellow-900' },
  'post-transition': { label: '전이후 금속', hex: '#64748b', border: 'border-slate-300', bg: 'bg-slate-50', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-800' },
  metalloid: { label: '준금속', hex: '#0d9488', border: 'border-teal-300', bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-800' },
  'reactive-nonmetal': { label: '반응성 비금속', hex: '#16a34a', border: 'border-green-300', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-800' },
  halogen: { label: '할로젠', hex: '#0891b2', border: 'border-cyan-300', bg: 'bg-cyan-50', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-800' },
  'noble-gas': { label: '비활성 기체', hex: '#7c3aed', border: 'border-violet-300', bg: 'bg-violet-50', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-800' },
  lanthanide: { label: '란타넘족', hex: '#db2777', border: 'border-pink-300', bg: 'bg-pink-50', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800' },
  actinide: { label: '악티늄족', hex: '#c026d3', border: 'border-fuchsia-300', bg: 'bg-fuchsia-50', text: 'text-fuchsia-700', badge: 'bg-fuchsia-100 text-fuchsia-800' },
}

export const CATEGORY_KEYS = Object.keys(CATEGORY_THEME) as ElementCategory[]
