import { motion } from 'framer-motion'
import {
  AlertTriangle, BookMarked, Box, Calculator, Flame, FlaskConical, Info, Lightbulb, ShieldCheck, Snowflake, Sparkles, Wand2, Zap,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { BOND_LABEL, CONDITION_LABEL, IONIC_THRESHOLD, NONPOLAR_THRESHOLD, speciesLabel } from '../../utils/chemistryEngine'
import { formatFormula } from '../../utils/formula'
import type { BondType, ConditionKey, MatterState, ProductInfo, ReactionResult } from '../../types/reaction'
import { LewisDiagram } from './LewisDiagram'
import { lewisKind } from './lewisSupport'

const BOND_STYLE: Record<BondType, string> = {
  ionic: 'bg-rose-500/15 text-rose-200 ring-rose-400/40',
  'covalent-polar': 'bg-sky-500/15 text-sky-200 ring-sky-400/40',
  'covalent-nonpolar': 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40',
  metallic: 'bg-amber-500/15 text-amber-200 ring-amber-400/40',
}

const STATE_LABEL: Record<MatterState, string> = { s: '고체', l: '액체', g: '기체', aq: '수용액' }

const CONDITION_ICON: Record<ConditionKey, typeof Flame> = { heat: Flame, pressure: Zap, catalyst: Sparkles }

interface ResultPanelProps {
  result: ReactionResult
  newMoleculeIds: string[]
  onAutoBalance: () => void
}

export function ResultPanel({ result, newMoleculeIds, onAutoBalance }: ResultPanelProps) {
  if (result.status === 'empty') return null

  if (result.status === 'no-reaction') {
    return (
      <Shell tone="slate" icon={<Info className="h-5 w-5 text-slate-300" />} title={result.title}>
        <p className="text-sm text-slate-300">{result.message}</p>
        {result.suggestions && result.suggestions.length > 0 && (
          <ul className="mt-3 space-y-1">
            {result.suggestions.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm text-cyan-200">
                <Lightbulb className="h-4 w-4 shrink-0 text-amber-300" /> {s}
              </li>
            ))}
          </ul>
        )}
      </Shell>
    )
  }

  if (result.status === 'needs-conditions') {
    return (
      <Shell tone="amber" icon={<AlertTriangle className="h-5 w-5 text-amber-300" />} title={result.title}>
        <p className="text-sm text-amber-100/90">{result.message}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {result.missing.map((m) => {
            const Icon = CONDITION_ICON[m]
            return (
              <span key={m} className="flex items-center gap-1.5 rounded-full bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200 ring-1 ring-amber-400/40">
                <Icon className="h-3.5 w-3.5" /> {CONDITION_LABEL[m]} 필요
              </span>
            )
          })}
        </div>
      </Shell>
    )
  }

  if (result.status === 'insufficient') {
    return (
      <Shell tone="cyan" icon={<Calculator className="h-5 w-5 text-cyan-300" />} title={result.title}>
        <p className="font-mono text-lg text-white">{result.equation}</p>
        <p className="mt-1 text-sm text-slate-300">{result.message}</p>
        <button
          onClick={onAutoBalance}
          className="mt-3 flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-3 py-2 text-sm font-medium text-cyan-200 hover:bg-cyan-500/20"
        >
          <Wand2 className="h-4 w-4" /> 자동 계량으로 맞추기
        </button>
      </Shell>
    )
  }

  const r = result
  const exo = r.deltaH ? r.deltaH.value < 0 : null
  const sourceBadge =
    r.source === 'known'
      ? { label: '반응 사전', cls: 'bg-violet-500/15 text-violet-200 ring-violet-400/40', Icon: BookMarked }
      : r.source === 'flame-test'
        ? { label: '불꽃 반응', cls: 'bg-orange-500/15 text-orange-200 ring-orange-400/40', Icon: Flame }
        : { label: '알고리즘 계산', cls: 'bg-cyan-500/15 text-cyan-200 ring-cyan-400/40', Icon: Calculator }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-y-4">
      <Shell tone="emerald" icon={<FlaskConical className="h-5 w-5 text-emerald-300" />} title={r.title}>
        <div className="flex flex-wrap items-center gap-2">
          <span className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1 ${sourceBadge.cls}`}>
            <sourceBadge.Icon className="h-3.5 w-3.5" /> {sourceBadge.label}
          </span>
          {r.deltaH && (
            <span
              className={`flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs ring-1 ${
                exo ? 'bg-orange-500/15 text-orange-200 ring-orange-400/40' : 'bg-sky-500/15 text-sky-200 ring-sky-400/40'
              }`}
              title={r.deltaH.estimated ? '폴링 근사(96.5·Δχ²·결합 수)로 추정한 값' : '표준 생성 엔탈피로 계산한 값'}
            >
              {exo ? <Flame className="h-3.5 w-3.5" /> : <Snowflake className="h-3.5 w-3.5" />}
              {r.deltaH.value === 0 ? '열 출입 거의 없음' : exo ? '발열 반응' : '흡열 반응'} · ΔH {r.deltaH.estimated ? '≈ ' : '= '}
              {r.deltaH.value > 0 ? '+' : ''}
              {r.deltaH.value.toLocaleString()} kJ{r.deltaH.estimated ? ' (추정)' : ''}
            </span>
          )}
          {r.style.flameColor && r.effects.includes('flame') && (
            <span className="flex items-center gap-1.5 rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-300 ring-1 ring-white/10">
              <span className="h-3 w-3 rounded-full" style={{ background: r.style.flameColor, boxShadow: `0 0 8px ${r.style.flameColor}` }} />
              불꽃색
            </span>
          )}
        </div>

        <p className="mt-3 font-mono text-xl text-white sm:text-2xl">{r.equation}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {r.source !== 'flame-test' && <span>반응식 기준 ×{r.units}회 진행</span>}
          {Object.keys(r.leftovers).length > 0 && (
            <span>
              남은 반응물:{' '}
              {Object.entries(r.leftovers).map(([k, n]) => `${speciesLabel(k)} ×${n}`).join(', ')} (과량)
            </span>
          )}
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-300">{r.description}</p>

        {r.alternatives.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
            다른 가능성:
            {r.alternatives.map((a) => (
              <span key={a.formula} className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-slate-300">
                {formatFormula(a.formula)} {a.stability === 'stable' ? '(실재)' : '(가상)'}
              </span>
            ))}
            <span className="text-slate-500">— 투입 비율을 바꿔 보세요</span>
          </div>
        )}
      </Shell>

      {r.products.map((p, i) => (
        <ProductCard key={p.formula} product={p} main={i === 0} isNew={!!p.moleculeId && newMoleculeIds.includes(p.moleculeId)} />
      ))}
    </motion.div>
  )
}

/* ------------------------------ 생성 물질 카드 ------------------------------ */

function ProductCard({ product: p, main, isNew }: { product: ProductInfo; main: boolean; isNew: boolean }) {
  return (
    <motion.article
      initial={{ opacity: 0, scale: 0.95, rotateX: -10 }}
      animate={{ opacity: 1, scale: 1, rotateX: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 0.5 }}
      className={`overflow-hidden rounded-3xl border p-5 ${
        p.stability === 'virtual'
          ? 'border-fuchsia-400/40 bg-gradient-to-br from-fuchsia-500/10 via-lab-panel to-violet-500/10'
          : 'border-emerald-400/30 bg-gradient-to-br from-emerald-500/10 via-lab-panel to-cyan-500/10'
      }`}
    >
      <div className="flex flex-col gap-5 md:flex-row">
        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {!main && <span className="text-xs text-slate-500">부산물</span>}
            <span className={`rounded-full px-2.5 py-0.5 text-xs ring-1 ${BOND_STYLE[p.bond]}`}>{BOND_LABEL[p.bond]}</span>
            {p.stability === 'stable' ? (
              <span className="flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs text-emerald-200 ring-1 ring-emerald-400/40">
                <ShieldCheck className="h-3.5 w-3.5" /> 안정적인 화합물
              </span>
            ) : (
              <span className="flex items-center gap-1 rounded-full bg-amber-500/15 px-2.5 py-0.5 text-xs text-amber-200 ring-1 ring-amber-400/50">
                <AlertTriangle className="h-3.5 w-3.5" /> 실험실 가상 합성물 (불안정)
              </span>
            )}
            {p.state && <span className="rounded-full bg-white/5 px-2.5 py-0.5 text-xs text-slate-300">{STATE_LABEL[p.state]}</span>}
            {p.moleculeId && (
              <motion.span
                initial={isNew ? { scale: 0 } : false}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 1 }}
                className="flex items-center gap-1 rounded-full bg-violet-500/20 px-2.5 py-0.5 text-xs text-violet-200 ring-1 ring-violet-400/50"
              >
                <Box className="h-3.5 w-3.5" /> {isNew ? '3D 분자 도감 신규 등록!' : '3D 분자 도감 등록됨'}
              </motion.span>
            )}
          </div>

          <div>
            <h3 className={`font-mono font-black text-white ${main ? 'text-5xl' : 'text-3xl'}`}>{formatFormula(p.formula)}</h3>
            <p className="mt-1 text-lg font-semibold text-slate-100">
              {p.nameKo} <span className="text-sm font-normal text-slate-400">{p.nameEn}</span>
            </p>
          </div>

          {p.deltaChi !== null && <DeltaChiMeter value={p.deltaChi} />}

          {p.structure && !p.structure.diatomic && (
            <p className="text-sm text-slate-300">
              VSEPR: <b className="text-white">{p.structure.geometryKo}</b>{' '}
              <span className="text-slate-500">({p.structure.geometryEn}, 약 {p.structure.bondAngle}°)</span>
            </p>
          )}

          <div>
            <h4 className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
              <Lightbulb className="h-4 w-4 text-amber-300" /> 루이스 구조로 보는 결합
            </h4>
            <ul className="space-y-1.5">
              {p.lewis.map((l) => (
                <li key={l} className="text-sm leading-relaxed text-slate-300">· {l}</li>
              ))}
            </ul>
          </div>

          {p.notes.length > 0 && (
            <ul className="space-y-1 rounded-xl border border-white/5 bg-slate-950/40 p-3">
              {p.notes.map((n) => (
                <li key={n} className="flex gap-2 text-xs leading-relaxed text-slate-400">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" /> {n}
                </li>
              ))}
            </ul>
          )}
        </div>

        {lewisKind(p) && (
          <div className="flex shrink-0 items-center justify-center rounded-2xl border border-white/5 bg-slate-950/50 p-3 md:w-[300px]">
            <LewisDiagram product={p} />
          </div>
        )}
      </div>
    </motion.article>
  )
}

/** Δχ 막대: 0 ~ 3.3, 0.4(무극성)·1.7(이온) 경계 표시 */
function DeltaChiMeter({ value }: { value: number }) {
  const max = 3.3
  const pct = (v: number) => `${Math.min(100, (v / max) * 100)}%`
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-slate-400">
        <span>전기음성도 차이 Δχ</span>
        <span className="font-mono text-white">{value.toFixed(2)}</span>
      </div>
      <div className="relative h-2.5 rounded-full bg-gradient-to-r from-emerald-500/40 via-sky-500/40 to-rose-500/50">
        <span className="absolute top-[-3px] h-4 w-0.5 bg-white/40" style={{ left: pct(NONPOLAR_THRESHOLD) }} />
        <span className="absolute top-[-3px] h-4 w-0.5 bg-white/40" style={{ left: pct(IONIC_THRESHOLD) }} />
        <motion.span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-900 shadow"
          initial={{ left: '0%' }}
          animate={{ left: pct(value) }}
          transition={{ type: 'spring', stiffness: 120, damping: 15, delay: 0.7 }}
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] text-slate-500">
        <span>무극성 공유</span>
        <span>극성 공유</span>
        <span>이온 (≥ 1.7)</span>
      </div>
    </div>
  )
}

/* ------------------------------ 공통 셸 ------------------------------ */

const TONES = {
  slate: 'border-slate-600/50 bg-lab-panel/80',
  amber: 'border-amber-400/40 bg-amber-500/5',
  cyan: 'border-cyan-400/40 bg-cyan-500/5',
  emerald: 'border-emerald-400/30 bg-lab-panel/80',
} as const

function Shell({ tone, icon, title, children }: { tone: keyof typeof TONES; icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className={`rounded-3xl border p-5 ${TONES[tone]}`}>
      <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-white">
        {icon} {title}
      </h3>
      {children}
    </motion.section>
  )
}
