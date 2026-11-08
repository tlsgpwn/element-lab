import type { KnownReaction } from '../types/reaction'

/**
 * 대표적인 실제 화학 반응 사전.
 * - reactants 키: 원소 기호(이원자 분자 원소는 X₂ 1개 단위) 또는 시약 화학식
 * - deltaH: 표준 생성 엔탈피(ΔH°f, 298 K)로 계산한 반응 엔탈피, 쓰인 계수 기준 kJ
 * - 같은 반응물 조합에 여러 반응이 있으면(예: C + O₂ → CO / CO₂) 엔진이 투입 비율로 고른다
 */
export const KNOWN_REACTIONS: KnownReaction[] = [
  /* ---------------- 수소 ---------------- */
  {
    id: 'h2-o2', nameKo: '수소의 연소 (물 합성)',
    reactants: { H: 2, O: 1 },
    products: [{ formula: 'H2O', coef: 2, state: 'l', nameKo: '물', nameEn: 'water', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: -571.6,
    effects: ['explosion', 'flame'], style: { flameColor: '#9ad7ff' },
    description: '점화하면 "펑" 소리와 함께 폭발적으로 반응해 물이 생깁니다. 로켓 연료로도 쓰이는 반응입니다.',
  },
  {
    id: 'h2-cl2', nameKo: '염화 수소 합성',
    reactants: { H: 1, Cl: 1 },
    products: [{ formula: 'HCl', coef: 2, state: 'g', nameKo: '염화 수소', nameEn: 'hydrogen chloride', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: -184.6,
    effects: ['explosion', 'flame'], style: { flameColor: '#e2f5b0' },
    description: '열이나 강한 빛을 받으면 연쇄 반응으로 폭발합니다. 물에 녹이면 염산이 됩니다.',
  },
  {
    id: 'h2-f2', nameKo: '플루오린화 수소 합성',
    reactants: { H: 1, F: 1 },
    products: [{ formula: 'HF', coef: 2, state: 'g', nameKo: '플루오린화 수소', nameEn: 'hydrogen fluoride', bond: 'covalent-polar', molecule: true }],
    conditions: {}, deltaH: -546.6,
    effects: ['explosion'], style: { flameColor: '#fef9c3' },
    description: '플루오린은 반응성이 너무 커서 어둡고 차가운 곳에서도 수소와 폭발적으로 반응합니다.',
  },
  {
    id: 'h2-br2', nameKo: '브로민화 수소 합성',
    reactants: { H: 1, Br: 1 },
    products: [{ formula: 'HBr', coef: 2, state: 'g', nameKo: '브로민화 수소', nameEn: 'hydrogen bromide', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: -72.6,
    effects: ['glow', 'color-change'], style: { flameColor: '#fb923c', solutionColor: '#fde68a' },
    description: '가열하면 적갈색 브로민 증기의 색이 옅어지며 무색의 브로민화 수소가 생깁니다.',
  },
  {
    id: 'h2-i2', nameKo: '아이오딘화 수소 합성 (가역)',
    reactants: { H: 1, I: 1 },
    products: [{ formula: 'HI', coef: 2, state: 'g', nameKo: '아이오딘화 수소', nameEn: 'hydrogen iodide', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: 53.0, reversible: true,
    effects: ['glow'], style: { flameColor: '#a78bfa' },
    description: '화학 평형의 교과서 예제입니다. 고체 아이오딘에서 출발하면 흡열 반응입니다.',
  },
  {
    id: 'haber', nameKo: '하버-보슈법 (암모니아 합성)',
    reactants: { N: 1, H: 3 },
    products: [{ formula: 'NH3', coef: 2, state: 'g', nameKo: '암모니아', nameEn: 'ammonia', bond: 'covalent-polar', molecule: true }],
    conditions: { pressure: true, catalyst: true }, deltaH: -92.2, reversible: true,
    effects: ['glow'], style: { flameColor: '#67e8f9' },
    description: '약 200기압과 철 촉매로 질소의 강한 삼중 결합을 끊어 암모니아를 만듭니다. 비료 생산의 핵심 공정입니다.',
  },
  {
    id: 'c-h2', nameKo: '메테인 합성',
    reactants: { C: 1, H: 2 },
    products: [{ formula: 'CH4', coef: 1, state: 'g', nameKo: '메테인', nameEn: 'methane', bond: 'covalent-nonpolar', molecule: true }],
    conditions: { heat: true, pressure: true, catalyst: true }, deltaH: -74.8,
    effects: ['glow'], style: { flameColor: '#93c5fd' },
    description: '고온·고압에서 니켈 촉매를 쓰면 탄소와 수소가 결합해 메테인이 됩니다.',
  },

  /* ---------------- 산소와의 반응 (연소·산화) ---------------- */
  {
    id: 'c-o2-co2', nameKo: '탄소의 완전 연소',
    reactants: { C: 1, O: 1 },
    products: [{ formula: 'CO2', coef: 1, state: 'g', nameKo: '이산화 탄소', nameEn: 'carbon dioxide', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: -393.5,
    effects: ['flame', 'glow'], style: { flameColor: '#ff8c42' },
    description: '산소가 충분하면 숯이 붉게 타며 이산화 탄소가 됩니다.',
  },
  {
    id: 'c-o2-co', nameKo: '탄소의 불완전 연소',
    reactants: { C: 2, O: 1 },
    products: [{ formula: 'CO', coef: 2, state: 'g', nameKo: '일산화 탄소', nameEn: 'carbon monoxide', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: -221.0,
    effects: ['flame'], style: { flameColor: '#60a5fa' },
    description: '산소가 부족하면 유독한 일산화 탄소가 생깁니다. 푸른 불꽃이 특징입니다.',
  },
  {
    id: 'ch4-o2', nameKo: '메테인의 연소',
    reactants: { CH4: 1, O: 2 },
    products: [
      { formula: 'CO2', coef: 1, state: 'g', nameKo: '이산화 탄소', nameEn: 'carbon dioxide', bond: 'covalent-polar', molecule: true },
      { formula: 'H2O', coef: 2, state: 'l', nameKo: '물', nameEn: 'water', bond: 'covalent-polar', molecule: true },
    ],
    conditions: { heat: true }, deltaH: -890.3,
    effects: ['flame'], style: { flameColor: '#3b82f6' },
    description: '가스레인지의 파란 불꽃입니다. 완전 연소하면 이산화 탄소와 물만 남습니다.',
  },
  {
    id: 's-o2', nameKo: '황의 연소',
    reactants: { S: 1, O: 1 },
    products: [{ formula: 'SO2', coef: 1, state: 'g', nameKo: '이산화 황', nameEn: 'sulfur dioxide', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: -296.8,
    effects: ['flame', 'smoke'], style: { flameColor: '#4f6bff' },
    description: '황은 아름다운 청보라색 불꽃을 내며 타고, 자극적인 냄새의 이산화 황이 생깁니다.',
  },
  {
    id: 'n2-o2', nameKo: '일산화 질소 생성 (번개 반응)',
    reactants: { N: 1, O: 1 },
    products: [{ formula: 'NO', coef: 2, state: 'g', nameKo: '일산화 질소', nameEn: 'nitric oxide', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: 180.5,
    effects: ['glow'], style: { flameColor: '#fde047' },
    description: '번개나 엔진 내부 같은 매우 높은 온도에서만 일어나는 흡열 반응입니다.',
  },
  {
    id: 'p-o2', nameKo: '인의 연소',
    reactants: { P: 4, O: 5 },
    products: [{ formula: 'P4O10', coef: 1, state: 's', nameKo: '십산화 사인', nameEn: 'tetraphosphorus decoxide', bond: 'covalent-polar' }],
    conditions: {}, deltaH: -2984.0,
    effects: ['flame', 'smoke'], style: { flameColor: '#fff3b0' },
    description: '백린은 공기 중에서 저절로 불붙어 짙은 흰 연기를 냅니다.',
  },
  {
    id: 'mg-o2', nameKo: '마그네슘의 연소',
    reactants: { Mg: 2, O: 1 },
    products: [{ formula: 'MgO', coef: 2, state: 's', nameKo: '산화 마그네슘', nameEn: 'magnesium oxide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -1203.4,
    effects: ['flame', 'glow', 'smoke'], style: { flameColor: '#ffffff' },
    description: '눈부신 흰빛을 내며 타서 흰 가루(산화 마그네슘)가 남습니다. 맨눈으로 보면 위험할 만큼 밝습니다.',
  },
  {
    id: 'ca-o2', nameKo: '칼슘의 연소',
    reactants: { Ca: 2, O: 1 },
    products: [{ formula: 'CaO', coef: 2, state: 's', nameKo: '산화 칼슘', nameEn: 'calcium oxide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -1270.2,
    effects: ['flame'], style: { flameColor: '#FF5A1F' },
    description: '주황빛 붉은 불꽃을 내며 생석회(산화 칼슘)가 됩니다.',
  },
  {
    id: 'li-o2', nameKo: '리튬의 연소',
    reactants: { Li: 4, O: 1 },
    products: [{ formula: 'Li2O', coef: 2, state: 's', nameKo: '산화 리튬', nameEn: 'lithium oxide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -1195.8,
    effects: ['flame'], style: { flameColor: '#DC143C' },
    description: '리튬은 진홍색 불꽃을 내며 산화 리튬이 됩니다.',
  },
  {
    id: 'na-o2', nameKo: '나트륨의 연소',
    reactants: { Na: 2, O: 1 },
    products: [{ formula: 'Na2O2', coef: 1, state: 's', nameKo: '과산화 나트륨', nameEn: 'sodium peroxide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -510.9,
    effects: ['flame'], style: { flameColor: '#FFB300' },
    description: '공기 중에서 태우면 노란 불꽃과 함께 주로 과산화 나트륨(O₂²⁻ 이온 포함)이 생깁니다.',
  },
  {
    id: 'k-o2', nameKo: '칼륨의 연소',
    reactants: { K: 1, O: 1 },
    products: [{ formula: 'KO2', coef: 1, state: 's', nameKo: '초과산화 칼륨', nameEn: 'potassium superoxide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -284.9,
    effects: ['flame'], style: { flameColor: '#C8A2C8' },
    description: '라일락빛 불꽃을 내며 초과산화 칼륨이 됩니다. 잠수함의 산소 발생 장치에 쓰이는 물질입니다.',
  },
  {
    id: 'b-o2', nameKo: '붕소의 연소',
    reactants: { B: 4, O: 3 },
    products: [{ formula: 'B2O3', coef: 2, state: 's', nameKo: '삼산화 이붕소', nameEn: 'boron trioxide', bond: 'covalent-polar' }],
    conditions: { heat: true }, deltaH: -2547.6,
    effects: ['flame'], style: { flameColor: '#7CFC00' },
    description: '붕소는 선명한 초록색 불꽃을 내며 탑니다.',
  },
  {
    id: 'al-o2', nameKo: '알루미늄의 연소',
    reactants: { Al: 4, O: 3 },
    products: [{ formula: 'Al2O3', coef: 2, state: 's', nameKo: '산화 알루미늄', nameEn: 'aluminium oxide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -3351.4,
    effects: ['flame', 'glow'], style: { flameColor: '#f8fafc' },
    description: '알루미늄 가루는 엄청난 열을 내며 탑니다. 불꽃놀이와 로켓 추진제에 쓰입니다.',
  },
  {
    id: 'si-o2', nameKo: '규소의 산화',
    reactants: { Si: 1, O: 1 },
    products: [{ formula: 'SiO2', coef: 1, state: 's', nameKo: '이산화 규소', nameEn: 'silicon dioxide', bond: 'covalent-polar' }],
    conditions: { heat: true }, deltaH: -910.9,
    effects: ['glow'], style: { flameColor: '#e0e7ff' },
    description: '석영·모래의 성분인 이산화 규소가 됩니다. 분자가 아닌 거대한 공유 결합 그물 구조입니다.',
  },
  {
    id: 'fe-rust', nameKo: '철의 녹 (산화 철(III))',
    reactants: { Fe: 4, O: 3 },
    products: [{ formula: 'Fe2O3', coef: 2, state: 's', nameKo: '산화 철(III)', nameEn: 'iron(III) oxide', bond: 'ionic' }],
    conditions: {}, deltaH: -1648.4,
    effects: ['color-change'], style: { solutionColor: '#9a3412' },
    description: '철이 산소(와 수분)를 만나 천천히 붉은 녹이 슬어 갑니다. 손난로는 이 반응의 열을 이용합니다.',
  },
  {
    id: 'cu-o2', nameKo: '구리의 산화',
    reactants: { Cu: 2, O: 1 },
    products: [{ formula: 'CuO', coef: 2, state: 's', nameKo: '산화 구리(II)', nameEn: 'copper(II) oxide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -314.6,
    effects: ['color-change', 'flame'], style: { solutionColor: '#1c1917', flameColor: '#1FC7A0' },
    description: '붉은 구리를 가열하면 표면이 검은 산화 구리(II)로 변합니다.',
  },

  /* ---------------- 할로젠과의 반응 ---------------- */
  {
    id: 'na-cl2', nameKo: '염화 나트륨 합성',
    reactants: { Na: 2, Cl: 1 },
    products: [{ formula: 'NaCl', coef: 2, state: 's', nameKo: '염화 나트륨', nameEn: 'sodium chloride', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -822.2,
    effects: ['flame', 'smoke'], style: { flameColor: '#FFB300' },
    description: '독성 금속과 독성 기체가 만나 노란 불꽃과 흰 연기를 내며 식탁의 소금이 됩니다.',
  },
  {
    id: 'k-cl2', nameKo: '염화 칼륨 합성',
    reactants: { K: 2, Cl: 1 },
    products: [{ formula: 'KCl', coef: 2, state: 's', nameKo: '염화 칼륨', nameEn: 'potassium chloride', bond: 'ionic' }],
    conditions: {}, deltaH: -873.0,
    effects: ['flame', 'smoke'], style: { flameColor: '#C8A2C8' },
    description: '칼륨은 반응성이 커서 가열하지 않아도 염소 기체 속에서 라일락빛 불꽃을 냅니다.',
  },
  {
    id: 'ca-cl2', nameKo: '염화 칼슘 합성',
    reactants: { Ca: 1, Cl: 1 },
    products: [{ formula: 'CaCl2', coef: 1, state: 's', nameKo: '염화 칼슘', nameEn: 'calcium chloride', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -795.4,
    effects: ['flame'], style: { flameColor: '#FF5A1F' },
    description: '제설제와 제습제로 쓰이는 염화 칼슘이 생깁니다.',
  },
  {
    id: 'fe-cl2', nameKo: '염화 철(III) 합성',
    reactants: { Fe: 2, Cl: 3 },
    products: [{ formula: 'FeCl3', coef: 2, state: 's', nameKo: '염화 철(III)', nameEn: 'iron(III) chloride', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -799.0,
    effects: ['glow', 'smoke'], style: { flameColor: '#f59e0b' },
    description: '뜨거운 철솜이 염소 속에서 빛을 내며 갈색 연기(염화 철(III))를 만듭니다. 염소는 철을 +3까지 산화시킵니다.',
  },
  {
    id: 'cu-cl2', nameKo: '염화 구리(II) 합성',
    reactants: { Cu: 1, Cl: 1 },
    products: [{ formula: 'CuCl2', coef: 1, state: 's', nameKo: '염화 구리(II)', nameEn: 'copper(II) chloride', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -220.1,
    effects: ['flame', 'smoke'], style: { flameColor: '#1FC7A0' },
    description: '구리 이온 특유의 청록색 불꽃이 보입니다.',
  },
  {
    id: 'al-br2', nameKo: '알루미늄과 브로민의 반응',
    reactants: { Al: 2, Br: 3 },
    products: [{ formula: 'AlBr3', coef: 2, state: 's', nameKo: '브로민화 알루미늄', nameEn: 'aluminium bromide', bond: 'ionic' }],
    conditions: {}, deltaH: -1054.4,
    effects: ['flame', 'smoke'], style: { flameColor: '#fb923c' },
    description: '알루미늄 조각을 액체 브로민에 넣으면 저절로 불꽃을 튀기며 격렬히 반응합니다.',
  },
  {
    id: 'mg-n2', nameKo: '질화 마그네슘 생성',
    reactants: { Mg: 3, N: 1 },
    products: [{ formula: 'Mg3N2', coef: 1, state: 's', nameKo: '질화 마그네슘', nameEn: 'magnesium nitride', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -461.1,
    effects: ['flame', 'glow'], style: { flameColor: '#ffffff' },
    description: '마그네슘은 공기 중에서 탈 때 산소뿐 아니라 질소와도 반응해 노란빛 질화물을 만듭니다.',
  },

  /* ---------------- 황화물 ---------------- */
  {
    id: 'fe-s', nameKo: '황화 철(II) 합성',
    reactants: { Fe: 1, S: 1 },
    products: [{ formula: 'FeS', coef: 1, state: 's', nameKo: '황화 철(II)', nameEn: 'iron(II) sulfide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -100.0,
    effects: ['glow'], style: { flameColor: '#f97316' },
    description: '철가루와 황 가루를 가열하면 붉게 빛나며 반응이 스스로 퍼져 나갑니다. 혼합물과 화합물을 비교하는 대표 실험입니다.',
  },
  {
    id: 'zn-s', nameKo: '황화 아연 합성',
    reactants: { Zn: 1, S: 1 },
    products: [{ formula: 'ZnS', coef: 1, state: 's', nameKo: '황화 아연', nameEn: 'zinc sulfide', bond: 'ionic' }],
    conditions: { heat: true }, deltaH: -206.0,
    effects: ['flame', 'smoke'], style: { flameColor: '#7dd3fc' },
    description: '순식간에 섬광과 연기를 내뿜습니다. 황화 아연은 야광 도료의 재료입니다.',
  },

  /* ---------------- 금속 + 물 ---------------- */
  {
    id: 'li-h2o', nameKo: '리튬과 물의 반응',
    reactants: { Li: 2, H2O: 2 },
    products: [
      { formula: 'LiOH', coef: 2, state: 'aq', nameKo: '수산화 리튬', nameEn: 'lithium hydroxide', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -445.4,
    effects: ['bubbles'], style: { flameColor: '#DC143C' },
    description: '리튬은 물 위에 떠서 쉭쉭 소리를 내며 비교적 차분하게 수소 기포를 냅니다.',
  },
  {
    id: 'na-h2o', nameKo: '나트륨과 물의 반응',
    reactants: { Na: 2, H2O: 2 },
    products: [
      { formula: 'NaOH', coef: 2, state: 'aq', nameKo: '수산화 나트륨', nameEn: 'sodium hydroxide', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -368.6,
    effects: ['bubbles', 'flame'], style: { flameColor: '#FFB300' },
    description: '나트륨이 녹아 은빛 구슬이 되어 물 위를 돌아다니고, 발생한 수소에 노란 불이 붙기도 합니다.',
  },
  {
    id: 'k-h2o', nameKo: '칼륨과 물의 반응',
    reactants: { K: 2, H2O: 2 },
    products: [
      { formula: 'KOH', coef: 2, state: 'aq', nameKo: '수산화 칼륨', nameEn: 'potassium hydroxide', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -393.2,
    effects: ['bubbles', 'flame', 'explosion'], style: { flameColor: '#C8A2C8' },
    description: '물에 닿자마자 라일락빛 불꽃을 내며 격렬하게 반응합니다.',
  },
  {
    id: 'rb-h2o', nameKo: '루비듐과 물의 반응',
    reactants: { Rb: 2, H2O: 2 },
    products: [
      { formula: 'RbOH', coef: 2, state: 'aq', nameKo: '수산화 루비듐', nameEn: 'rubidium hydroxide', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -390.8,
    effects: ['explosion', 'bubbles'], style: { flameColor: '#C71585' },
    description: '주기율표 아래로 갈수록 반응성이 커집니다. 루비듐은 물속에서 폭발합니다.',
  },
  {
    id: 'cs-h2o', nameKo: '세슘과 물의 반응',
    reactants: { Cs: 2, H2O: 2 },
    products: [
      { formula: 'CsOH', coef: 2, state: 'aq', nameKo: '수산화 세슘', nameEn: 'caesium hydroxide', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -404.6,
    effects: ['explosion', 'bubbles'], style: { flameColor: '#5F4BDB' },
    description: '세슘은 물에 닿는 순간 유리 수조를 깰 만큼 강하게 폭발합니다.',
  },
  {
    id: 'ca-h2o', nameKo: '칼슘과 물의 반응',
    reactants: { Ca: 1, H2O: 2 },
    products: [
      { formula: 'Ca(OH)2', coef: 1, state: 'aq', nameKo: '수산화 칼슘', nameEn: 'calcium hydroxide', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -431.2,
    effects: ['bubbles', 'color-change'], style: { solutionColor: '#f1f5f9' },
    description: '알칼리 토금속인 칼슘은 물과 꾸준히 반응하며, 수산화 칼슘 때문에 용액이 뿌옇게 흐려집니다.',
  },

  /* ---------------- 금속 + 산 ---------------- */
  {
    id: 'zn-hcl', nameKo: '아연과 염산의 반응',
    reactants: { Zn: 1, HCl: 2 },
    products: [
      { formula: 'ZnCl2', coef: 1, state: 'aq', nameKo: '염화 아연', nameEn: 'zinc chloride', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -153.9,
    effects: ['bubbles'],
    description: '아연 조각 표면에서 수소 기포가 끊임없이 올라옵니다. 실험실에서 수소를 얻는 고전적인 방법입니다.',
  },
  {
    id: 'mg-hcl', nameKo: '마그네슘과 염산의 반응',
    reactants: { Mg: 1, HCl: 2 },
    products: [
      { formula: 'MgCl2', coef: 1, state: 'aq', nameKo: '염화 마그네슘', nameEn: 'magnesium chloride', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -466.9,
    effects: ['bubbles', 'glow'], style: { flameColor: '#fca5a5' },
    description: '격렬하게 거품이 일고 시험관이 뜨거워집니다.',
  },
  {
    id: 'fe-hcl', nameKo: '철과 염산의 반응',
    reactants: { Fe: 1, HCl: 2 },
    products: [
      { formula: 'FeCl2', coef: 1, state: 'aq', nameKo: '염화 철(II)', nameEn: 'iron(II) chloride', bond: 'ionic' },
      { formula: 'H2', coef: 1, state: 'g', nameKo: '수소', nameEn: 'hydrogen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: {}, deltaH: -89.1,
    effects: ['bubbles', 'color-change'], style: { solutionColor: '#bbf7d0' },
    description: '천천히 기포가 생기며 용액이 옅은 초록색(Fe²⁺)으로 변합니다.',
  },

  /* ---------------- 수용액 반응 (침전·치환) ---------------- */
  {
    id: 'agcl-precipitate', nameKo: '염화 은 앙금 생성',
    reactants: { AgNO3: 1, NaCl: 1 },
    products: [
      { formula: 'AgCl', coef: 1, state: 's', nameKo: '염화 은', nameEn: 'silver chloride', bond: 'ionic' },
      { formula: 'NaNO3', coef: 1, state: 'aq', nameKo: '질산 나트륨', nameEn: 'sodium nitrate', bond: 'ionic' },
    ],
    conditions: {}, deltaH: -65.5,
    effects: ['precipitate'], style: { precipitateColor: '#f8fafc' },
    description: 'Ag⁺ + Cl⁻ → AgCl↓. 우유처럼 하얀 앙금이 가라앉습니다. 염화 이온 검출에 쓰입니다.',
  },
  {
    id: 'cuso4-fe', nameKo: '철과 황산 구리(II)의 치환 반응',
    reactants: { CuSO4: 1, Fe: 1 },
    products: [
      { formula: 'FeSO4', coef: 1, state: 'aq', nameKo: '황산 철(II)', nameEn: 'iron(II) sulfate', bond: 'ionic' },
      { formula: 'Cu', coef: 1, state: 's', nameKo: '구리', nameEn: 'copper', bond: 'metallic' },
    ],
    conditions: {}, deltaH: -153.9,
    effects: ['color-change', 'precipitate'], style: { solutionColor: '#86efac', precipitateColor: '#c2410c' },
    description: '철이 구리보다 반응성이 커서 구리 이온을 밀어냅니다. 파란 용액이 옅은 초록색이 되고 붉은 구리가 석출됩니다.',
  },
  {
    id: 'cuso4-zn', nameKo: '아연과 황산 구리(II)의 치환 반응',
    reactants: { CuSO4: 1, Zn: 1 },
    products: [
      { formula: 'ZnSO4', coef: 1, state: 'aq', nameKo: '황산 아연', nameEn: 'zinc sulfate', bond: 'ionic' },
      { formula: 'Cu', coef: 1, state: 's', nameKo: '구리', nameEn: 'copper', bond: 'metallic' },
    ],
    conditions: {}, deltaH: -218.7,
    effects: ['color-change', 'precipitate'], style: { solutionColor: '#e2e8f0', precipitateColor: '#c2410c' },
    description: '다니엘 전지의 원리가 되는 반응입니다. 파란색이 사라지고 구리가 석출됩니다.',
  },

  /* ---------------- 분해 반응 ---------------- */
  {
    id: 'h2o2-decomp', nameKo: '과산화 수소의 촉매 분해',
    reactants: { H2O2: 2 },
    products: [
      { formula: 'H2O', coef: 2, state: 'l', nameKo: '물', nameEn: 'water', bond: 'covalent-polar', molecule: true },
      { formula: 'O2', coef: 1, state: 'g', nameKo: '산소', nameEn: 'oxygen', bond: 'covalent-nonpolar', molecule: true },
    ],
    conditions: { catalyst: true }, deltaH: -196.0,
    effects: ['bubbles', 'smoke'],
    description: '이산화 망가니즈 촉매를 넣자 산소 거품이 폭발적으로 솟아오릅니다("코끼리 치약" 실험).',
  },
  {
    id: 'caco3-decomp', nameKo: '탄산 칼슘의 열분해',
    reactants: { CaCO3: 1 },
    products: [
      { formula: 'CaO', coef: 1, state: 's', nameKo: '산화 칼슘', nameEn: 'calcium oxide', bond: 'ionic' },
      { formula: 'CO2', coef: 1, state: 'g', nameKo: '이산화 탄소', nameEn: 'carbon dioxide', bond: 'covalent-polar', molecule: true },
    ],
    conditions: { heat: true }, deltaH: 178.3,
    effects: ['glow', 'smoke'], style: { flameColor: '#fdba74' },
    description: '석회석을 약 900 °C로 구우면 생석회와 이산화 탄소로 분해됩니다. 시멘트 제조의 첫 단계입니다.',
  },

  /* ---------------- 비활성 기체 화합물 ---------------- */
  {
    id: 'xef2', nameKo: '이플루오린화 제논 합성',
    reactants: { Xe: 1, F: 1 },
    products: [{ formula: 'XeF2', coef: 1, state: 's', nameKo: '이플루오린화 제논', nameEn: 'xenon difluoride', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true }, deltaH: -164.0,
    effects: ['glow'], style: { flameColor: '#c4b5fd' },
    description: '제논과 플루오린을 400 °C로 가열하면 무색 결정이 생깁니다. "비활성" 기체도 반응한다는 증거입니다.',
  },
  {
    id: 'xef4', nameKo: '사플루오린화 제논 합성',
    reactants: { Xe: 1, F: 2 },
    products: [{ formula: 'XeF4', coef: 1, state: 's', nameKo: '사플루오린화 제논', nameEn: 'xenon tetrafluoride', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true, pressure: true }, deltaH: -261.5,
    effects: ['glow'], style: { flameColor: '#a78bfa' },
    description: '플루오린을 과량으로 넣고 고온·고압을 걸면 평면 사각형 구조의 XeF₄가 생깁니다(1962년 첫 합성).',
  },
  {
    id: 'krf2', nameKo: '이플루오린화 크립톤 합성',
    reactants: { Kr: 1, F: 1 },
    products: [{ formula: 'KrF2', coef: 1, state: 'g', nameKo: '이플루오린화 크립톤', nameEn: 'krypton difluoride', bond: 'covalent-polar', molecule: true }],
    conditions: { heat: true, pressure: true }, deltaH: 60.2,
    effects: ['glow'], style: { flameColor: '#ddd6fe' },
    description: '흡열 화합물이라 매우 불안정합니다. 실제로는 저온 전기 방전 등 극한 조건에서 만듭니다.',
  },

  /* ---------------- 합금 ---------------- */
  {
    id: 'fe-c-steel', nameKo: '강철 제련 (탄화 철 생성)',
    reactants: { Fe: 3, C: 1 },
    products: [{ formula: 'Fe3C', coef: 1, state: 's', nameKo: '탄화 철 (시멘타이트, 강철 성분)', nameEn: 'cementite', bond: 'metallic' }],
    conditions: { heat: true }, deltaH: 25.1,
    effects: ['glow'], style: { flameColor: '#f97316' },
    description: '녹인 철에 탄소를 녹이면 단단한 강철이 됩니다. 탄소 함량이 강철의 강도를 좌우합니다.',
  },
]
