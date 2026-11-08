import { Atom, Flame, Lightbulb, Orbit, Scale, Zap } from 'lucide-react'
import type { ReactNode } from 'react'
import type { ChemicalElement } from '../types/chemistry'
import { CATEGORY_THEME } from '../theme/categoryColors'
import { formatMass, formatOxidation } from '../lib/format'
import { groupLabel } from '../lib/quiz'
import { PhaseIcon } from './PhaseIcon'
import { PHASE_LABEL } from '../lib/phase'

function Stat({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/40 px-3 py-2.5">
      <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium tracking-wide text-slate-400 uppercase">
        {icon}
        {label}
      </div>
      <div className="text-sm text-slate-100">{children}</div>
    </div>
  )
}

interface ElementCardProps {
  element: ChemicalElement
  /** trivia 섹션 표시 여부 */
  showTrivia?: boolean
}

/** 원소 상세 학습 카드 — category별 테마 색상 적용 */
export function ElementCard({ element: el, showTrivia = true }: ElementCardProps) {
  const theme = CATEGORY_THEME[el.category]

  return (
    <article
      className={`relative overflow-hidden rounded-3xl border-2 ${theme.border} ${theme.gradient} p-5 shadow-2xl ${theme.glow} backdrop-blur sm:p-7`}
    >
      {/* 헤더 */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div
          className={`flex h-32 w-32 shrink-0 flex-col justify-between rounded-2xl border-2 ${theme.border} bg-slate-950/50 p-3`}
        >
          <div className="flex items-start justify-between">
            <span className="font-mono text-sm text-slate-300">{el.atomicNumber}</span>
            <PhaseIcon phase={el.phaseAtSTP} />
          </div>
          <span className={`text-center text-5xl font-black ${theme.text}`}>{el.symbol}</span>
          <span className="text-center font-mono text-[11px] text-slate-400">{formatMass(el.atomicMass)}</span>
        </div>

        <div className="min-w-0 flex-1">
          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${theme.badge}`}>
            {theme.label}
          </span>
          <h2 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
            {el.nameKo} <span className="text-lg font-normal text-slate-400">{el.nameEn}</span>
          </h2>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-300">
            <span>원자 번호 <b className="text-white">{el.atomicNumber}</b></span>
            <span>
              {el.period}주기 · {groupLabel(el.group)}
            </span>
            <span className="flex items-center gap-1">
              <PhaseIcon phase={el.phaseAtSTP} className="h-4 w-4" /> 상온 {PHASE_LABEL[el.phaseAtSTP]}
            </span>
          </div>
        </div>
      </div>

      {/* 성질 */}
      <div className="mt-6 grid grid-cols-2 gap-2.5 lg:grid-cols-3">
        <Stat icon={<Scale className="h-3.5 w-3.5" />} label="원자량">
          <span className="font-mono">{formatMass(el.atomicMass)}</span>
        </Stat>
        <Stat icon={<Zap className="h-3.5 w-3.5" />} label="전기음성도">
          <span className="font-mono">{el.electronegativity ?? '—'}</span>
        </Stat>
        <Stat icon={<Atom className="h-3.5 w-3.5" />} label="원자가 전자">
          <span className="font-mono">{el.valenceElectrons || '—'}</span>
        </Stat>
        <Stat icon={<Orbit className="h-3.5 w-3.5" />} label="전자 배치">
          <span className="font-mono break-words">{el.electronConfig || '—'}</span>
        </Stat>
        <Stat icon={<span className="font-mono text-[10px]">±</span>} label="주요 산화수">
          <span className="flex flex-wrap gap-1">
            {el.oxidationStates.length
              ? el.oxidationStates.map((o) => (
                  <span key={o} className="rounded bg-white/5 px-1.5 font-mono">
                    {formatOxidation(o)}
                  </span>
                ))
              : '—'}
          </span>
        </Stat>
        <Stat icon={<Flame className="h-3.5 w-3.5" />} label="불꽃 반응">
          {el.flameColor ? (
            <span className="flex items-center gap-2">
              <span
                className="h-4 w-4 rounded-full ring-2 ring-white/20"
                style={{ backgroundColor: el.flameColor, boxShadow: `0 0 12px ${el.flameColor}` }}
              />
              <span className="font-mono text-xs text-slate-400">{el.flameColor}</span>
            </span>
          ) : (
            <span className="text-slate-500">없음</span>
          )}
        </Stat>
      </div>

      {/* 스토리 */}
      {showTrivia && el.trivia.length > 0 && (
        <div className="mt-6">
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
            <Lightbulb className="h-4 w-4 text-amber-300" /> 흥미로운 이야기
          </h3>
          <ul className="space-y-2">
            {el.trivia.map((t) => (
              <li key={t} className="rounded-xl border border-white/5 bg-slate-950/30 px-3 py-2 text-sm leading-relaxed text-slate-300">
                {t}
              </li>
            ))}
          </ul>
        </div>
      )}
    </article>
  )
}
