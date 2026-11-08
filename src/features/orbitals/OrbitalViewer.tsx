import { Canvas } from '@react-three/fiber'
import { Axis3d, Cloud, Layers, Orbit, RotateCcw, Shapes, type LucideIcon } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { ELEMENT_BY_Z } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import type { ChemicalElement } from '../../types/chemistry'
import {
  angularNodeText, hundBoxes, MAX_N, mValues, orbitalSuffix, parseElectronConfig, radialNodes, shapeText,
  SUBSHELL_LETTER, subshellName, type OrbitalId,
} from '../../utils/orbital'
import { OrbitalScene, type OrbitalMode } from './OrbitalScene'
import { PHASE_COLOR } from './orbitalTheme'
import { RadialChart } from './RadialChart'

/** "3d" + 아래첨자 "z²" */
function OrbitalName({ n, l, m, className = '' }: OrbitalId & { className?: string }) {
  const suffix = orbitalSuffix(l, m)
  return (
    <span className={`font-mono ${className}`}>
      {subshellName(n, l)}
      {suffix && <sub className="ml-0.5 text-[0.6em]">{suffix}</sub>}
    </span>
  )
}

function Seg<T extends string | number>({ value, options, onChange, render, disabled }: {
  value: T
  options: T[]
  onChange: (v: T) => void
  render: (v: T) => ReactNode
  disabled?: (v: T) => boolean
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const active = o === value
        const off = disabled?.(o) ?? false
        return (
          <button
            key={String(o)}
            onClick={() => onChange(o)}
            disabled={off}
            aria-pressed={active}
            className={`min-w-9 rounded-lg border px-2 py-1.5 text-sm transition ${
              active
                ? 'border-cyan-300 bg-cyan-500/20 text-white'
                : 'border-white/10 bg-slate-900/50 text-slate-300 hover:border-white/30 disabled:cursor-not-allowed disabled:opacity-25'
            }`}
          >
            {render(o)}
          </button>
        )
      })}
    </div>
  )
}

function Toggle({ on, onClick, icon: Icon, label }: { on: boolean; onClick: () => void; icon: LucideIcon; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium backdrop-blur transition ${
        on ? 'border-cyan-400/50 bg-cyan-500/15 text-cyan-100' : 'border-white/10 bg-slate-900/70 text-slate-300 hover:border-white/30'
      }`}
    >
      <Icon className="h-4 w-4" /> {label}
    </button>
  )
}

/* ------------------------------ 원소 전자 배치 상자 ------------------------------ */

function ElectronBoxes({ element, current, onPick }: { element: ChemicalElement; current: OrbitalId; onPick: (o: OrbitalId) => void }) {
  const fills = parseElectronConfig(element.electronConfig)
  const outerN = Math.max(...fills.map((f) => f.n))
  return (
    <div className="space-y-1.5">
      {[...fills].reverse().map((f) => {
        const ms = mValues(f.l)
        const boxes = hundBoxes(f.l, f.electrons)
        const valence = f.n === outerN || (f.l >= 2 && f.electrons < 2 * (2 * f.l + 1))
        return (
          <div key={`${f.n}${f.l}`} className="flex items-center gap-2">
            <span className={`w-7 shrink-0 text-right font-mono text-xs ${valence ? 'text-cyan-200' : 'text-slate-500'}`}>
              {subshellName(f.n, f.l)}
            </span>
            <div className="flex flex-wrap gap-0.5">
              {boxes.map(([up, down], i) => {
                const m = ms[i]
                const active = current.n === f.n && current.l === f.l && current.m === m
                return (
                  <button
                    key={m}
                    onClick={() => onPick({ n: f.n, l: f.l, m })}
                    title={`${subshellName(f.n, f.l)}${orbitalSuffix(f.l, m)} 보기`}
                    aria-label={`${subshellName(f.n, f.l)}${orbitalSuffix(f.l, m)} 오비탈, 전자 ${up + down}개`}
                    className={`flex h-7 w-7 items-center justify-center rounded border text-xs leading-none transition ${
                      active ? 'border-cyan-300 bg-cyan-500/25' : 'border-white/15 bg-slate-900/60 hover:border-white/40'
                    }`}
                  >
                    <span className="text-sky-300">{up ? '↑' : ''}</span>
                    <span className="text-orange-300">{down ? '↓' : ''}</span>
                  </button>
                )
              })}
            </div>
            {valence && <span className="text-[10px] text-cyan-300/80">원자가</span>}
          </div>
        )
      })}
    </div>
  )
}

/* ------------------------------ 메인 ------------------------------ */

export function OrbitalViewer() {
  const { save } = useSaveData()
  const [orbital, setOrbital] = useState<OrbitalId>({ n: 2, l: 1, m: 0 })
  const [mode, setMode] = useState<OrbitalMode>('lobe')
  const [slice, setSlice] = useState(false)
  const [showAxes, setShowAxes] = useState(true)
  const [autoRotate, setAutoRotate] = useState(false)
  const [viewKey, setViewKey] = useState(0)
  const [elementZ, setElementZ] = useState<number | null>(null)

  const elements = useMemo(
    () =>
      [...save.unlockedElements]
        .sort((a, b) => a - b)
        .map((z) => ELEMENT_BY_Z.get(z))
        .filter((e): e is ChemicalElement => !!e && !!e.electronConfig),
    [save.unlockedElements],
  )
  const element = elementZ !== null ? ELEMENT_BY_Z.get(elementZ) : undefined
  const { n, l, m } = orbital
  const nodes = useMemo(() => radialNodes(n, l), [n, l])

  const setN = (nn: number) => setOrbital((o) => ({ n: nn, l: Math.min(o.l, nn - 1), m: Math.min(o.l, nn - 1) === o.l ? o.m : 0 }))
  const setL = (ll: number) => setOrbital((o) => ({ ...o, l: ll, m: 0 }))
  const setM = (mm: number) => setOrbital((o) => ({ ...o, m: mm }))

  return (
    <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      {/* ---------------- 선택 패널 ---------------- */}
      <aside className="space-y-4 rounded-2xl border border-lab-border bg-lab-panel/70 p-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-slate-200">양자수로 고르기</h3>
          <div>
            <p className="mb-1 text-xs text-slate-400">주양자수 n — 전자 껍질 (클수록 크고 에너지가 높음)</p>
            <Seg value={n} options={Array.from({ length: MAX_N }, (_, i) => i + 1)} onChange={setN} render={(v) => v} />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-400">방위 양자수 l — 모양 (0 ≤ l ≤ n−1)</p>
            <Seg
              value={l}
              options={[0, 1, 2, 3]}
              onChange={setL}
              disabled={(v) => v > n - 1}
              render={(v) => (
                <span>
                  <b>{SUBSHELL_LETTER[v]}</b> <span className="text-[10px] text-slate-500">l={v}</span>
                </span>
              )}
            />
          </div>
          <div>
            <p className="mb-1 text-xs text-slate-400">자기 양자수 m — 방향 ({2 * l + 1}개)</p>
            <Seg value={m} options={mValues(l)} onChange={setM} render={(v) => <OrbitalName n={n} l={l} m={v} />} />
          </div>
        </div>

        <div className="border-t border-white/5 pt-3">
          <h3 className="mb-1 text-sm font-semibold text-slate-200">원소의 전자 배치로 보기</h3>
          {elements.length === 0 ? (
            <p className="text-xs text-slate-500">[오늘의 원소]에서 원소를 해금하면 그 원소의 오비탈 상자를 볼 수 있어요.</p>
          ) : (
            <>
              <select
                value={elementZ ?? ''}
                onChange={(e) => setElementZ(e.target.value ? Number(e.target.value) : null)}
                className="w-full rounded-lg border border-lab-border bg-slate-900/80 px-2.5 py-1.5 text-sm text-white focus:border-lab-accent focus:outline-none"
                aria-label="원소 선택"
              >
                <option value="">해금한 원소 선택…</option>
                {elements.map((e) => (
                  <option key={e.atomicNumber} value={e.atomicNumber}>
                    {e.atomicNumber}. {e.nameKo} ({e.symbol})
                  </option>
                ))}
              </select>
              {element && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs">
                    <span className={`font-bold ${CATEGORY_THEME[element.category].text}`}>{element.symbol}</span>{' '}
                    <span className="font-mono text-slate-300">{element.electronConfig}</span>
                  </p>
                  <ElectronBoxes element={element} current={orbital} onPick={setOrbital} />
                  <p className="text-[11px] leading-relaxed text-slate-500">
                    상자 하나가 오비탈 하나예요. 전자는 훈트 규칙대로 빈 상자에 ↑부터 하나씩 들어간 뒤 ↓로 짝을 지어요. 상자를 누르면 그
                    오비탈이 3D로 보여요.
                  </p>
                </div>
              )}
            </>
          )}
        </div>
      </aside>

      {/* ---------------- 뷰어 + 정보 ---------------- */}
      <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="relative h-[380px] overflow-hidden rounded-3xl border border-lab-border bg-[radial-gradient(circle_at_50%_45%,#1e293b,#020617_75%)] sm:h-[480px]">
            <Canvas
              key={viewKey}
              camera={{ position: [3.4, 1.2, 7.6], fov: 42 }}
              dpr={[1, 2]}
              fallback={<p className="p-6 text-sm text-slate-400">이 브라우저는 WebGL을 지원하지 않아 3D 오비탈을 표시할 수 없어요.</p>}
            >
              <OrbitalScene orbital={orbital} mode={mode} slice={slice} showAxes={showAxes} autoRotate={autoRotate} />
            </Canvas>

            <div className="absolute inset-x-3 top-3 flex flex-wrap gap-1.5">
              <div className="flex rounded-lg border border-white/10 bg-slate-900/70 p-0.5 backdrop-blur" role="tablist" aria-label="표현 방식">
                {([
                  ['lobe', '경계면 모형', Shapes],
                  ['cloud', '전자 구름', Cloud],
                ] as const).map(([id, label, Icon]) => (
                  <button
                    key={id}
                    role="tab"
                    aria-selected={mode === id}
                    onClick={() => setMode(id)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition ${
                      mode === id ? 'bg-violet-500/30 text-violet-100' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    <Icon className="h-4 w-4" /> {label}
                  </button>
                ))}
              </div>
              {mode === 'cloud' && <Toggle on={slice} onClick={() => setSlice((v) => !v)} icon={Layers} label="단면 보기" />}
              <Toggle on={showAxes} onClick={() => setShowAxes((v) => !v)} icon={Axis3d} label="축" />
              <Toggle on={autoRotate} onClick={() => setAutoRotate((v) => !v)} icon={Orbit} label="자동 회전" />
              <button
                onClick={() => setViewKey((k) => k + 1)}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-slate-900/70 px-2.5 py-1.5 text-xs text-slate-300 backdrop-blur hover:border-white/30"
                aria-label="시점 초기화"
              >
                <RotateCcw className="h-3.5 w-3.5" /> 시점
              </button>
            </div>

            <div className="pointer-events-none absolute bottom-3 left-3 flex flex-wrap gap-1.5 text-xs">
              <span className="flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-0.5 text-slate-200">
                <span className="h-3 w-3 rounded-full" style={{ background: PHASE_COLOR.plus }} /> 위상 +
              </span>
              <span className="flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-0.5 text-slate-200">
                <span className="h-3 w-3 rounded-full" style={{ background: PHASE_COLOR.minus }} /> 위상 −
              </span>
              <span className="flex items-center gap-1 rounded-md bg-slate-950/70 px-2 py-0.5 text-slate-200">
                <span className="h-2 w-2 rounded-full bg-yellow-100" /> 원자핵
              </span>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">
            {mode === 'lobe'
              ? '경계면 모형: 방향에 따른 모양만 보여 줘요(교과서 그림). 전자가 있을 확률이 높은 영역의 윤곽입니다.'
              : slice
                ? '단면 보기: 원자를 xz 평면으로 자른 모습이에요. 점이 없는 빈 고리가 지름 마디입니다.'
                : '전자 구름: 점이 빽빽한 곳일수록 전자를 발견할 확률이 높아요(|ψ|²에 비례).'}
          </p>
        </div>

        {/* ---------------- 정보 패널 ---------------- */}
        <aside className="space-y-3">
          <div className="rounded-2xl border border-lab-border bg-lab-panel/80 p-4">
            <OrbitalName n={n} l={l} m={m} className="text-4xl font-black text-white" />
            <p className="mt-2 text-sm leading-relaxed text-slate-300">{shapeText(l, m)}</p>
          </div>

          <section className="rounded-2xl border border-white/5 bg-slate-950/40 p-3.5">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">양자수</h4>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-sm">
              <dt className="font-mono text-cyan-200">n = {n}</dt>
              <dd className="text-slate-300">{n}번째 전자 껍질</dd>
              <dt className="font-mono text-cyan-200">l = {l}</dt>
              <dd className="text-slate-300">{SUBSHELL_LETTER[l]} 오비탈 (모양)</dd>
              <dt className="font-mono text-cyan-200">m = {m > 0 ? `+${m}` : m}</dt>
              <dd className="text-slate-300">
                방향: <OrbitalName n={n} l={l} m={m} />
              </dd>
            </dl>
            <p className="mt-2 text-xs leading-relaxed text-slate-400">
              오비탈 하나에는 스핀이 반대인 전자 <b className="text-slate-200">2개(↑↓)</b>까지 들어가요. {subshellName(n, l)} 부껍질은 오비탈{' '}
              {2 * l + 1}개라 최대 <b className="text-slate-200">{2 * (2 * l + 1)}개</b>.
            </p>
          </section>

          <section className="rounded-2xl border border-white/5 bg-slate-950/40 p-3.5">
            <h4 className="mb-2 text-xs font-semibold tracking-wide text-slate-400 uppercase">마디 (전자가 있을 확률 0)</h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>
                지름 마디 <b className="font-mono text-white">{n - l - 1}</b>개 <span className="text-xs text-slate-500">= n − l − 1</span>
                {nodes.length > 0 && <span className="text-xs text-slate-400"> · 공 껍질 모양</span>}
              </li>
              <li>
                각 마디 <b className="font-mono text-white">{l}</b>개 <span className="text-xs text-slate-500">= l</span>
                <span className="block text-xs text-slate-400">{angularNodeText(l, m)}</span>
              </li>
              <li className="text-xs text-slate-500">전체 마디 = n − 1 = {n - 1}개</li>
            </ul>
          </section>

          <section className="rounded-2xl border border-white/5 bg-slate-950/40 p-3.5">
            <RadialChart n={n} l={l} />
          </section>

          <p className="px-1 text-[11px] leading-relaxed text-slate-500">
            수소 원자의 파동함수로 계산한 모양이에요. 전자가 여러 개인 원자도 모양은 같고 크기만 달라집니다.
          </p>
        </aside>
      </div>
    </div>
  )
}
