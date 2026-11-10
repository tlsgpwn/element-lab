import { ArrowLeft, Hand, Keyboard, ListOrdered, Play, Shuffle, SlidersHorizontal, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { RangePicker } from '../../components/RangePicker'
import { ToastStack } from '../../components/ToastStack'
import { useSaveData } from '../../hooks/useSaveData'
import { useToasts } from '../../hooks/useToasts'
import { parseRange, rangeLabel } from '../../lib/range'
import { DragPuzzleMode } from './DragPuzzleMode'
import { TypingMode, type TypingOrder } from './TypingMode'

type Method = 'drag' | 'typing'

const METHODS: { id: Method; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'drag', label: '드래그 퍼즐', desc: '원소 카드를 끌어 빈 주기율표의 올바른 칸에 놓기', icon: Hand },
  { id: 'typing', label: '타이핑 퍼즐', desc: '빈칸에 원소 기호나 이름을 직접 입력하기', icon: Keyboard },
]

const ORDERS: { id: TypingOrder; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'random', label: '무작위', desc: '정답을 맞히면 남은 빈칸 중 아무 데로나 이동', icon: Shuffle },
  { id: 'sequential', label: '번호 순서', desc: '수 → 헬 → 리 → 베 … 차례대로 이동', icon: ListOrdered },
]

function Choice<T extends string>({ id, on, onPick, label, desc, Icon }: {
  id: T; on: boolean; onPick: (id: T) => void; label: string; desc: string; Icon: LucideIcon
}) {
  return (
    <button
      onClick={() => onPick(id)}
      aria-pressed={on}
      className={`flex items-start gap-3 rounded-2xl border p-3 text-left transition ${
        on ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-400'
      }`}
    >
      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${on ? 'text-blue-600' : 'text-slate-400'}`} />
      <span>
        <b className="block text-sm text-slate-900">{label}</b>
        <span className="text-xs text-slate-500">{desc}</span>
      </span>
    </button>
  )
}

export function PuzzleMode() {
  const { save, setPuzzleRange } = useSaveData()
  const { toasts, push, dismiss } = useToasts()
  const [phase, setPhase] = useState<'setup' | 'play'>('setup')
  const [method, setMethod] = useState<Method>('drag')
  const [order, setOrder] = useState<TypingOrder>('random')
  const [fromText, setFromText] = useState(String(save.puzzleRange.from))
  const [toText, setToText] = useState(String(save.puzzleRange.to))
  const [round, setRound] = useState(0)

  const picked = parseRange(fromText, toText)
  const range = save.puzzleRange

  const start = () => {
    if (!picked) return
    setPuzzleRange(picked)
    setRound((r) => r + 1)
    setPhase('play')
  }

  if (phase === 'play') {
    const methodLabel = METHODS.find((m) => m.id === method)?.label
    const orderLabel = method === 'typing' ? ` (${ORDERS.find((o) => o.id === order)?.label})` : ''
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
            {rangeLabel(range)} · {methodLabel}
            {orderLabel}
          </span>
        </div>
        {method === 'drag' ? (
          <DragPuzzleMode key={round} range={range} pushToast={push} onRestart={() => setRound((r) => r + 1)} />
        ) : (
          <TypingMode key={round} range={range} order={order} pushToast={push} onRestart={() => setRound((r) => r + 1)} />
        )}
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-lab-border bg-white p-6 shadow-sm">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <SlidersHorizontal className="h-5 w-5 text-lab-accent" /> 퍼즐 범위 정하기
        </h2>
        <p className="mt-1 text-sm text-slate-500">몇 번부터 몇 번 원소까지 퍼즐을 할지 고르세요.</p>
      </div>

      <RangePicker
        fromText={fromText}
        toText={toText}
        onChange={(f, t) => {
          setFromText(f)
          setToText(t)
        }}
      />

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">방식</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {METHODS.map((m) => (
            <Choice key={m.id} id={m.id} on={method === m.id} onPick={setMethod} label={m.label} desc={m.desc} Icon={m.icon} />
          ))}
        </div>
      </div>

      {method === 'typing' && (
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-500">칸 이동 순서</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {ORDERS.map((o) => (
              <Choice key={o.id} id={o.id} on={order === o.id} onPick={setOrder} label={o.label} desc={o.desc} Icon={o.icon} />
            ))}
          </div>
        </div>
      )}

      <button
        onClick={start}
        disabled={!picked}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-bold text-white transition enabled:hover:bg-blue-700 disabled:opacity-40"
      >
        <Play className="h-5 w-5" /> {picked ? `${picked.to - picked.from + 1}개 원소로 시작` : '범위를 확인해 주세요'}
      </button>
    </div>
  )
}
