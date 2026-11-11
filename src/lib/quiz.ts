import type { ChemicalElement } from '../types/chemistry'
import { matchesName, matchesSymbol } from './answers'
import { shuffle } from './random'

/** 퀴즈 유형 (CLAUDE.md §5-1) */
export type QuizKind =
  | 'number-to-name'
  | 'element-to-number'
  | 'name-to-symbol'
  | 'symbol-to-name'
  | 'position-to-name'
  | 'name-to-position'

export interface QuizKindInfo {
  id: QuizKind
  label: string
  /** 예시: "26 → 철" */
  example: string
  /** 입력칸 안내 */
  placeholder: string
  /** 숫자 입력인지 */
  numeric: boolean
  /** 좌표(주기, 족) 유형: 족이 없는 f-블록 원소는 출제하지 않는다 */
  needsGroup?: boolean
}

export const QUIZ_KINDS: QuizKindInfo[] = [
  { id: 'number-to-name', label: '번호 → 이름', example: '26 → 철', placeholder: '원소 이름 (예: 철)', numeric: false },
  { id: 'element-to-number', label: '기호·이름 → 번호', example: 'Fe 철 → 26', placeholder: '원자 번호 (예: 26)', numeric: true },
  { id: 'name-to-symbol', label: '이름 → 기호', example: '철 → Fe', placeholder: '원소 기호 (예: Fe)', numeric: false },
  { id: 'symbol-to-name', label: '기호 → 이름', example: 'Fe → 철', placeholder: '원소 이름 (예: 철)', numeric: false },
  { id: 'position-to-name', label: '좌표 → 원소', example: '(4, 8) → 철', placeholder: '원소 이름 또는 기호 (예: 철)', numeric: false, needsGroup: true },
  { id: 'name-to-position', label: '원소 → 좌표', example: '철 → 4, 8', placeholder: '주기, 족 (예: 4, 8)', numeric: false, needsGroup: true },
]

export const QUIZ_KIND_BY_ID: ReadonlyMap<QuizKind, QuizKindInfo> = new Map(QUIZ_KINDS.map((k) => [k.id, k]))

/** 문제 수 선택지 (null = 범위 전체) */
export const QUESTION_COUNTS = [10, 20, null] as const

/** 이 유형으로 출제할 수 있는 원소만 남긴다 (좌표 유형은 족이 있는 원소만) */
export function eligiblePool(kind: QuizKind, pool: ChemicalElement[]): ChemicalElement[] {
  return QUIZ_KIND_BY_ID.get(kind)?.needsGroup ? pool.filter((e) => e.group !== null) : pool
}

/** "(주기, 족)" 표기 */
export function positionText(el: Pick<ChemicalElement, 'period' | 'group'>): string {
  return `(${el.period}, ${el.group ?? '—'})`
}

/**
 * 좌표 답 해석: "4,8" · "(4, 8)" · "4 8" · "4주기 8족" · "8족 4주기" → { period, group }.
 * '주기'·'족' 글자가 있으면 그것을 따르고, 숫자만 있으면 (주기, 족) 순서로 본다.
 */
export function parsePosition(input: string): { period: number; group: number } | null {
  const t = input.trim()
  const p = /(\d+)\s*주기/.exec(t)
  const g = /(\d+)\s*족/.exec(t)
  if (p && g) return { period: Number(p[1]), group: Number(g[1]) }
  const nums = t.match(/\d+/g)
  if (!nums || nums.length !== 2) return null
  return { period: Number(nums[0]), group: Number(nums[1]) }
}

/** 범위 안 원소를 중복 없이 무작위로 count개 뽑는다 */
export function buildQuestions(pool: ChemicalElement[], count: number | null, random: () => number = Math.random): ChemicalElement[] {
  const shuffled = shuffle(pool, random)
  return count === null ? shuffled : shuffled.slice(0, Math.min(count, shuffled.length))
}

export interface Grade {
  correct: boolean
  /** 정답이어도 덧붙일 안내 (예: 기호 대소문자) / 오답일 때 실수 유형 안내 */
  note?: string
}

/** 입력이 이 유형의 정답인지 채점한다 */
export function gradeAnswer(kind: QuizKind, input: string, el: ChemicalElement): Grade {
  const text = input.trim()
  switch (kind) {
    case 'number-to-name':
    case 'symbol-to-name': {
      if (matchesName(text, el)) return { correct: true }
      if (matchesSymbol(text, el).match) return { correct: false, note: '기호가 아니라 이름을 적어 주세요.' }
      return { correct: false }
    }
    case 'name-to-symbol': {
      const { match, exact } = matchesSymbol(text, el)
      if (match) return exact ? { correct: true } : { correct: true, note: `기호는 첫 글자만 대문자로 써요: ${el.symbol}` }
      if (matchesName(text, el)) return { correct: false, note: '이름이 아니라 기호를 적어 주세요.' }
      return { correct: false }
    }
    case 'element-to-number': {
      const n = Number(text.replace(/번$/, ''))
      return { correct: Number.isInteger(n) && n === el.atomicNumber }
    }
    case 'position-to-name': {
      // 무슨 원소인지 맞히는 문제라 이름·기호 모두 정답
      if (matchesName(text, el)) return { correct: true }
      const { match, exact } = matchesSymbol(text, el)
      if (match) return exact ? { correct: true } : { correct: true, note: `기호는 첫 글자만 대문자로 써요: ${el.symbol}` }
      return { correct: false }
    }
    case 'name-to-position': {
      const pos = parsePosition(text)
      if (!pos) return { correct: false, note: '주기, 족 순서로 숫자 두 개를 적어 주세요 (예: 4, 8).' }
      if (pos.period === el.period && pos.group === el.group) return { correct: true }
      if (pos.period === el.group && pos.group === el.period) {
        return { correct: false, note: `순서가 바뀌었어요. (주기, 족) 순서로 적어요: ${el.period}, ${el.group}` }
      }
      return { correct: false }
    }
  }
}

/** 한 문제의 답안 기록 */
export interface QuizAnswer {
  atomicNumber: number
  /** 사용자가 적은 답 ('' = 모르겠어요) */
  input: string
  correct: boolean
  note?: string
}

/** 이 유형에서 보여 줄 정답 문자열 */
export function answerText(kind: QuizKind, el: ChemicalElement): string {
  switch (kind) {
    case 'number-to-name':
    case 'symbol-to-name':
      return el.nameKo
    case 'name-to-symbol':
      return el.symbol
    case 'element-to-number':
      return String(el.atomicNumber)
    case 'position-to-name':
      return `${el.nameKo} (${el.symbol})`
    case 'name-to-position':
      return positionText(el)
  }
}
