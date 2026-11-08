/**
 * VSEPR 자동 입체 구조 계산기 (순수 함수, Three.js 의존성 없음)
 *
 * 1) 중심 원자 A의 원자가 전자 수 V와, 주변 원자 B와의 결합에 쓴 전자 수를 세어
 *    결합 전자쌍 수(B)와 비공유 전자쌍 수(E = (V − 결합에 쓴 전자) / 2)를 구한다.
 * 2) 입체수 SN = B + E 로 전자쌍 영역의 3D 방향을 정하고, 비공유 전자쌍 자리를 배정한다.
 * 3) 비공유 전자쌍 반발(LP–LP > LP–BP > BP–BP)로 줄어든 결합각을 반영해 좌표를 만든다.
 */
import type { MoleculeStructure } from '../types/reaction'
import { parseFormula } from './formula'
import { analyzeMolecule, ELEMENT_BY_SYMBOL, valenceOf } from './molecule'
import { VSEPR_TABLE, type GeometryInfo } from './vseprTable'

export type Vec3 = [number, number, number]

export interface Atom3D {
  symbol: string
  position: Vec3
  role: 'central' | 'ligand' | 'hydrogen'
}

export interface Bond3D {
  a: number
  b: number
  order: number
}

export interface LonePair3D {
  /** 중심 원자 기준 단위 방향 벡터 */
  direction: Vec3
  /** 홀전자(라디칼) 영역이면 true */
  single: boolean
}

export interface VseprResult {
  formula: string
  kind: 'ABnEm' | 'diatomic' | 'oxyacid'
  /** 예: "AB₂E₂" */
  notation: string
  central: string
  ligand: string
  /** 결합 전자쌍 영역 수 (주변 원자 수) */
  B: number
  /** 비공유 전자쌍(+홀전자) 영역 수 */
  E: number
  SN: number
  /** 중심 원자 원자가 전자 */
  valence: number
  /** 중심 원자가 결합에 사용한 전자 수 */
  bondingElectrons: number
  geometry: GeometryInfo
  /** 좌표에서 측정한 서로 다른 결합각들 (°) */
  measuredAngles: number[]
  /** 실측값을 반영했으면 해당 결합각 */
  experimentalAngle: number | null
  atoms: Atom3D[]
  bonds: Bond3D[]
  lonePairs: LonePair3D[]
  /** 쌍극자 모멘트 벡터 (Δχ 단위, δ⁻ 쪽을 향함) */
  dipole: Vec3
  dipoleMagnitude: number
  polar: boolean
  polarReason: string
  octet: MoleculeStructure['octet']
  unpaired: number
}

/* ------------------------------ 벡터 ------------------------------ */

const add = (a: Vec3, b: Vec3): Vec3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]]
const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const scale = (a: Vec3, s: number): Vec3 => [a[0] * s, a[1] * s, a[2] * s]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const len = (a: Vec3) => Math.hypot(a[0], a[1], a[2])
const norm = (a: Vec3): Vec3 => {
  const l = len(a) || 1
  return [a[0] / l, a[1] / l, a[2] / l]
}
const cross = (a: Vec3, b: Vec3): Vec3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const rad = (deg: number) => (deg * Math.PI) / 180
export const angleBetween = (a: Vec3, b: Vec3) => (Math.acos(Math.max(-1, Math.min(1, dot(norm(a), norm(b))))) * 180) / Math.PI

/* ------------------------------ 원자 크기 ------------------------------ */

/** 공유 결합 반지름 (pm, Cordero 2008 근사) */
const COVALENT_RADIUS: Record<string, number> = {
  H: 31, He: 28, Li: 128, Be: 96, B: 84, C: 76, N: 71, O: 66, F: 57, Ne: 58,
  Na: 166, Mg: 141, Al: 121, Si: 111, P: 107, S: 105, Cl: 102, Ar: 106,
  K: 203, Ca: 176, Ga: 122, Ge: 120, As: 119, Se: 120, Br: 120, Kr: 116,
  Sn: 139, Sb: 139, Te: 138, I: 139, Xe: 140,
}

export function covalentRadius(symbol: string): number {
  return COVALENT_RADIUS[symbol] ?? 130
}

/** 3D 장면 단위로 환산한 결합 길이 (다중 결합일수록 짧아짐) */
const BOND_SCALE = 1.45
function bondLength(a: string, b: string, order: number): number {
  return ((covalentRadius(a) + covalentRadius(b)) / 100) * BOND_SCALE * (1 - 0.07 * (order - 1))
}

/* ------------------------------ 실측 결합각 ------------------------------ */

/** 표의 대표값과 차이가 큰 분자의 실측 결합각 (°) */
const EXPERIMENTAL_ANGLE: Record<string, number> = {
  H2O: 104.5, NH3: 107, H2S: 92.1, H2Se: 91, PH3: 93.5, AsH3: 92.1, NF3: 102.5, NCl3: 107.1,
  PCl3: 100.3, PF3: 97.7, OF2: 103.1, Cl2O: 110.9, SO2: 119, NO2: 134.3, ClO2: 117.4, SCl2: 103,
}

/* ------------------------------ 전자쌍 영역 방향 ------------------------------ */

/**
 * 결합 B개, 비공유 영역 E개의 방향 벡터.
 * angle: 굽은형·삼각뿔형에서 사용할 결합각
 */
function domainDirections(B: number, E: number, angle: number): { bonds: Vec3[]; lps: Vec3[] } {
  const SN = B + E
  const half = rad(angle / 2)

  if (SN === 2) return { bonds: [[-1, 0, 0], [1, 0, 0]].slice(0, B) as Vec3[], lps: E ? [[1, 0, 0]] : [] }

  if (SN === 3) {
    if (E === 0) {
      return { bonds: [90, 210, 330].map((a) => [Math.cos(rad(a)), Math.sin(rad(a)), 0] as Vec3), lps: [] }
    }
    // AB₂E: 비공유 전자쌍은 위, 두 결합은 아래로 벌어진다
    return {
      bonds: [[-Math.sin(half), -Math.cos(half), 0], [Math.sin(half), -Math.cos(half), 0]],
      lps: [[0, 1, 0]],
    }
  }

  if (SN === 4) {
    if (E === 0) {
      const t = rad(109.47)
      const below = [90, 210, 330].map((a) => [Math.sin(t) * Math.cos(rad(a)), Math.cos(t), Math.sin(t) * Math.sin(rad(a))] as Vec3)
      return { bonds: [[0, 1, 0], ...below], lps: [] }
    }
    if (E === 1) {
      // AB₃E: 결합 사이각이 angle이 되도록 아래쪽 원뿔 각 φ를 구한다 (cos α = 1 − 1.5·sin²φ)
      const sinPhi = Math.sqrt((1 - Math.cos(rad(angle))) / 1.5)
      const cosPhi = Math.sqrt(1 - sinPhi * sinPhi)
      const bonds = [90, 210, 330].map((a) => [sinPhi * Math.cos(rad(a)), -cosPhi, sinPhi * Math.sin(rad(a))] as Vec3)
      return { bonds: bonds.slice(0, B), lps: [[0, 1, 0]] }
    }
    // AB₂E₂: 결합은 xy 평면, 비공유 전자쌍 두 개는 yz 평면에서 서로 벌어진다
    const lpHalf = rad(57.5)
    return {
      bonds: [[-Math.sin(half), -Math.cos(half), 0], [Math.sin(half), -Math.cos(half), 0]].slice(0, B) as Vec3[],
      lps: [[0, Math.cos(lpHalf), Math.sin(lpHalf)], [0, Math.cos(lpHalf), -Math.sin(lpHalf)]].slice(0, E) as Vec3[],
    }
  }

  if (SN === 5) {
    // 비공유 전자쌍은 반발이 적은 적도 자리부터 (화면 앞쪽 좌·우 → 뒤쪽 순: 중심 원자에 가려지지 않게)
    const eq = [150, 30, 270].map((a) => [Math.cos(rad(a)), 0, Math.sin(rad(a))] as Vec3)
    const slots: Vec3[] = [...eq, [0, 1, 0], [0, -1, 0]]
    return { bonds: slots.slice(E), lps: slots.slice(0, E) }
  }

  // SN 6: 비공유 전자쌍은 서로 반대편(위·아래) → 평면 사각형
  const slots: Vec3[] = [[0, 1, 0], [0, -1, 0], [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]]
  return { bonds: slots.slice(E), lps: slots.slice(0, E) }
}

/* ------------------------------ 측정 · 극성 ------------------------------ */

function measureAngles(dirs: Vec3[]): number[] {
  const out: number[] = []
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const a = Math.round(angleBetween(dirs[i], dirs[j]) * 10) / 10
      if (!out.some((x) => Math.abs(x - a) < 0.6)) out.push(a)
    }
  }
  return out.sort((x, y) => x - y)
}

const chi = (sym: string) => ELEMENT_BY_SYMBOL.get(sym)?.electronegativity ?? 2.2
/** 비공유 전자쌍 1개가 쌍극자에 기여하는 크기 (Δχ 단위 근사) */
const LONE_PAIR_DIPOLE = 0.4
const POLAR_THRESHOLD = 0.05

function dipoleOf(atoms: Atom3D[], bonds: Bond3D[], lps: LonePair3D[]): Vec3 {
  let mu: Vec3 = [0, 0, 0]
  for (const b of bonds) {
    const A = atoms[b.a]
    const Bt = atoms[b.b]
    const d = chi(Bt.symbol) - chi(A.symbol)
    mu = add(mu, scale(norm(sub(Bt.position, A.position)), d))
  }
  for (const lp of lps) mu = add(mu, scale(lp.direction, lp.single ? LONE_PAIR_DIPOLE / 2 : LONE_PAIR_DIPOLE))
  return mu
}

function polarity(atoms: Atom3D[], bonds: Bond3D[], lps: LonePair3D[]) {
  const mu = dipoleOf(atoms, bonds, lps)
  const mag = Math.round(len(mu) * 100) / 100
  const maxBondDelta = Math.max(0, ...bonds.map((b) => Math.abs(chi(atoms[b.a].symbol) - chi(atoms[b.b].symbol))))
  const polar = mag > POLAR_THRESHOLD
  let reason: string
  if (polar) {
    reason = lps.length
      ? '비공유 전자쌍이 한쪽으로 몰린 비대칭 구조라 결합 쌍극자가 상쇄되지 않습니다.'
      : '결합의 극성이 서로 다른 방향을 가리켜 상쇄되지 않습니다.'
  } else if (maxBondDelta < 0.4 && lps.length === 0) {
    reason = '결합 자체의 극성이 거의 없습니다(Δχ < 0.4).'
  } else {
    reason = '결합은 극성이지만, 구조가 대칭이라 결합 쌍극자들이 정확히 상쇄됩니다(Σμ = 0).'
  }
  return { mu, mag, polar, reason }
}

const SUB = '₀₁₂₃₄₅₆₇₈₉'
const subNum = (n: number) => String(n).split('').map((c) => SUB[Number(c)]).join('')

/* ------------------------------ 메인 ------------------------------ */

function fromStructure(formula: string, s: MoleculeStructure): VseprResult {
  const E = s.lonePairs + s.unpaired
  const central = s.central

  if (s.diatomic) {
    const L = bondLength(s.central, s.ligand, s.bondOrder)
    const atoms: Atom3D[] = [
      { symbol: s.central, position: [-L / 2, 0, 0], role: s.central === 'H' ? 'hydrogen' : 'central' },
      { symbol: s.ligand, position: [L / 2, 0, 0], role: s.ligand === 'H' ? 'hydrogen' : 'ligand' },
    ]
    const bonds = [{ a: 0, b: 1, order: s.bondOrder }]
    const p = polarity(atoms, bonds, [])
    return {
      formula, kind: 'diatomic', notation: 'AB', central, ligand: s.ligand, B: 1, E: 0, SN: 1,
      valence: valenceOf(ELEMENT_BY_SYMBOL.get(central)!), bondingElectrons: s.bondOrder,
      geometry: VSEPR_TABLE['2-0'], measuredAngles: [], experimentalAngle: null,
      atoms, bonds, lonePairs: [], dipole: p.mu, dipoleMagnitude: p.mag, polar: p.polar,
      polarReason: s.central === s.ligand ? '같은 원자끼리의 결합이라 전자가 고르게 공유됩니다.' : p.reason,
      octet: s.octet, unpaired: s.unpaired,
    }
  }

  const B = s.ligandCount
  const SN = B + E
  const geometry = VSEPR_TABLE[`${SN}-${E}`]
  const experimental = E > 0 ? (EXPERIMENTAL_ANGLE[formula] ?? null) : null
  const { bonds: dirs, lps } = domainDirections(B, E, experimental ?? geometry.angle)
  const L = bondLength(central, s.ligand, s.bondOrder)

  const atoms: Atom3D[] = [{ symbol: central, position: [0, 0, 0], role: 'central' }]
  const bonds: Bond3D[] = []
  dirs.forEach((d, i) => {
    atoms.push({ symbol: s.ligand, position: scale(d, L), role: s.ligand === 'H' ? 'hydrogen' : 'ligand' })
    bonds.push({ a: 0, b: i + 1, order: s.bondOrder })
  })
  const lonePairs: LonePair3D[] = lps.map((d, i) => ({ direction: d, single: i >= s.lonePairs }))
  const p = polarity(atoms, bonds, lonePairs)

  return {
    formula, kind: 'ABnEm',
    notation: `AB${subNum(B)}${E ? `E${subNum(E)}` : ''}`,
    central, ligand: s.ligand, B, E, SN,
    valence: valenceOf(ELEMENT_BY_SYMBOL.get(central)!),
    bondingElectrons: B * s.bondOrder,
    geometry, measuredAngles: measureAngles(dirs), experimentalAngle: experimental,
    atoms, bonds, lonePairs,
    dipole: p.mu, dipoleMagnitude: p.mag, polar: p.polar, polarReason: p.reason,
    octet: s.octet, unpaired: s.unpaired,
  }
}

/**
 * 산소산 HₐXOᵦ (H₂SO₄, HNO₃, H₃PO₄, H₂CO₃, HClO₃ …):
 * 중심 X에 O가 b개, 그중 a개는 –OH(단일 결합), 나머지는 =O(이중 결합).
 */
function oxyacid(formula: string, counts: Record<string, number>): VseprResult | null {
  const syms = Object.keys(counts)
  if (syms.length !== 3 || !counts.H || !counts.O) return null
  const X = syms.find((s) => s !== 'H' && s !== 'O')!
  const el = ELEMENT_BY_SYMBOL.get(X)
  const a = counts.H
  const b = counts.O
  if (!el || counts[X] !== 1 || a > b) return null

  const V = valenceOf(el)
  const used = a * 1 + (b - a) * 2
  const rem = V - used
  if (rem < 0) return null
  const lpCount = Math.floor(rem / 2)
  const unpaired = rem % 2
  const E = lpCount + unpaired
  const SN = b + E
  const geometry = VSEPR_TABLE[`${SN}-${E}`]
  if (!geometry) return null

  const { bonds: dirs, lps } = domainDirections(b, E, geometry.angle)
  const atoms: Atom3D[] = [{ symbol: X, position: [0, 0, 0], role: 'central' }]
  const bonds: Bond3D[] = []
  const up: Vec3 = [0, 1, 0]
  dirs.forEach((d, i) => {
    const isOH = i < a
    const order = isOH ? 1 : 2
    const oPos = scale(d, bondLength(X, 'O', order))
    atoms.push({ symbol: 'O', position: oPos, role: 'ligand' })
    const oIdx = atoms.length - 1
    bonds.push({ a: 0, b: oIdx, order })
    if (isOH) {
      // O–H는 X–O 결합과 약 104.5°를 이루도록 바깥쪽으로
      const toX = scale(d, -1)
      let perp = cross(d, Math.abs(dot(d, up)) > 0.9 ? [0, 0, 1] : up)
      perp = norm(cross(perp, d))
      const t = rad(104.5)
      const hDir = norm(add(scale(toX, Math.cos(t)), scale(perp, -Math.sin(t))))
      atoms.push({ symbol: 'H', position: add(oPos, scale(hDir, bondLength('O', 'H', 1))), role: 'hydrogen' })
      bonds.push({ a: oIdx, b: atoms.length - 1, order: 1 })
    }
  })
  const lonePairs: LonePair3D[] = lps.map((d, i) => ({ direction: d, single: i >= lpCount }))
  const p = polarity(atoms, bonds, lonePairs)

  return {
    formula, kind: 'oxyacid',
    notation: `AB${subNum(b)}${E ? `E${subNum(E)}` : ''}`,
    central: X, ligand: 'O', B: b, E, SN, valence: V, bondingElectrons: used,
    geometry, measuredAngles: measureAngles(dirs), experimentalAngle: null,
    atoms, bonds, lonePairs,
    dipole: p.mu, dipoleMagnitude: p.mag, polar: p.polar || a > 0,
    polarReason: a > 0 ? '극성이 큰 O–H 결합이 바깥쪽에 있어 분자 전체가 극성을 띱니다(물에 잘 녹는 이유).' : p.reason,
    octet: 'ok', unpaired,
  }
}

/** 화학식 → VSEPR 3D 모델. 해석할 수 없는 구조면 null */
export function computeVsepr(formula: string): VseprResult | null {
  const counts = parseFormula(formula)
  if (Object.keys(counts).some((s) => !ELEMENT_BY_SYMBOL.has(s))) return null
  const s = analyzeMolecule(formula)
  if (s && (s.diatomic || VSEPR_TABLE[`${s.ligandCount + s.lonePairs + s.unpaired}-${s.lonePairs + s.unpaired}`])) {
    return fromStructure(formula, s)
  }
  return oxyacid(formula, counts)
}
