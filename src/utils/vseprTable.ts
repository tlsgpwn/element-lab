/**
 * VSEPR 기하 구조표 (단일 정의 지점).
 * 키: `${입체수 SN}-${비공유 전자쌍 수 E}` → AB(SN−E)E(E)
 */
export interface GeometryInfo {
  ko: string
  en: string
  /** 대표 결합각 (°) */
  angle: number
  /** 화면 표기용 결합각 문자열 */
  angleLabel: string
}

export const VSEPR_TABLE: Record<string, GeometryInfo> = {
  '2-0': { ko: '직선형', en: 'linear', angle: 180, angleLabel: '180°' },
  '3-0': { ko: '평면 삼각형', en: 'trigonal planar', angle: 120, angleLabel: '120°' },
  '3-1': { ko: '굽은형', en: 'bent', angle: 119, angleLabel: '약 119°' },
  '4-0': { ko: '정사면체형', en: 'tetrahedral', angle: 109.5, angleLabel: '109.5°' },
  '4-1': { ko: '삼각뿔형', en: 'trigonal pyramidal', angle: 107, angleLabel: '약 107°' },
  '4-2': { ko: '굽은형', en: 'bent', angle: 104.5, angleLabel: '약 104.5°' },
  '5-0': { ko: '삼각쌍뿔형', en: 'trigonal bipyramidal', angle: 90, angleLabel: '90° / 120°' },
  '5-1': { ko: '시소형', en: 'seesaw', angle: 90, angleLabel: '약 90° / 120°' },
  '5-2': { ko: 'T자형', en: 'T-shaped', angle: 90, angleLabel: '약 90°' },
  '5-3': { ko: '직선형', en: 'linear', angle: 180, angleLabel: '180°' },
  '6-0': { ko: '정팔면체형', en: 'octahedral', angle: 90, angleLabel: '90°' },
  '6-1': { ko: '사각뿔형', en: 'square pyramidal', angle: 90, angleLabel: '약 90°' },
  '6-2': { ko: '평면 사각형', en: 'square planar', angle: 90, angleLabel: '90°' },
}
