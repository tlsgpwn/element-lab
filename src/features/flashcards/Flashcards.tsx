import { AnimatePresence, motion } from 'framer-motion'
import {
  BookOpen, Brain, CheckCircle2, Frown, HelpCircle, Layers, Meh, Smile, Trophy, XCircle,
} from 'lucide-react'
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { ElementCard } from '../../components/ElementCard'
import { PhaseIcon } from '../../components/PhaseIcon'
import { PHASE_LABEL } from '../../lib/phase'
import { ELEMENT_BY_Z, LEARNABLE_ELEMENTS } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { defaultProgress } from '../../lib/storage'
import { pickWeighted, type Difficulty } from '../../lib/spacedRepetition'
import {
  buildQuizA, buildQuizB, gradeQuizB, groupLabel, isQuizBComplete,
  type QuizA, type QuizB, type QuizBAnswer,
} from '../../lib/quiz'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import type { ChemicalElement, Phase } from '../../types/chemistry'

type Mode = 'A' | 'B'
type Quiz = QuizA | QuizB

const EMPTY_B: QuizBAnswer = { period: null, group: undefined, phase: null, category: null }

const MODE_INFO: Record<Mode, { title: string; desc: string }> = {
  A: { title: '유형 A · 힌트 → 원소', desc: '성질·스토리·주기/족 힌트를 보고 원소 이름과 번호 맞히기' },
  B: { title: '유형 B · 원소 → 성질', desc: '원소 기호/이름을 보고 주기·족·상온 상태·분류 맞히기' },
}

/* ------------------------------ 공통 UI ------------------------------ */

function Choice({
  selected, correct, revealed, onClick, children,
}: {
  selected: boolean
  correct: boolean
  revealed: boolean
  onClick: () => void
  children: ReactNode
}) {
  let cls = 'border-lab-border bg-slate-900/50 text-slate-200 hover:border-slate-500'
  if (revealed && correct) cls = 'border-emerald-400/70 bg-emerald-500/15 text-emerald-100'
  else if (revealed && selected) cls = 'border-rose-400/70 bg-rose-500/15 text-rose-100'
  else if (selected) cls = 'border-lab-accent bg-cyan-500/15 text-white'
  return (
    <button
      disabled={revealed}
      onClick={onClick}
      className={`flex items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm font-medium transition disabled:cursor-default ${cls}`}
    >
      {children}
    </button>
  )
}

function Hint({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-white/5 bg-slate-950/40 px-3 py-2">
      <div className="text-[11px] tracking-wide text-slate-400 uppercase">{label}</div>
      <div className="mt-0.5 text-sm text-slate-100">{children}</div>
    </div>
  )
}

/* ------------------------------ 메인 ------------------------------ */

export function Flashcards({ onGoToToday }: { onGoToToday: () => void }) {
  const { save, recordReview } = useSaveData()
  const [mode, setMode] = useState<Mode>('A')

  const pool = useMemo(
    () =>
      save.unlockedElements
        .map((z) => ELEMENT_BY_Z.get(z))
        .filter((e): e is ChemicalElement => !!e && e.trivia.length > 0),
    [save.unlockedElements],
  )

  const makeQuiz = useCallback(
    (m: Mode, excludeZ: number | null): Quiz | null => {
      const target = pickWeighted(
        pool,
        (e) => save.elementProgress[e.atomicNumber]?.weight ?? 1,
        (e) => e.atomicNumber,
        excludeZ,
      )
      if (!target) return null
      return m === 'A' ? buildQuizA(target, LEARNABLE_ELEMENTS) : buildQuizB(target)
    },
    [pool, save.elementProgress],
  )

  const [quiz, setQuiz] = useState<Quiz | null>(() => makeQuiz('A', null))
  const [answerA, setAnswerA] = useState<number | null>(null)
  const [answerB, setAnswerB] = useState<QuizBAnswer>(EMPTY_B)
  const [revealed, setRevealed] = useState(false)
  const [session, setSession] = useState({ answered: 0, correct: 0 })
  const [round, setRound] = useState(0)

  const resetAnswers = () => {
    setAnswerA(null)
    setAnswerB(EMPTY_B)
    setRevealed(false)
  }

  const next = (m: Mode = mode, excludeZ: number | null = quiz?.target.atomicNumber ?? null) => {
    setQuiz(makeQuiz(m, excludeZ))
    setRound((r) => r + 1)
    resetAnswers()
  }

  // 풀이 중 새로 해금된 원소가 생겨 quiz가 없을 때 바로 문제를 만든다
  if (!quiz && pool.length > 0) {
    const q = makeQuiz(mode, null)
    if (q) setQuiz(q)
  }

  if (pool.length === 0 || !quiz) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-lab-border bg-lab-panel/70 px-6 py-14 text-center">
        <Layers className="h-12 w-12 text-slate-500" />
        <h2 className="text-xl font-bold text-white">아직 해금된 원소가 없어요</h2>
        <p className="text-sm text-slate-400">[오늘의 원소]에서 원소를 학습하면 플래시카드 퀴즈가 열립니다.</p>
        <button
          onClick={onGoToToday}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
        >
          <BookOpen className="h-4 w-4" /> 오늘의 원소 학습하기
        </button>
      </div>
    )
  }

  const target = quiz.target
  const progress = save.elementProgress[target.atomicNumber] ?? defaultProgress()
  const theme = CATEGORY_THEME[target.category]

  const gradeB = quiz.kind === 'B' ? gradeQuizB(quiz, answerB) : null
  const isCorrect = quiz.kind === 'A' ? answerA === target.atomicNumber : !!gradeB?.allCorrect
  const canSubmit = quiz.kind === 'A' ? answerA !== null : isQuizBComplete(answerB)

  const submit = () => {
    if (!canSubmit || revealed) return
    setRevealed(true)
    setSession((s) => ({ answered: s.answered + 1, correct: s.correct + (isCorrect ? 1 : 0) }))
  }

  const rate = (d: Difficulty) => {
    recordReview(target.atomicNumber, d, isCorrect)
    next()
  }

  const switchMode = (m: Mode) => {
    if (m === mode) return
    setMode(m)
    next(m)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* 상단: 유형 토글 + 세션 통계 */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="inline-flex rounded-xl border border-lab-border bg-lab-panel/70 p-1" role="tablist">
          {(['A', 'B'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => switchMode(m)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === m ? 'bg-cyan-500/20 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {MODE_INFO[m].title}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-4 text-sm text-slate-400">
          <span className="flex items-center gap-1.5">
            <Trophy className="h-4 w-4 text-amber-300" />
            {session.correct} / {session.answered}
          </span>
          <span className="flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-lab-accent" /> 출제 범위 {pool.length}개
          </span>
        </div>
      </div>
      <p className="text-xs text-slate-500">{MODE_INFO[mode].desc}</p>

      <AnimatePresence mode="wait">
        <motion.div
          key={round}
          initial={{ opacity: 0, y: 16, rotateX: -8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="space-y-4"
        >
          {/* 문제 카드 */}
          <div className="rounded-3xl border border-lab-border bg-lab-panel/80 p-5 shadow-xl sm:p-6">
            <div className="mb-4 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4" /> 문제 {round + 1}
              </span>
              <span title="출제 가중치 · 틀린 횟수">
                가중치 {progress.weight.toFixed(2)} · 오답 {progress.wrongCount}회
              </span>
            </div>

            {quiz.kind === 'A' ? (
              <QuizAView quiz={quiz} answer={answerA} revealed={revealed} onAnswer={setAnswerA} />
            ) : (
              <QuizBView quiz={quiz} answer={answerB} revealed={revealed} onAnswer={setAnswerB} grade={gradeB} />
            )}

            {!revealed && (
              <button
                onClick={submit}
                disabled={!canSubmit}
                className="mt-5 w-full rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 py-3 text-sm font-semibold text-white transition enabled:hover:brightness-110 disabled:opacity-40"
              >
                정답 확인
              </button>
            )}
          </div>

          {/* 결과 + 난이도 평가 */}
          {revealed && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${
                  isCorrect
                    ? 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/30'
                    : 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/30'
                }`}
              >
                {isCorrect ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                <span className="text-sm">
                  {isCorrect ? '정답입니다!' : '아쉬워요.'} 정답은{' '}
                  <b className={theme.text}>
                    {target.atomicNumber}. {target.nameKo} ({target.symbol})
                  </b>
                </span>
              </div>

              <ElementCard element={target} showTrivia={false} />

              <div className="rounded-2xl border border-lab-border bg-lab-panel/70 p-4">
                <p className="mb-3 flex items-center gap-1.5 text-sm text-slate-300">
                  <Brain className="h-4 w-4 text-violet-300" /> 이 원소, 얼마나 어려웠나요? (어려울수록 더 자주 출제돼요)
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <RateButton onClick={() => rate('easy')} icon={<Smile className="h-5 w-5" />} label="쉬움" tone="emerald" />
                  <RateButton onClick={() => rate('normal')} icon={<Meh className="h-5 w-5" />} label="보통" tone="sky" />
                  <RateButton onClick={() => rate('hard')} icon={<Frown className="h-5 w-5" />} label="어려움" tone="rose" />
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

const TONES = {
  emerald: 'border-emerald-400/40 text-emerald-200 hover:bg-emerald-500/15',
  sky: 'border-sky-400/40 text-sky-200 hover:bg-sky-500/15',
  rose: 'border-rose-400/40 text-rose-200 hover:bg-rose-500/15',
} as const

function RateButton({
  onClick, icon, label, tone,
}: { onClick: () => void; icon: ReactNode; label: string; tone: keyof typeof TONES }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-1 rounded-xl border bg-slate-900/40 py-3 text-sm font-medium transition ${TONES[tone]}`}
    >
      {icon}
      {label}
    </button>
  )
}

/* ------------------------------ 유형 A ------------------------------ */

function QuizAView({
  quiz, answer, revealed, onAnswer,
}: { quiz: QuizA; answer: number | null; revealed: boolean; onAnswer: (z: number) => void }) {
  const t = quiz.target
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold text-white">다음 힌트에 해당하는 원소는?</h2>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Hint label="분류">{CATEGORY_THEME[t.category].label}</Hint>
        <Hint label="위치">
          {t.period}주기 · {groupLabel(t.group)}
        </Hint>
        <Hint label="상온 상태">
          <span className="flex items-center gap-1">
            <PhaseIcon phase={t.phaseAtSTP} /> {PHASE_LABEL[t.phaseAtSTP]}
          </span>
        </Hint>
        <Hint label="전기음성도">{t.electronegativity ?? '—'}</Hint>
      </div>
      <div className="mt-2">
        <Hint label="전자 배치">
          <span className="font-mono">{t.electronConfig}</span>
        </Hint>
      </div>
      <blockquote className="mt-3 rounded-xl border-l-4 border-amber-300/60 bg-amber-500/5 px-4 py-3 text-sm leading-relaxed text-slate-200">
        {quiz.maskedTrivia}
      </blockquote>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {quiz.options.map((o) => (
          <Choice
            key={o.atomicNumber}
            selected={answer === o.atomicNumber}
            correct={o.atomicNumber === t.atomicNumber}
            revealed={revealed}
            onClick={() => onAnswer(o.atomicNumber)}
          >
            <span className="font-mono text-xs text-slate-400">{o.atomicNumber}</span> {o.nameKo}
            <span className="text-xs text-slate-400">({o.symbol})</span>
          </Choice>
        ))}
      </div>
    </div>
  )
}

/* ------------------------------ 유형 B ------------------------------ */

const PHASES: Phase[] = ['solid', 'liquid', 'gas']

function Row({
  label, ok, revealed, children,
}: { label: string; ok: boolean | undefined; revealed: boolean; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center gap-1.5 text-sm text-slate-300">
        {label}
        {revealed &&
          (ok ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <XCircle className="h-4 w-4 text-rose-400" />)}
      </div>
      {children}
    </div>
  )
}

function QuizBView({
  quiz, answer, revealed, onAnswer, grade,
}: {
  quiz: QuizB
  answer: QuizBAnswer
  revealed: boolean
  onAnswer: (a: QuizBAnswer) => void
  grade: ReturnType<typeof gradeQuizB> | null
}) {
  const t = quiz.target
  const theme = CATEGORY_THEME[t.category]
  const set = (patch: Partial<QuizBAnswer>) => onAnswer({ ...answer, ...patch })

  return (
    <div>
      <div className="mb-5 flex items-center gap-4">
        <div
          className={`flex h-20 w-20 flex-col items-center justify-center rounded-2xl border-2 ${theme.border} bg-slate-950/50`}
        >
          <span className="font-mono text-xs text-slate-400">{t.atomicNumber}</span>
          <span className="text-3xl font-black text-white">{t.symbol}</span>
        </div>
        <div>
          <h2 className="text-2xl font-bold text-white">{t.nameKo}</h2>
          <p className="text-sm text-slate-400">{t.nameEn} — 이 원소의 성질을 맞혀 보세요</p>
        </div>
      </div>

      <div className="space-y-4">
        <Row label="주기" ok={grade?.period} revealed={revealed}>
          <div className="grid grid-cols-7 gap-1.5">
            {[1, 2, 3, 4, 5, 6, 7].map((p) => (
              <Choice
                key={p}
                selected={answer.period === p}
                correct={p === t.period}
                revealed={revealed}
                onClick={() => set({ period: p })}
              >
                {p}
              </Choice>
            ))}
          </div>
        </Row>

        <Row label="족" ok={grade?.group} revealed={revealed}>
          <div className="grid grid-cols-4 gap-1.5">
            {quiz.groupOptions.map((g) => (
              <Choice
                key={g ?? 'f'}
                selected={answer.group === g}
                correct={g === t.group}
                revealed={revealed}
                onClick={() => set({ group: g })}
              >
                {groupLabel(g)}
              </Choice>
            ))}
          </div>
        </Row>

        <Row label="상온(STP) 상태" ok={grade?.phase} revealed={revealed}>
          <div className="grid grid-cols-3 gap-1.5">
            {PHASES.map((ph) => (
              <Choice
                key={ph}
                selected={answer.phase === ph}
                correct={ph === t.phaseAtSTP}
                revealed={revealed}
                onClick={() => set({ phase: ph })}
              >
                <PhaseIcon phase={ph} /> {PHASE_LABEL[ph]}
              </Choice>
            ))}
          </div>
        </Row>

        <Row label="분류 (주요 성질)" ok={grade?.category} revealed={revealed}>
          <div className="grid grid-cols-2 gap-1.5">
            {quiz.categoryOptions.map((c) => (
              <Choice
                key={c}
                selected={answer.category === c}
                correct={c === t.category}
                revealed={revealed}
                onClick={() => set({ category: c })}
              >
                {CATEGORY_THEME[c].label}
              </Choice>
            ))}
          </div>
        </Row>
      </div>
    </div>
  )
}
