import type { ProductInfo } from '../../types/reaction'

/** 루이스 도식을 그릴 수 있는 생성물인지와 그 종류 */
export function lewisKind(p: ProductInfo): 'metallic' | 'ionic' | 'covalent' | null {
  if (p.bond === 'metallic' && p.formula.includes('–')) return 'metallic'
  if (p.bond === 'ionic' && p.ions) return 'ionic'
  if (p.bond !== 'ionic' && p.structure) return 'covalent'
  return null
}
