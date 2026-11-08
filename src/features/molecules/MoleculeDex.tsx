import { Canvas } from '@react-three/fiber'
import { motion } from 'framer-motion'
import {
  Box, Calculator, Cloud, FlaskConical, Lock, Magnet, RotateCcw, Ruler, Tag, Orbit, type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { BUILTIN_MOLECULES } from '../../data/molecules'
import { useSaveData } from '../../hooks/useSaveData'
import { moleculeName } from '../../utils/chemistryEngine'
import { formatFormula, parseFormula } from '../../utils/formula'
import { computeVsepr } from '../../utils/vseprCalculator'
import { cpkColor } from './cpk'
import { MoleculeScene } from './MoleculeScene'
import { VseprInfoPanel } from './VseprInfoPanel'

type Filter = 'all' | 'builtin' | 'discovered'

interface Entry {
  id: string
  builtin: boolean
  discovered: boolean
  blurb?: string
}

function Toggle({ on, onClick, icon: Icon, label, primary = false }: {
  on: boolean; onClick: () => void; icon: LucideIcon; label: string; primary?: boolean
}) {
  const onCls = primary
    ? 'border-violet-400/70 bg-violet-500/25 text-violet-100 shadow-lg shadow-violet-500/30'
    : 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100'
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium backdrop-blur transition ${
        on ? onCls : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/30'
      } ${primary ? 'text-sm' : ''}`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}

export function MoleculeDex({ onGoToLab }: { onGoToLab: () => void }) {
  const { save } = useSaveData()
  const [filter, setFilter] = useState<Filter>('all')
  const [selected, setSelected] = useState('H2O')
  const [customInput, setCustomInput] = useState('')
  const [customError, setCustomError] = useState<string | null>(null)
  const [showLonePairs, setShowLonePairs] = useState(false)
  const [showLabels, setShowLabels] = useState(true)
  const [showDipole, setShowDipole] = useState(false)
  const [showAngle, setShowAngle] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [viewKey, setViewKey] = useState(0)

  const entries = useMemo<Entry[]>(() => {
    const discovered = new Set(save.discoveredMolecules)
    const list: Entry[] = BUILTIN_MOLECULES.map((m) => ({ id: m.id, builtin: true, discovered: discovered.has(m.id), blurb: m.blurb }))
    for (const id of save.discoveredMolecules) {
      if (!list.some((e) => e.id === id)) list.push({ id, builtin: false, discovered: true })
    }
    return list
  }, [save.discoveredMolecules])

  const models = useMemo(() => new Map(entries.map((e) => [e.id, computeVsepr(e.id)])), [entries])
  const visible = entries.filter((e) => filter === 'all' || (filter === 'builtin' ? e.builtin : e.discovered))
  const model = useMemo(() => models.get(selected) ?? computeVsepr(selected), [models, selected])
  const name = moleculeName(selected)
  const symbols = model ? [...new Set(model.atoms.map((a) => a.symbol))] : []

  const runCustom = () => {
    const f = customInput.trim()
    if (!f) return
    const parsed = parseFormula(f)
    if (!Object.keys(parsed).length) {
      setCustomError('화학식을 읽을 수 없어요. 원소 기호의 대소문자를 확인하세요 (예: ClF3).')
      return
    }
    const m = computeVsepr(f)
    if (!m) {
      setCustomError('ABₙ 형태(중심 원자 1개)·이원자 분자·산소산만 계산할 수 있어요. 입체수 7 이상도 지원하지 않습니다.')
      return
    }
    setCustomError(null)
    setSelected(f)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* ---------------- 목록 ---------------- */}
      <aside className="space-y-3 rounded-2xl border border-lab-border bg-lab-panel/70 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-200">분자 도감</h3>
          <span className="text-xs text-slate-500">
            실험실 발견 <b className="text-violet-300">{save.discoveredMolecules.length}</b>
          </span>
        </div>
        <div className="flex gap-1 rounded-lg bg-slate-900/60 p-1 text-xs" role="tablist">
          {(['all', 'builtin', 'discovered'] as const).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={`flex-1 rounded-md py-1 transition ${filter === f ? 'bg-cyan-500/20 text-white' : 'text-slate-400 hover:text-slate-200'}`}
            >
              {f === 'all' ? '전체' : f === 'builtin' ? '기본' : '발견'}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-700 p-4 text-center text-xs text-slate-500">
            <p>아직 실험실에서 발견한 분자가 없어요.</p>
            <button onClick={onGoToLab} className="mt-2 inline-flex items-center gap-1 text-cyan-300 hover:underline">
              <FlaskConical className="h-3.5 w-3.5" /> 가상 실험실로 가기
            </button>
          </div>
        ) : (
          <ul className="grid max-h-56 grid-cols-2 gap-1.5 overflow-y-auto sm:grid-cols-4 lg:max-h-none lg:grid-cols-2 lg:overflow-visible">
            {visible.map((e) => {
              const m = models.get(e.id)
              const active = selected === e.id
              return (
                <li key={e.id}>
                  <button
                    onClick={() => m && setSelected(e.id)}
                    disabled={!m}
                    title={m ? (e.blurb ?? moleculeName(e.id).ko) : '중심 원자가 여러 개인 복잡한 구조라 VSEPR 자동 계산을 지원하지 않아요.'}
                    className={`relative w-full rounded-xl border px-2 py-2 text-left transition ${
                      active
                        ? 'border-cyan-300 bg-cyan-500/15 shadow-lg shadow-cyan-500/20'
                        : 'border-white/10 bg-slate-900/50 hover:border-white/30 disabled:opacity-40'
                    }`}
                  >
                    {e.discovered && (
                      <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_6px_#a78bfa]" title="실험실에서 발견" />
                    )}
                    <span className="block font-mono text-base font-bold text-white">{formatFormula(e.id)}</span>
                    <span className="block truncate text-[10px] text-slate-400">
                      {m ? (m.kind === 'diatomic' ? '이원자 분자' : m.geometry.ko) : (
                        <span className="inline-flex items-center gap-0.5"><Lock className="h-2.5 w-2.5" /> 계산 불가</span>
                      )}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}

        <div className="border-t border-white/5 pt-3">
          <h4 className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-slate-300">
            <Calculator className="h-3.5 w-3.5 text-cyan-300" /> VSEPR 계산기 (직접 입력)
          </h4>
          <form
            onSubmit={(ev) => {
              ev.preventDefault()
              runCustom()
            }}
            className="flex gap-1.5"
          >
            <input
              value={customInput}
              onChange={(ev) => setCustomInput(ev.target.value)}
              placeholder="예: ClF3, XeO3, IF5"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-lab-border bg-slate-900/60 px-2.5 py-1.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-lab-accent focus:outline-none"
            />
            <button type="submit" className="rounded-lg bg-cyan-500/20 px-3 text-sm text-cyan-100 hover:bg-cyan-500/30">
              계산
            </button>
          </form>
          {customError && <p className="mt-1.5 text-[11px] text-rose-300">{customError}</p>}
        </div>
      </aside>

      {/* ---------------- 뷰어 + 정보 ---------------- */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-3">
          <div className="relative h-[380px] overflow-hidden rounded-3xl border border-lab-border bg-[radial-gradient(circle_at_50%_40%,#1e293b,#020617_75%)] sm:h-[480px]">
            {model ? (
              <Canvas
                key={viewKey}
                camera={{ position: [2.4, 1.0, 6.9], fov: 42 }}
                dpr={[1, 2]}
                fallback={<p className="p-6 text-sm text-slate-400">이 브라우저는 WebGL을 지원하지 않아 3D 모형을 표시할 수 없어요.</p>}
              >
                <MoleculeScene
                  model={model}
                  showLonePairs={showLonePairs}
                  showLabels={showLabels}
                  showDipole={showDipole}
                  showAngle={showAngle}
                  autoRotate={autoRotate}
                />
              </Canvas>
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">구조를 계산할 수 없는 분자예요.</div>
            )}

            {/* 툴바 */}
            <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
              <Toggle primary on={showLonePairs} onClick={() => setShowLonePairs((v) => !v)} icon={Cloud} label="비공유 전자쌍 표시" />
              <Toggle on={showAngle} onClick={() => setShowAngle((v) => !v)} icon={Ruler} label="결합각" />
              <Toggle on={showDipole} onClick={() => setShowDipole((v) => !v)} icon={Magnet} label="쌍극자" />
              <Toggle on={showLabels} onClick={() => setShowLabels((v) => !v)} icon={Tag} label="원소 기호" />
              <Toggle on={autoRotate} onClick={() => setAutoRotate((v) => !v)} icon={Orbit} label="자동 회전" />
              <button
                onClick={() => setViewKey((k) => k + 1)}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 backdrop-blur hover:border-white/30"
                aria-label="시점 초기화"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 시점
              </button>
            </div>

            {/* 범례 */}
            {model && (
              <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5">
                {symbols.map((s) => (
                  <span key={s} className="flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-0.5 text-xs text-slate-200">
                    <span className="h-3 w-3 rounded-full ring-1 ring-white/30" style={{ background: cpkColor(s) }} /> {s}
                  </span>
                ))}
                {showLonePairs && model.lonePairs.length > 0 && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex items-center gap-1 rounded-md bg-violet-950/80 px-2 py-0.5 text-xs text-violet-200"
                  >
                    <span className="h-3 w-3 rounded-full bg-violet-400/60" /> 비공유 전자쌍 {model.lonePairs.length - model.unpaired}
                    {model.unpaired > 0 && ` + 홀전자 ${model.unpaired}`}
                  </motion.span>
                )}
                {showLonePairs && model.lonePairs.length === 0 && (
                  <span className="rounded-md bg-slate-950/70 px-2 py-0.5 text-xs text-slate-400">중심 원자에 비공유 전자쌍 없음</span>
                )}
              </div>
            )}
          </div>

          {!BUILTIN_MOLECULES.some((b) => b.id === selected) && !save.discoveredMolecules.includes(selected) && model && (
            <p className="flex items-center gap-1.5 text-xs text-slate-400">
              <Box className="h-3.5 w-3.5" /> 직접 입력한 분자는 도감에 저장되지 않아요. 실험실에서 합성하면 등록됩니다.
            </p>
          )}
        </div>

        {model && <VseprInfoPanel model={model} nameKo={name.ko} nameEn={name.en} />}
      </div>
    </div>
  )
}
