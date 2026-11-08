/** [3D 분자 도감] 기본 내장 분자 (실험실 발견 여부와 관계없이 항상 열람 가능) */
export interface BuiltinMolecule {
  id: string
  /** 한 줄 설명 */
  blurb: string
}

export const BUILTIN_MOLECULES: BuiltinMolecule[] = [
  { id: 'H2O', blurb: '비공유 전자쌍 2개가 결합을 눌러 104.5°로 굽은 생명의 분자' },
  { id: 'CO2', blurb: '극성 결합 두 개가 정반대로 상쇄되는 무극성 직선 분자' },
  { id: 'CH4', blurb: '네 결합이 가장 멀리 떨어진 정사면체의 표준 모형' },
  { id: 'NH3', blurb: '비공유 전자쌍 1개가 꼭대기를 차지한 삼각뿔' },
  { id: 'BF3', blurb: '옥텟이 6개뿐인 평면 삼각형 분자 (전자쌍 받개)' },
  { id: 'SF6', blurb: '여섯 결합이 90°로 뻗은 정팔면체 (확장된 옥텟)' },
  { id: 'PCl5', blurb: '축 방향 90°와 적도 방향 120°가 공존하는 삼각쌍뿔' },
  { id: 'BeCl2', blurb: '기체 상태에서 직선형인 전자 부족 분자' },
  { id: 'SO2', blurb: '비공유 전자쌍 1개로 굽은 AB₂E 분자' },
  { id: 'H2S', blurb: '물과 같은 굽은형이지만 결합각은 약 92°' },
  { id: 'CCl4', blurb: '극성 결합 넷이 대칭으로 상쇄된 무극성 정사면체' },
  { id: 'PCl3', blurb: '비공유 전자쌍이 있는 삼각뿔형 염화물' },
  { id: 'NF3', blurb: 'NH₃와 같은 모양이지만 쌍극자가 서로 상쇄되어 작음' },
  { id: 'SF4', blurb: '적도의 비공유 전자쌍 때문에 생긴 시소형' },
  { id: 'ClF3', blurb: '비공유 전자쌍 2개가 적도에 앉은 T자형' },
  { id: 'XeF2', blurb: '비공유 전자쌍 3개가 적도를 채운 직선형' },
  { id: 'XeF4', blurb: '비공유 전자쌍 2개가 위아래로 마주 본 평면 사각형' },
  { id: 'BrF5', blurb: '비공유 전자쌍 1개가 꼭대기를 누른 사각뿔' },
  { id: 'HCl', blurb: '전자쌍이 염소 쪽으로 치우친 극성 이원자 분자' },
  { id: 'N2', blurb: '삼중 결합으로 매우 안정한 공기의 주성분' },
  { id: 'O2', blurb: '이중 결합으로 이어진 산소 분자' },
  { id: 'H2SO4', blurb: '중심 S 주위 정사면체 + 바깥 –OH를 가진 산소산' },
]
