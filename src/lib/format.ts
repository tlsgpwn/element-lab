const SUPERSCRIPT: Record<string, string> = {
  '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴',
  '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹',
}

/** "1s2 2s2 2p4" → "1s² 2s² 2p⁴" (오비탈 문자 뒤의 숫자만 위첨자로 변환) */
export function toSuperscriptConfig(config: string): string {
  return config.replace(/([spdf])(\d+)/g, (_, orb: string, n: string) =>
    orb + n.split('').map((c) => SUPERSCRIPT[c]).join(''),
  )
}

/** 산화수 표기: 3 → "+3", -2 → "−2", 0 → "0" */
export function formatOxidation(n: number): string {
  if (n > 0) return `+${n}`
  if (n < 0) return `−${Math.abs(n)}`
  return '0'
}

export function formatMass(mass: number): string {
  return Number.isInteger(mass) ? `[${mass}]` : mass.toString()
}

