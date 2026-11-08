import type { MatterState } from '../types/reaction'

/** 실험실 기본 시약 선반 (원소 해금과 무관하게 항상 사용 가능) */
export interface Reagent {
  formula: string
  nameKo: string
  state: MatterState
  /** 챔버 액체/기체 표현 색 */
  color: string
  description: string
}

export const REAGENTS: Reagent[] = [
  { formula: 'H2O', nameKo: '물', state: 'l', color: '#38bdf8', description: '알칼리 금속과 격렬히 반응합니다.' },
  { formula: 'HCl', nameKo: '염산', state: 'aq', color: '#a5f3fc', description: '활성이 큰 금속을 녹이며 수소 기체를 냅니다.' },
  { formula: 'H2O2', nameKo: '과산화 수소수', state: 'aq', color: '#e0f2fe', description: '촉매(MnO₂)를 만나면 빠르게 분해됩니다.' },
  { formula: 'AgNO3', nameKo: '질산 은 수용액', state: 'aq', color: '#f1f5f9', description: '염화 이온과 만나면 흰색 침전을 만듭니다.' },
  { formula: 'NaCl', nameKo: '염화 나트륨 수용액', state: 'aq', color: '#e2e8f0', description: '소금물. 염화 이온(Cl⁻)의 공급원입니다.' },
  { formula: 'CuSO4', nameKo: '황산 구리(II) 수용액', state: 'aq', color: '#3b82f6', description: '구리 이온 때문에 파란색을 띱니다.' },
  { formula: 'CH4', nameKo: '메테인', state: 'g', color: '#cbd5e1', description: '천연가스의 주성분. 산소와 함께 태울 수 있습니다.' },
  { formula: 'CaCO3', nameKo: '탄산 칼슘', state: 's', color: '#f8fafc', description: '석회석. 강하게 가열하면 분해됩니다.' },
]

export const REAGENT_BY_FORMULA: ReadonlyMap<string, Reagent> = new Map(REAGENTS.map((r) => [r.formula, r]))
