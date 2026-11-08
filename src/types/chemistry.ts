export type ElementCategory =
  | 'alkali-metal'
  | 'alkaline-earth'
  | 'transition-metal'
  | 'post-transition'
  | 'metalloid'
  | 'reactive-nonmetal'
  | 'halogen'
  | 'noble-gas'
  | 'lanthanide'
  | 'actinide'

export type Phase = 'solid' | 'liquid' | 'gas'

export interface ChemicalElement {
  atomicNumber: number
  symbol: string
  nameKo: string
  nameEn: string
  /** 표준 원자량. 안정 동위원소가 없는 원소는 가장 안정한 동위원소의 질량수 */
  atomicMass: number
  /** 1~7 */
  period: number
  /** 1~18, 란타넘족/악티늄족(f-블록)은 null */
  group: number | null
  /** 란타넘족/악티늄족 플래그 */
  isFBlock: boolean
  /** 주기율표 렌더링 좌표 (본표 1~7행, f-블록은 9~10행) */
  gridRow: number
  /** 주기율표 렌더링 좌표 (1~18열) */
  gridCol: number
  category: ElementCategory
  phaseAtSTP: Phase
  /** 폴링 척도 */
  electronegativity: number | null
  /** 주요 산화수 */
  oxidationStates: number[]
  /** 원자가 전자 수 (전이 금속은 ns + (n-1)d 전자 수 = 족 번호 기준) */
  valenceElectrons: number
  /** 위첨자 유니코드 표기. 예: "1s² 2s² 2p⁴" */
  electronConfig: string
  /** 불꽃 반응 색상 HEX */
  flameColor: string | null
  /** 과학사/일상 스토리 2~3개 (상세 데이터 미입력 원소는 빈 배열) */
  trivia: string[]
}
