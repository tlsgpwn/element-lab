import { ArrowLeft, Hand, Keyboard, Play, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { ToastStack } from '../../components/ToastStack'
import { ELEMENTS, ELEMENT_BY_Z } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { useToasts } from '../../hooks/useToasts'
import { ELEMENT_COUNT } from '../../lib/storage'
import type { PuzzleRange } from '../../types/save'
import { DragPuzzleMode } from './DragPuzzleMode'
import { TypingMode } from './TypingMode'

type Method = 'drag' | 'typing'

const PRESETS: { label: string; sub: string; range: PuzzleRange }[] = [
  { label: '1~20', sub: '기초', range: { from: 1, to: 20 } },
  { label: '1~36', sub: '4주기까지', range: { from: 1, to: 36 } },
  { label: '1~54', sub: '5주기까지', range: { from: 1, to: 54 } },
  { label: '21~30', sub: '첫째 전이 금속', range: { from: 21, to: 30 } },
  { label: '57~71', sub: '란타넘족', range: { from: 57, to: 71 } },
  { label: '1~118', sub: '전체', range: { from: 1, to: ELEMENT_COUNT } },
]

const METHODS: { id: Method; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'drag', label: '드래그 퍼즐', desc: '원소 카드를 끌어 빈 주기율표의 올바른 칸에 놓기', icon: Hand },
  { id: 'typing', label: '타이핑 퍼즐', desc: '빈칸을 누르고 원소 기호나 이름을 직접 입력하기', icon: Keyboard },
]

const label = (z: number) => {
  const el = ELEMENT_BY_Z.get(z)
  return el ? `${z}. ${el.nameKo}(${el.symbol})` : String(z)
}

export function PuzzleMode() {
  const { save, setPuzzleRange } = useSaveData()
  const { toasts, push, dismiss } = useToasts()
  const [phase, setPhase] = useState<'setup' | 'play'>('setup')
  const [method, setMethod] = useState<Method>('drag')
  const [fromText, setFromText] = useState(String(save.puzzleRange.from))
  const [toText, setToText] = useState(String(save.puzzleRange.to))
  const [round, setRound] = useState(0)

  const from = Number(fromText)
  const to = Number(toText)
  const valid =
    Number.isInteger(from) && Number.isInteger(to) && from >= 1 && to <= ELEMENT_COUNT && from <= to && fromText !== '' && toText !== ''
  const count = valid ? to - from + 1 : 0
  const range = save.puzzleRange

  const start = () => {
    if (!valid) return
    setPuzzleRange({ from, to })
    setRound((r) => r + 1)
    setPhase('play')
  }

  if (phase === 'play') {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setPhase('setup')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> 범위 다시 정하기
          </button>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800 ring-1 ring-blue-200">
            {label(range.from)} ~ {label(range.to)} · {range.to - range.from + 1}개 · {METHODS.find((m) => m.id === method)?.label}
          </span>
        </div>
        {method === 'drag' ? (
          <DragPuzzleMode key={round} range={range} pushToast={push} onRestart={() => setRound((r) => r + 1)} />
        ) : (
          <TypingMode key={round} range={range} pushToast={push} onRestart={() => setRound((r) => r + 1)} />
        )}
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    )
  }

  const included = valid ? ELEMENTS.slice(from - 1, to) : []

  return (
    <div className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-lab-border bg-white p-6 shadow-sm">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <SlidersHorizontal className="h-5 w-5 text-lab-accent" /> 퍼즐 범위 정하기
        </h2>
        <p className="mt-1 text-sm text-slate-500">몇 번부터 몇 번 원소까지 퍼즐을 할지 고르세요.</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">빠른 선택</p>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => {
            const on = from === p.range.from && to === p.range.to
            return (
              <button
                key={p.label}
                onClick={() => {
                  setFromText(String(p.range.from))
                  setToText(String(p.range.to))
                }}
                aria-pressed={on}
                className={`rounded-xl border px-3 py-1.5 text-left text-sm transition ${
                  on ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                }`}
              >
                <b className="font-mono">{p.label}</b> <span className={on ? 'text-blue-100' : 'text-slate-400'}>{p.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">직접 입력 (1~{ELEMENT_COUNT})</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            시작
            <input
              type="number"
              min={1}
              max={ELEMENT_COUNT}
              value={fromText}
              onChange={(e) => setFromText(e.target.value)}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 focus:border-lab-accent focus:outline-none"
            />
          </label>
          <span className="text-slate-400">~</span>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            끝
            <input
              type="number"
              min={1}
              max={ELEMENT_COUNT}
              value={toText}
              onChange={(e) => setToText(e.target.value)}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 focus:border-lab-accent focus:outline-none"
            />
          </label>
          {valid ? (
            <span className="text-sm text-slate-600">
              {label(from)} ~ {label(to)} · <b className="text-slate-900">{count}개</b>
            </span>
          ) : (
            <span className="text-sm text-rose-600">시작은 1 이상, 끝은 {ELEMENT_COUNT} 이하이고 시작 ≤ 끝이어야 해요.</span>
          )}
        </div>
        {included.length > 0 && (
          <div className="mt-3 flex max-h-24 flex-wrap gap-1 overflow-y-auto rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
            {included.map((e) => (
              <span key={e.atomicNumber} className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-slate-200">
                {e.symbol}
              </span>
            ))}
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">방식</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {METHODS.map(({ id, label: name, desc, icon: Icon }) => {
            const on = method === id
            return (
              <button
                key={id}
                onClick={() => setMethod(id)}
                aria-pressed={on}
                className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
                  on ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <Icon className={`mt-0.5 h-5 w-5 ${on ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>
                  <b className="block text-sm text-slate-900">{name}</b>
                  <span className="text-xs text-slate-500">{desc}</span>
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <button
        onClick={start}
        disabled={!valid}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-bold text-white transition enabled:hover:bg-blue-700 disabled:opacity-40"
      >
        <Play className="h-5 w-5" /> {valid ? `${count}개 원소로 시작` : '범위를 확인해 주세요'}
      </button>
    </div>
  )
}
