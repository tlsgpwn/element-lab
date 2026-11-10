import { Lightbulb } from 'lucide-react'
import type { ReactNode } from 'react'
import { blockClassOf, metalClassOf } from '../lib/classify'
import { formatMass, formatOxidation } from '../lib/format'
import { PHASE_LABEL } from '../lib/phase'
import { CATEGORY_THEME } from '../theme/categoryColors'
import { BLOCK_STYLE, METAL_STYLE } from '../theme/vizColors'
import type { ChemicalElement } from '../types/chemistry'
import { Modal } from './Modal'
import { PhaseIcon } from './PhaseIcon'

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
      <dt className="text-[11px] text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm font-medium text-slate-900">{children}</dd>
    </div>
  )
}

export function ElementDetailModal({ element: el, onClose }: { element: ChemicalElement | null; onClose: () => void }) {
  return (
    <Modal open={!!el} onClose={onClose} title="원소 정보" size="xl">
      {el && (
        <div className="space-y-5">
          <div className="flex items-center gap-4">
            <div
              className={`flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-2xl border-2 ${CATEGORY_THEME[el.category].border} ${CATEGORY_THEME[el.category].bg}`}
            >
              <span className="font-mono text-xs text-slate-500">{el.atomicNumber}</span>
              <span className={`text-4xl font-black ${CATEGORY_THEME[el.category].text}`}>{el.symbol}</span>
              <span className="text-xs text-slate-600">{el.nameKo}</span>
            </div>
            <div className="min-w-0">
              <h3 className="text-2xl font-bold text-slate-900">
                {el.nameKo} <span className="text-base font-normal text-slate-500">{el.nameEn}</span>
              </h3>
              <span className={`mt-1 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${CATEGORY_THEME[el.category].badge}`}>
                {CATEGORY_THEME[el.category].label}
              </span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <Fact label="원자 번호">{el.atomicNumber}</Fact>
            <Fact label="원자량">{formatMass(el.atomicMass)}</Fact>
            <Fact label="위치">
              {el.period}주기 · {el.group === null ? 'f-블록' : `${el.group}족`}
            </Fact>
            <Fact label="전형 / 전이">{BLOCK_STYLE[blockClassOf(el)].label}</Fact>
            <Fact label="금속 / 비금속">{METAL_STYLE[metalClassOf(el)].label}</Fact>
            <Fact label="전기음성도 (폴링)">{el.electronegativity ?? '자료 없음'}</Fact>
            <Fact label="상온 상태">
              <span className="flex items-center gap-1">
                <PhaseIcon phase={el.phaseAtSTP} /> {PHASE_LABEL[el.phaseAtSTP]}
                {el.atomicNumber >= 104 && <span className="text-xs text-slate-400">(예측)</span>}
              </span>
            </Fact>
            {el.electronConfig && (
              <Fact label="전자 배치">
                <span className="font-mono">{el.electronConfig}</span>
              </Fact>
            )}
            {el.oxidationStates.length > 0 && (
              <Fact label="주요 산화수">
                <span className="font-mono">{el.oxidationStates.map(formatOxidation).join(', ')}</span>
              </Fact>
            )}
          </dl>

          {el.trivia.length > 0 && (
            <div>
              <h4 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-800">
                <Lightbulb className="h-4 w-4 text-amber-500" /> 흥미로운 이야기
              </h4>
              <ul className="space-y-1.5">
                {el.trivia.map((t) => (
                  <li key={t} className="rounded-xl bg-amber-50/60 px-3 py-2 text-sm leading-relaxed text-slate-700 ring-1 ring-amber-100">
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
