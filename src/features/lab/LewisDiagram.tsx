import { ELEMENT_BY_SYMBOL } from '../../utils/molecule'
import { formatCharge } from '../../utils/formula'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import type { ProductInfo } from '../../types/reaction'
import { lewisKind } from './lewisSupport'

const W = 280
const H = 200
const DOT = '#e2e8f0'

const colorOf = (sym: string) => {
  const el = ELEMENT_BY_SYMBOL.get(sym)
  return el ? CATEGORY_THEME[el.category].hex : '#e2e8f0'
}

function Atom({ x, y, sym }: { x: number; y: number; sym: string }) {
  return (
    <text x={x} y={y} textAnchor="middle" dominantBaseline="central" fontSize={22} fontWeight={800} fill={colorOf(sym)}>
      {sym}
    </text>
  )
}

/** (x,y)에서 angle 방향으로 거리 r 위치에 전자쌍(점 2개) */
function Pair({ x, y, angle, r = 20, single = false }: { x: number; y: number; angle: number; r?: number; single?: boolean }) {
  const cx = x + Math.cos(angle) * r
  const cy = y + Math.sin(angle) * r
  const px = -Math.sin(angle) * 4
  const py = Math.cos(angle) * 4
  if (single) return <circle cx={cx} cy={cy} r={2.4} fill="#fbbf24" />
  return (
    <>
      <circle cx={cx + px} cy={cy + py} r={2.4} fill={DOT} />
      <circle cx={cx - px} cy={cy - py} r={2.4} fill={DOT} />
    </>
  )
}

/** 결합선 (결합 차수만큼 평행선) */
function Bond({ x1, y1, x2, y2, order }: { x1: number; y1: number; x2: number; y2: number; order: number }) {
  const len = Math.hypot(x2 - x1, y2 - y1)
  const ux = (x2 - x1) / len
  const uy = (y2 - y1) / len
  const sx = x1 + ux * 16
  const sy = y1 + uy * 16
  const ex = x2 - ux * 16
  const ey = y2 - uy * 16
  const nx = -uy * 5
  const ny = ux * 5
  return (
    <>
      {Array.from({ length: order }, (_, i) => {
        const off = i - (order - 1) / 2
        return (
          <line key={i} x1={sx + nx * off} y1={sy + ny * off} x2={ex + nx * off} y2={ey + ny * off} stroke="#94a3b8" strokeWidth={2.2} strokeLinecap="round" />
        )
      })}
    </>
  )
}

/** 영역 수별 2D 배치 각도(라디안). 4개는 루이스 관례(좌·우·아래·위)를 따른다 */
function slotAngles(d: number): number[] {
  const deg = (a: number) => (a * Math.PI) / 180
  if (d === 4) return [180, 0, 90, 270].map(deg)
  if (d === 2) return [180, 0].map(deg)
  if (d === 3) return [210, 330, 90].map(deg)
  // 5·6개: 십자(좌·우·위·아래) 먼저, 나머지는 대각선 → XeF₄는 십자 + 대각선 비공유 전자쌍
  if (d === 5) return [180, 0, 270, 90, 315].map(deg)
  if (d === 6) return [180, 0, 270, 90, 315, 135].map(deg)
  return Array.from({ length: d }, (_, i) => deg(180 + (360 / d) * i))
}

function Covalent({ p }: { p: ProductInfo }) {
  const s = p.structure!
  const cx = W / 2
  const cy = H / 2

  if (s.diatomic) {
    const ax = cx - 45
    const bx = cx + 45
    const lpA = s.lonePairs
    const lpB = s.ligandLonePairs
    const sides = (n: number, outward: number) => [outward, outward - Math.PI / 2, outward + Math.PI / 2].slice(0, n)
    return (
      <>
        <Bond x1={ax} y1={cy} x2={bx} y2={cy} order={s.bondOrder} />
        <Atom x={ax} y={cy} sym={s.central} />
        <Atom x={bx} y={cy} sym={s.ligand} />
        {sides(lpA, Math.PI).map((a, i) => <Pair key={`a${i}`} x={ax} y={cy} angle={a} />)}
        {sides(lpB, 0).map((a, i) => <Pair key={`b${i}`} x={bx} y={cy} angle={a} />)}
        {s.unpaired > 0 && <Pair x={ax} y={cy} angle={-Math.PI / 2 - 0.6} single />}
      </>
    )
  }

  const d = s.ligandCount + s.lonePairs + s.unpaired
  const angles = slotAngles(d)
  const R = s.ligandCount > 4 ? 66 : 72
  const ligandAngles = angles.slice(0, s.ligandCount)
  const lpAngles = angles.slice(s.ligandCount, s.ligandCount + s.lonePairs)
  const unpairedAngles = angles.slice(s.ligandCount + s.lonePairs)

  return (
    <>
      {ligandAngles.map((a, i) => {
        const lx = cx + Math.cos(a) * R
        const ly = cy + Math.sin(a) * R
        const lpCount = s.ligandLonePairs
        const lpDirs = [a, a - Math.PI / 2, a + Math.PI / 2].slice(0, lpCount)
        return (
          <g key={i}>
            <Bond x1={cx} y1={cy} x2={lx} y2={ly} order={s.bondOrder} />
            <Atom x={lx} y={ly} sym={s.ligand} />
            {lpDirs.map((da, j) => <Pair key={j} x={lx} y={ly} angle={da} r={17} />)}
          </g>
        )
      })}
      <Atom x={cx} y={cy} sym={s.central} />
      {lpAngles.map((a, i) => <Pair key={`lp${i}`} x={cx} y={cy} angle={a} r={22} />)}
      {unpairedAngles.map((a, i) => <Pair key={`u${i}`} x={cx} y={cy} angle={a} r={22} single />)}
    </>
  )
}

function Ionic({ p }: { p: ProductInfo }) {
  const ions = p.ions!
  const cy = H / 2
  const cx1 = W / 2 - 62
  const ax = W / 2 + 62
  // 양이온: 대괄호 + 원소 기호, 오른쪽 위에 전하
  const half1 = (ions.cation.length + 2) * 7.5
  return (
    <>
      <text x={cx1} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={24} fontWeight={800} fill={colorOf(ions.cation)}>
        [{ions.cation}]
      </text>
      <text x={cx1 + half1 + 2} y={cy - 14} fontSize={15} fill="#fda4af" fontWeight={700}>{formatCharge(ions.cationCharge)}</text>
      {ions.cationCount > 1 && <text x={cx1} y={cy + 36} textAnchor="middle" fontSize={13} fill="#94a3b8">× {ions.cationCount}</text>}

      {/* 음이온: 전자 8개(4쌍)를 대괄호로 감싸고 전하 표시 */}
      <text x={ax - 34} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={34} fontWeight={300} fill="#64748b">[</text>
      <text x={ax + 34} y={cy} textAnchor="middle" dominantBaseline="central" fontSize={34} fontWeight={300} fill="#64748b">]</text>
      <Atom x={ax} y={cy} sym={ions.anion} />
      {[0, Math.PI / 2, Math.PI, -Math.PI / 2].map((a, i) => <Pair key={i} x={ax} y={cy} angle={a} r={19} />)}
      <text x={ax + 42} y={cy - 18} fontSize={15} fill="#7dd3fc" fontWeight={700}>{formatCharge(ions.anionCharge)}</text>
      {ions.anionCount > 1 && <text x={ax} y={cy + 40} textAnchor="middle" fontSize={13} fill="#94a3b8">× {ions.anionCount}</text>}
    </>
  )
}

function Metallic() {
  const pts = Array.from({ length: 12 }, (_, i) => ({ x: 60 + (i % 4) * 54, y: 55 + Math.floor(i / 4) * 45 }))
  return (
    <>
      {pts.map((pt, i) => (
        <g key={i}>
          <circle cx={pt.x} cy={pt.y} r={13} fill="#facc1522" stroke="#facc15" strokeWidth={1.2} />
          <text x={pt.x} y={pt.y} textAnchor="middle" dominantBaseline="central" fontSize={13} fill="#fde68a">+</text>
        </g>
      ))}
      {pts.map((pt, i) => (
        <circle key={`e${i}`} cx={pt.x + 27} cy={pt.y + 22} r={2.6} fill="#38bdf8" />
      ))}
      <text x={W / 2} y={H - 12} textAnchor="middle" fontSize={11} fill="#94a3b8">양이온 격자 + 자유 전자(e⁻)</text>
    </>
  )
}

/** 생성물 루이스 구조 도식. 그릴 수 없는 구조면 null */
export function LewisDiagram({ product }: { product: ProductInfo }) {
  const kind = lewisKind(product)
  if (!kind) return null
  const body = kind === 'metallic' ? <Metallic /> : kind === 'ionic' ? <Ionic p={product} /> : <Covalent p={product} />
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full max-w-[280px]" role="img" aria-label={`${product.formula} 루이스 구조`}>
      {body}
    </svg>
  )
}
