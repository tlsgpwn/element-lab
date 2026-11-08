/** 반응 환경 조건 */
export interface Conditions {
  heat: boolean
  pressure: boolean
  catalyst: boolean
}

export type ConditionKey = keyof Conditions

/**
 * 챔버에 넣는 화학종 키.
 * - 원소: 원소 기호 ("Na", "H") — 이원자 분자 원소(H, N, O, F, Cl, Br, I)는 X₂ 분자 1개 단위
 * - 화합물 시약: 화학식 ("H2O", "HCl") — `src/data/reagents.ts`
 */
export type SpeciesKey = string

/** 챔버 내용물: 화학종 → 투입 개수(입자 수) */
export type ChamberContents = Record<SpeciesKey, number>

export type BondType = 'ionic' | 'covalent-polar' | 'covalent-nonpolar' | 'metallic'

export type MatterState = 's' | 'l' | 'g' | 'aq'

/** 반응 연출 효과 */
export type ReactionEffect =
  | 'explosion'
  | 'flame'
  | 'bubbles'
  | 'precipitate'
  | 'smoke'
  | 'glow'
  | 'color-change'

export interface EffectStyle {
  /** 불꽃/빛 색 */
  flameColor?: string
  /** 침전 색 */
  precipitateColor?: string
  /** 반응 후 용액 색 (color-change) */
  solutionColor?: string
}

export interface KnownProduct {
  formula: string
  coef: number
  state: MatterState
  nameKo: string
  nameEn: string
  bond: BondType
  /** true면 [3D 분자 도감]에 등록되는 공유 결합 분자 */
  molecule?: boolean
}

export interface KnownReaction {
  id: string
  nameKo: string
  /** 반응물: 화학종 키 → 계수 */
  reactants: Record<SpeciesKey, number>
  products: KnownProduct[]
  /** 반응에 반드시 필요한 조건 */
  conditions: Partial<Conditions>
  /** 반응식 1회(쓰인 계수 기준) 표준 엔탈피 변화 (kJ) */
  deltaH: number
  reversible?: boolean
  effects: ReactionEffect[]
  style?: EffectStyle
  description: string
}

/** 루이스 구조 / VSEPR 분석 결과 */
export interface MoleculeStructure {
  /** 중심 원자 기호 (이원자 분자는 첫 번째 원자) */
  central: string
  /** 주변 원자 기호 */
  ligand: string
  /** 주변 원자 수 (이원자 분자는 1) */
  ligandCount: number
  /** 중심-주변 결합 차수 */
  bondOrder: number
  /** 중심 원자 비공유 전자쌍 수 */
  lonePairs: number
  /** 중심 원자 홀전자 수 (라디칼) */
  unpaired: number
  /** 주변 원자 1개당 비공유 전자쌍 수 */
  ligandLonePairs: number
  /** 이원자 분자일 때 첫 원자의 비공유 전자쌍 (= lonePairs) */
  diatomic: boolean
  stericNumber: number
  geometryKo: string
  geometryEn: string
  /** 대표 결합각 (°), 이원자 분자는 null */
  bondAngle: number | null
  octet: 'ok' | 'incomplete' | 'expanded' | 'violated'
}

export type Stability = 'stable' | 'virtual'

export interface ProductInfo {
  formula: string
  nameKo: string
  nameEn: string
  state?: MatterState
  bond: BondType
  /** 두 원소 간 전기음성도 차이 (계산 가능할 때) */
  deltaChi: number | null
  stability: Stability
  /** 루이스 구조 개념 설명 */
  lewis: string[]
  /** 이온 결합: 양이온/음이온 정보 (루이스 도식용) */
  ions?: { cation: string; cationCharge: number; cationCount: number; anion: string; anionCharge: number; anionCount: number }
  structure?: MoleculeStructure
  /** [3D 분자 도감] 등록 ID (공유 결합 분자만) */
  moleculeId?: string
  notes: string[]
}

export type ReactionResult =
  | { status: 'empty'; message: string }
  | { status: 'no-reaction'; title: string; message: string; suggestions?: string[] }
  | {
      status: 'needs-conditions'
      title: string
      missing: ConditionKey[]
      message: string
      balance: Record<SpeciesKey, number>
    }
  | {
      status: 'insufficient'
      title: string
      equation: string
      balance: Record<SpeciesKey, number>
      message: string
    }
  | {
      status: 'success'
      source: 'known' | 'computed' | 'flame-test'
      title: string
      equation: string
      /** 반응식이 몇 번 진행되었는지 (투입량 기준) */
      units: number
      balance: Record<SpeciesKey, number>
      leftovers: Record<SpeciesKey, number>
      products: ProductInfo[]
      deltaH: { value: number; estimated: boolean } | null
      effects: ReactionEffect[]
      style: EffectStyle
      description: string
      /** 다른 가능한 생성물 화학식 (알고리즘 계산 시) */
      alternatives: { formula: string; stability: Stability }[]
      /** 이번 반응으로 도감에 등록할 분자 ID */
      moleculeIds: string[]
    }
