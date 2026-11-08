import { useMemo, useState } from 'react'
import { radialDistribution, radialNodes } from '../../utils/orbital'

const W = 300
const H = 150
const PAD = { l: 30, r: 10, t: 12, b: 28 }
const LINE = '#22d3ee'

/**
 * 지름 방향 확률 분포 P(r) = r²R² (단일 계열 → 범례 없이 제목으로 표시).
 * 마디 위치는 점선, 마우스를 올리면 십자선과 값이 나온다.
 */
export function RadialChart({ n, l }: { n: number; l: number }) {
  const { samples, extent } = useMemo(() => radialDistribution(n, l), [n, l])
  const nodes = useMemo(() => radialNodes(n, l), [n, l])
  const [hover, setHover] = useState<number | null>(null)

  const x = (r: number) => PAD.l + (r / extent) * (W - PAD.l - PAD.r)
  const y = (p: number) => H - PAD.b - p * (H - PAD.t - PAD.b)
  const path = samples.map((s, i) => `${i ? 'L' : 'M'}${x(s.r).toFixed(1)},${y(s.p).toFixed(1)}`).join(' ')
  const area = `${path} L${x(extent).toFixed(1)},${y(0)} L${x(0)},${y(0)} Z`
  const peak = samples.reduce((a, b) => (b.p > a.p ? b : a))

  // 눈금: 0, 중간, 끝 (보어 반지름)
  const ticks = [0, Math.round(extent / 2), Math.round(extent)]
  const h = hover !== null ? samples[hover] : null

  return (
    <figure>
      <figcaption className="mb-1 text-xs font-semibold text-slate-300">
        지름 방향 확률 분포 <span className="font-mono font-normal text-slate-500">P(r) = r²R²</span>
      </figcaption>
      <div className="relative">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full touch-none"
          role="img"
          aria-label={`${n}${['s', 'p', 'd', 'f'][l]} 오비탈의 지름 방향 확률 분포. 가장 확률이 높은 반지름은 약 ${peak.r.toFixed(1)} 보어 반지름, 지름 마디 ${nodes.length}개`}
          onPointerMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            const px = ((e.clientX - rect.left) / rect.width) * W
            const r = ((px - PAD.l) / (W - PAD.l - PAD.r)) * extent
            const i = Math.round((r / extent) * (samples.length - 1))
            setHover(i >= 0 && i < samples.length ? i : null)
          }}
          onPointerLeave={() => setHover(null)}
        >
          {/* 기준선 */}
          <line x1={PAD.l} x2={W - PAD.r} y1={y(0)} y2={y(0)} stroke="#334155" strokeWidth={1} />
          {ticks.map((t) => (
            <text key={t} x={x(t)} y={H - PAD.b + 14} textAnchor="middle" fontSize={9} fill="#64748b">
              {t}
            </text>
          ))}
          <text x={W - PAD.r} y={H - 3} textAnchor="end" fontSize={9} fill="#64748b">r (a₀, 보어 반지름)</text>

          {/* 마디 */}
          {nodes.map((r) => (
            <g key={r}>
              <line x1={x(r)} x2={x(r)} y1={PAD.t} y2={y(0)} stroke="#fb923c" strokeWidth={1} strokeDasharray="3 3" opacity={0.8} />
              <text x={x(r)} y={PAD.t - 2} textAnchor="middle" fontSize={8} fill="#fdba74">마디</text>
            </g>
          ))}

          <path d={area} fill={LINE} opacity={0.12} />
          <path d={path} fill="none" stroke={LINE} strokeWidth={2} strokeLinejoin="round" />

          {h && (
            <>
              <line x1={x(h.r)} x2={x(h.r)} y1={PAD.t} y2={y(0)} stroke="#e2e8f0" strokeWidth={1} opacity={0.5} />
              <circle cx={x(h.r)} cy={y(h.p)} r={4} fill={LINE} stroke="#0f172a" strokeWidth={2} />
            </>
          )}
        </svg>
        {h && (
          <div
            className="pointer-events-none absolute top-0 rounded-md border border-white/10 bg-slate-950/95 px-2 py-1 text-[11px] whitespace-nowrap text-slate-200 shadow-lg"
            style={{ left: `${Math.min(70, Math.max(0, (x(h.r) / W) * 100 - 15))}%` }}
          >
            r = <b className="font-mono">{h.r.toFixed(1)}</b> a₀ · 상대 확률 <b className="font-mono">{Math.round(h.p * 100)}%</b>
          </div>
        )}
      </div>
      <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
        전자를 찾을 확률이 가장 높은 거리: 약 <b className="font-mono text-slate-200">{peak.r.toFixed(1)} a₀</b>
        {nodes.length > 0
          ? ` · 확률이 0이 되는 지름 마디 ${nodes.length}개 (r = ${nodes.map((r) => r.toFixed(1)).join(', ')} a₀)`
          : ' · 지름 마디 없음'}
      </p>
    </figure>
  )
}
