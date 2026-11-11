import { ArrowLeft, PencilLine, Play } from 'lucide-react'
import { useState } from 'react'
import { RangePicker } from '../../components/RangePicker'
import { ToastStack } from '../../components/ToastStack'
import { ELEMENTS, ELEMENT_BY_Z } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { useToasts } from '../../hooks/useToasts'
import { buildQuestions, eligiblePool, QUESTION_COUNTS, QUIZ_KIND_BY_ID, QUIZ_KINDS, type QuizAnswer, type QuizKind } from '../../lib/quiz'
import { shuffle } from '../../lib/random'
import { parseRange, rangeLabel } from '../../lib/range'
import type { ChemicalElement } from '../../types/chemistry'
import { QuizPlay } from './QuizPlay'
import { QuizResult } from './QuizResult'

type Phase = 'setup' | 'play' | 'result'

export function QuizMode() {
  const { save, setPuzzleRange } = useSaveData()
  const { toasts, push, dismiss } = useToasts()
  const [phase, setPhase] = useState<Phase>('setup')
  const [kind, setKind] = useState<QuizKind>('number-to-name')
  const [count, setCount] = useState<number | null>(10)
  const [fromText, setFromText] = useState(String(save.puzzleRange.from))
  const [toText, setToText] = useState(String(save.puzzleRange.to))
  const [questions, setQuestions] = useState<ChemicalElement[]>([])
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{ answers: QuizAnswer[]; elapsedMs: number } | null>(null)

  const picked = parseRange(fromText, toText)
  // 좌표 유형은 족이 없는 란타넘족·악티늄족을 뺀 원소만 출제한다
  const pool = picked ? eligiblePool(kind, ELEMENTS.slice(picked.from - 1, picked.to)) : []
  const poolSize = pool.length
  const excluded = picked ? picked.to - picked.from + 1 - poolSize : 0
  const actualCount = count === null ? poolSize : Math.min(count, poolSize)
  const range = save.puzzleRange

  const begin = (qs: ChemicalElement[]) => {
    setQuestions(qs)
    setResult(null)
    setRound((r) => r + 1)
    setPhase('play')
  }

  const start = () => {
    if (!picked || poolSize === 0) return
    setPuzzleRange(picked)
    begin(buildQuestions(pool, count))
  }

  if (phase === 'play') {
    return (
      <div className="space-y-4">
        <div className="mx-auto flex max-w-2xl flex-wrap items-center gap-2">
          <button
            onClick={() => setPhase('setup')}
            className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            <ArrowLeft className="h-4 w-4" /> 설정으로
          </button>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-sm text-blue-800 ring-1 ring-blue-200">
            {QUIZ_KIND_BY_ID.get(kind)?.label} · {rangeLabel(range)}
            {QUIZ_KIND_BY_ID.get(kind)?.needsGroup ? ' (란타넘족·악티늄족 제외)' : ''}
          </span>
        </div>
        <QuizPlay
          key={round}
          kind={kind}
          questions={questions}
          pushToast={push}
          onFinish={(answers, elapsedMs) => {
            setResult({ answers, elapsedMs })
            setPhase('result')
          }}
        />
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </div>
    )
  }

  if (phase === 'result' && result) {
    return (
      <>
        <QuizResult
          kind={kind}
          answers={result.answers}
          elapsedMs={result.elapsedMs}
          pushToast={push}
          onRetryAll={() => begin(buildQuestions(eligiblePool(kind, ELEMENTS.slice(range.from - 1, range.to)), count))}
          onRetryWrong={() =>
            begin(
              shuffle(
                result.answers
                  .filter((a) => !a.correct)
                  .map((a) => ELEMENT_BY_Z.get(a.atomicNumber))
                  .filter((e): e is ChemicalElement => !!e),
              ),
            )
          }
          onSettings={() => setPhase('setup')}
        />
        <ToastStack toasts={toasts} onDismiss={dismiss} />
      </>
    )
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5 rounded-3xl border border-lab-border bg-white p-6 shadow-sm">
      <div>
        <h2 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <PencilLine className="h-5 w-5 text-lab-accent" /> 퀴즈 준비
        </h2>
        <p className="mt-1 text-sm text-slate-500">문제 유형과 범위를 고르면 무작위 순서로 문제가 나와요. 답을 쓰고 Enter!</p>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">문제 유형</p>
        <div className="grid gap-2 sm:grid-cols-3">
          {QUIZ_KINDS.map((k) => {
            const on = kind === k.id
            return (
              <button
                key={k.id}
                onClick={() => setKind(k.id)}
                aria-pressed={on}
                className={`rounded-2xl border p-3 text-left transition ${
                  on ? 'border-blue-500 bg-blue-50 ring-1 ring-blue-500' : 'border-slate-200 bg-white hover:border-slate-400'
                }`}
              >
                <b className="block text-sm text-slate-900">{k.label}</b>
                <span className="font-mono text-xs text-slate-500">예) {k.example}</span>
              </button>
            )
          })}
        </div>
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
        <p className="mb-2 text-xs font-semibold text-slate-500">문제 수</p>
        <div className="flex flex-wrap gap-2">
          {QUESTION_COUNTS.map((c) => {
            const on = count === c
            return (
              <button
                key={String(c)}
                onClick={() => setCount(c)}
                aria-pressed={on}
                className={`rounded-xl border px-4 py-1.5 text-sm transition ${
                  on ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                }`}
              >
                {c === null ? `범위 전체${picked ? ` (${poolSize})` : ''}` : `${c}문제`}
              </button>
            )
          })}
        </div>
        {picked && excluded > 0 && (
          <p className="mt-1.5 text-xs text-slate-500">
            좌표 문제에서는 족 번호가 없는 란타넘족·악티늄족 {excluded}개를 빼고 출제해요.
          </p>
        )}
        {picked && poolSize > 0 && count !== null && count > poolSize && (
          <p className="mt-1.5 text-xs text-slate-500">범위에 출제할 원소가 {poolSize}개라 {poolSize}문제만 나와요.</p>
        )}
      </div>

      <button
        onClick={start}
        disabled={!picked || poolSize === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 text-base font-bold text-white transition enabled:hover:bg-blue-700 disabled:opacity-40"
      >
        <Play className="h-5 w-5" /> {!picked ? '범위를 확인해 주세요' : poolSize === 0 ? '이 범위에는 좌표 문제를 낼 원소가 없어요' : `${actualCount}문제 시작`}
      </button>
    </div>
  )
}
