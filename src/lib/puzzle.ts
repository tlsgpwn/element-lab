import type { ChemicalElement } from '../types/chemistry'
import { CATEGORY_THEME } from '../theme/categoryColors'
import { PHASE_LABEL } from './phase'

/* ------------------------------ 점수 ------------------------------ */

export const BASE_SCORE = 100
export const COMBO_BONUS = 25
export const MAX_COMBO_BONUS = 250

/** combo: 이번 정답을 포함한 연속 정답 수 (1부터) */
export function scoreFor(combo: number): number {
  return BASE_SCORE + Math.min(MAX_COMBO_BONUS, Math.max(0, combo - 1) * COMBO_BONUS)
}

export function formatDuration(ms: number): string {
  const total = Math.floor(ms / 1000)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

/* ------------------------------ 힌트 ------------------------------ */

const MAIN_GROUPS = new Set([1, 2, 13, 14, 15, 16, 17, 18])

export function positionLabel(el: Pick<ChemicalElement, 'period' | 'group' | 'category'>): string {
  if (el.group === null) return `${el.period}주기 ${CATEGORY_THEME[el.category].label}(f-블록)`
  return `${el.period}주기 ${el.group}족`
}

/**
 * 오답 횟수에 따라 점점 구체적인 힌트를 준다.
 * 1회: 분류 → 2회: 원자가 전자/상태 → 3회: 주기 → 4회 이상: 정확한 위치
 */
export function progressiveHint(target: ChemicalElement, attempt: number): string {
  const cat = CATEGORY_THEME[target.category].label
  if (attempt <= 1) return `이 원소는 ${cat}입니다.`
  if (attempt === 2) {
    if (target.group !== null && MAIN_GROUPS.has(target.group) && target.valenceElectrons > 0) {
      return `원자가 전자가 ${target.valenceElectrons}개입니다.`
    }
    return `상온에서 ${PHASE_LABEL[target.phaseAtSTP]} 상태이고, 원자 번호는 ${target.atomicNumber}번입니다.`
  }
  if (attempt === 3) return `${target.period}주기 원소입니다.`
  return `정답 위치: ${positionLabel(target)}`
}

/** 놓은 칸과 정답 칸을 비교한 방향 힌트 */
export function directionHint(target: ChemicalElement, dropped: ChemicalElement): string | null {
  if (target.isFBlock !== dropped.isFBlock) {
    return target.isFBlock ? '아래쪽 f-블록(란타넘족/악티늄족) 줄을 보세요.' : '본 표(1~18족) 안에 있는 원소예요.'
  }
  const parts: string[] = []
  if (target.period !== dropped.period) parts.push(target.period > dropped.period ? '더 아래 주기' : '더 위 주기')
  if (target.gridCol !== dropped.gridCol) parts.push(target.gridCol > dropped.gridCol ? '더 오른쪽' : '더 왼쪽')
  return parts.length ? `${parts.join(', ')}에 있어요.` : null
}

/* ------------------------------ 타이핑 판정 ------------------------------ */

/** 영문명 이표기 허용 */
const EN_ALIASES: Record<number, string[]> = {
  13: ['aluminum'],
  16: ['sulphur'],
  55: ['cesium'],
}

/** 한국어 옛 이름/이표기 허용 */
const KO_ALIASES: Record<number, string[]> = {
  9: ['불소'],
  11: ['소듐'],
  19: ['포타슘'],
  22: ['티타늄', '티탄'],
  24: ['크롬'],
  25: ['망간'],
  32: ['게르마늄'],
  35: ['브롬'],
  42: ['몰리브덴'],
  51: ['안티몬'],
  53: ['요오드'],
  54: ['크세논'],
  73: ['탄탈'],
}

const norm = (s: string) => s.trim().replace(/\s+/g, '').toLowerCase()

/** 기호(대소문자 무시) 또는 한국어/영어 이름이 맞으면 정답 */
export function isCorrectAnswer(input: string, el: ChemicalElement): boolean {
  const a = norm(input)
  if (!a) return false
  const accepted = [el.symbol, el.nameKo, el.nameEn, ...(EN_ALIASES[el.atomicNumber] ?? []), ...(KO_ALIASES[el.atomicNumber] ?? [])]
  return accepted.some((x) => norm(x) === a)
}

/**
 * 타이핑 모드 힌트 (칸 위치는 이미 보이므로 위치 대신 다른 단서를 준다)
 * 1회: 분류 → 2회: 원자가 전자/상태 → 3회: 원자 번호 → 4회 이상: 기호 첫 글자 + 글자 수
 */
export function typingHint(target: ChemicalElement, attempt: number): string {
  if (attempt <= 2) return progressiveHint(target, attempt)
  if (attempt === 3) return `원자 번호는 ${target.atomicNumber}번입니다.`
  return `원소 기호는 "${target.symbol[0]}"로 시작하는 ${target.symbol.length}글자, 이름은 ${target.nameKo.length}글자예요.`
}
