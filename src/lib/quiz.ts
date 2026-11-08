import type { ChemicalElement, ElementCategory, Phase } from '../types/chemistry'
import { shuffle } from './spacedRepetition'

const ALL_CATEGORIES: ElementCategory[] = [
  'alkali-metal', 'alkaline-earth', 'transition-metal', 'post-transition', 'metalloid',
  'reactive-nonmetal', 'halogen', 'noble-gas', 'lanthanide', 'actinide',
]

/* ---------------------- 유형 A: 힌트 → 원소 맞히기 ---------------------- */

export interface QuizA {
  kind: 'A'
  target: ChemicalElement
  /** 이름이 가려진 trivia 힌트 */
  maskedTrivia: string
  /** 4지선다 보기 (원소) */
  options: ChemicalElement[]
}

/** trivia 문장에서 원소 이름/기호 노출을 가린다 */
export function maskTrivia(text: string, el: ChemicalElement): string {
  let out = text.split(el.nameKo).join('○○')
  out = out.replace(new RegExp(el.nameEn, 'gi'), '○○')
  // 기호는 다른 단어 일부일 수 있으므로 영문자 경계가 있을 때만 가린다
  out = out.replace(new RegExp(`(?<![A-Za-z])${el.symbol}(?![a-z])`, 'g'), '○')
  return out
}

/** 같은 카테고리·인접 번호를 우선으로 헷갈리는 오답 보기를 고른다 */
function pickDistractors(target: ChemicalElement, pool: ChemicalElement[], count: number, random: () => number) {
  const others = pool.filter((e) => e.atomicNumber !== target.atomicNumber)
  const similar = shuffle(
    others.filter(
      (e) => e.category === target.category || Math.abs(e.atomicNumber - target.atomicNumber) <= 2,
    ),
    random,
  )
  const rest = shuffle(others.filter((e) => !similar.includes(e)), random)
  return [...similar.slice(0, 2), ...rest].slice(0, count)
}

export function buildQuizA(
  target: ChemicalElement,
  pool: ChemicalElement[],
  random: () => number = Math.random,
): QuizA {
  const trivia = target.trivia[Math.floor(random() * target.trivia.length)] ?? ''
  return {
    kind: 'A',
    target,
    maskedTrivia: maskTrivia(trivia, target),
    options: shuffle([target, ...pickDistractors(target, pool, 3, random)], random),
  }
}

/* ---------------------- 유형 B: 원소 → 성질 맞히기 ---------------------- */

export interface QuizB {
  kind: 'B'
  target: ChemicalElement
  /** null = f-블록(란타넘족/악티늄족) */
  groupOptions: (number | null)[]
  categoryOptions: ElementCategory[]
}

export interface QuizBAnswer {
  period: number | null
  group: number | null | undefined // undefined = 미응답, null = f-블록 선택
  phase: Phase | null
  category: ElementCategory | null
}

export function buildQuizB(target: ChemicalElement, random: () => number = Math.random): QuizB {
  const groupCandidates: (number | null)[] = Array.from({ length: 18 }, (_, i) => i + 1)
  if (target.group !== null) groupCandidates.push(null)
  const wrongGroups = shuffle(
    groupCandidates.filter((g) => g !== target.group),
    random,
  ).slice(0, 3)
  const wrongCats = shuffle(
    ALL_CATEGORIES.filter((c) => c !== target.category),
    random,
  ).slice(0, 3)
  return {
    kind: 'B',
    target,
    groupOptions: shuffle([target.group, ...wrongGroups], random),
    categoryOptions: shuffle([target.category, ...wrongCats], random),
  }
}

export function gradeQuizB(q: QuizB, a: QuizBAnswer) {
  const result = {
    period: a.period === q.target.period,
    group: a.group === q.target.group,
    phase: a.phase === q.target.phaseAtSTP,
    category: a.category === q.target.category,
  }
  return { ...result, allCorrect: Object.values(result).every(Boolean) }
}

export function isQuizBComplete(a: QuizBAnswer): boolean {
  return a.period !== null && a.group !== undefined && a.phase !== null && a.category !== null
}

export function groupLabel(group: number | null): string {
  return group === null ? 'f-블록' : `${group}족`
}
