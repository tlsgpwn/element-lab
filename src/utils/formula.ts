/** 화학식 파싱 · 표기 유틸 (순수 함수) */

const SUB: Record<string, string> = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' }
const SUP: Record<string, string> = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' }

/** 상온에서 이원자 분자로 존재하는 원소 */
export const DIATOMIC = new Set(['H', 'N', 'O', 'F', 'Cl', 'Br', 'I'])

/** "Ca(OH)2" → "Ca(OH)₂" (원소 기호/괄호 뒤 숫자를 아래첨자로) */
export function formatFormula(formula: string): string {
  return formula.replace(/([A-Za-z)])(\d+)/g, (_, a: string, n: string) => a + n.split('').map((c) => SUB[c]).join(''))
}

/** 전하 표기: 2 → "²⁺", -3 → "³⁻", 1 → "⁺" */
export function formatCharge(charge: number): string {
  const mag = Math.abs(charge)
  const sign = charge >= 0 ? '+' : '-'
  return (mag === 1 ? '' : String(mag).split('').map((c) => SUP[c]).join('')) + SUP[sign]
}

/** 화학식 → 원소별 원자 수. 괄호 지원 ("(NH4)2S" → {N:2,H:8,S:1}) */
export function parseFormula(formula: string): Record<string, number> {
  let i = 0
  const readNumber = () => {
    const m = /^\d+/.exec(formula.slice(i))
    if (!m) return 1
    i += m[0].length
    return Number(m[0])
  }
  const parseGroup = (): Record<string, number> => {
    const counts: Record<string, number> = {}
    const add = (el: string, n: number) => (counts[el] = (counts[el] ?? 0) + n)
    while (i < formula.length) {
      const ch = formula[i]
      if (ch === '(') {
        i++
        const inner = parseGroup()
        const mult = readNumber()
        for (const [el, n] of Object.entries(inner)) add(el, n * mult)
      } else if (ch === ')') {
        i++
        return counts
      } else {
        const m = /^[A-Z][a-z]?/.exec(formula.slice(i))
        if (!m) {
          i++ // 알 수 없는 문자는 무시
          continue
        }
        i += m[0].length
        add(m[0], readNumber())
      }
    }
    return counts
  }
  return parseGroup()
}

export function gcd(a: number, b: number): number {
  return b === 0 ? Math.abs(a) : gcd(b, a % b)
}

export function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b)
}

const ROMAN = ['', 'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII']
export function roman(n: number): string {
  return ROMAN[n] ?? String(n)
}
