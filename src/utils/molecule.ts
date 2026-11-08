import { ELEMENTS } from '../data/elements'
import type { ChemicalElement } from '../types/chemistry'
import type { MoleculeStructure } from '../types/reaction'
import { parseFormula } from './formula'
import { VSEPR_TABLE } from './vseprTable'

export const ELEMENT_BY_SYMBOL: ReadonlyMap<string, ChemicalElement> = new Map(ELEMENTS.map((e) => [e.symbol, e]))

/** 주족 원소의 원자가 전자 수 (데이터가 없으면 족 번호로 계산) */
export function valenceOf(el: ChemicalElement): number {
  if (el.valenceElectrons > 0) return el.valenceElectrons
  if (el.group === null) return 2
  if (el.group <= 2) return el.group
  if (el.group >= 13) return el.group - 10
  return el.group
}

/** 원자가 만들 수 있는 최대 결합 수 (H=1, 할로젠=1, 16족=2, 15족=3, 14족=4) */
function bondCapacity(el: ChemicalElement): number {
  if (el.symbol === 'H') return 1
  const v = valenceOf(el)
  return Math.max(1, Math.min(4, 8 - v))
}

/** 결합 차수 예외 (배위 결합 포함 실제 값) */
const DIATOMIC_BOND_ORDER: Record<string, number> = { CO: 3 }

function octetState(el: ChemicalElement, electrons: number): MoleculeStructure['octet'] {
  if (el.symbol === 'H') return electrons === 2 ? 'ok' : 'violated'
  if (electrons === 8) return 'ok'
  if (electrons < 8) return 'incomplete'
  return el.period <= 2 ? 'violated' : 'expanded'
}

/**
 * 공유 결합 분자의 루이스 구조 · VSEPR 분석.
 * 지원: 이원자 분자(X₂, XY), 중심 원자 1개 + 같은 주변 원자 n개(AXₙ). 그 외는 null.
 */
export function analyzeMolecule(formula: string): MoleculeStructure | null {
  const counts = parseFormula(formula)
  const syms = Object.keys(counts)

  // 등핵 이원자 분자 (H₂, O₂, N₂, Cl₂ …)
  if (syms.length === 1 && counts[syms[0]] === 2) {
    const el = ELEMENT_BY_SYMBOL.get(syms[0])
    if (!el) return null
    const bo = bondCapacity(el)
    const lp = Math.max(0, Math.floor((valenceOf(el) - bo) / 2))
    return diatomic(el, el, bo, lp, lp, 0)
  }
  if (syms.length !== 2) return null

  const [s1, s2] = syms
  const e1 = ELEMENT_BY_SYMBOL.get(s1)
  const e2 = ELEMENT_BY_SYMBOL.get(s2)
  if (!e1 || !e2) return null

  // 이핵 이원자 분자 (HCl, CO, NO …)
  if (counts[s1] === 1 && counts[s2] === 1) {
    const bo = DIATOMIC_BOND_ORDER[formula] ?? Math.min(bondCapacity(e1), bondCapacity(e2))
    const r1 = Math.max(0, valenceOf(e1) - bo)
    const r2 = Math.max(0, valenceOf(e2) - bo)
    return diatomic(e1, e2, bo, Math.floor(r1 / 2), Math.floor(r2 / 2), (r1 % 2) + (r2 % 2))
  }

  // AXₙ: 개수가 1인 원자가 중심 (H는 중심이 될 수 없음)
  const centralSym = counts[s1] === 1 ? s1 : counts[s2] === 1 ? s2 : null
  if (!centralSym) return null
  const ligandSym = centralSym === s1 ? s2 : s1
  const central = ELEMENT_BY_SYMBOL.get(centralSym)!
  const ligand = ELEMENT_BY_SYMBOL.get(ligandSym)!
  if (central.symbol === 'H') return null
  const n = counts[ligandSym]
  const V = valenceOf(central)

  let bo = Math.min(bondCapacity(ligand), 3)
  if (V - n * bo < 0) bo = 1 // 중심 원자 전자가 모자라면 단일 결합으로
  const remaining = V - n * bo
  if (remaining < 0) return null

  const lonePairs = Math.floor(remaining / 2)
  const unpaired = remaining % 2
  const steric = n + lonePairs + unpaired
  const geo = VSEPR_TABLE[`${steric}-${lonePairs + unpaired}`]
  if (!geo) return null
  const electrons = 2 * n * bo + 2 * lonePairs + unpaired
  const ligandLP = ligand.symbol === 'H' ? 0 : Math.max(0, Math.floor((valenceOf(ligand) - bo) / 2))

  return {
    central: central.symbol,
    ligand: ligand.symbol,
    ligandCount: n,
    bondOrder: bo,
    lonePairs,
    unpaired,
    ligandLonePairs: ligandLP,
    diatomic: false,
    stericNumber: steric,
    geometryKo: geo.ko,
    geometryEn: geo.en,
    bondAngle: geo.angle,
    octet: octetState(central, electrons),
  }
}

function diatomic(
  a: ChemicalElement, b: ChemicalElement, bo: number, lpA: number, lpB: number, unpaired: number,
): MoleculeStructure {
  const electrons = 2 * bo + 2 * lpA
  return {
    central: a.symbol,
    ligand: b.symbol,
    ligandCount: 1,
    bondOrder: bo,
    lonePairs: lpA,
    unpaired,
    ligandLonePairs: lpB,
    diatomic: true,
    stericNumber: 1 + lpA,
    geometryKo: '직선형 (이원자 분자)',
    geometryEn: 'linear (diatomic)',
    bondAngle: null,
    octet: octetState(a, electrons),
  }
}

export const BOND_ORDER_KO = ['', '단일', '이중', '삼중'] as const
