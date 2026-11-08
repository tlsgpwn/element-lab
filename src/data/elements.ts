import type { ChemicalElement, ElementCategory, Phase } from '../types/chemistry'
import { toSuperscriptConfig } from '../lib/format'

/* ------------------------------------------------------------------ *
 * 1) 118개 원소 기본 정보: [기호, 한국어명, 영문명, 원자량]
 *    원자량: IUPAC 표준 원자량(약식). 안정 동위원소가 없는 원소는
 *    가장 안정한 동위원소의 질량수(정수)로 표기한다.
 * ------------------------------------------------------------------ */
type BaseRow = [symbol: string, nameKo: string, nameEn: string, atomicMass: number]

const BASE: BaseRow[] = [
  ['H', '수소', 'Hydrogen', 1.008],
  ['He', '헬륨', 'Helium', 4.0026],
  ['Li', '리튬', 'Lithium', 6.94],
  ['Be', '베릴륨', 'Beryllium', 9.0122],
  ['B', '붕소', 'Boron', 10.81],
  ['C', '탄소', 'Carbon', 12.011],
  ['N', '질소', 'Nitrogen', 14.007],
  ['O', '산소', 'Oxygen', 15.999],
  ['F', '플루오린', 'Fluorine', 18.998],
  ['Ne', '네온', 'Neon', 20.18],
  ['Na', '나트륨', 'Sodium', 22.99],
  ['Mg', '마그네슘', 'Magnesium', 24.305],
  ['Al', '알루미늄', 'Aluminium', 26.982],
  ['Si', '규소', 'Silicon', 28.085],
  ['P', '인', 'Phosphorus', 30.974],
  ['S', '황', 'Sulfur', 32.06],
  ['Cl', '염소', 'Chlorine', 35.45],
  ['Ar', '아르곤', 'Argon', 39.948],
  ['K', '칼륨', 'Potassium', 39.098],
  ['Ca', '칼슘', 'Calcium', 40.078],
  ['Sc', '스칸듐', 'Scandium', 44.956],
  ['Ti', '타이타늄', 'Titanium', 47.867],
  ['V', '바나듐', 'Vanadium', 50.942],
  ['Cr', '크로뮴', 'Chromium', 51.996],
  ['Mn', '망가니즈', 'Manganese', 54.938],
  ['Fe', '철', 'Iron', 55.845],
  ['Co', '코발트', 'Cobalt', 58.933],
  ['Ni', '니켈', 'Nickel', 58.693],
  ['Cu', '구리', 'Copper', 63.546],
  ['Zn', '아연', 'Zinc', 65.38],
  ['Ga', '갈륨', 'Gallium', 69.723],
  ['Ge', '저마늄', 'Germanium', 72.63],
  ['As', '비소', 'Arsenic', 74.922],
  ['Se', '셀레늄', 'Selenium', 78.971],
  ['Br', '브로민', 'Bromine', 79.904],
  ['Kr', '크립톤', 'Krypton', 83.798],
  ['Rb', '루비듐', 'Rubidium', 85.468],
  ['Sr', '스트론튬', 'Strontium', 87.62],
  ['Y', '이트륨', 'Yttrium', 88.906],
  ['Zr', '지르코늄', 'Zirconium', 91.224],
  ['Nb', '나이오븀', 'Niobium', 92.906],
  ['Mo', '몰리브데넘', 'Molybdenum', 95.95],
  ['Tc', '테크네튬', 'Technetium', 98],
  ['Ru', '루테늄', 'Ruthenium', 101.07],
  ['Rh', '로듐', 'Rhodium', 102.91],
  ['Pd', '팔라듐', 'Palladium', 106.42],
  ['Ag', '은', 'Silver', 107.87],
  ['Cd', '카드뮴', 'Cadmium', 112.41],
  ['In', '인듐', 'Indium', 114.82],
  ['Sn', '주석', 'Tin', 118.71],
  ['Sb', '안티모니', 'Antimony', 121.76],
  ['Te', '텔루륨', 'Tellurium', 127.6],
  ['I', '아이오딘', 'Iodine', 126.9],
  ['Xe', '제논', 'Xenon', 131.29],
  ['Cs', '세슘', 'Caesium', 132.91],
  ['Ba', '바륨', 'Barium', 137.33],
  ['La', '란타넘', 'Lanthanum', 138.91],
  ['Ce', '세륨', 'Cerium', 140.12],
  ['Pr', '프라세오디뮴', 'Praseodymium', 140.91],
  ['Nd', '네오디뮴', 'Neodymium', 144.24],
  ['Pm', '프로메튬', 'Promethium', 145],
  ['Sm', '사마륨', 'Samarium', 150.36],
  ['Eu', '유로퓸', 'Europium', 151.96],
  ['Gd', '가돌리늄', 'Gadolinium', 157.25],
  ['Tb', '터븀', 'Terbium', 158.93],
  ['Dy', '디스프로슘', 'Dysprosium', 162.5],
  ['Ho', '홀뮴', 'Holmium', 164.93],
  ['Er', '어븀', 'Erbium', 167.26],
  ['Tm', '툴륨', 'Thulium', 168.93],
  ['Yb', '이터븀', 'Ytterbium', 173.05],
  ['Lu', '루테튬', 'Lutetium', 174.97],
  ['Hf', '하프늄', 'Hafnium', 178.49],
  ['Ta', '탄탈럼', 'Tantalum', 180.95],
  ['W', '텅스텐', 'Tungsten', 183.84],
  ['Re', '레늄', 'Rhenium', 186.21],
  ['Os', '오스뮴', 'Osmium', 190.23],
  ['Ir', '이리듐', 'Iridium', 192.22],
  ['Pt', '백금', 'Platinum', 195.08],
  ['Au', '금', 'Gold', 196.97],
  ['Hg', '수은', 'Mercury', 200.59],
  ['Tl', '탈륨', 'Thallium', 204.38],
  ['Pb', '납', 'Lead', 207.2],
  ['Bi', '비스무트', 'Bismuth', 208.98],
  ['Po', '폴로늄', 'Polonium', 209],
  ['At', '아스타틴', 'Astatine', 210],
  ['Rn', '라돈', 'Radon', 222],
  ['Fr', '프랑슘', 'Francium', 223],
  ['Ra', '라듐', 'Radium', 226],
  ['Ac', '악티늄', 'Actinium', 227],
  ['Th', '토륨', 'Thorium', 232.04],
  ['Pa', '프로트악티늄', 'Protactinium', 231.04],
  ['U', '우라늄', 'Uranium', 238.03],
  ['Np', '넵투늄', 'Neptunium', 237],
  ['Pu', '플루토늄', 'Plutonium', 244],
  ['Am', '아메리슘', 'Americium', 243],
  ['Cm', '퀴륨', 'Curium', 247],
  ['Bk', '버클륨', 'Berkelium', 247],
  ['Cf', '캘리포늄', 'Californium', 251],
  ['Es', '아인슈타이늄', 'Einsteinium', 252],
  ['Fm', '페르뮴', 'Fermium', 257],
  ['Md', '멘델레븀', 'Mendelevium', 258],
  ['No', '노벨륨', 'Nobelium', 259],
  ['Lr', '로렌슘', 'Lawrencium', 266],
  ['Rf', '러더포듐', 'Rutherfordium', 267],
  ['Db', '더브늄', 'Dubnium', 268],
  ['Sg', '시보귬', 'Seaborgium', 269],
  ['Bh', '보륨', 'Bohrium', 270],
  ['Hs', '하슘', 'Hassium', 269],
  ['Mt', '마이트너륨', 'Meitnerium', 278],
  ['Ds', '다름슈타튬', 'Darmstadtium', 281],
  ['Rg', '뢴트게늄', 'Roentgenium', 282],
  ['Cn', '코페르니슘', 'Copernicium', 285],
  ['Nh', '니호늄', 'Nihonium', 286],
  ['Fl', '플레로븀', 'Flerovium', 289],
  ['Mc', '모스코븀', 'Moscovium', 290],
  ['Lv', '리버모륨', 'Livermorium', 293],
  ['Ts', '테네신', 'Tennessine', 294],
  ['Og', '오가네손', 'Oganesson', 294],
]

/* ------------------------------------------------------------------ *
 * 2) 원자 번호 → 주기 / 족 / 표 좌표 / 카테고리 / 상온 상태 계산
 * ------------------------------------------------------------------ */
const PERIOD_ENDS = [2, 10, 18, 36, 54, 86, 118]

function periodOf(z: number): number {
  return PERIOD_ENDS.findIndex((end) => z <= end) + 1
}

function layoutOf(z: number): Pick<ChemicalElement, 'period' | 'group' | 'isFBlock' | 'gridRow' | 'gridCol'> {
  const period = periodOf(z)
  // f-블록: La–Lu(57–71), Ac–Lr(89–103) → 표 하단 9·10행, 3~17열
  if (z >= 57 && z <= 71) return { period, group: null, isFBlock: true, gridRow: 9, gridCol: 3 + (z - 57) }
  if (z >= 89 && z <= 103) return { period, group: null, isFBlock: true, gridRow: 10, gridCol: 3 + (z - 89) }

  const start = period === 1 ? 1 : PERIOD_ENDS[period - 2] + 1
  const pos = z - start
  let group: number
  if (period === 1) group = z === 1 ? 1 : 18
  else if (period <= 3) group = pos < 2 ? pos + 1 : pos + 11
  else if (period <= 5) group = pos + 1
  else group = pos < 2 ? pos + 1 : pos - 13 // 6·7주기: f-블록 15개를 건너뜀
  return { period, group, isFBlock: false, gridRow: period, gridCol: group }
}

const CATEGORY_BY_Z: Partial<Record<number, ElementCategory>> = {}
const assign = (cat: ElementCategory, zs: number[]) => zs.forEach((z) => (CATEGORY_BY_Z[z] = cat))
assign('alkali-metal', [3, 11, 19, 37, 55, 87])
assign('alkaline-earth', [4, 12, 20, 38, 56, 88])
assign('reactive-nonmetal', [1, 6, 7, 8, 15, 16, 34])
assign('halogen', [9, 17, 35, 53, 85, 117])
assign('noble-gas', [2, 10, 18, 36, 54, 86, 118])
assign('metalloid', [5, 14, 32, 33, 51, 52])
assign('post-transition', [13, 31, 49, 50, 81, 82, 83, 84, 113, 114, 115, 116])

function categoryOf(z: number): ElementCategory {
  if (z >= 57 && z <= 71) return 'lanthanide'
  if (z >= 89 && z <= 103) return 'actinide'
  return CATEGORY_BY_Z[z] ?? 'transition-metal'
}

const GASES = new Set([1, 2, 7, 8, 9, 10, 17, 18, 36, 54, 86])
const LIQUIDS = new Set([35, 80])

function phaseOf(z: number): Phase {
  if (GASES.has(z)) return 'gas'
  if (LIQUIDS.has(z)) return 'liquid'
  return 'solid' // 초중원소(104번 이후)는 예측값
}

/* ------------------------------------------------------------------ *
 * 3) 상세 화학 데이터 (55개 원소)
 *    electronConfig는 ASCII("1s2 2s2")로 입력 → 위첨자로 자동 변환
 * ------------------------------------------------------------------ */
interface Detail {
  en: number | null
  ox: number[]
  val: number
  config: string
  flame: string | null
  trivia: string[]
}

const DETAILS: Record<number, Detail> = {
  1: {
    en: 2.2, ox: [-1, 1], val: 1, config: '1s1', flame: null,
    trivia: [
      '우주에 존재하는 원자의 약 90%가 수소이며, 태양은 수소 핵융합으로 빛을 냅니다.',
      '1766년 헨리 캐번디시가 금속과 산의 반응으로 처음 분리했고, 라부아지에가 "물을 만드는 것(hydro-gen)"이라 이름 붙였습니다.',
      '1937년 힌덴부르크 비행선 화재 이후 수소 비행선 시대가 막을 내렸습니다.',
    ],
  },
  2: {
    en: null, ox: [0], val: 2, config: '1s2', flame: null,
    trivia: [
      '1868년 개기일식 때 태양 스펙트럼에서 먼저 발견되어 그리스어 태양(helios)에서 이름이 왔습니다.',
      '절대영도 근처에서도 상압에서는 얼지 않는 유일한 원소이며, 초유체가 되어 벽을 타고 기어오릅니다.',
      'MRI 장비의 초전도 자석을 냉각하는 데 액체 헬륨이 필수적으로 쓰입니다.',
    ],
  },
  3: {
    en: 0.98, ox: [1], val: 1, config: '1s2 2s1', flame: '#DC143C',
    trivia: [
      '가장 가벼운 금속으로, 물보다 밀도가 낮아 물에 뜹니다(다만 반응하며 수소를 냅니다).',
      '스마트폰과 전기차의 리튬 이온 배터리 핵심 소재로, 2019년 노벨 화학상의 주제였습니다.',
      '탄산 리튬은 조울증(양극성 장애) 치료제로도 사용됩니다.',
    ],
  },
  4: {
    en: 1.57, ox: [2], val: 2, config: '1s2 2s2', flame: null,
    trivia: [
      '에메랄드와 아쿠아마린은 베릴(녹주석)이라는 베릴륨 광물의 일종입니다.',
      'X선을 거의 흡수하지 않아 X선관의 창 재료로 쓰이며, 제임스 웹 우주망원경의 거울도 베릴륨으로 만들었습니다.',
    ],
  },
  5: {
    en: 2.04, ox: [3], val: 3, config: '1s2 2s2 2p1', flame: '#7CFC00',
    trivia: [
      '붕규산 유리(파이렉스)에 들어가 열충격에 강한 실험용 유리 기구를 만듭니다.',
      '붕소 화합물은 불꽃 반응에서 선명한 초록색을 냅니다.',
      '붕산은 안약과 바퀴벌레 퇴치제에도 쓰이는 친숙한 물질입니다.',
    ],
  },
  6: {
    en: 2.55, ox: [-4, 2, 4], val: 4, config: '1s2 2s2 2p2', flame: null,
    trivia: [
      '다이아몬드와 흑연, 그래핀, 풀러렌은 모두 탄소로만 이루어진 동소체입니다.',
      '탄소-14의 반감기(약 5730년)를 이용한 방사성 탄소 연대 측정으로 유물의 나이를 알아냅니다.',
      '지구 생명체의 모든 유기 분자는 탄소 골격을 기반으로 합니다.',
    ],
  },
  7: {
    en: 3.04, ox: [-3, 3, 5], val: 5, config: '1s2 2s2 2p3', flame: null,
    trivia: [
      '공기의 약 78%를 차지하지만 삼중 결합(N≡N)이 강해 반응성이 매우 낮습니다.',
      '하버-보슈법으로 질소를 암모니아로 바꾸는 기술이 비료 혁명을 이끌어 수십억 명을 먹여 살렸습니다.',
      '액체 질소(−196 °C)는 세포 냉동 보관과 분자 요리에 활용됩니다.',
    ],
  },
  8: {
    en: 3.44, ox: [-2], val: 6, config: '1s2 2s2 2p4', flame: null,
    trivia: [
      '지각 질량의 약 46%를 차지하는, 지각에서 가장 많은 원소입니다.',
      '약 24억 년 전 남세균의 광합성으로 대기에 산소가 쌓인 "대산화 사건"이 일어났습니다.',
      '액체 산소는 옅은 파란색이며 자석에 끌려가는 상자성을 띱니다.',
    ],
  },
  9: {
    en: 3.98, ox: [-1], val: 7, config: '1s2 2s2 2p5', flame: null,
    trivia: [
      '전기음성도가 가장 큰 원소로, 거의 모든 원소와 격렬하게 반응합니다.',
      '1886년 앙리 무아상이 분리에 성공해 노벨상을 받았지만, 그 전까지 여러 화학자가 다치거나 목숨을 잃었습니다.',
      '치약의 불소(플루오린화물)는 충치 예방에, 테플론(PTFE)은 프라이팬 코팅에 쓰입니다.',
    ],
  },
  10: {
    en: null, ox: [0], val: 8, config: '1s2 2s2 2p6', flame: null,
    trivia: [
      '네온사인의 붉은 주황빛은 네온 기체 방전에서 나오며, 다른 색은 대부분 다른 기체나 형광 코팅 덕분입니다.',
      '알려진 안정한 화합물이 전혀 없는, 가장 반응성이 낮은 원소 중 하나입니다.',
    ],
  },
  11: {
    en: 0.93, ox: [1], val: 1, config: '1s2 2s2 2p6 3s1', flame: '#FFB300',
    trivia: [
      '칼로 자를 수 있을 만큼 무르고, 물에 넣으면 격렬하게 반응하며 수소를 냅니다.',
      '가로등의 주황빛(나트륨등)은 나트륨의 D선(589 nm) 방출 때문입니다.',
      '원소 기호 Na는 라틴어 natrium에서 왔습니다.',
    ],
  },
  12: {
    en: 1.31, ox: [2], val: 2, config: '1s2 2s2 2p6 3s2', flame: null,
    trivia: [
      '연소할 때 눈부신 흰빛을 내어 초창기 카메라 플래시와 조명탄에 쓰였습니다.',
      '엽록소 분자의 중심에 마그네슘 이온이 자리 잡고 있습니다.',
      '가볍고 단단해 노트북 케이스와 자동차 휠 합금에 사용됩니다.',
    ],
  },
  13: {
    en: 1.61, ox: [3], val: 3, config: '1s2 2s2 2p6 3s2 3p1', flame: null,
    trivia: [
      '19세기에는 금보다 비싸서 나폴레옹 3세가 귀빈에게만 알루미늄 식기를 내놓았다고 전해집니다.',
      '1886년 홀-에루 전기분해법이 개발되며 값싼 금속이 되었습니다.',
      '표면에 얇은 산화막(Al₂O₃)이 생겨 내부를 부식으로부터 보호합니다.',
    ],
  },
  14: {
    en: 1.9, ox: [-4, 4], val: 4, config: '1s2 2s2 2p6 3s2 3p2', flame: null,
    trivia: [
      '산소 다음으로 지각에 많은 원소이며, 모래와 석영의 주성분(SiO₂)입니다.',
      '반도체 칩의 핵심 소재로, 실리콘밸리라는 이름의 유래가 되었습니다.',
    ],
  },
  15: {
    en: 2.19, ox: [-3, 3, 5], val: 5, config: '1s2 2s2 2p6 3s2 3p3', flame: null,
    trivia: [
      '1669년 연금술사 헤니히 브란트가 금을 만들려고 소변을 끓이다가 발견했습니다.',
      '백린은 어둠 속에서 빛나며(그리스어 "빛을 나르는 자"), 공기 중에서 자연 발화합니다.',
      'DNA의 뼈대와 에너지 분자 ATP에 인산기로 들어 있습니다.',
    ],
  },
  16: {
    en: 2.58, ox: [-2, 4, 6], val: 6, config: '1s2 2s2 2p6 3s2 3p4', flame: null,
    trivia: [
      '노란 고체로 화산 주변에서 자연 상태로 발견되며, 성경에서는 "유황"으로 등장합니다.',
      '계란 썩는 냄새는 황화수소(H₂S), 양파와 마늘 냄새도 황 화합물 때문입니다.',
      '황산은 생산량이 국가 산업 수준의 지표로 쓰일 만큼 중요한 화학 물질입니다.',
    ],
  },
  17: {
    en: 3.16, ox: [-1, 1, 3, 5, 7], val: 7, config: '1s2 2s2 2p6 3s2 3p5', flame: null,
    trivia: [
      '황록색의 유독 기체로, 제1차 세계대전에서 화학 무기로 사용된 어두운 역사가 있습니다.',
      '수돗물 소독과 수영장 살균에 쓰여 수인성 전염병을 크게 줄였습니다.',
      '나트륨과 결합하면 식탁의 소금(NaCl)이 됩니다.',
    ],
  },
  18: {
    en: null, ox: [0], val: 8, config: '1s2 2s2 2p6 3s2 3p6', flame: null,
    trivia: [
      '공기의 약 0.93%를 차지해 지구 대기에서 세 번째로 많은 기체입니다.',
      '1894년 레일리와 램지가 발견했으며, 그리스어 "게으른(argos)"에서 이름이 왔습니다.',
      '반응성이 없어 백열전구 충전 기체와 용접 보호 가스로 쓰입니다.',
    ],
  },
  19: {
    en: 0.82, ox: [1], val: 1, config: '[Ar] 4s1', flame: '#C8A2C8',
    trivia: [
      '바나나에 풍부한 영양소로, 신경 신호 전달에 꼭 필요합니다.',
      '원소 기호 K는 라틴어 kalium(재, 알칼리)에서 왔습니다.',
      '1807년 험프리 데이비가 전기분해로 처음 분리한 원소입니다.',
    ],
  },
  20: {
    en: 1.0, ox: [2], val: 2, config: '[Ar] 4s2', flame: '#FF5A1F',
    trivia: [
      '뼈와 치아의 주성분이며, 인체에서 가장 많은 금속 원소입니다.',
      '석회암, 대리석, 조개껍데기는 모두 탄산 칼슘(CaCO₃)입니다.',
      '불꽃 반응에서 주황빛이 도는 붉은색을 냅니다.',
    ],
  },
  21: {
    en: 1.36, ox: [3], val: 3, config: '[Ar] 3d1 4s2', flame: null,
    trivia: [
      '멘델레예프가 "에카붕소"로 존재를 예언했고, 1879년 닐손이 발견했습니다.',
      '알루미늄-스칸듐 합금은 고급 자전거 프레임과 야구 배트에 쓰입니다.',
    ],
  },
  22: {
    en: 1.54, ox: [2, 3, 4], val: 4, config: '[Ar] 3d2 4s2', flame: null,
    trivia: [
      '강철만큼 강하면서 약 45% 가볍고 부식에 강해 항공기와 인공 관절에 쓰입니다.',
      '이산화 타이타늄(TiO₂)은 흰색 페인트, 자외선 차단제, 치약의 백색 안료입니다.',
      '그리스 신화의 거인족 티탄에서 이름이 왔습니다.',
    ],
  },
  23: {
    en: 1.63, ox: [2, 3, 4, 5], val: 5, config: '[Ar] 3d3 4s2', flame: null,
    trivia: [
      '화합물이 다양한 색을 띠어 스칸디나비아의 아름다움의 여신 바나디스에서 이름을 땄습니다.',
      '헨리 포드는 바나듐강을 사용해 모델 T 자동차를 가볍고 튼튼하게 만들었습니다.',
    ],
  },
  24: {
    en: 1.66, ox: [2, 3, 6], val: 6, config: '[Ar] 3d5 4s1', flame: null,
    trivia: [
      '스테인리스강의 녹 방지 핵심 성분이며, 크롬 도금은 반짝이는 표면을 만듭니다.',
      '루비의 붉은색과 에메랄드의 초록색 모두 미량의 크로뮴 이온 때문입니다.',
      '화합물의 색이 화려해 그리스어 chroma(색)에서 이름이 왔습니다.',
    ],
  },
  25: {
    en: 1.55, ox: [2, 4, 7], val: 7, config: '[Ar] 3d5 4s2', flame: null,
    trivia: [
      '과망가니즈산 칼륨(KMnO₄)은 진한 보라색으로, 산화제와 소독제로 쓰입니다.',
      '건전지(알칼리 전지)의 양극 재료로 이산화 망가니즈가 사용됩니다.',
    ],
  },
  26: {
    en: 1.83, ox: [2, 3], val: 8, config: '[Ar] 3d6 4s2', flame: null,
    trivia: [
      '질량 기준으로 지구 전체에서 가장 많은 원소이며, 지구 핵의 주성분입니다.',
      '혈액의 헤모글로빈 속 철 이온이 산소를 운반해 피가 붉게 보입니다.',
      '별 내부 핵융합은 철에서 멈추며, 더 무거운 원소는 초신성 폭발 등에서 만들어집니다.',
    ],
  },
  27: {
    en: 1.88, ox: [2, 3], val: 9, config: '[Ar] 3d7 4s2', flame: null,
    trivia: [
      '독일 광부들이 은을 방해하는 장난꾸러기 요정 코볼트(Kobold)에서 이름을 따왔습니다.',
      '도자기와 유리의 짙은 "코발트 블루" 색을 냅니다.',
      '비타민 B12의 중심 원자입니다.',
    ],
  },
  28: {
    en: 1.91, ox: [2], val: 10, config: '[Ar] 3d8 4s2', flame: null,
    trivia: [
      '"악마의 구리(Kupfernickel)"라는 독일 광부들의 별명에서 이름이 왔습니다.',
      '많은 동전과 스테인리스강, 전기차 배터리 양극재에 쓰입니다.',
    ],
  },
  29: {
    en: 1.9, ox: [1, 2], val: 11, config: '[Ar] 3d10 4s1', flame: '#1FC7A0',
    trivia: [
      '인류가 가장 먼저 사용한 금속 중 하나로, 주석과 섞은 청동이 청동기 시대를 열었습니다.',
      '자유의 여신상이 초록색인 이유는 구리 표면의 녹청(염기성 탄산 구리) 때문입니다.',
      '은 다음으로 전기 전도성이 좋아 전선에 널리 쓰입니다.',
    ],
  },
  30: {
    en: 1.65, ox: [2], val: 12, config: '[Ar] 3d10 4s2', flame: null,
    trivia: [
      '철을 아연으로 도금한 함석(아연 도금 강판)은 녹을 막는 대표적인 방법입니다.',
      '구리와 섞으면 황동(놋쇠)이 되어 악기와 장식품에 쓰입니다.',
      '면역 기능과 상처 회복에 필요한 필수 미량 원소입니다.',
    ],
  },
  31: {
    en: 1.81, ox: [3], val: 3, config: '[Ar] 3d10 4s2 4p1', flame: null,
    trivia: [
      '녹는점이 약 29.8 °C라 손바닥 위에 올려 두면 녹습니다.',
      '멘델레예프가 "에카알루미늄"으로 예언한 원소로, 1875년 발견되어 주기율표의 신뢰를 높였습니다.',
      '질화 갈륨(GaN)은 파란색 LED와 고속 충전기의 핵심 소재입니다.',
    ],
  },
  32: {
    en: 2.01, ox: [2, 4], val: 4, config: '[Ar] 3d10 4s2 4p2', flame: null,
    trivia: [
      '멘델레예프가 "에카규소"로 예언했으며, 1886년 독일에서 발견되어 Germany의 이름을 땄습니다.',
      '초기 트랜지스터는 실리콘이 아닌 저마늄으로 만들어졌습니다.',
    ],
  },
  33: {
    en: 2.18, ox: [-3, 3, 5], val: 5, config: '[Ar] 3d10 4s2 4p3', flame: null,
    trivia: [
      '역사적으로 "독약의 왕"이라 불리며 수많은 독살 사건에 등장했습니다.',
      '19세기 셸레 그린 같은 비소 안료가 벽지에 쓰여 건강 문제를 일으켰습니다.',
      '갈륨비소(GaAs) 반도체는 고주파 통신 칩에 사용됩니다.',
    ],
  },
  34: {
    en: 2.55, ox: [-2, 4, 6], val: 6, config: '[Ar] 3d10 4s2 4p4', flame: null,
    trivia: [
      '그리스어 selene(달)에서 이름이 왔으며, 먼저 발견된 텔루륨(지구)과 짝을 이룹니다.',
      '빛을 받으면 전기 전도도가 증가해 초기 복사기와 태양전지에 사용되었습니다.',
    ],
  },
  35: {
    en: 2.96, ox: [-1, 1, 3, 5], val: 7, config: '[Ar] 3d10 4s2 4p5', flame: null,
    trivia: [
      '상온에서 액체인 단 두 원소(브로민, 수은) 중 유일한 비금속입니다.',
      '고약한 냄새 때문에 그리스어 bromos(악취)에서 이름이 붙었습니다.',
      '고대 로마 황제의 "티리언 퍼플" 염료는 브로민이 포함된 화합물이었습니다.',
    ],
  },
  36: {
    en: 3.0, ox: [0, 2], val: 8, config: '[Ar] 3d10 4s2 4p6', flame: null,
    trivia: [
      '그리스어 kryptos(숨겨진)에서 이름이 왔으며, 1898년 액체 공기에서 발견되었습니다.',
      '1960~1983년에는 크립톤-86의 스펙트럼선 파장으로 1미터를 정의했습니다.',
      '플루오린화 크립톤(KrF₂)이라는 화합물을 만들 수 있습니다.',
    ],
  },
  37: {
    en: 0.82, ox: [1], val: 1, config: '[Kr] 5s1', flame: '#C71585',
    trivia: [
      '분광 분석에서 진한 붉은 스펙트럼선으로 발견되어 라틴어 rubidus(진홍색)에서 이름이 왔습니다.',
      '루비듐 원자시계는 GPS 위성과 통신망의 시간 기준으로 쓰입니다.',
    ],
  },
  38: {
    en: 0.95, ox: [2], val: 2, config: '[Kr] 5s2', flame: '#FF1A1A',
    trivia: [
      '불꽃놀이와 조명탄의 선명한 빨간색은 스트론튬 화합물 덕분입니다.',
      '스코틀랜드의 스트론티안 마을에서 발견된 광물에서 이름을 땄습니다.',
      '스트론튬 광격자 시계는 현존 최고 정밀도의 원자시계 중 하나입니다.',
    ],
  },
  42: {
    en: 2.16, ox: [4, 6], val: 6, config: '[Kr] 4d5 5s1', flame: null,
    trivia: [
      '처음에는 납과 혼동되어 그리스어 molybdos(납)에서 이름이 왔습니다.',
      '고강도 강철 합금에 첨가되며, 질소 고정 효소(니트로게네이스)의 핵심 원소입니다.',
    ],
  },
  46: {
    en: 2.2, ox: [2, 4], val: 10, config: '[Kr] 4d10', flame: null,
    trivia: [
      '자기 부피의 900배 이상에 달하는 수소 기체를 흡수할 수 있습니다.',
      '자동차 배기가스 정화 촉매 변환기에 백금, 로듐과 함께 쓰입니다.',
      '1802년 발견된 소행성 팔라스에서 이름을 땄습니다.',
    ],
  },
  47: {
    en: 1.93, ox: [1], val: 11, config: '[Kr] 4d10 5s1', flame: null,
    trivia: [
      '모든 금속 중 전기 전도도와 열 전도도가 가장 높습니다.',
      '은 이온의 항균 작용 때문에 예로부터 은 식기와 상처 치료에 사용되었습니다.',
      '할로젠화 은의 감광성을 이용해 필름 사진이 탄생했습니다.',
    ],
  },
  50: {
    en: 1.96, ox: [2, 4], val: 4, config: '[Kr] 4d10 5s2 5p2', flame: null,
    trivia: [
      '구리와 섞어 청동을 만들며, 통조림 캔(주석 도금 강판)에도 쓰입니다.',
      '주석 막대를 구부리면 결정이 서로 미끄러지며 "주석의 울음(tin cry)" 소리가 납니다.',
      '13 °C 이하에서는 부서지기 쉬운 회색 주석으로 변하는 "주석 페스트" 현상이 일어납니다.',
    ],
  },
  53: {
    en: 2.66, ox: [-1, 1, 5, 7], val: 7, config: '[Kr] 4d10 5s2 5p5', flame: null,
    trivia: [
      '가열하면 고체에서 바로 보라색 기체로 승화하여 그리스어 iodes(보라색)에서 이름이 왔습니다.',
      '1811년 쿠르투아가 해초 재에서 우연히 발견했습니다.',
      '갑상선 호르몬의 재료이며, 아이오딘화 소금으로 결핍증을 예방합니다.',
    ],
  },
  54: {
    en: 2.6, ox: [0, 2, 4, 6], val: 8, config: '[Kr] 4d10 5s2 5p6', flame: null,
    trivia: [
      '1962년 닐 바틀릿이 최초의 비활성 기체 화합물을 제논으로 합성해 "비활성" 통념을 깼습니다.',
      '자동차 HID 전조등과 영화관 프로젝터의 밝은 램프에 쓰입니다.',
      '이온 엔진의 추진제로 사용되어 우주 탐사선을 움직입니다.',
    ],
  },
  55: {
    en: 0.79, ox: [1], val: 1, config: '[Xe] 6s1', flame: '#5F4BDB',
    trivia: [
      '세슘-133 원자의 진동수(9,192,631,770 Hz)로 1초가 정의됩니다.',
      '녹는점이 약 28.5 °C로 따뜻한 날 녹으며, 물과 폭발적으로 반응합니다.',
      '분광 스펙트럼의 하늘색 선 때문에 라틴어 caesius(하늘색)에서 이름이 왔습니다.',
    ],
  },
  56: {
    en: 0.89, ox: [2], val: 2, config: '[Xe] 6s2', flame: '#9ACD32',
    trivia: [
      '황산 바륨은 X선을 잘 흡수해 위장 조영제(바륨 검사)로 마십니다. 물에 녹지 않아 안전합니다.',
      '불꽃놀이의 초록색은 바륨 화합물에서 나옵니다.',
    ],
  },
  74: {
    en: 2.36, ox: [4, 6], val: 6, config: '[Xe] 4f14 5d4 6s2', flame: null,
    trivia: [
      '모든 금속 중 녹는점이 가장 높아(약 3422 °C) 백열전구 필라멘트로 쓰였습니다.',
      '원소 기호 W는 독일어 이름 Wolfram에서 왔습니다.',
      '탄화 텅스텐은 매우 단단해 드릴 날과 절삭 공구에 쓰입니다.',
    ],
  },
  78: {
    en: 2.28, ox: [2, 4], val: 10, config: '[Xe] 4f14 5d9 6s1', flame: null,
    trivia: [
      '스페인어 platina(작은 은)에서 이름이 왔으며, 처음엔 불순물 취급을 받았습니다.',
      '1889~2019년 킬로그램 국제 원기는 백금-이리듐 합금으로 만들어졌습니다.',
      '항암제 시스플라틴의 중심 원자입니다.',
    ],
  },
  79: {
    en: 2.54, ox: [1, 3], val: 11, config: '[Xe] 4f14 5d10 6s1', flame: null,
    trivia: [
      '상대론적 효과로 전자 에너지 준위가 바뀌어 다른 금속과 달리 노란빛을 띱니다.',
      '1 g의 금으로 수 제곱미터를 덮는 금박을 만들 수 있을 만큼 전성이 뛰어납니다.',
      '중성자별 충돌 같은 우주의 극한 사건에서 만들어진 것으로 여겨집니다.',
    ],
  },
  80: {
    en: 2.0, ox: [1, 2], val: 12, config: '[Xe] 4f14 5d10 6s2', flame: null,
    trivia: [
      '상온에서 액체인 유일한 금속으로, 원소 기호 Hg는 "물 같은 은(hydrargyrum)"에서 왔습니다.',
      '진시황이 불로장생을 위해 수은을 먹었다는 기록이 전해집니다.',
      '독성 때문에 체온계와 형광등에서 점차 퇴출되고 있습니다(미나마타 협약).',
    ],
  },
  82: {
    en: 2.33, ox: [2, 4], val: 4, config: '[Xe] 4f14 5d10 6s2 6p2', flame: null,
    trivia: [
      '원소 기호 Pb는 라틴어 plumbum에서 왔으며, 배관공(plumber)의 어원이기도 합니다.',
      '고대 로마의 수도관과 식기에 쓰였고, 납 중독이 로마 쇠퇴의 한 원인이라는 가설도 있습니다.',
      '밀도가 높아 X선과 방사선 차폐재로 쓰입니다.',
    ],
  },
  86: {
    en: 2.2, ox: [0, 2], val: 8, config: '[Xe] 4f14 5d10 6s2 6p6', flame: null,
    trivia: [
      '우라늄 붕괴로 생기는 방사성 기체로, 지하실이나 땅에서 실내로 스며들 수 있습니다.',
      '흡연 다음가는 폐암의 주요 원인으로 꼽혀 실내 농도 측정이 권장됩니다.',
    ],
  },
  88: {
    en: 0.9, ox: [2], val: 2, config: '[Rn] 7s2', flame: '#DC143C',
    trivia: [
      '1898년 마리 퀴리와 피에르 퀴리가 피치블렌드에서 발견했습니다.',
      '20세기 초 시계 문자판의 야광 도료로 쓰였고, 이를 칠하던 "라듐 걸스"가 피폭 피해를 입었습니다.',
    ],
  },
  92: {
    en: 1.38, ox: [3, 4, 5, 6], val: 6, config: '[Rn] 5f3 6d1 7s2', flame: null,
    trivia: [
      '1789년 발견 직전 관측된 행성 천왕성(Uranus)에서 이름을 땄습니다.',
      '1896년 베크렐이 우라늄염에서 방사선을 발견하며 방사능 연구가 시작되었습니다.',
      '우라늄-235의 핵분열은 원자력 발전의 에너지원입니다.',
    ],
  },
  94: {
    en: 1.28, ox: [3, 4, 5, 6], val: 8, config: '[Rn] 5f6 7s2', flame: null,
    trivia: [
      '1940년 시보그 연구팀이 합성했으며, 당시 막 발견된 명왕성(Pluto)에서 이름을 땄습니다.',
      '플루토늄-238의 붕괴열은 보이저호와 화성 탐사 로버의 원자력 전지에 쓰입니다.',
    ],
  },
}

/* ------------------------------------------------------------------ *
 * 4) 최종 원소 배열
 * ------------------------------------------------------------------ */
export const ELEMENTS: ChemicalElement[] = BASE.map(([symbol, nameKo, nameEn, atomicMass], i) => {
  const z = i + 1
  const d = DETAILS[z]
  return {
    atomicNumber: z,
    symbol,
    nameKo,
    nameEn,
    atomicMass,
    ...layoutOf(z),
    category: categoryOf(z),
    phaseAtSTP: phaseOf(z),
    electronegativity: d?.en ?? null,
    oxidationStates: d?.ox ?? [],
    valenceElectrons: d?.val ?? 0,
    electronConfig: d ? toSuperscriptConfig(d.config) : '',
    flameColor: d?.flame ?? null,
    trivia: d?.trivia ?? [],
  }
})

export const ELEMENT_BY_Z: ReadonlyMap<number, ChemicalElement> = new Map(
  ELEMENTS.map((e) => [e.atomicNumber, e]),
)

/** 상세 데이터(전자 배치·trivia 등)가 입력된 원소인지 */
export function isDetailed(el: ChemicalElement): boolean {
  return el.trivia.length > 0
}

/** 학습/퀴즈 대상이 되는 상세 데이터 원소 (원자 번호순) */
export const LEARNABLE_ELEMENTS: ChemicalElement[] = ELEMENTS.filter(isDetailed)
