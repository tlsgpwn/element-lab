import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { BookmarkPlus, CheckCircle2, RotateCcw, Settings2, Target, Timer, Trophy, XCircle } from 'lucide-react'
import { ELEMENT_BY_Z } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { formatDuration } from '../../lib/puzzle'
import { answerText, type QuizAnswer, type QuizKind } from '../../lib/quiz'

interface QuizResultProps {
  kind: QuizKind
  answers: QuizAnswer[]
  elapsedMs: number
  onRetryAll: () => void
  onRetryWrong: () => void
  onSettings: () => void
  pushToast: (t: { tone: 'success' | 'error' | 'info'; title: string; body?: string }) => void
}

export function QuizResult({ kind, answers, elapsedMs, onRetryAll, onRetryWrong, onSettings, pushToast }: QuizResultProps) {
  const { save, addReview } = useSaveData()
  const correct = answers.filter((a) => a.correct).length
  const wrong = answers.filter((a) => !a.correct)
  const accuracy = answers.length ? Math.round((correct / answers.length) * 100) : 0
  const unsaved = wrong.filter((a) => !save.reviewElements.includes(a.atomicNumber))

  const saveWrong = () => {
    const n = addReview(wrong.map((a) => a.atomicNumber))
    pushToast({ tone: 'success', title: `오답 플래시에 ${n}개 저장했어요`, body: '[플래시카드] → [오답만 복습]에서 다시 볼 수 있어요.' })
  }

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mx-auto max-w-2xl space-y-4">
      <div className="rounded-3xl border border-lab-border bg-white p-6 text-center shadow-sm">
        <Trophy className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          {answers.length}문제 중 {correct}문제 맞혔어요
        </h2>
        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="맞힘" value={`${correct}`} />
          <Stat icon={<Target className="h-4 w-4 text-blue-600" />} label="정확도" value={`${accuracy}%`} />
          <Stat icon={<Timer className="h-4 w-4 text-slate-500" />} label="걸린 시간" value={formatDuration(elapsedMs)} />
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {wrong.length > 0 && (
            <button onClick={onRetryWrong} className="flex items-center gap-1.5 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-700">
              <RotateCcw className="h-4 w-4" /> 틀린 {wrong.length}문제만 다시
            </button>
          )}
          <button onClick={onRetryAll} className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700">
            <RotateCcw className="h-4 w-4" /> 새로 섞어서 다시
          </button>
          <button onClick={onSettings} className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-100">
            <Settings2 className="h-4 w-4" /> 설정 바꾸기
          </button>
        </div>
      </div>

      {wrong.length > 0 && (
        <section className="rounded-2xl border border-rose-200 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-sm font-bold text-rose-800">
              <XCircle className="h-4 w-4" /> 틀린 문제 {wrong.length}개
            </h3>
            <button
              onClick={saveWrong}
              disabled={unsaved.length === 0}
              className="flex items-center gap-1 rounded-lg border border-orange-300 bg-orange-50 px-2.5 py-1.5 text-xs font-medium text-orange-800 enabled:hover:bg-orange-100 disabled:opacity-50"
            >
              <BookmarkPlus className="h-4 w-4" /> {unsaved.length === 0 ? '모두 오답 플래시에 있어요' : `틀린 원소 ${unsaved.length}개 오답 플래시에 저장`}
            </button>
          </div>
          <ul className="divide-y divide-slate-100">
            {wrong.map((a) => {
              const el = ELEMENT_BY_Z.get(a.atomicNumber)
              if (!el) return null
              return (
                <li key={a.atomicNumber} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="w-28 shrink-0 text-slate-700">
                    <span className="font-mono text-xs text-slate-400">{el.atomicNumber}</span> <b>{el.symbol}</b> {el.nameKo}
                  </span>
                  <span className="text-slate-500">
                    내 답 <span className="text-rose-700 line-through decoration-rose-300">{a.input || '모름'}</span>
                  </span>
                  <span className="text-slate-500">
                    정답 <b className="text-emerald-700">{answerText(kind, el)}</b>
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      )}
    </motion.div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-200">
      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
        {icon} {label}
      </div>
      <div className="mt-0.5 font-mono text-lg font-bold text-slate-900">{value}</div>
    </div>
  )
}
