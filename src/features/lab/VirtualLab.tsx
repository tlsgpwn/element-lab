import {
  DndContext, DragOverlay, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { motion } from 'framer-motion'
import { Box, History, Loader2, Play, RotateCcw, Wand2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ToastStack } from '../../components/ToastStack'
import { ELEMENT_BY_Z } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { useToasts } from '../../hooks/useToasts'
import type { ChemicalElement } from '../../types/chemistry'
import type { ChamberContents, ConditionKey, Conditions, ReactionResult, SpeciesKey } from '../../types/reaction'
import { analyzeReaction, MAX_SPECIES, speciesLabel, speciesName } from '../../utils/chemistryEngine'
import { formatFormula } from '../../utils/formula'
import { ConditionToggles, LabShelf, ReactionChamber } from './LabParts'
import { CHAMBER_ID, keyOfDragId } from './labIds'
import { ReactionEffects } from './ReactionEffects'
import { ResultPanel } from './ResultPanel'

type Phase = 'idle' | 'reacting' | 'done'

interface LogEntry {
  id: number
  title: string
  equation: string
  ok: boolean
}

const REACT_DELAY = 1100

export function VirtualLab({ onGoToMolecules }: { onGoToMolecules: () => void }) {
  const { save, discoverMolecules } = useSaveData()
  const { toasts, push, dismiss } = useToasts()
  const elements = useMemo(
    () =>
      [...save.unlockedElements]
        .sort((a, b) => a - b)
        .map((z) => ELEMENT_BY_Z.get(z))
        .filter((e): e is ChemicalElement => !!e),
    [save.unlockedElements],
  )

  const [contents, setContents] = useState<ChamberContents>({})
  const [cond, setCond] = useState<Conditions>({ heat: false, pressure: false, catalyst: false })
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ReactionResult | null>(null)
  const [nonce, setNonce] = useState(0)
  const [newIds, setNewIds] = useState<string[]>([])
  const [log, setLog] = useState<LogEntry[]>([])
  const [dragKey, setDragKey] = useState<SpeciesKey | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 6 } }),
  )

  const reacting = phase === 'reacting'
  const keys = Object.keys(contents)

  const add = (key: SpeciesKey) => {
    if (reacting) return
    if (!contents[key] && keys.length >= MAX_SPECIES) {
      push({ tone: 'error', title: `최대 ${MAX_SPECIES}종류까지 넣을 수 있어요`, body: '다른 물질을 빼고 다시 시도해 보세요.' })
      return
    }
    setContents((c) => ({ ...c, [key]: (c[key] ?? 0) + 1 }))
  }

  const change = (key: SpeciesKey, delta: number) => {
    setContents((c) => {
      const n = (c[key] ?? 0) + delta
      if (n <= 0) {
        const rest = { ...c }
        delete rest[key]
        return rest
      }
      return { ...c, [key]: Math.min(99, n) }
    })
  }

  const remove = (key: SpeciesKey) => change(key, -Infinity)

  const toggle = (k: ConditionKey) => setCond((c) => ({ ...c, [k]: !c[k] }))

  const reset = () => {
    setContents({})
    setResult(null)
    setPhase('idle')
  }

  const autoBalance = () => {
    const r = analyzeReaction(contents, cond)
    if (r.status === 'success' || r.status === 'insufficient' || r.status === 'needs-conditions') {
      // 기존 순서를 유지하며 계수로 교체
      const next: ChamberContents = {}
      for (const k of keys) if (r.balance[k]) next[k] = r.balance[k]
      for (const [k, n] of Object.entries(r.balance)) if (!next[k]) next[k] = n
      setContents(next)
      push({
        tone: 'info',
        title: '자동 계량 완료',
        body: `반응식 계수에 맞춰 투입량을 조정했어요: ${Object.entries(next).map(([k, n]) => `${n === 1 ? '' : n}${speciesLabel(k)}`).join(' + ')}`,
      })
    } else {
      push({ tone: 'error', title: '자동 계량할 반응을 찾지 못했어요', body: r.message })
    }
  }

  const start = () => {
    if (reacting) return
    if (keys.length === 0) {
      push({ tone: 'info', title: '챔버가 비어 있어요', body: '원소나 시약을 먼저 넣어 주세요.' })
      return
    }
    setPhase('reacting')
    setResult(null)
    timer.current = setTimeout(() => {
      const r = analyzeReaction(contents, cond)
      setResult(r)
      setNonce((n) => n + 1)
      setPhase('done')

      let fresh: string[] = []
      if (r.status === 'success') {
        fresh = r.moleculeIds.filter((id) => !save.discoveredMolecules.includes(id))
        if (r.moleculeIds.length) discoverMolecules(r.moleculeIds)
        if (fresh.length) {
          push({ tone: 'success', title: '3D 분자 도감에 새 분자 등록!', body: fresh.map(formatFormula).join(', ') })
        }
      }
      setNewIds(fresh)
      if (r.status !== 'empty') {
        setLog((l) => [
          {
            id: Date.now(),
            title: r.title,
            equation: r.status === 'success' || r.status === 'insufficient' ? r.equation : keys.map(speciesLabel).join(' + '),
            ok: r.status === 'success',
          },
          ...l,
        ].slice(0, 8))
      }
    }, REACT_DELAY)
  }

  const onDragStart = (e: DragStartEvent) => setDragKey(keyOfDragId(e.active.id))
  const onDragEnd = (e: DragEndEvent) => {
    setDragKey(null)
    if (e.over?.id === CHAMBER_ID) add(keyOfDragId(e.active.id))
  }

  const success = phase === 'done' && result?.status === 'success' ? result : null

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragCancel={() => setDragKey(null)}>
      <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
        <LabShelf elements={elements} onAdd={add} />

        <section className="min-w-0 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-xl font-bold text-white">가상 실험실</h2>
              <p className="text-xs text-slate-500">
                반응 사전에 있는 실제 반응을 먼저 찾고, 없으면 전기음성도와 산화수로 결합을 계산합니다.
              </p>
            </div>
            <button
              onClick={onGoToMolecules}
              className="flex items-center gap-1.5 rounded-xl border border-violet-400/40 bg-violet-500/10 px-3 py-2 text-sm text-violet-200 hover:bg-violet-500/20"
            >
              <Box className="h-4 w-4" /> 발견한 분자 {save.discoveredMolecules.length}개
            </button>
          </div>

          <ReactionChamber
            contents={contents}
            reacting={reacting}
            onChange={change}
            onRemove={remove}
            shakeKey={nonce}
            strongShake={!!success?.effects.includes('explosion')}
            overlay={success ? <ReactionEffects key={nonce} effects={success.effects} style={success.style} nonce={nonce} /> : null}
          />

          <ConditionToggles value={cond} onToggle={toggle} />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={start}
              disabled={reacting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-cyan-500/20 transition enabled:hover:brightness-110 disabled:opacity-60"
            >
              {reacting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              {reacting ? '반응 중…' : '반응 시작'}
            </button>
            <button
              onClick={autoBalance}
              disabled={reacting || keys.length === 0}
              title="예상되는 반응식의 계수대로 투입량을 맞춥니다"
              className="flex items-center gap-1.5 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3 text-sm font-medium text-cyan-200 transition enabled:hover:bg-cyan-500/20 disabled:opacity-40"
            >
              <Wand2 className="h-4 w-4" /> 자동 계량
            </button>
            <button
              onClick={reset}
              disabled={reacting}
              className="flex items-center gap-1.5 rounded-xl border border-lab-border px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" /> 비우기
            </button>
          </div>

          {phase === 'done' && result && <ResultPanel result={result} newMoleculeIds={newIds} onAutoBalance={autoBalance} />}

          {log.length > 0 && (
            <div className="rounded-2xl border border-lab-border bg-lab-panel/50 p-4">
              <h3 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-300">
                <History className="h-4 w-4" /> 실험 기록
              </h3>
              <ul className="space-y-1">
                {log.map((l) => (
                  <li key={l.id} className="flex items-center gap-2 text-xs">
                    <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${l.ok ? 'bg-emerald-400' : 'bg-slate-500'}`} />
                    <span className="truncate text-slate-300">{l.title}</span>
                    <span className="ml-auto shrink-0 font-mono text-slate-500">{l.equation}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>
      </div>

      <DragOverlay dropAnimation={null} zIndex={70}>
        {dragKey ? (
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1.1, rotate: 4 }}
            className="rounded-xl border border-cyan-300/60 bg-slate-900/95 px-3 py-2 text-center shadow-2xl shadow-cyan-500/30"
          >
            <div className="font-mono text-lg font-black text-white">{speciesLabel(dragKey)}</div>
            <div className="text-[10px] text-slate-400">{speciesName(dragKey)}</div>
          </motion.div>
        ) : null}
      </DragOverlay>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </DndContext>
  )
}
