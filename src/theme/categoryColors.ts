import type { ElementCategory } from '../types/chemistry'

export interface CategoryTheme {
  label: string
  /** 대표 색 (HEX) — 차트/3D 등 클래스 외 용도 */
  hex: string
  /** 카드 테두리 */
  border: string
  /** 카드 배경 그라데이션 */
  gradient: string
  /** 강조 텍스트 */
  text: string
  /** 작은 배지 */
  badge: string
  /** 호버/선택 시 글로우 */
  glow: string
}

/**
 * 카테고리 → 테마 색상 단일 정의 지점 (CLAUDE.md §4).
 * Tailwind가 클래스를 감지할 수 있도록 반드시 완전한 클래스 문자열로 작성한다.
 */
export const CATEGORY_THEME: Record<ElementCategory, CategoryTheme> = {
  'alkali-metal': {
    label: '알칼리 금속',
    hex: '#f87171',
    border: 'border-red-400/60',
    gradient: 'bg-gradient-to-br from-red-500/25 via-red-900/20 to-slate-950/60',
    text: 'text-red-300',
    badge: 'bg-red-500/15 text-red-300 ring-1 ring-red-400/40',
    glow: 'shadow-red-500/30',
  },
  'alkaline-earth': {
    label: '알칼리 토금속',
    hex: '#fb923c',
    border: 'border-orange-400/60',
    gradient: 'bg-gradient-to-br from-orange-500/25 via-orange-900/20 to-slate-950/60',
    text: 'text-orange-300',
    badge: 'bg-orange-500/15 text-orange-300 ring-1 ring-orange-400/40',
    glow: 'shadow-orange-500/30',
  },
  'transition-metal': {
    label: '전이 금속',
    hex: '#facc15',
    border: 'border-yellow-400/60',
    gradient: 'bg-gradient-to-br from-yellow-500/20 via-amber-900/20 to-slate-950/60',
    text: 'text-yellow-300',
    badge: 'bg-yellow-500/15 text-yellow-300 ring-1 ring-yellow-400/40',
    glow: 'shadow-yellow-500/30',
  },
  'post-transition': {
    label: '전이후 금속',
    hex: '#94a3b8',
    border: 'border-slate-400/60',
    gradient: 'bg-gradient-to-br from-slate-400/25 via-slate-800/30 to-slate-950/60',
    text: 'text-slate-300',
    badge: 'bg-slate-400/15 text-slate-300 ring-1 ring-slate-400/40',
    glow: 'shadow-slate-400/30',
  },
  metalloid: {
    label: '준금속',
    hex: '#2dd4bf',
    border: 'border-teal-400/60',
    gradient: 'bg-gradient-to-br from-teal-500/25 via-teal-900/20 to-slate-950/60',
    text: 'text-teal-300',
    badge: 'bg-teal-500/15 text-teal-300 ring-1 ring-teal-400/40',
    glow: 'shadow-teal-500/30',
  },
  'reactive-nonmetal': {
    label: '반응성 비금속',
    hex: '#4ade80',
    border: 'border-green-400/60',
    gradient: 'bg-gradient-to-br from-green-500/25 via-green-900/20 to-slate-950/60',
    text: 'text-green-300',
    badge: 'bg-green-500/15 text-green-300 ring-1 ring-green-400/40',
    glow: 'shadow-green-500/30',
  },
  halogen: {
    label: '할로젠',
    hex: '#22d3ee',
    border: 'border-cyan-400/60',
    gradient: 'bg-gradient-to-br from-cyan-500/25 via-cyan-900/20 to-slate-950/60',
    text: 'text-cyan-300',
    badge: 'bg-cyan-500/15 text-cyan-300 ring-1 ring-cyan-400/40',
    glow: 'shadow-cyan-500/30',
  },
  'noble-gas': {
    label: '비활성 기체',
    hex: '#a78bfa',
    border: 'border-violet-400/60',
    gradient: 'bg-gradient-to-br from-violet-500/25 via-violet-900/20 to-slate-950/60',
    text: 'text-violet-300',
    badge: 'bg-violet-500/15 text-violet-300 ring-1 ring-violet-400/40',
    glow: 'shadow-violet-500/30',
  },
  lanthanide: {
    label: '란타넘족',
    hex: '#f472b6',
    border: 'border-pink-400/60',
    gradient: 'bg-gradient-to-br from-pink-500/25 via-pink-900/20 to-slate-950/60',
    text: 'text-pink-300',
    badge: 'bg-pink-500/15 text-pink-300 ring-1 ring-pink-400/40',
    glow: 'shadow-pink-500/30',
  },
  actinide: {
    label: '악티늄족',
    hex: '#e879f9',
    border: 'border-fuchsia-400/60',
    gradient: 'bg-gradient-to-br from-fuchsia-500/25 via-fuchsia-900/20 to-slate-950/60',
    text: 'text-fuchsia-300',
    badge: 'bg-fuchsia-500/15 text-fuchsia-300 ring-1 ring-fuchsia-400/40',
    glow: 'shadow-fuchsia-500/30',
  },
}

export const CATEGORY_KEYS = Object.keys(CATEGORY_THEME) as ElementCategory[]
