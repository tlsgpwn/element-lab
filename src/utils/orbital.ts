/**
 * 수소 유사 원자 오비탈 계산 (순수 함수, Three.js 의존성 없음)
 *
 * ψ(n,l,m) = R_nl(r) · Y_lm(θ,φ)  (원자 단위: 길이 = 보어 반지름 a₀, Z = 1)
 * - R_nl: 일반화 라게르 다항식으로 계산한 지름 함수
 * - Y_lm: 실수 구면 조화 함수 (px·py·pz, dxy … 처럼 교과서에서 쓰는 실수 오비탈)
 * 좌표는 화학 관례(x, y, z; z가 위)를 쓴다. 3D 장면 좌표 변환은 화면 쪽에서 한다.
 */

export type Vec3 = [number, number, number]

export interface OrbitalId {
  n: number
  l: number
  /** 실수 오비탈 지표: m > 0 → cos(mφ), m < 0 → sin(|m|φ) */
  m: number
}

export const SUBSHELL_LETTER = ['s', 'p', 'd', 'f'] as const
export const MAX_N = 7
export const MAX_L = 3

/* ------------------------------ 이름 ------------------------------ */

/** 실수 오비탈 아래첨자 이름. 예: (2, 0) → "z²", (1, 1) → "x" */
const SUFFIX: Record<string, string> = {
  '0,0': '',
  '1,0': 'z', '1,1': 'x', '1,-1': 'y',
  '2,0': 'z²', '2,1': 'xz', '2,-1': 'yz', '2,2': 'x²−y²', '2,-2': 'xy',
  '3,0': 'z³', '3,1': 'xz²', '3,-1': 'yz²', '3,2': 'z(x²−y²)', '3,-2': 'xyz', '3,3': 'x(x²−3y²)', '3,-3': 'y(3x²−y²)',
}

export function orbitalSuffix(l: number, m: number): string {
  return SUFFIX[`${l},${m}`] ?? ''
}

/** "2p" 같은 부껍질 이름 */
export function subshellName(n: number, l: number): string {
  return `${n}${SUBSHELL_LETTER[l]}`
}

/** 화면 표시 순서: m = 0, +1, −1, +2, −2 … (pz, px, py / dz², dxz, dyz, dx²−y², dxy) */
export function mValues(l: number): number[] {
  const out = [0]
  for (let k = 1; k <= l; k++) out.push(k, -k)
  return out
}

/* ------------------------------ 특수 함수 ------------------------------ */

/** 일반화 라게르 다항식 L_k^α(x) */
function laguerre(k: number, alpha: number, x: number): number {
  if (k === 0) return 1
  let prev = 1
  let cur = 1 + alpha - x
  for (let i = 1; i < k; i++) {
    const next = ((2 * i + 1 + alpha - x) * cur - (i + alpha) * prev) / (i + 1)
    prev = cur
    cur = next
  }
  return cur
}

/** 연관 르장드르 함수 P_l^m(x), m ≥ 0 */
function legendre(l: number, m: number, x: number): number {
  let pmm = 1
  const s = Math.sqrt(Math.max(0, 1 - x * x))
  // 콘던-쇼틀리 위상(−1)^m은 생략: px의 + 로브가 +x를 향하는 교과서 표기와 맞춘다
  for (let i = 1; i <= m; i++) pmm *= (2 * i - 1) * s
  if (l === m) return pmm
  let pmm1 = x * (2 * m + 1) * pmm
  if (l === m + 1) return pmm1
  for (let ll = m + 2; ll <= l; ll++) {
    const pll = ((2 * ll - 1) * x * pmm1 - (ll + m - 1) * pmm) / (ll - m)
    pmm = pmm1
    pmm1 = pll
  }
  return pmm1
}

/** 지름 함수 R_nl(r) (정규화 상수 제외: 모양만 필요) */
export function radialR(n: number, l: number, r: number): number {
  const rho = (2 * r) / n
  return Math.pow(rho, l) * Math.exp(-rho / 2) * laguerre(n - l - 1, 2 * l + 1, rho)
}

/** 실수 구면 조화 함수 Y_lm(θ, φ) (정규화 상수 제외) */
export function angularY(l: number, m: number, theta: number, phi: number): number {
  const p = legendre(l, Math.abs(m), Math.cos(theta))
  if (m > 0) return p * Math.cos(m * phi)
  if (m < 0) return p * Math.sin(-m * phi)
  return p
}

/* ------------------------------ 지름 분포 ------------------------------ */

export interface RadialSample {
  r: number
  /** 지름 방향 확률 분포 P(r) = r²R², 최댓값 1로 정규화 */
  p: number
}

/** 탐색 범위 (보어 반지름 단위) */
const searchRadius = (n: number) => 4 * n * n + 12

/** P(r) 표와 누적 분포 */
function radialTable(n: number, l: number, steps = 1600) {
  const rMax = searchRadius(n)
  const rs: number[] = []
  const ps: number[] = []
  for (let i = 0; i <= steps; i++) {
    const r = (rMax * i) / steps
    const R = radialR(n, l, r)
    rs.push(r)
    ps.push(r * r * R * R)
  }
  const cum: number[] = [0]
  for (let i = 1; i < ps.length; i++) cum.push(cum[i - 1] + (ps[i] + ps[i - 1]) / 2)
  const total = cum[cum.length - 1] || 1
  return { rs, ps, cum: cum.map((c) => c / total) }
}

/** 전자를 발견할 확률이 99%가 되는 반지름 (화면 크기 기준) */
export function orbitalExtent(n: number, l: number): number {
  const { rs, cum } = radialTable(n, l)
  const i = cum.findIndex((c) => c >= 0.99)
  return rs[i < 0 ? rs.length - 1 : i]
}

export function radialDistribution(n: number, l: number, points = 160): { samples: RadialSample[]; extent: number } {
  const extent = orbitalExtent(n, l) * 1.05
  const raw: RadialSample[] = []
  for (let i = 0; i <= points; i++) {
    const r = (extent * i) / points
    const R = radialR(n, l, r)
    raw.push({ r, p: r * r * R * R })
  }
  const max = Math.max(...raw.map((s) => s.p)) || 1
  return { samples: raw.map((s) => ({ r: s.r, p: s.p / max })), extent }
}

/** 지름 마디(R = 0이 되는 반지름, r > 0) — 개수는 n − l − 1 */
export function radialNodes(n: number, l: number): number[] {
  const nodes: number[] = []
  const rMax = searchRadius(n)
  const steps = 4000
  let prev = radialR(n, l, 1e-6)
  for (let i = 1; i <= steps; i++) {
    const r = (rMax * i) / steps
    const cur = radialR(n, l, r)
    if (prev !== 0 && Math.sign(cur) !== Math.sign(prev)) {
      // 이분법으로 다듬기
      let a = (rMax * (i - 1)) / steps
      let b = r
      for (let k = 0; k < 40; k++) {
        const mid = (a + b) / 2
        if (Math.sign(radialR(n, l, mid)) === Math.sign(radialR(n, l, a))) a = mid
        else b = mid
      }
      nodes.push(Math.round(((a + b) / 2) * 100) / 100)
    }
    prev = cur
  }
  return nodes.slice(0, n - l - 1)
}

/* ------------------------------ 3D 데이터 ------------------------------ */

/** 시드 기반 난수 (같은 오비탈 → 같은 점 배치) */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function maxAbsY(l: number, m: number): number {
  let max = 0
  for (let i = 0; i <= 90; i++) {
    const th = (Math.PI * i) / 90
    for (let j = 0; j < 180; j++) max = Math.max(max, Math.abs(angularY(l, m, th, (2 * Math.PI * j) / 180)))
  }
  return max || 1
}

export interface LobeMesh {
  /** 화학 좌표 (x, y, z), 최대 반지름 1로 정규화 */
  positions: Float32Array
  /** 각 꼭짓점의 위상 부호 (+1 / −1) */
  signs: Float32Array
  indices: Uint32Array
}

/**
 * 경계면(로브) 모형: 반지름을 |Y_lm(θ,φ)|로 둔 각도 분포 곡면.
 * 교과서의 아령형(p)·클로버형(d) 그림이 이 방식이다. 부호는 위상(파동함수의 ±)이다.
 */
export function lobeMesh(l: number, m: number, thetaSteps = 96, phiSteps = 192): LobeMesh {
  const maxY = maxAbsY(l, m)
  const positions: number[] = []
  const signs: number[] = []
  for (let i = 0; i <= thetaSteps; i++) {
    const th = (Math.PI * i) / thetaSteps
    for (let j = 0; j <= phiSteps; j++) {
      const ph = (2 * Math.PI * j) / phiSteps
      const y = angularY(l, m, th, ph)
      const r = l === 0 ? 1 : Math.abs(y) / maxY
      positions.push(r * Math.sin(th) * Math.cos(ph), r * Math.sin(th) * Math.sin(ph), r * Math.cos(th))
      signs.push(y >= 0 ? 1 : -1)
    }
  }
  const indices: number[] = []
  const row = phiSteps + 1
  for (let i = 0; i < thetaSteps; i++) {
    for (let j = 0; j < phiSteps; j++) {
      const a = i * row + j
      const b = a + row
      indices.push(a, b, a + 1, b, b + 1, a + 1)
    }
  }
  return { positions: new Float32Array(positions), signs: new Float32Array(signs), indices: new Uint32Array(indices) }
}

export interface ElectronCloud {
  /** 화학 좌표, orbitalExtent 기준으로 최대 1 근처로 정규화 */
  positions: Float32Array
  signs: Float32Array
  /** 정규화에 쓴 실제 반지름 (보어 반지름) */
  extent: number
}

/**
 * 전자 구름 모형: |ψ|²에 비례하는 확률로 점을 찍는다.
 * 반지름은 P(r) 누적 분포의 역함수로, 방향은 |Y|² 기각 표본추출로 뽑는다.
 */
export function electronCloud({ n, l, m }: OrbitalId, count = 26000): ElectronCloud {
  const rand = mulberry32(n * 1000 + l * 100 + (m + 10))
  const { rs, cum } = radialTable(n, l)
  const extent = orbitalExtent(n, l)
  const maxY2 = maxAbsY(l, m) ** 2
  const positions = new Float32Array(count * 3)
  const signs = new Float32Array(count)

  const sampleR = () => {
    const u = rand()
    let lo = 0
    let hi = cum.length - 1
    while (lo < hi) {
      const mid = (lo + hi) >> 1
      if (cum[mid] < u) lo = mid + 1
      else hi = mid
    }
    const i = Math.max(1, lo)
    const t = (u - cum[i - 1]) / ((cum[i] - cum[i - 1]) || 1)
    return rs[i - 1] + t * (rs[i] - rs[i - 1])
  }

  let k = 0
  let guard = 0
  while (k < count && guard < count * 60) {
    guard++
    const cz = 2 * rand() - 1
    const ph = 2 * Math.PI * rand()
    const th = Math.acos(cz)
    const y = angularY(l, m, th, ph)
    if (l > 0 && rand() * maxY2 > y * y) continue
    const r = sampleR()
    const st = Math.sqrt(1 - cz * cz)
    positions[k * 3] = (r * st * Math.cos(ph)) / extent
    positions[k * 3 + 1] = (r * st * Math.sin(ph)) / extent
    positions[k * 3 + 2] = (r * cz) / extent
    signs[k] = Math.sign(radialR(n, l, r) * (l === 0 ? 1 : y)) || 1
    k++
  }
  return { positions: positions.subarray(0, k * 3), signs: signs.subarray(0, k), extent }
}

/* ------------------------------ 설명 데이터 ------------------------------ */

/** 각 마디(마디면·마디 원뿔) 설명 */
const ANGULAR_NODES: Record<string, string> = {
  '1,0': 'xy 평면', '1,1': 'yz 평면', '1,-1': 'xz 평면',
  '2,0': '원뿔 2개 (z축과 약 54.7°)', '2,1': 'xy 평면, yz 평면', '2,-1': 'xy 평면, xz 평면',
  '2,2': '대각선 평면 2개 (x = ±y)', '2,-2': 'xz 평면, yz 평면',
}

export function angularNodeText(l: number, m: number): string {
  if (l === 0) return '없음'
  return ANGULAR_NODES[`${l},${m}`] ?? `마디면·마디 원뿔 ${l}개`
}

export function shapeText(l: number, m: number): string {
  if (l === 0) return '공 모양(구형). 방향에 상관없이 전자 분포가 같습니다.'
  if (l === 1) return '아령 모양. 원자핵을 지나는 마디면을 사이에 두고 두 로브의 위상(±)이 반대입니다.'
  if (l === 2 && m === 0) return 'z축 방향 아령 + 가운데를 감싼 도넛(고리) 모양입니다.'
  if (l === 2) return '네 잎 클로버 모양. 마주 보는 로브끼리 위상이 같습니다.'
  return '여러 개의 로브가 복잡하게 배열된 모양입니다. 란타넘족·악티늄족의 성질을 결정합니다.'
}

/* ------------------------------ 전자 배치 ------------------------------ */

export interface SubshellFill {
  n: number
  l: number
  electrons: number
}

const NOBLE_CORE: Record<string, string> = {
  He: '1s2',
  Ne: '[He] 2s2 2p6',
  Ar: '[Ne] 3s2 3p6',
  Kr: '[Ar] 3d10 4s2 4p6',
  Xe: '[Kr] 4d10 5s2 5p6',
  Rn: '[Xe] 4f14 5d10 6s2 6p6',
}

const SUPER_TO_DIGIT: Record<string, string> = { '⁰': '0', '¹': '1', '²': '2', '³': '3', '⁴': '4', '⁵': '5', '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9' }

/** "[Ar] 3d¹⁰ 4s¹" → 부껍질별 전자 수 (원자 코어 전개, 에너지 순서 정렬) */
export function parseElectronConfig(config: string): SubshellFill[] {
  const ascii = config.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]/g, (c) => SUPER_TO_DIGIT[c])
  const out: SubshellFill[] = []
  const expand = (cfg: string) => {
    for (const token of cfg.trim().split(/\s+/)) {
      const core = /^\[(\w+)\]$/.exec(token)
      if (core) {
        expand(NOBLE_CORE[core[1]] ?? '')
        continue
      }
      const m = /^(\d)([spdf])(\d+)$/.exec(token)
      if (m) out.push({ n: Number(m[1]), l: SUBSHELL_LETTER.indexOf(m[2] as (typeof SUBSHELL_LETTER)[number]), electrons: Number(m[3]) })
    }
  }
  expand(ascii)
  // 마델룽 규칙(n + l, 같으면 n 작은 순)으로 정렬
  return out.sort((a, b) => a.n + a.l - (b.n + b.l) || a.n - b.n)
}

/**
 * 훈트 규칙에 따른 오비탈 상자 채우기.
 * 반환: 상자(m 순서는 mValues)별 [↑ 개수, ↓ 개수]
 */
export function hundBoxes(l: number, electrons: number): [number, number][] {
  const boxes = 2 * l + 1
  return Array.from({ length: boxes }, (_, i) => [electrons > i ? 1 : 0, electrons > boxes + i ? 1 : 0])
}
