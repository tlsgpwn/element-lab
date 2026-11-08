import { covalentRadius } from '../../utils/vseprCalculator'

/**
 * CPK(Jmol) 원자 색상 표준.
 * 탄소는 표준상 검은색/회색 계열이지만 어두운 배경에서 보이도록 중간 회색을 쓴다.
 */
const CPK: Record<string, string> = {
  H: '#FFFFFF', He: '#D9FFFF', Li: '#CC80FF', Be: '#C2FF00', B: '#FFB5B5', C: '#7A7A7A', N: '#3050F8', O: '#FF0D0D',
  F: '#90E050', Ne: '#B3E3F5', Na: '#AB5CF2', Mg: '#8AFF00', Al: '#BFA6A6', Si: '#F0C8A0', P: '#FF8000', S: '#FFFF30',
  Cl: '#1FF01F', Ar: '#80D1E3', K: '#8F40D4', Ca: '#3DFF00', Ga: '#C28F8F', Ge: '#668F8F', As: '#BD80E3', Se: '#FFA100',
  Br: '#A62929', Kr: '#5CB8D1', Sn: '#668080', Sb: '#9E63B5', Te: '#D47A00', I: '#940094', Xe: '#429EB0',
}

export function cpkColor(symbol: string): string {
  return CPK[symbol] ?? '#FF1493'
}

/** 비공유 전자쌍 구름 색 */
export const LONE_PAIR_COLOR = '#c084fc'
/** 홀전자(라디칼) 구름 색 */
export const RADICAL_COLOR = '#fbbf24'
/** 쌍극자 화살표 색 */
export const DIPOLE_COLOR = '#f472b6'

/** 공-막대 모형의 원자 구 반지름 (공유 결합 반지름에 비례) */
export function atomRadius(symbol: string): number {
  return symbol === 'H' ? 0.22 : 0.2 + (covalentRadius(symbol) / 100) * 0.3
}
