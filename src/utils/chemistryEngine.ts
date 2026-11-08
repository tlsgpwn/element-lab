/**
 * ElementLab 하이브리드 화학 결합 엔진 (순수 함수, UI 의존성 없음)
 *
 * Step 1. 유명 반응 사전(knownReactions) 매칭 — 조건 충족 시 최우선
 * Step 2. 알고리즘 기반 가상 결합 계산
 *   a) 비활성 기체 예외 처리 (Xe·Kr + F·O 는 고온+고압에서만)
 *   b) 전기음성도 차이(Δχ)로 결합 종류 판별 (이온 / 극성·무극성 공유 / 금속)
 *   c) 산화수 교차 매칭(LCM)으로 화학식 AₓBᵧ와 한글·영문 명칭 생성
 *   d) 실재 화합물 목록으로 안정성 평가 (안정 / 가상 합성물)
 */
import { ALLOY_NAMES, AMMONIUM, ANION_ROOT, POLYATOMIC_ANIONS, SPECIAL_NAMES, STABLE_COMPOUNDS } from '../data/compounds'
import { KNOWN_REACTIONS } from '../data/knownReactions'
import { REAGENT_BY_FORMULA } from '../data/reagents'
import type { ChemicalElement } from '../types/chemistry'
import type {
  BondType, ChamberContents, ConditionKey, Conditions, EffectStyle, KnownReaction, ProductInfo,
  ReactionEffect, ReactionResult, SpeciesKey, Stability,
} from '../types/reaction'
import { DIATOMIC, formatCharge, formatFormula, lcm, parseFormula, roman } from './formula'
import { analyzeMolecule, BOND_ORDER_KO, ELEMENT_BY_SYMBOL, valenceOf } from './molecule'

/* ================================================================== *
 * 공통 상수 · 헬퍼
 * ================================================================== */

export const MAX_SPECIES = 3

export const CONDITION_LABEL: Record<ConditionKey, string> = {
  heat: '가열(고온)',
  pressure: '고압',
  catalyst: '촉매',
}

/** 이온 결합 판정 기준 Δχ */
export const IONIC_THRESHOLD = 1.7
/** 무극성 공유 결합 기준 Δχ */
export const NONPOLAR_THRESHOLD = 0.4

const METAL_CATEGORIES = new Set([
  'alkali-metal', 'alkaline-earth', 'transition-metal', 'post-transition', 'lanthanide', 'actinide',
])

/** 공유 결정(그물 구조) — 분자가 아니므로 3D 분자 도감에 등록하지 않음 */
const NETWORK_SOLIDS = new Set(['SiO2', 'SiC', 'BN', 'Si3N4', 'B2O3', 'GeO2', 'P4O10'])

/** 금속 판정 (준금속은 비금속 쪽으로 취급) */
export function isMetal(el: ChemicalElement): boolean {
  return METAL_CATEGORIES.has(el.category)
}

export function isReagent(key: SpeciesKey): boolean {
  return REAGENT_BY_FORMULA.has(key)
}

/** 챔버 표시용 화학종 라벨: 이원자 원소는 X₂ */
export function speciesLabel(key: SpeciesKey): string {
  if (isReagent(key)) return formatFormula(key)
  return DIATOMIC.has(key) ? `${key}₂` : key
}

export function speciesName(key: SpeciesKey): string {
  return REAGENT_BY_FORMULA.get(key)?.nameKo ?? ELEMENT_BY_SYMBOL.get(key)?.nameKo ?? key
}

const sameSet = (a: string[], b: string[]) => a.length === b.length && a.every((x) => b.includes(x))

const round1 = (n: number) => Math.round(n * 10) / 10

function missingConditions(req: Partial<Conditions>, cond: Conditions): ConditionKey[] {
  return (Object.keys(req) as ConditionKey[]).filter((k) => req[k] && !cond[k])
}

/** 반응식 문자열: "2H₂ + O₂ → 2H₂O" */
function buildEquation(
  reactants: Record<SpeciesKey, number>,
  products: { formula: string; coef: number }[],
  arrow = '→',
): string {
  const coef = (n: number) => (n === 1 ? '' : String(n))
  const left = Object.entries(reactants).map(([k, n]) => `${coef(n)}${speciesLabel(k)}`).join(' + ')
  const right = products.map((p) => `${coef(p.coef)}${formatFormula(p.formula)}`).join(' + ')
  return `${left} ${arrow} ${right}`
}

/** 투입량으로 반응 횟수와 남는 반응물 계산 */
function stoichiometry(balance: Record<SpeciesKey, number>, contents: ChamberContents) {
  const units = Math.min(...Object.entries(balance).map(([k, n]) => Math.floor((contents[k] ?? 0) / n)))
  const leftovers: Record<SpeciesKey, number> = {}
  for (const [k, count] of Object.entries(contents)) {
    const left = count - units * (balance[k] ?? 0)
    if (left > 0) leftovers[k] = left
  }
  return { units, leftovers }
}

/**
 * 여러 후보 중 투입 비율에 가장 잘 맞는 반응을 고른다.
 * 1회 이상 진행 가능한 후보 우선, 그다음 남는 반응물 비율이 작은 순. 동점이면 앞 순서 유지.
 */
function pickByRatio<T>(items: T[], getBalance: (t: T) => Record<SpeciesKey, number>, contents: ChamberContents): T {
  const total = Object.values(contents).reduce((a, b) => a + b, 0) || 1
  let best = items[0]
  let bestScore = Infinity
  for (const item of items) {
    const { units, leftovers } = stoichiometry(getBalance(item), contents)
    const leftFrac = Object.values(leftovers).reduce((a, b) => a + b, 0) / total
    const score = (units === 0 ? 10 : 0) + leftFrac
    if (score < bestScore - 1e-9) {
      best = item
      bestScore = score
    }
  }
  return best
}

/** 원소 단체(이원자 분자 고려)로부터 생성물 1종을 만드는 계수 */
function elementalBalance(productCounts: Record<string, number>) {
  for (let c = 1; c <= 4; c++) {
    if (Object.entries(productCounts).every(([sym, n]) => !DIATOMIC.has(sym) || (c * n) % 2 === 0)) {
      const reactants: Record<SpeciesKey, number> = {}
      for (const [sym, n] of Object.entries(productCounts)) reactants[sym] = DIATOMIC.has(sym) ? (c * n) / 2 : c * n
      return { productCoef: c, reactants }
    }
  }
  return { productCoef: 2, reactants: Object.fromEntries(Object.entries(productCounts).map(([s, n]) => [s, n * 2])) }
}

function deltaChiOf(a: ChemicalElement, b: ChemicalElement): number | null {
  if (a.electronegativity === null || b.electronegativity === null) return null
  return Math.round(Math.abs(a.electronegativity - b.electronegativity) * 100) / 100
}

/* ================================================================== *
 * 생성물 정보 (루이스 구조 설명 · 이온 · 분자 구조)
 * ================================================================== */

const KO_PREFIX = ['', '일', '이', '삼', '사', '오', '육', '칠', '팔', '구', '십']
const EN_PREFIX = ['', 'mono', 'di', 'tri', 'tetra', 'penta', 'hexa', 'hepta', 'octa', 'nona', 'deca']

/** 영문 접두사 + 어근 (모음 생략: penta+oxide → pentoxide) */
function enPrefixed(n: number, root: string): string {
  const p = EN_PREFIX[n] ?? ''
  return /[ao]$/.test(p) && root.startsWith('o') ? p.slice(0, -1) + root : p + root
}

function covalentLewis(formula: string, deltaChi: number | null): string[] {
  const s = analyzeMolecule(formula)
  const lines: string[] = []
  if (!s) {
    lines.push('여러 원자가 전자쌍을 공유하는 공유 결합 물질입니다. 구조가 복잡해 자동 루이스 분석은 생략합니다.')
  } else if (s.diatomic) {
    const bondKo = BOND_ORDER_KO[s.bondOrder] ?? `${s.bondOrder}중`
    lines.push(`${s.central}와(과) ${s.ligand}가 전자쌍 ${s.bondOrder}개를 공유하는 ${bondKo} 결합을 이룹니다.`)
    if (s.lonePairs || s.ligandLonePairs) {
      lines.push(`비공유 전자쌍: ${s.central} ${s.lonePairs}쌍, ${s.ligand} ${s.ligandLonePairs}쌍${s.unpaired ? ` · 홀전자 ${s.unpaired}개(라디칼)` : ''}`)
    }
  } else {
    const c = ELEMENT_BY_SYMBOL.get(s.central)!
    const bondKo = BOND_ORDER_KO[s.bondOrder] ?? `${s.bondOrder}중`
    lines.push(`중심 원자 ${s.central}(원자가 전자 ${valenceOf(c)}개)가 ${s.ligand} ${s.ligandCount}개와 각각 ${bondKo} 결합을 이룹니다.`)
    lines.push(
      `중심 원자의 비공유 전자쌍 ${s.lonePairs}쌍${s.unpaired ? ' + 홀전자 1개' : ''} → 전자쌍 영역 ${s.stericNumber}개`,
    )
    lines.push(`VSEPR 예측 구조: ${s.geometryKo} (결합각 약 ${s.bondAngle}°)`)
  }
  if (s) {
    if (s.octet === 'incomplete' && s.central !== 'H') lines.push(`${s.central}는 옥텟을 다 채우지 못한 '불완전한 옥텟' 상태입니다.`)
    if (s.octet === 'expanded') lines.push(`${s.central}는 3주기 이상 원소라 d 오비탈을 활용해 8개보다 많은 전자를 수용합니다('확장된 옥텟').`)
    if (s.octet === 'violated') lines.push(`2주기 원소 ${s.central}는 8개를 넘는 전자를 수용할 수 없어 실제로는 존재하기 어렵습니다.`)
  }
  if (deltaChi !== null) {
    lines.push(
      deltaChi < NONPOLAR_THRESHOLD
        ? `Δχ = ${deltaChi.toFixed(2)} < 0.4 → 전자쌍이 거의 고르게 공유되는 무극성 공유 결합입니다.`
        : `Δχ = ${deltaChi.toFixed(2)} → 전자쌍이 전기음성도가 큰 원자 쪽으로 치우친 극성 공유 결합입니다(δ⁺/δ⁻).`,
    )
  }
  return lines
}

function ionicLewis(cation: ChemicalElement, x: number, pos: number, anion: ChemicalElement, y: number, neg: number): string[] {
  const lines = [
    `${cation.symbol}${x > 1 ? ` 원자 ${x}개가` : '가'} 각각 전자 ${pos}개를 잃어 ${cation.symbol}${formatCharge(pos)} 양이온이 됩니다.`,
    `${anion.symbol}${y > 1 ? ` 원자 ${y}개가` : '가'} 각각 전자 ${Math.abs(neg)}개를 얻어 ${anion.symbol}${formatCharge(neg)} 음이온이 됩니다.`,
    `이동한 전자 총 ${x * pos}개 — 전하 합: (+${x * pos}) + (−${y * Math.abs(neg)}) = 0`,
  ]
  lines.push(
    cation.category === 'transition-metal' || cation.isFBlock
      ? '음이온은 옥텟을 이루고, 전이 금속 양이온은 d 오비탈에 전자가 남은 채 정전기적 인력으로 결정 격자를 만듭니다.'
      : '두 이온 모두 비활성 기체와 같은 전자 배치(옥텟)를 갖고, 정전기적 인력으로 결정 격자를 만듭니다.',
  )
  return lines
}

const METALLIC_LEWIS = [
  '금속 원자들이 원자가 전자를 내놓아 자유롭게 움직이는 "전자 바다"를 이루고, 이것이 양이온 격자를 붙잡는 금속 결합입니다.',
  '크기가 다른 원자가 끼어들면 원자층이 미끄러지기 어려워져 순수 금속보다 단단해집니다.',
]

/** 이원 이온 화합물의 이온 구성 추론 (전하가 주요 산화수와 맞을 때만) */
function inferIons(formula: string) {
  const counts = parseFormula(formula)
  const syms = Object.keys(counts)
  if (syms.length !== 2) return undefined
  const [a, b] = syms.map((s) => ELEMENT_BY_SYMBOL.get(s)!)
  if (!a || !b) return undefined
  const cation = isMetal(a) || (!isMetal(b) && (a.electronegativity ?? 0) < (b.electronegativity ?? 0)) ? a : b
  const anion = cation === a ? b : a
  const neg = anion.oxidationStates.find((o) => o < 0)
  if (neg === undefined) return undefined
  const x = counts[cation.symbol]
  const y = counts[anion.symbol]
  const pos = (y * -neg) / x
  if (!Number.isInteger(pos) || !cation.oxidationStates.includes(pos)) return undefined
  return { cation: cation.symbol, cationCharge: pos, cationCount: x, anion: anion.symbol, anionCharge: neg, anionCount: y }
}

/** 사전 반응 생성물 → ProductInfo */
function knownProductInfo(p: KnownReaction['products'][number]): ProductInfo {
  const counts = parseFormula(p.formula)
  const syms = Object.keys(counts)
  const els = syms.map((s) => ELEMENT_BY_SYMBOL.get(s)).filter((e): e is ChemicalElement => !!e)
  const deltaChi = els.length === 2 ? deltaChiOf(els[0], els[1]) : els.length === 1 && p.bond !== 'metallic' ? 0 : null
  const notes: string[] = []
  let lewis: string[]
  let ions: ProductInfo['ions']

  if (p.bond === 'metallic') {
    lewis = syms.length === 1 ? [`순수한 금속 ${p.nameKo}이(가) 생성되었습니다. 금속 결합으로 이루어져 있습니다.`] : METALLIC_LEWIS
  } else if (p.bond === 'ionic') {
    ions = inferIons(p.formula)
    if (ions) {
      const c = ELEMENT_BY_SYMBOL.get(ions.cation)!
      const a = ELEMENT_BY_SYMBOL.get(ions.anion)!
      lewis = ionicLewis(c, ions.cationCount, ions.cationCharge, a, ions.anionCount, ions.anionCharge)
    } else {
      lewis = ['양이온과 다원자 음이온(또는 과산화 이온 등)이 정전기적 인력으로 결합한 이온 결합 화합물입니다. 다원자 이온 내부는 공유 결합입니다.']
    }
  } else {
    lewis = covalentLewis(p.formula, deltaChi)
  }
  if (NETWORK_SOLIDS.has(p.formula)) notes.push('독립된 분자가 아니라 원자들이 끝없이 공유 결합으로 연결된 공유 결정(그물 구조)입니다.')

  const isMolecule = !!p.molecule && !NETWORK_SOLIDS.has(p.formula)
  return {
    formula: p.formula, nameKo: p.nameKo, nameEn: p.nameEn, state: p.state, bond: p.bond,
    deltaChi, stability: 'stable', lewis, ions,
    structure: isMolecule ? (analyzeMolecule(p.formula) ?? undefined) : undefined,
    moleculeId: isMolecule ? p.formula : undefined,
    notes,
  }
}

/* ================================================================== *
 * Step 1. 유명 반응 사전 매칭
 * ================================================================== */

function matchKnown(keys: SpeciesKey[], contents: ChamberContents, cond: Conditions): ReactionResult | null {
  const candidates = KNOWN_REACTIONS.filter((r) => sameSet(Object.keys(r.reactants), keys))
  if (candidates.length === 0) return null

  const ok = candidates.filter((r) => missingConditions(r.conditions, cond).length === 0)
  const bestOverall = pickByRatio(candidates, (r) => r.reactants, contents)

  if (ok.length === 0) {
    const r = bestOverall
    const missing = missingConditions(r.conditions, cond)
    return {
      status: 'needs-conditions',
      title: `${r.nameKo}에는 조건이 필요해요`,
      missing,
      message: `이 조합은 반응할 수 있지만 [${missing.map((m) => CONDITION_LABEL[m]).join(' + ')}] 조건을 켜야 합니다.`,
      balance: r.reactants,
    }
  }

  const r = pickByRatio(ok, (x) => x.reactants, contents)
  const equation = buildEquation(r.reactants, r.products, r.reversible ? '⇌' : '→')
  const { units, leftovers } = stoichiometry(r.reactants, contents)
  if (units === 0) {
    return {
      status: 'insufficient', title: '반응물의 양이 부족해요', equation, balance: r.reactants,
      message: `${r.nameKo}: 반응식대로 넣어야 반응이 진행됩니다. [자동 계량]을 눌러 보세요.`,
    }
  }

  let description = r.description
  if (bestOverall !== r) {
    const miss = missingConditions(bestOverall.conditions, cond)
    description += ` (투입 비율로 보면 [${miss.map((m) => CONDITION_LABEL[m]).join(' + ')}] 조건에서 ${formatFormula(bestOverall.products[0].formula)}이(가) 생길 수도 있어요.)`
  }

  const products = r.products.map(knownProductInfo)
  return {
    status: 'success', source: 'known', title: r.nameKo, equation, units,
    balance: r.reactants, leftovers, products,
    deltaH: { value: r.deltaH, estimated: false },
    effects: r.effects, style: r.style ?? {}, description,
    alternatives: [],
    moleculeIds: products.flatMap((p) => (p.moleculeId ? [p.moleculeId] : [])),
  }
}

/* ================================================================== *
 * Step 2. 알고리즘 기반 가상 결합 계산
 * ================================================================== */

interface Candidate {
  formula: string
  productCounts: Record<string, number>
  stability: Stability
  build: () => { product: ProductInfo; deltaH: number | null; effects: ReactionEffect[]; style: EffectStyle; description: string }
}

/** 화학식 문자열: 양이온 성분 먼저. 단, H + 13~15족 원소는 관례상 원소를 먼저 (NH₃, CH₄, PH₃) */
function binaryFormula(cation: ChemicalElement, x: number, anion: ChemicalElement, y: number): string {
  const part = (el: ChemicalElement, n: number) => `${el.symbol}${n > 1 ? n : ''}`
  const other = cation.symbol === 'H' ? anion : null
  if (other && other.group !== null && other.group >= 13 && other.group <= 15) return part(anion, y) + part(cation, x)
  return part(cation, x) + part(anion, y)
}

function positiveStates(el: ChemicalElement): { states: number[]; fallback: boolean } {
  const pos = el.oxidationStates.filter((o) => o > 0)
  if (pos.length) return { states: pos, fallback: false }
  return { states: [Math.max(1, 8 - valenceOf(el))], fallback: true }
}

function negativeState(el: ChemicalElement): { state: number; fallback: boolean } {
  const neg = el.oxidationStates.find((o) => o < 0)
  if (neg !== undefined) return { state: neg, fallback: false }
  const v = valenceOf(el)
  return { state: -Math.max(1, Math.min(v, 8 - v)), fallback: true }
}

function binaryName(
  cation: ChemicalElement, x: number, pos: number, anion: ChemicalElement, y: number, formula: string,
): { ko: string; en: string } {
  const special = SPECIAL_NAMES[formula]
  if (special) return special
  const root = ANION_ROOT[anion.symbol] ?? { ko: `${anion.nameKo}화`, en: `${anion.nameEn.toLowerCase()}ide` }
  // 금속 양이온 → 이온식 명명(스톡 표기), 비금속끼리 → 공유식 명명(그리스 수 접두사)
  if (isMetal(cation)) {
    const multi = cation.oxidationStates.filter((o) => o > 0).length > 1
    const stock = multi ? `(${roman(pos)})` : ''
    return { ko: `${root.ko} ${cation.nameKo}${stock}`, en: `${cation.nameEn.toLowerCase()}${stock} ${root.en}` }
  }
  if (cation.symbol === 'H') {
    // 13~15족 수소 화합물은 "삼수소화 비소"처럼, 나머지는 "염화 수소"처럼
    if (formula.startsWith(anion.symbol)) {
      return { ko: `${KO_PREFIX[x]}수소화 ${anion.nameKo}`, en: `${anion.nameEn.toLowerCase()} ${enPrefixed(x, 'hydride')}` }
    }
    return { ko: `${root.ko} 수소`, en: `hydrogen ${root.en}` }
  }
  const yKo = y > 1 ? KO_PREFIX[y] : anion.symbol === 'O' ? '일' : ''
  const yEn = y > 1 || anion.symbol === 'O' ? enPrefixed(y, root.en) : root.en
  return {
    ko: `${yKo}${root.ko} ${x > 1 ? KO_PREFIX[x] : ''}${cation.nameKo}`,
    en: `${x > 1 ? EN_PREFIX[x] : ''}${cation.nameEn.toLowerCase()} ${yEn}`,
  }
}

function binaryCandidates(a: ChemicalElement, b: ChemicalElement): Candidate[] {
  const aMetal = isMetal(a)
  const bMetal = isMetal(b)
  const chiA = a.electronegativity ?? 0
  const chiB = b.electronegativity ?? 0
  // 양이온: 금속+비금속이면 금속, 아니면 전기음성도가 낮은 쪽
  const cation = aMetal !== bMetal ? (aMetal ? a : b) : chiA <= chiB ? a : b
  const anion = cation === a ? b : a
  const dChi = deltaChiOf(a, b) ?? 0
  const metalNonmetal = aMetal !== bMetal
  const bond: BondType =
    metalNonmetal || dChi >= IONIC_THRESHOLD ? 'ionic' : dChi < NONPOLAR_THRESHOLD ? 'covalent-nonpolar' : 'covalent-polar'

  const pos = positiveStates(cation)
  const neg = negativeState(anion)
  const seen = new Set<string>()
  const out: Candidate[] = []

  for (const p of pos.states) {
    const n = Math.abs(neg.state)
    const L = lcm(p, n)
    const x = L / p
    const y = L / n
    const formula = binaryFormula(cation, x, anion, y)
    if (seen.has(formula)) continue
    seen.add(formula)
    const fallback = pos.fallback || neg.fallback
    const structure = bond === 'ionic' ? null : analyzeMolecule(formula)
    const known = STABLE_COMPOUNDS.has(formula)
    const stability: Stability = known && structure?.octet !== 'violated' ? 'stable' : 'virtual'
    const productCounts = { [cation.symbol]: x, [anion.symbol]: y }

    out.push({
      formula, productCounts, stability,
      build: () => {
        const name = binaryName(cation, x, p, anion, y, formula)
        const notes: string[] = []
        if (fallback) notes.push('데이터의 주요 산화수로 전하 균형을 맞출 수 없어, 원자가 전자 수로 추정한 산화수를 사용했습니다.')
        if (!metalNonmetal && bond === 'ionic') {
          notes.push(`Δχ ≥ ${IONIC_THRESHOLD}이라 규칙상 이온 결합으로 분류했지만, 비금속끼리의 결합이므로 실제 물질은 극성이 매우 큰 공유 결합 분자에 가깝습니다.`)
        }
        if (metalNonmetal && dChi < 1.0) {
          notes.push(`금속+비금속 조합이지만 Δχ가 ${dChi.toFixed(2)}로 작아 실제로는 공유성이 강한 화합물(반도체 등)일 수 있습니다.`)
        }
        if (NETWORK_SOLIDS.has(formula)) notes.push('독립된 분자가 아닌 공유 결정(그물 구조)입니다.')
        if (stability === 'virtual') notes.push('산화수 계산상으로만 가능한 조합입니다. 실제로 안정하게 분리된 기록이 드뭅니다.')

        const isCovalent = bond !== 'ionic'
        const isMolecule = isCovalent && !NETWORK_SOLIDS.has(formula)
        const lewis = isCovalent ? covalentLewis(formula, dChi) : ionicLewis(cation, x, p, anion, y, neg.state)
        // 폴링 근사: 결합 에너지 증가분 ≈ 96.5·Δχ² kJ/mol, 전자쌍(결합) 수 ≈ L
        const perUnit = -96.5 * dChi * dChi * L

        const effects: ReactionEffect[] = isCovalent ? ['glow', 'smoke'] : ['flame', 'smoke']
        const style: EffectStyle = {
          flameColor: stability === 'virtual' ? '#c084fc' : isCovalent ? '#67e8f9' : (cation.flameColor ?? anion.flameColor ?? '#fbbf24'),
        }
        const bondKo = bond === 'ionic' ? '이온 결합' : bond === 'covalent-polar' ? '극성 공유 결합' : '무극성 공유 결합'
        return {
          product: {
            formula, nameKo: name.ko, nameEn: name.en, bond, deltaChi: dChi, stability, lewis,
            ions: bond === 'ionic' ? { cation: cation.symbol, cationCharge: p, cationCount: x, anion: anion.symbol, anionCharge: neg.state, anionCount: y } : undefined,
            structure: structure ?? undefined,
            moleculeId: isMolecule ? formula : undefined,
            notes,
          },
          deltaH: perUnit,
          effects,
          style,
          description: `${cation.nameKo}(χ ${cation.electronegativity ?? '—'})와 ${anion.nameKo}(χ ${anion.electronegativity ?? '—'})의 Δχ = ${dChi.toFixed(2)}${metalNonmetal ? ', 금속+비금속 조합' : ''} → ${bondKo}. 산화수 +${p}와 −${Math.abs(neg.state)}의 최소공배수 ${L}로 전하 균형(${cation.symbol}×${x}, ${anion.symbol}×${y})을 맞췄습니다.`,
        }
      },
    })
  }
  return out
}

function alloyResult(els: ChemicalElement[], contents: ChamberContents, cond: Conditions): ReactionResult {
  const syms = els.map((e) => e.symbol)
  const key = [...syms].sort().join('-')
  const hasHg = syms.includes('Hg')
  const roomTemp = hasHg || key === 'K-Na'
  if (!roomTemp && !cond.heat) {
    return {
      status: 'needs-conditions', title: '금속을 녹여야 섞을 수 있어요', missing: ['heat'],
      message: '금속끼리는 녹인 상태에서 섞어야 합금이 됩니다. [가열(고온)]을 켜 주세요.',
      balance: Object.fromEntries(syms.map((s) => [s, contents[s] ?? 1])),
    }
  }
  const known = ALLOY_NAMES[key]
  const total = syms.reduce((sum, s) => sum + (contents[s] ?? 0), 0)
  const composition = syms.map((s) => `${s} ${Math.round(((contents[s] ?? 0) / total) * 100)}%`).join(' · ')
  const nameKo = known?.ko ?? (hasHg ? `아말감 (${syms.join('–')})` : `${syms.join('–')} 합금`)
  const nameEn = known?.en ?? (hasHg ? 'amalgam' : `${els.map((e) => e.nameEn).join('-')} alloy`)
  const stability: Stability = known || hasHg ? 'stable' : 'virtual'
  const notes = [`원자 수 기준 조성: ${composition}`]
  if (known) notes.push(known.note)
  if (hasHg && !known) notes.push('수은은 많은 금속을 상온에서 녹여 아말감을 만듭니다(치과용 아말감 등).')
  if (stability === 'virtual') notes.push('관용명이 알려지지 않은 조합입니다. 실제 상(相) 구조는 조성과 온도에 따라 달라집니다.')

  return {
    status: 'success', source: 'computed', title: `합금 생성: ${nameKo}`,
    equation: `${syms.map((s) => speciesLabel(s)).join(' + ')} → ${syms.join('–')} 합금`,
    units: 1, balance: Object.fromEntries(syms.map((s) => [s, contents[s] ?? 1])), leftovers: {},
    products: [{
      formula: syms.join('–'), nameKo, nameEn, bond: 'metallic', deltaChi: null, stability, lewis: METALLIC_LEWIS, notes,
    }],
    deltaH: { value: 0, estimated: true },
    effects: ['glow'], style: { flameColor: '#fb923c' },
    description: '금속 + 금속 조합 → 금속 결합(합금). 화학식이 정해진 화합물이 아니라 조성을 바꿀 수 있는 고용체입니다.',
    alternatives: [],
    moleculeIds: [],
  }
}

/** 후보 생성물 목록 → 최종 결과 (안정 후보 우선 → 투입 비율) */
function finalizeCandidates(cands: Candidate[], contents: ChamberContents, titlePrefix: string): ReactionResult {
  const stable = cands.filter((c) => c.stability === 'stable')
  const pool = stable.length ? stable : cands
  const chosen = pickByRatio(pool, (c) => elementalBalance(c.productCounts).reactants, contents)
  const { productCoef, reactants } = elementalBalance(chosen.productCounts)
  const equation = buildEquation(reactants, [{ formula: chosen.formula, coef: productCoef }])
  const { units, leftovers } = stoichiometry(reactants, contents)
  const alternatives = cands.filter((c) => c !== chosen).map((c) => ({ formula: c.formula, stability: c.stability }))

  if (units === 0) {
    return {
      status: 'insufficient', title: '반응물의 양이 부족해요', equation, balance: reactants,
      message: `${formatFormula(chosen.formula)}을(를) 만들려면 반응식의 계수만큼 넣어야 합니다. [자동 계량]을 눌러 보세요.`,
    }
  }
  const built = chosen.build()
  return {
    status: 'success', source: 'computed',
    title: `${titlePrefix}: ${built.product.nameKo}`,
    equation, units, balance: reactants, leftovers,
    products: [built.product],
    deltaH: built.deltaH === null ? null : { value: round1(built.deltaH * productCoef), estimated: true },
    effects: built.effects, style: built.style, description: built.description,
    alternatives,
    moleculeIds: built.product.moleculeId ? [built.product.moleculeId] : [],
  }
}

/** 3원소: 다원자 이온 규칙 (수산화물·탄산염·질산염·황산염·인산염·염소산염·산·암모늄염) */
function ternaryCandidates(els: ChemicalElement[]): Candidate[] {
  const syms = els.map((e) => e.symbol)
  const out: Candidate[] = []

  for (const ion of POLYATOMIC_ANIONS) {
    if (!ion.elements.every((s) => syms.includes(s))) continue
    const m = els.find((e) => !ion.elements.includes(e.symbol))!
    const isAcid = m.symbol === 'H'
    if (!isAcid && !isMetal(m)) continue
    const charge = Math.abs(ion.charge)
    const states = isAcid ? [1] : m.oxidationStates.filter((o) => o > 0)
    for (const p of states) {
      const L = lcm(p, charge)
      const x = L / p
      const y = L / charge
      const ionPart = y > 1 ? `(${ion.formula})${y}` : ion.formula
      const formula = `${m.symbol}${x > 1 ? x : ''}${ionPart}`
      if (out.some((c) => c.formula === formula)) continue
      const productCounts = parseFormula(formula)
      const stability: Stability = STABLE_COMPOUNDS.has(formula) ? 'stable' : 'virtual'
      const o = ELEMENT_BY_SYMBOL.get('O')!
      const dChi = deltaChiOf(m, o)
      out.push({
        formula, productCounts, stability,
        build: () => {
          const multi = isMetal(m) && m.oxidationStates.filter((s) => s > 0).length > 1
          const stock = multi ? `(${roman(p)})` : ''
          const name = isAcid
            ? (SPECIAL_NAMES[formula] ?? { ko: `${ion.nameKo}`, en: `${ion.nameEn} acid` })
            : { ko: `${ion.nameKo} ${m.nameKo}${stock}`, en: `${m.nameEn.toLowerCase()}${stock} ${ion.nameEn}` }
          const bond: BondType = isAcid ? 'covalent-polar' : 'ionic'
          const lewis = isAcid
            ? [
                `수소 원자가 다원자 이온 ${formatFormula(ion.formula)}${formatCharge(ion.charge)}의 산소와 공유 결합한 산(acid) 분자입니다.`,
                '물에 녹으면 H⁺를 내놓아 산성을 띱니다. 분자 내부의 모든 결합은 공유 결합입니다.',
              ]
            : [
                `${m.symbol}${formatCharge(p)} 양이온 ${x}개와 다원자 이온 ${formatFormula(ion.formula)}${formatCharge(ion.charge)} ${y}개가 정전기적 인력으로 결합합니다.`,
                `다원자 이온 내부(${ion.elements.join('–')})는 공유 결합, 이온 사이는 이온 결합입니다.`,
                `전하 합: (+${x * p}) + (−${y * charge}) = 0`,
              ]
          return {
            product: {
              formula, nameKo: name.ko, nameEn: name.en, bond, deltaChi: dChi, stability, lewis,
              moleculeId: isAcid ? formula : undefined,
              notes: stability === 'virtual' ? ['산화수 계산상으로만 가능한 조합입니다.'] : [],
            },
            deltaH: null,
            effects: isAcid ? ['smoke', 'glow'] : ['glow', 'smoke'],
            style: { flameColor: stability === 'virtual' ? '#c084fc' : (m.flameColor ?? '#a5f3fc') },
            description: `3원소 조합에서 다원자 이온 ${formatFormula(ion.formula)}${formatCharge(ion.charge)}(${ion.nameKo} 이온)을 찾았습니다. ${isAcid ? '수소와 결합해 산이 됩니다.' : `금속 ${m.nameKo}와 이온 결합합니다.`}`,
          }
        },
      })
    }
  }

  // 암모늄염: N + H + (할로젠 또는 S)
  if (syms.includes('N') && syms.includes('H')) {
    const x = els.find((e) => e.symbol !== 'N' && e.symbol !== 'H')!
    const neg = x.oxidationStates.find((o) => o < 0)
    if ((x.category === 'halogen' || x.symbol === 'S') && neg !== undefined) {
      const n = Math.abs(neg)
      const formula = n > 1 ? `(NH4)${n}${x.symbol}` : `NH4${x.symbol}`
      const root = ANION_ROOT[x.symbol] ?? { ko: `${x.nameKo}화`, en: `${x.nameEn.toLowerCase()}ide` }
      out.push({
        formula, productCounts: parseFormula(formula), stability: STABLE_COMPOUNDS.has(formula) ? 'stable' : 'virtual',
        build: () => ({
          product: {
            formula, nameKo: `${root.ko} ${AMMONIUM.nameKo}`, nameEn: `${AMMONIUM.nameEn} ${root.en}`, bond: 'ionic',
            deltaChi: deltaChiOf(ELEMENT_BY_SYMBOL.get('N')!, x), stability: 'stable',
            lewis: [
              `NH₃의 비공유 전자쌍이 H⁺와 배위 결합해 암모늄 이온 NH₄⁺(정사면체형)이 됩니다.`,
              `NH₄⁺와 ${x.symbol}${formatCharge(neg)}이(가) 이온 결합합니다. 금속이 없는 이온 화합물입니다.`,
            ],
            notes: [],
          },
          deltaH: null, effects: ['smoke'], style: { flameColor: '#e2e8f0' },
          description: '질소와 수소가 암모늄 이온(NH₄⁺)을 이루고, 남은 비금속이 음이온이 되는 3원소 규칙을 적용했습니다.',
        }),
      })
    }
  }
  return out
}

/* ================================================================== *
 * 메인 진입점
 * ================================================================== */

export function analyzeReaction(contents: ChamberContents, cond: Conditions): ReactionResult {
  const filtered: ChamberContents = Object.fromEntries(Object.entries(contents).filter(([, n]) => n > 0))
  const keys = Object.keys(filtered)
  if (keys.length === 0) return { status: 'empty', message: '반응 챔버가 비어 있어요. 왼쪽에서 원소나 시약을 넣어 주세요.' }
  if (keys.length > MAX_SPECIES) {
    return { status: 'no-reaction', title: '너무 많은 물질을 넣었어요', message: `한 번에 최대 ${MAX_SPECIES}종류까지 반응시킬 수 있습니다.` }
  }

  // Step 1. 사전 매칭
  const known = matchKnown(keys, filtered, cond)
  if (known) return known

  // 사전에 없는 화합물 시약 조합
  if (keys.some(isReagent)) {
    return {
      status: 'no-reaction', title: '반응이 일어나지 않았어요',
      message: '화합물 시약은 반응 사전에 등록된 조합에서만 반응합니다. 원소끼리 조합하거나 다른 시약을 시도해 보세요.',
    }
  }

  const els = keys.map((k) => ELEMENT_BY_SYMBOL.get(k)).filter((e): e is ChemicalElement => !!e)

  // 단일 원소: 불꽃 반응
  if (els.length === 1) {
    const el = els[0]
    if (!cond.heat) {
      return { status: 'no-reaction', title: '반응할 상대가 없어요', message: '다른 원소를 함께 넣거나, [가열]을 켜서 불꽃 반응을 관찰해 보세요.' }
    }
    if (!el.flameColor) {
      return { status: 'no-reaction', title: '뚜렷한 불꽃 반응색이 없어요', message: `${el.nameKo}는 불꽃 반응에서 특징적인 색을 내지 않습니다. 알칼리 금속이나 알칼리 토금속을 가열해 보세요.` }
    }
    return {
      status: 'success', source: 'flame-test', title: `불꽃 반응: ${el.nameKo}`, equation: `${speciesLabel(el.symbol)} + 열 → 빛 (${el.flameColor})`,
      units: 1, balance: { [el.symbol]: 1 }, leftovers: {}, products: [], deltaH: null,
      effects: ['flame'], style: { flameColor: el.flameColor },
      description: `원자의 전자가 열에너지를 흡수해 들뜬 상태가 되었다가 바닥 상태로 돌아오며 고유한 파장의 빛을 냅니다. 원소마다 에너지 준위가 달라 불꽃색으로 원소를 구별할 수 있습니다.`,
      alternatives: [], moleculeIds: [],
    }
  }

  // a) 비활성 기체
  const noble = els.filter((e) => e.category === 'noble-gas')
  if (noble.length) {
    const exception =
      els.length === 2 && noble.length === 1 && ['Xe', 'Kr'].includes(noble[0].symbol) &&
      els.some((e) => e.symbol === 'F' || e.symbol === 'O')
    if (!exception) {
      return {
        status: 'no-reaction', title: '비활성 기체는 반응하지 않아요',
        message: `${noble.map((n) => n.nameKo).join(', ')}은(는) 최외각 전자 껍질이 가득 찬 안정한 상태(옥텟 규칙 충족)라 다른 원소와 결합하지 않습니다.`,
        suggestions: ['예외: 제논(Xe)·크립톤(Kr)은 고온·고압에서 플루오린(F)이나 산소(O)와 결합할 수 있어요.'],
      }
    }
    const missing = (['heat', 'pressure'] as const).filter((k) => !cond[k])
    if (missing.length) {
      return {
        status: 'needs-conditions', title: '비활성 기체를 깨우려면 극한 조건이 필요해요', missing: [...missing],
        message: `${noble[0].nameKo}는 매우 안정하지만, [${missing.map((m) => CONDITION_LABEL[m]).join(' + ')}] 조건에서는 전기음성도가 큰 원소와 결합할 수 있습니다.`,
        balance: Object.fromEntries(keys.map((k) => [k, 1])),
      }
    }
  }

  // b~d) 2원소
  if (els.length === 2) {
    const [a, b] = els
    if (isMetal(a) && isMetal(b)) return alloyResult(els, filtered, cond)
    const cands = binaryCandidates(a, b)
    if (!cands.length) {
      return { status: 'no-reaction', title: '결합을 만들 수 없어요', message: '두 원소의 산화수로 전하 균형을 맞출 수 없습니다.' }
    }
    return finalizeCandidates(cands, filtered, '가상 결합 계산')
  }

  // 3원소
  if (els.every(isMetal)) return alloyResult(els, filtered, cond)
  const cands = ternaryCandidates(els)
  if (cands.length) return finalizeCandidates(cands, filtered, '3원소 결합 계산')

  const suggestions: string[] = []
  for (let i = 0; i < els.length; i++) {
    for (let j = i + 1; j < els.length; j++) {
      const [a, b] = [els[i], els[j]]
      if (a.category === 'noble-gas' || b.category === 'noble-gas') continue
      if (isMetal(a) && isMetal(b)) {
        suggestions.push(`${a.symbol} + ${b.symbol} → 합금`)
        continue
      }
      const c = binaryCandidates(a, b)
      const best = c.find((x) => x.stability === 'stable') ?? c[0]
      if (best) suggestions.push(`${speciesLabel(a.symbol)} + ${speciesLabel(b.symbol)} → ${formatFormula(best.formula)}`)
    }
  }
  return {
    status: 'no-reaction', title: '3원소 규칙에 맞지 않는 조합이에요',
    message: '세 원소가 다원자 이온(수산화·탄산·질산·황산·인산·염소산 이온, 암모늄 이온)을 이루지 않습니다. 유기 화합물처럼 가능한 구조가 너무 많은 경우도 있어요. 두 원소씩 반응시켜 보세요.',
    suggestions,
  }
}

/** 결합 종류 한글 라벨 */
export const BOND_LABEL: Record<BondType, string> = {
  ionic: '이온 결합',
  'covalent-polar': '극성 공유 결합',
  'covalent-nonpolar': '무극성 공유 결합',
  metallic: '금속 결합 (합금)',
}

/**
 * 화학식 → 한글/영문 이름 (3D 분자 도감 표시용).
 * 관용명 → 등핵 이원자 분자 → 이원 화합물 명명 규칙 순으로 시도한다.
 */
export function moleculeName(formula: string): { ko: string; en: string } {
  const special = SPECIAL_NAMES[formula]
  if (special) return special
  const counts = parseFormula(formula)
  const syms = Object.keys(counts)
  const els = syms.map((s) => ELEMENT_BY_SYMBOL.get(s))
  if (els.some((e) => !e)) return { ko: formatFormula(formula), en: formula }
  if (els.length === 1) {
    const el = els[0]!
    return { ko: `${el.nameKo} 분자`, en: `${el.nameEn.toLowerCase()} molecule` }
  }
  if (els.length === 2) {
    const [a, b] = els as ChemicalElement[]
    const cation = isMetal(a) !== isMetal(b) ? (isMetal(a) ? a : b) : (a.electronegativity ?? 0) <= (b.electronegativity ?? 0) ? a : b
    const anion = cation === a ? b : a
    const x = counts[cation.symbol]
    const y = counts[anion.symbol]
    const neg = negativeState(anion).state
    const pos = Math.round((y * Math.abs(neg)) / x)
    return binaryName(cation, x, pos, anion, y, formula)
  }
  return { ko: formatFormula(formula), en: formula }
}
