/**
 * 알고리즘 결합 계산(chemistryEngine Step 2)에 쓰는 참조 데이터.
 * 화학식 문자열은 엔진이 만드는 표기(양이온 성분 먼저, 1은 생략)와 같아야 한다.
 */

/** 실제로 존재·안정하게 알려진 화합물 → [안정적인 화합물] 배지 */
export const STABLE_COMPOUNDS = new Set<string>([
  // 수소 화합물
  'H2O', 'H2S', 'H2Se', 'HF', 'HCl', 'HBr', 'HI', 'NH3', 'PH3', 'AsH3', 'CH4', 'SiH4', 'GeH4',
  'LiH', 'NaH', 'KH', 'RbH', 'CsH', 'MgH2', 'CaH2', 'SrH2', 'BaH2', 'AlH3',
  // 산화물
  'Li2O', 'Na2O', 'K2O', 'Rb2O', 'Cs2O', 'BeO', 'MgO', 'CaO', 'SrO', 'BaO', 'RaO',
  'B2O3', 'CO', 'CO2', 'N2O3', 'N2O5', 'Al2O3', 'SiO2', 'P2O3', 'P2O5', 'SO2', 'SO3', 'OF2',
  'Cl2O', 'Cl2O7', 'ClO2', 'Sc2O3', 'TiO', 'Ti2O3', 'TiO2', 'VO', 'V2O3', 'VO2', 'V2O5',
  'CrO', 'Cr2O3', 'CrO3', 'MnO', 'MnO2', 'Mn2O7', 'FeO', 'Fe2O3', 'CoO', 'NiO', 'Cu2O', 'CuO', 'ZnO',
  'Ga2O3', 'GeO', 'GeO2', 'As2O3', 'As2O5', 'SeO2', 'SeO3', 'MoO2', 'MoO3', 'PdO', 'Ag2O', 'SnO', 'SnO2',
  'I2O5', 'XeO3', 'WO2', 'WO3', 'PtO2', 'Au2O3', 'HgO', 'PbO', 'PbO2', 'UO2', 'UO3', 'PuO2',
  // 할로젠화물
  'LiF', 'LiCl', 'LiBr', 'LiI', 'NaF', 'NaCl', 'NaBr', 'NaI', 'KF', 'KCl', 'KBr', 'KI',
  'RbF', 'RbCl', 'RbBr', 'RbI', 'CsF', 'CsCl', 'CsBr', 'CsI',
  'BeF2', 'BeCl2', 'MgF2', 'MgCl2', 'MgBr2', 'MgI2', 'CaF2', 'CaCl2', 'CaBr2', 'CaI2',
  'SrF2', 'SrCl2', 'BaF2', 'BaCl2', 'BaBr2', 'RaCl2',
  'BF3', 'BCl3', 'BBr3', 'AlF3', 'AlCl3', 'AlBr3', 'AlI3', 'CF4', 'CCl4', 'CBr4',
  'NF3', 'NCl3', 'SiF4', 'SiCl4', 'PF3', 'PF5', 'PCl3', 'PCl5', 'PBr3', 'PBr5', 'PI3',
  'SF4', 'SF6', 'SCl2', 'ClF', 'ClF3', 'ClF5', 'BrF', 'BrF3', 'BrF5', 'IF5', 'IF7', 'ICl', 'ICl3', 'IBr',
  'XeF2', 'XeF4', 'XeF6', 'KrF2',
  'ScCl3', 'TiCl3', 'TiCl4', 'VCl3', 'VCl4', 'CrCl2', 'CrCl3', 'MnCl2', 'FeCl2', 'FeCl3', 'FeBr2', 'FeBr3',
  'CoCl2', 'NiCl2', 'CuCl', 'CuCl2', 'CuBr2', 'CuI', 'ZnF2', 'ZnCl2', 'ZnBr2', 'ZnI2',
  'GaCl3', 'GeCl4', 'AsF5', 'AsCl3', 'SeF6', 'SeCl4', 'MoCl5', 'PdCl2',
  'AgF', 'AgCl', 'AgBr', 'AgI', 'SnF2', 'SnCl2', 'SnCl4', 'WF6', 'WCl6', 'PtCl2', 'PtCl4',
  'AuCl', 'AuCl3', 'HgCl2', 'PbCl2', 'PbCl4', 'PbBr2', 'PbI2', 'UF4', 'UF6', 'UCl4', 'PuF4',
  // 질화물·인화물·탄화물·규화물
  'Li3N', 'Be3N2', 'Mg3N2', 'Ca3N2', 'Sr3N2', 'Ba3N2', 'BN', 'AlN', 'Si3N4', 'GaN', 'TiN', 'Zn3N2',
  'Ca3P2', 'Zn3P2', 'AlP', 'GaP', 'Na3P', 'K3P', 'SiC', 'Al4C3', 'Be2C', 'TiC', 'WC', 'Mg2Si', 'GaAs',
  // 황화물·셀레늄화물
  'Li2S', 'Na2S', 'K2S', 'MgS', 'CaS', 'SrS', 'BaS', 'Al2S3', 'B2S3', 'CS2', 'SiS2', 'P2S5',
  'MnS', 'FeS', 'CoS', 'NiS', 'Cu2S', 'CuS', 'ZnS', 'Ag2S', 'SnS', 'SnS2', 'MoS2', 'HgS', 'PbS',
  'As2S3', 'GeS2', 'ZnSe', 'Ag2Se',
  // 다원자 이온 화합물 (3원소)
  'LiOH', 'NaOH', 'KOH', 'RbOH', 'CsOH', 'Mg(OH)2', 'Ca(OH)2', 'Sr(OH)2', 'Ba(OH)2', 'Al(OH)3',
  'Fe(OH)2', 'Fe(OH)3', 'Cu(OH)2', 'Zn(OH)2', 'Ni(OH)2', 'Co(OH)2',
  'Li2CO3', 'Na2CO3', 'K2CO3', 'MgCO3', 'CaCO3', 'SrCO3', 'BaCO3', 'FeCO3', 'ZnCO3', 'PbCO3', 'Ag2CO3',
  'LiNO3', 'NaNO3', 'KNO3', 'Mg(NO3)2', 'Ca(NO3)2', 'Ba(NO3)2', 'AgNO3', 'Cu(NO3)2', 'Zn(NO3)2', 'Pb(NO3)2', 'Fe(NO3)3',
  'Li2SO4', 'Na2SO4', 'K2SO4', 'MgSO4', 'CaSO4', 'BaSO4', 'SrSO4', 'Al2(SO4)3', 'FeSO4', 'Fe2(SO4)3',
  'CuSO4', 'ZnSO4', 'NiSO4', 'PbSO4', 'Ag2SO4',
  'Na3PO4', 'K3PO4', 'Ca3(PO4)2', 'Mg3(PO4)2', 'AlPO4', 'FePO4', 'Li3PO4',
  'NaClO3', 'KClO3', 'Ba(ClO3)2',
  'NH4F', 'NH4Cl', 'NH4Br', 'NH4I', '(NH4)2S',
  'H2SO4', 'HNO3', 'H3PO4', 'H2CO3', 'HClO3',
])

/** 관용명/특수명 */
export const SPECIAL_NAMES: Record<string, { ko: string; en: string }> = {
  H2O: { ko: '물', en: 'water' },
  NH3: { ko: '암모니아', en: 'ammonia' },
  CH4: { ko: '메테인', en: 'methane' },
  SiH4: { ko: '실레인', en: 'silane' },
  GeH4: { ko: '저메인', en: 'germane' },
  PH3: { ko: '포스핀', en: 'phosphine' },
  AsH3: { ko: '아르신', en: 'arsine' },
  BH3: { ko: '보레인', en: 'borane' },
  H2O2: { ko: '과산화 수소', en: 'hydrogen peroxide' },
  H2SO4: { ko: '황산', en: 'sulfuric acid' },
  HNO3: { ko: '질산', en: 'nitric acid' },
  H3PO4: { ko: '인산', en: 'phosphoric acid' },
  H2CO3: { ko: '탄산', en: 'carbonic acid' },
  HClO3: { ko: '염소산', en: 'chloric acid' },
  P2O5: { ko: '오산화 이인 (실제 분자는 P₄O₁₀)', en: 'phosphorus pentoxide' },
  P2S5: { ko: '오황화 이인 (실제 분자는 P₄S₁₀)', en: 'phosphorus pentasulfide' },
}

/** 이원 화합물 음이온 성분의 어근 */
export const ANION_ROOT: Record<string, { ko: string; en: string }> = {
  H: { ko: '수소화', en: 'hydride' },
  B: { ko: '붕화', en: 'boride' },
  C: { ko: '탄화', en: 'carbide' },
  N: { ko: '질화', en: 'nitride' },
  O: { ko: '산화', en: 'oxide' },
  F: { ko: '플루오린화', en: 'fluoride' },
  Si: { ko: '규화', en: 'silicide' },
  P: { ko: '인화', en: 'phosphide' },
  S: { ko: '황화', en: 'sulfide' },
  Cl: { ko: '염화', en: 'chloride' },
  Ge: { ko: '저마늄화', en: 'germanide' },
  As: { ko: '비소화', en: 'arsenide' },
  Se: { ko: '셀레늄화', en: 'selenide' },
  Br: { ko: '브로민화', en: 'bromide' },
  Sb: { ko: '안티모니화', en: 'antimonide' },
  Te: { ko: '텔루륨화', en: 'telluride' },
  I: { ko: '아이오딘화', en: 'iodide' },
}

/**
 * 다원자 이온 (3원소 조합 규칙).
 * elements: 이온을 이루는 두 원소, formula: 괄호 표기용 단위
 */
export interface PolyatomicIon {
  formula: string
  charge: number
  elements: [string, string]
  /** 이 이온을 이루는 원자 수 */
  counts: Record<string, number>
  nameKo: string
  nameEn: string
}

export const POLYATOMIC_ANIONS: PolyatomicIon[] = [
  { formula: 'OH', charge: -1, elements: ['O', 'H'], counts: { O: 1, H: 1 }, nameKo: '수산화', nameEn: 'hydroxide' },
  { formula: 'CO3', charge: -2, elements: ['C', 'O'], counts: { C: 1, O: 3 }, nameKo: '탄산', nameEn: 'carbonate' },
  { formula: 'NO3', charge: -1, elements: ['N', 'O'], counts: { N: 1, O: 3 }, nameKo: '질산', nameEn: 'nitrate' },
  { formula: 'SO4', charge: -2, elements: ['S', 'O'], counts: { S: 1, O: 4 }, nameKo: '황산', nameEn: 'sulfate' },
  { formula: 'PO4', charge: -3, elements: ['P', 'O'], counts: { P: 1, O: 4 }, nameKo: '인산', nameEn: 'phosphate' },
  { formula: 'ClO3', charge: -1, elements: ['Cl', 'O'], counts: { Cl: 1, O: 3 }, nameKo: '염소산', nameEn: 'chlorate' },
]

/** 암모늄 이온 (N, H) — 할로젠·황과 이온 화합물을 만든다 */
export const AMMONIUM = { formula: 'NH4', charge: 1, counts: { N: 1, H: 4 }, nameKo: '암모늄', nameEn: 'ammonium' } as const

/** 합금 관용명. 키는 원소 기호를 알파벳순 정렬 후 '-'로 연결 */
export const ALLOY_NAMES: Record<string, { ko: string; en: string; note: string }> = {
  'Cu-Zn': { ko: '황동 (놋쇠)', en: 'brass', note: '악기·장식품·탄피에 쓰이는 노란빛 합금입니다.' },
  'Cu-Sn': { ko: '청동', en: 'bronze', note: '인류 최초의 합금 중 하나로 청동기 시대를 열었습니다.' },
  'Cu-Sn-Zn': { ko: '포금 (건메탈)', en: 'gunmetal', note: '대포와 선박 부품에 쓰였던 내식성 청동입니다.' },
  'Cr-Fe': { ko: '크로뮴강 (스테인리스강 계열)', en: 'chromium steel', note: '크로뮴 산화막이 녹을 막아 줍니다.' },
  'Cr-Fe-Ni': { ko: '스테인리스강 (18-8)', en: 'stainless steel', note: '주방 기구·의료 기구에 쓰이는 대표적인 스테인리스강입니다.' },
  'Fe-Ni': { ko: '인바 (불변강)', en: 'Invar', note: '열팽창이 거의 없어 정밀 기기와 시계에 쓰입니다(1920 노벨 물리학상).' },
  'Fe-Mn': { ko: '망가니즈강', en: 'manganese steel', note: '충격에 강해 철도 레일 교차부와 굴착기 날에 쓰입니다.' },
  'Fe-W': { ko: '텅스텐강', en: 'tungsten steel', note: '고온에서도 단단해 절삭 공구(고속도강)에 쓰입니다.' },
  'Fe-Mo': { ko: '몰리브데넘강', en: 'molybdenum steel', note: '고온 강도가 높아 엔진 부품에 쓰입니다.' },
  'Fe-V': { ko: '바나듐강', en: 'vanadium steel', note: '포드 모델 T에 쓰인 가볍고 강한 강철입니다.' },
  'Ag-Au': { ko: '일렉트럼 (호박금)', en: 'electrum', note: '자연에서 산출되며 최초의 주화 재료였습니다.' },
  'Au-Cu': { ko: '로즈 골드', en: 'rose gold', note: '구리가 섞여 붉은빛이 도는 금 합금입니다.' },
  'Ag-Cu': { ko: '스털링 실버', en: 'sterling silver', note: '은 92.5%에 구리를 섞어 단단하게 만든 합금입니다.' },
  'Pb-Sn': { ko: '땜납', en: 'solder', note: '녹는점이 낮아 전자 부품 납땜에 쓰였습니다(현재는 무연 땜납으로 대체).' },
  'Al-Mg': { ko: '마그날륨', en: 'magnalium', note: '가볍고 단단하며, 가루는 불꽃놀이에 쓰입니다.' },
  'Al-Cu': { ko: '두랄루민 계열 합금', en: 'duralumin-type alloy', note: '가볍고 강해 항공기 동체에 쓰였습니다.' },
  'Al-Cu-Mg': { ko: '두랄루민', en: 'duralumin', note: '비행선과 항공기의 뼈대가 된 고강도 알루미늄 합금입니다.' },
  'Ni-Ti': { ko: '니티놀 (형상 기억 합금)', en: 'nitinol', note: '구부려도 온도를 올리면 원래 모양으로 돌아옵니다.' },
  'Cu-Ni': { ko: '백동 (큐프로니켈)', en: 'cupronickel', note: '은색 동전(한국 500원·100원 주화)의 재료입니다.' },
  'Co-Cr': { ko: '코발트-크로뮴 합금 (스텔라이트 계열)', en: 'cobalt-chromium alloy', note: '마모에 강해 인공 관절과 터빈 날개에 쓰입니다.' },
  'K-Na': { ko: '나트륨-칼륨 합금 (NaK)', en: 'NaK', note: '상온에서 액체인 금속 합금으로 원자로 냉각재에 쓰였습니다.' },
}
