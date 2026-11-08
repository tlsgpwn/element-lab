import { useDraggable, useDroppable } from '@dnd-kit/core'
import { AnimatePresence, motion } from 'framer-motion'
import { Beaker, Flame, Minus, Plus, Search, Sparkles, X, Zap, type LucideIcon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { REAGENTS, REAGENT_BY_FORMULA } from '../../data/reagents'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import type { ChemicalElement } from '../../types/chemistry'
import type { ChamberContents, ConditionKey, Conditions, SpeciesKey } from '../../types/reaction'
import { MAX_SPECIES, speciesLabel, speciesName } from '../../utils/chemistryEngine'
import { formatFormula } from '../../utils/formula'
import { CHAMBER_ID, dragIdOf } from './labIds'


/* ------------------------------ 선반 ------------------------------ */

function ShelfTile({ id, onAdd, children, title, className }: {
  id: SpeciesKey; onAdd: () => void; children: ReactNode; title: string; className: string
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: dragIdOf(id) })
  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onAdd}
      title={title}
      className={`touch-none select-none ${className} ${isDragging ? 'opacity-30' : ''}`}
    >
      {children}
    </button>
  )
}

export function LabShelf({ elements, onAdd }: { elements: ChemicalElement[]; onAdd: (key: SpeciesKey) => void }) {
  const [q, setQ] = useState('')
  const query = q.trim().toLowerCase()
  const filtered = query
    ? elements.filter((e) => e.symbol.toLowerCase().includes(query) || e.nameKo.includes(q.trim()) || e.nameEn.toLowerCase().includes(query))
    : elements

  return (
    <aside className="space-y-4 rounded-2xl border border-lab-border bg-lab-panel/70 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
      <div>
        <h3 className="mb-1 text-sm font-semibold text-slate-200">해금된 원소 <span className="text-slate-500">({elements.length})</span></h3>
        <p className="mb-2 text-xs text-slate-500">클릭하거나 챔버로 끌어다 놓으세요.</p>
        <label className="relative mb-2 block">
          <Search className="absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="기호·이름 검색"
            className="w-full rounded-lg border border-lab-border bg-slate-900/60 py-1.5 pr-2 pl-8 text-sm text-white placeholder:text-slate-500 focus:border-lab-accent focus:outline-none"
          />
        </label>
        {elements.length === 0 ? (
          <p className="rounded-lg border border-dashed border-slate-700 p-3 text-xs text-slate-500">
            아직 해금한 원소가 없어요. [오늘의 원소]에서 학습하면 실험에 쓸 수 있습니다.
          </p>
        ) : (
          <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-8 lg:grid-cols-4">
            {filtered.map((el) => {
              const t = CATEGORY_THEME[el.category]
              return (
                <ShelfTile
                  key={el.symbol}
                  id={el.symbol}
                  onAdd={() => onAdd(el.symbol)}
                  title={`${el.nameKo} (${speciesLabel(el.symbol)})`}
                  className={`flex aspect-square flex-col items-center justify-center rounded-lg border ${t.border} ${t.gradient} transition hover:scale-105`}
                >
                  <span className={`text-sm font-black ${t.text}`}>{el.symbol}</span>
                  <span className="w-full truncate px-0.5 text-center text-[9px] text-slate-300">{el.nameKo}</span>
                </ShelfTile>
              )
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-200">
          <Beaker className="h-4 w-4 text-sky-300" /> 시약 선반
        </h3>
        <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-2">
          {REAGENTS.map((r) => (
            <ShelfTile
              key={r.formula}
              id={r.formula}
              onAdd={() => onAdd(r.formula)}
              title={r.description}
              className="flex items-center gap-2 rounded-lg border border-sky-400/20 bg-sky-500/5 px-2 py-1.5 text-left transition hover:bg-sky-500/15"
            >
              <span className="h-3 w-3 shrink-0 rounded-full ring-1 ring-white/30" style={{ background: r.color }} />
              <span className="min-w-0">
                <span className="block font-mono text-xs font-bold text-white">{formatFormula(r.formula)}</span>
                <span className="block truncate text-[10px] text-slate-400">{r.nameKo}</span>
              </span>
            </ShelfTile>
          ))}
        </div>
      </div>
    </aside>
  )
}

/* ------------------------------ 반응 챔버 ------------------------------ */

interface ChamberProps {
  contents: ChamberContents
  reacting: boolean
  onChange: (key: SpeciesKey, delta: number) => void
  onRemove: (key: SpeciesKey) => void
  overlay: ReactNode
  shakeKey: number
  strongShake: boolean
}

export function ReactionChamber({ contents, reacting, onChange, onRemove, overlay, shakeKey, strongShake }: ChamberProps) {
  const { setNodeRef, isOver } = useDroppable({ id: CHAMBER_ID })
  const keys = Object.keys(contents)
  const liquid = keys.map((k) => REAGENT_BY_FORMULA.get(k)).find((r) => r && (r.state === 'l' || r.state === 'aq'))

  return (
    <motion.div
      ref={setNodeRef}
      key={shakeKey}
      animate={
        reacting
          ? { x: [0, -3, 3, -2, 2, 0], transition: { duration: 0.3, repeat: Infinity } }
          : strongShake
            ? { x: [0, -14, 14, -10, 10, -5, 5, 0], y: [0, 6, -6, 4, -4, 0], transition: { duration: 0.6 } }
            : { x: 0 }
      }
      className={`relative min-h-[280px] overflow-hidden rounded-[2rem] border-2 bg-gradient-to-b from-slate-900/40 to-slate-950/80 p-5 transition-colors ${
        isOver ? 'border-cyan-300 shadow-[0_0_30px_rgba(34,211,238,0.35)]' : 'border-cyan-500/25'
      }`}
    >
      {/* 유리 반사광 */}
      <div className="pointer-events-none absolute inset-y-6 left-5 w-3 rounded-full bg-white/5" />
      {/* 액체 층 */}
      {liquid && (
        <motion.div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 opacity-30"
          style={{ background: `linear-gradient(to top, ${liquid.color}, transparent)` }}
          initial={{ height: 0 }}
          animate={{ height: '40%' }}
        />
      )}
      {reacting && (
        <motion.div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_70%,rgba(34,211,238,0.25),transparent_60%)]"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 0.8, repeat: Infinity }}
        />
      )}
      {overlay}

      <div className="relative z-20">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
          <span className="font-semibold tracking-widest text-cyan-300/80 uppercase">Reaction Chamber</span>
          <span>{keys.length} / {MAX_SPECIES}종</span>
        </div>

        {keys.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 text-center text-sm text-slate-500">
            <Beaker className="h-8 w-8" />
            원소나 시약을 여기로 끌어다 놓거나 클릭해 넣으세요
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-3 py-6">
            <AnimatePresence>
              {keys.map((k, i) => (
                <motion.div
                  key={k}
                  layout
                  initial={{ opacity: 0, scale: 0.5, y: -30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.5 }}
                  className="flex items-center gap-3"
                >
                  {i > 0 && <span className="text-2xl font-light text-slate-500">+</span>}
                  <div className="relative rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-center shadow-lg backdrop-blur">
                    <button
                      onClick={() => onRemove(k)}
                      className="absolute -top-2 -right-2 rounded-full bg-slate-800 p-0.5 text-slate-400 ring-1 ring-white/10 hover:text-white"
                      aria-label={`${speciesName(k)} 빼기`}
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                    <div className="font-mono text-2xl font-black text-white">{speciesLabel(k)}</div>
                    <div className="text-[11px] text-slate-400">{speciesName(k)}</div>
                    <div className="mt-2 flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => onChange(k, -1)}
                        className="rounded-md bg-white/5 p-1 text-slate-300 hover:bg-white/10"
                        aria-label={`${speciesName(k)} 1개 빼기`}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 font-mono text-lg font-bold text-cyan-200">{contents[k]}</span>
                      <button
                        onClick={() => onChange(k, 1)}
                        className="rounded-md bg-white/5 p-1 text-slate-300 hover:bg-white/10"
                        aria-label={`${speciesName(k)} 1개 더하기`}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </motion.div>
  )
}

/* ------------------------------ 환경 조건 토글 ------------------------------ */

const TOGGLES: { key: ConditionKey; label: string; sub: string; Icon: LucideIcon; on: string }[] = [
  { key: 'heat', label: '가열', sub: '고온', Icon: Flame, on: 'border-orange-400/70 bg-orange-500/15 text-orange-100 shadow-orange-500/30' },
  { key: 'pressure', label: '고압', sub: '압축', Icon: Zap, on: 'border-yellow-300/70 bg-yellow-400/15 text-yellow-100 shadow-yellow-400/30' },
  { key: 'catalyst', label: '촉매 투입', sub: 'Fe·Ni·MnO₂', Icon: Sparkles, on: 'border-violet-400/70 bg-violet-500/15 text-violet-100 shadow-violet-500/30' },
]

export function ConditionToggles({ value, onToggle }: { value: Conditions; onToggle: (k: ConditionKey) => void }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {TOGGLES.map(({ key, label, sub, Icon, on }) => {
        const active = value[key]
        return (
          <button
            key={key}
            role="switch"
            aria-checked={active}
            onClick={() => onToggle(key)}
            className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition ${
              active ? `${on} shadow-lg` : 'border-lab-border bg-slate-900/50 text-slate-400 hover:border-slate-500'
            }`}
          >
            <motion.span animate={active ? { scale: [1, 1.25, 1] } : { scale: 1 }} transition={{ duration: 0.4 }}>
              <Icon className="h-5 w-5" />
            </motion.span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">{label}</span>
              <span className="block truncate text-[10px] opacity-70">{sub}</span>
            </span>
            <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${active ? 'bg-white/30' : 'bg-slate-700'}`}>
              <motion.span
                className="absolute top-0.5 h-4 w-4 rounded-full bg-white"
                animate={{ left: active ? 18 : 2 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            </span>
          </button>
        )
      })}
    </div>
  )
}
