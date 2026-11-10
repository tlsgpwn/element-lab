import type { ChemicalElement } from '../types/chemistry'

/**
 * 원소 이름·기호 정답 판정 (퍼즐 타이핑·퀴즈 공용, CLAUDE.md §5-1).
 * 이름은 공백·대소문자를 무시하고, 교과서·일상에서 쓰는 이표기도 정답으로 받는다.
 */

/** 영문명 이표기 */
const EN_ALIASES: Record<number, string[]> = {
  13: ['aluminum'],
  16: ['sulphur'],
  55: ['cesium'],
}

/** 한국어 옛 이름·이표기 */
const KO_ALIASES: Record<number, string[]> = {
  9: ['불소', '플루오르'],
  11: ['소듐'],
  19: ['포타슘'],
  22: ['티타늄', '티탄'],
  24: ['크롬'],
  25: ['망간'],
  32: ['게르마늄'],
  35: ['브롬'],
  41: ['니오브'],
  42: ['몰리브덴'],
  51: ['안티몬'],
  52: ['텔루르'],
  53: ['요오드'],
  54: ['크세논'],
  57: ['란탄'],
  73: ['탄탈'],
  83: ['비스머스'],
}

export const normalizeAnswer = (s: string) => s.trim().replace(/\s+/g, '').toLowerCase()

/** 한글·영문 이름(이표기 포함)과 일치하는지 */
export function matchesName(input: string, el: ChemicalElement): boolean {
  const a = normalizeAnswer(input)
  if (!a) return false
  const accepted = [el.nameKo, el.nameEn, ...(EN_ALIASES[el.atomicNumber] ?? []), ...(KO_ALIASES[el.atomicNumber] ?? [])]
  return accepted.some((x) => normalizeAnswer(x) === a)
}

/**
 * 원소 기호와 일치하는지. 대소문자가 달라도 match는 true이고,
 * 정확한 표기(Fe처럼 첫 글자만 대문자)인지는 exact로 알려 준다.
 */
export function matchesSymbol(input: string, el: ChemicalElement): { match: boolean; exact: boolean } {
  const t = input.trim()
  if (!t) return { match: false, exact: false }
  return { match: t.toLowerCase() === el.symbol.toLowerCase(), exact: t === el.symbol }
}
