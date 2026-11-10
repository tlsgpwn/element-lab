import { AnimatePresence, motion } from 'framer-motion'
import { Atom, Gauge, Layers2, MousePointerClick } from 'lucide-react'
import { useMemo, useState, type CSSProperties } from 'react'
import { ElementDetailModal } from '../../components/ElementDetailModal'
import { ElementTile } from '../../components/ElementTile'
import { PeriodicGrid } from '../../components/PeriodicGrid'
import { ELEMENTS } from '../../data/elements'
import { blockClassOf, EN_MAX, EN_MIN, enStep, metalClassOf } from '../../lib/classify'
import { BLOCK_STYLE, EN_DARK_FROM, EN_RAMP, METAL_STYLE, NO_DATA, type ClassStyle } from '../../theme/vizColors'
import type { ChemicalElement } from '../../types/chemistry'

type View = 'none' | 'block' | 'metal' | 'en'

const VIEWS = [
  { id: 'block', label: '전형 / 전이', icon: Layers2 },
  { id: 'metal', label: '금속 / 비금속', icon: Atom },
  { id: 'en', label: '전기음성도', icon: Gauge },
] as const

const EXPLAIN: Record<Exclude<View, 'none'>, string> = {
  block: '전형 원소는 1·2족과 13~18족, 전이 원소는 가운데 3~12족이에요. 아래 두 줄(란타넘족·악티늄족)도 전이 원소예요.',
  metal: '금속은 표의 왼쪽·아래, 비금속은 오른쪽 위에 모여 있어요. 그 경계에 금속과 비금속의 성질을 함께 가진 준금속이 있어요.',
  en: '전기음성도는 원자가 공유 전자를 끌어당기는 힘이에요. 같은 주기에서는 오른쪽으로, 같은 족에서는 위로 갈수록 커져요. 가장 큰 원소는 플루오린(F, 3.98)이에요.',
}

type ClassKey = string

function classOf(view: View, el: ChemicalElement): { key: ClassKey; style: ClassStyle } | null {
  if (view === 'block') {
    const k = blockClassOf(el)
    return { key: k, style: BLOCK_STYLE[k] }
  }
  if (view === 'metal') {
    const k = metalClassOf(el)
    return { key: k, style: METAL_STYLE[k] }
  }
  return null
}

export function BasicMode() {
  const [view, setView] = useState<View>('none')
  const [focus, setFocus] = useState<ClassKey | null>(null)
  const [detail, setDetail] = useState<ChemicalElement | null>(null)

  const legend = useMemo(() => {
    if (view !== 'block' && view !== 'metal') return []
    const styles: Record<string, ClassStyle> = view === 'block' ? BLOCK_STYLE : METAL_STYLE
    return Object.entries(styles).map(([key, style]) => ({
      key,
      style,
      count: ELEMENTS.filter((e) => classOf(view, e)?.key === key).length,
    }))
  }, [view])

  const noEnCount = useMemo(() => ELEMENTS.filter((e) => e.electronegativity === null).length, [])

  const choose = (v: Exclude<View, 'none'>) => {
    setView((cur) => (cur === v ? 'none' : v))
    setFocus(null)
  }

  const cellStyle = (el: ChemicalElement): { style: CSSProperties; dark: boolean; dim: boolean } => {
    if (view === 'en') {
      const step = enStep(el.electronegativity, EN_RAMP.length)
      if (step === null) return { style: { background: NO_DATA.fill, borderColor: '#dcdad4' }, dark: false, dim: false }
      return { style: { background: EN_RAMP[step], borderColor: EN_RAMP[step] }, dark: step >= EN_DARK_FROM, dim: false }
    }
    const c = classOf(view, el)
    if (!c) return { style: {}, dark: false, dim: false }
    return { style: { background: c.style.tint, borderColor: c.style.color }, dark: false, dim: focus !== null && focus !== c.key }
  }

  return (
    <div className="space-y-4">
      {/* 보기 버튼 */}
      <div className="flex flex-wrap items-center gap-2">
        {VIEWS.map(({ id, label, icon: Icon }) => {
          const on = view === id
          return (
            <button
              key={id}
              onClick={() => choose(id)}
              aria-pressed={on}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
                on ? 'border-blue-500 bg-blue-600 text-white shadow-sm' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:text-blue-700'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          )
        })}
        <span className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
          <MousePointerClick className="h-3.5 w-3.5" /> 원소를 누르면 자세한 정보가 나와요
        </span>
      </div>

      {/* 범례 + 설명 */}
      <AnimatePresence mode="wait">
        {view !== 'none' && (
          <motion.div
            key={view}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2xl border border-lab-border bg-white p-4"
          >
            {view === 'en' ? (
              <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
                <div className="min-w-[260px] flex-1">
                  <div className="flex h-3 overflow-hidden rounded-full ring-1 ring-slate-200">
                    {EN_RAMP.map((c) => (
                      <span key={c} className="flex-1" style={{ background: c }} />
                    ))}
                  </div>
                  <div className="mt-1 flex justify-between font-mono text-[11px] text-slate-500">
                    <span>{EN_MIN} 작음</span>
                    <span>{((EN_MIN + EN_MAX) / 2).toFixed(1)}</span>
                    <span>{EN_MAX} 큼</span>
                  </div>
                </div>
                <span className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="h-3 w-3 rounded" style={{ background: NO_DATA.fill, boxShadow: 'inset 0 0 0 1px #dcdad4' }} />
                  자료 없음 ({noEnCount}개 · He·Ne·Ar, 104번 이후)
                </span>
              </div>
            ) : (
              <div className="flex flex-wrap gap-2" role="group" aria-label="범례 (누르면 강조)">
                {legend.map(({ key, style, count }) => {
                  const on = focus === key
                  return (
                    <button
                      key={key}
                      onClick={() => setFocus((f) => (f === key ? null : key))}
                      aria-pressed={on}
                      className={`flex items-center gap-2 rounded-full border px-3 py-1 text-sm transition ${
                        on ? 'border-slate-800 bg-slate-800 text-white' : 'border-slate-200 bg-white text-slate-700 hover:border-slate-400'
                      } ${focus !== null && !on ? 'opacity-50' : ''}`}
                    >
                      <span className="h-3 w-3 rounded-sm" style={{ background: style.color }} />
                      <b className="font-semibold">{style.label}</b>
                      <span className={on ? 'text-slate-300' : 'text-slate-400'}>{count}개</span>
                    </button>
                  )
                })}
                <span className="self-center text-xs text-slate-400">범례를 누르면 그 분류만 강조돼요</span>
              </div>
            )}
            <p className="mt-3 text-sm leading-relaxed text-slate-600">{EXPLAIN[view]}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 주기율표 */}
      <div className="rounded-2xl border border-lab-border bg-white p-3">
        <PeriodicGrid
          renderCell={(el) => {
            const { style, dark, dim } = cellStyle(el)
            const c = classOf(view, el)
            const enLabel = el.electronegativity === null ? '—' : el.electronegativity.toFixed(2)
            return (
              <button
                onClick={() => setDetail(el)}
                title={`${el.atomicNumber}. ${el.nameKo} (${el.nameEn})${c ? ` · ${c.style.label}` : ''}${view === 'en' ? ` · 전기음성도 ${enLabel}` : ''}`}
                aria-label={`${el.nameKo} ${el.symbol}${c ? `, ${c.style.label}` : ''}${view === 'en' ? `, 전기음성도 ${enLabel}` : ''}`}
                style={style}
                className={`h-full w-full rounded-md border transition hover:z-10 hover:scale-110 hover:shadow-md focus-visible:outline-2 focus-visible:outline-blue-600 ${
                  view === 'none' ? 'border-slate-200 bg-white hover:border-blue-400' : 'border-2'
                } ${dark ? 'text-white' : 'text-slate-700'} ${dim ? 'opacity-25' : ''}`}
              >
                <ElementTile
                  element={el}
                  corner={view === 'en' ? enLabel : undefined}
                  symbolClass={dark ? 'text-white' : 'text-slate-900'}
                  nameClass={dark ? 'text-white/85' : 'text-slate-500'}
                />
              </button>
            )
          }}
        />
      </div>

      <ElementDetailModal element={detail} onClose={() => setDetail(null)} />
    </div>
  )
}
