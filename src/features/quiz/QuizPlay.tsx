import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { ArrowRight, BookmarkMinus, BookmarkPlus, CheckCircle2, Flame, HelpCircle, Info, XCircle } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { ElementTile } from '../../components/ElementTile'
import { useSaveData } from '../../hooks/useSaveData'
import { answerText, gradeAnswer, positionText, QUIZ_KIND_BY_ID, type QuizAnswer, type QuizKind } from '../../lib/quiz'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import type { ChemicalElement } from '../../types/chemistry'

interface QuizPlayProps {
  kind: QuizKind
  questions: ChemicalElement[]
  onFinish: (answers: QuizAnswer[], elapsedMs: number) => void
  pushToast: (t: { tone: 'success' | 'error' | 'info'; title: string; body?: string }) => void
}

/** 유형별 문제 화면 (큰 글자 + 질문 문장) */
function Prompt({ kind, el }: { kind: QuizKind; el: ChemicalElement }) {
  switch (kind) {
    case 'number-to-name':
      return (
        <>
          <p className="font-mono text-7xl font-black text-slate-900">{el.atomicNumber}</p>
          <p className="mt-3 text-base text-slate-600">원자 번호 {el.atomicNumber}번 원소의 <b>이름</b>은?</p>
        </>
      )
    case 'element-to-number':
      return (
        <>
          <p className="text-7xl font-black text-slate-900">{el.symbol}</p>
          <p className="mt-1 text-xl font-semibold text-slate-700">
            {el.nameKo} <span className="text-base font-normal text-slate-400">{el.nameEn}</span>
          </p>
          <p className="mt-3 text-base text-slate-600">이 원소의 <b>원자 번호</b>는?</p>
        </>
      )
    case 'name-to-symbol':
      return (
        <>
          <p className="text-6xl font-black text-slate-900">{el.nameKo}</p>
          <p className="mt-1 text-base text-slate-400">{el.nameEn}</p>
          <p className="mt-3 text-base text-slate-600">이 원소의 <b>원소 기호</b>는?</p>
        </>
      )
    case 'symbol-to-name':
      return (
        <>
          <p className="text-7xl font-black text-slate-900">{el.symbol}</p>
          <p className="mt-3 text-base text-slate-600">이 기호의 원소 <b>이름</b>은?</p>
        </>
      )
    case 'position-to-name':
      return (
        <>
          <p className="font-mono text-7xl font-black text-slate-900">{positionText(el)}</p>
          <p className="mt-3 text-base text-slate-600">
            {el.period}주기 {el.group}족에 있는 원소는? <span className="text-slate-400">(이름 또는 기호)</span>
          </p>
        </>
      )
    case 'name-to-position':
      return (
        <>
          <p className="text-6xl font-black text-slate-900">{el.nameKo}</p>
          <p className="mt-1 text-base text-slate-400">{el.nameEn}</p>
          <p className="mt-3 text-base text-slate-600">
            이 원소의 자리는 <b>(주기, 족)</b>으로? <span className="text-slate-400">예: 4, 8</span>
          </p>
        </>
      )
  }
}

export function QuizPlay({ kind, questions, onFinish, pushToast }: QuizPlayProps) {
  const { save, toggleReview } = useSaveData()
  const info = QUIZ_KIND_BY_ID.get(kind)!
  const [index, setIndex] = useState(0)
  const [input, setInput] = useState('')
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [feedback, setFeedback] = useState<QuizAnswer | null>(null)
  const [streak, setStreak] = useState(0)
  const [startedAt] = useState(() => Date.now())
  const inputRef = useRef<HTMLInputElement>(null)
  const shake = useAnimationControls()

  const el = questions[index]
  const score = answers.filter((a) => a.correct).length
  const marked = save.reviewElements.includes(el.atomicNumber)

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  const record = (answer: QuizAnswer) => {
    setAnswers((a) => [...a, answer])
    setFeedback(answer)
    setStreak((s) => (answer.correct ? s + 1 : 0))
    if (!answer.correct) void shake.start({ x: [0, -10, 10, -6, 6, 0], transition: { duration: 0.35 } })
  }

  const submit = () => {
    if (feedback) return next()
    if (!input.trim()) return
    const g = gradeAnswer(kind, input, el)
    record({ atomicNumber: el.atomicNumber, input: input.trim(), correct: g.correct, note: g.note })
  }

  const giveUp = () => {
    if (feedback) return
    record({ atomicNumber: el.atomicNumber, input: '', correct: false })
  }

  const next = () => {
    if (index + 1 >= questions.length) {
      onFinish(answers, Date.now() - startedAt)
      return
    }
    setIndex((i) => i + 1)
    setInput('')
    setFeedback(null)
  }

  const toggleCurrent = useCallback(() => {
    const added = toggleReview(el.atomicNumber)
    pushToast(
      added
        ? { tone: 'success', title: '오답 플래시에 저장했어요', body: feedback ? `${el.nameKo}(${el.symbol})` : '이 문제의 원소' }
        : { tone: 'info', title: '오답 플래시에서 뺐어요' },
    )
  }, [el, feedback, pushToast, toggleReview])

  // Alt+X: 현재 문제의 원소를 오답 플래시에 넣고 빼기 (플래시카드와 같은 단축키)
  const toggleRef = useRef(toggleCurrent)
  useLayoutEffect(() => {
    toggleRef.current = toggleCurrent
  }, [toggleCurrent])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyX' && !e.repeat) {
        e.preventDefault()
        toggleRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const t = CATEGORY_THEME[el.category]

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      {/* 진행 */}
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span className="font-mono">
          <b className="text-slate-900">{index + 1}</b> / {questions.length}
        </span>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
          <motion.div
            className="h-full rounded-full bg-blue-600"
            initial={false}
            animate={{ width: `${((index + (feedback ? 1 : 0)) / questions.length) * 100}%` }}
          />
        </div>
        <span>
          맞힘 <b className="font-mono text-emerald-700">{score}</b>
        </span>
        <span className={`flex items-center gap-1 ${streak >= 3 ? 'text-orange-600' : 'text-slate-400'}`}>
          <Flame className="h-4 w-4" /> <b className="font-mono">{streak}</b>
        </span>
      </div>

      {/* 문제 */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.18 }}
          className="rounded-3xl border border-lab-border bg-white px-6 py-10 text-center shadow-sm"
        >
          <Prompt kind={kind} el={el} />
        </motion.div>
      </AnimatePresence>

      {/* 답 입력 */}
      <motion.div animate={shake} className="flex flex-col gap-2 sm:flex-row">
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => !feedback && setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            // 한글 조합 중 Enter는 무시 (브라우저에 따라 Enter가 두 번 들어오는 문제 방지)
            e.preventDefault()
            if (!e.nativeEvent.isComposing) submit()
          }}
          readOnly={!!feedback}
          inputMode={info.numeric ? 'numeric' : 'text'}
          placeholder={info.placeholder}
          aria-label={info.placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`flex-1 rounded-xl border-2 px-4 py-3 text-lg text-slate-900 placeholder:text-slate-400 focus:outline-none ${
            feedback ? (feedback.correct ? 'border-emerald-400 bg-emerald-50' : 'border-rose-400 bg-rose-50') : 'border-slate-300 focus:border-blue-500'
          }`}
        />
        {!feedback ? (
          <div className="flex gap-2">
            <button onClick={submit} className="flex-1 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 sm:flex-none">
              확인
            </button>
            <button
              onClick={giveUp}
              className="flex items-center gap-1 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm text-slate-600 hover:bg-slate-100"
            >
              <HelpCircle className="h-4 w-4" /> 모르겠어요
            </button>
          </div>
        ) : (
          <button
            onClick={next}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
          >
            {index + 1 >= questions.length ? '결과 보기' : '다음 문제'} <ArrowRight className="h-4 w-4" />
            <kbd className="ml-1 rounded bg-white/20 px-1.5 font-mono text-[11px]">Enter</kbd>
          </button>
        )}
      </motion.div>

      {/* 채점 결과 */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${
              feedback.correct ? 'border-emerald-200 bg-emerald-50' : 'border-rose-200 bg-rose-50'
            }`}
            role="status"
          >
            <div className={`h-16 w-16 shrink-0 rounded-xl border-2 ${t.border} ${t.bg}`}>
              <ElementTile element={el} symbolClass={t.text} nameClass="text-slate-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`flex items-center gap-1.5 font-bold ${feedback.correct ? 'text-emerald-800' : 'text-rose-800'}`}>
                {feedback.correct ? <CheckCircle2 className="h-5 w-5" /> : <XCircle className="h-5 w-5" />}
                {feedback.correct ? '정답!' : feedback.input ? `"${feedback.input}"은(는) 틀렸어요` : '정답을 확인해 보세요'}
              </p>
              <p className="mt-0.5 text-sm text-slate-700">
                정답 <b className="text-slate-900">{answerText(kind, el)}</b> · {el.atomicNumber}번 {el.nameKo}({el.symbol}) {el.nameEn}
              </p>
              {feedback.note && (
                <p className="mt-1 flex items-center gap-1 text-xs text-slate-600">
                  <Info className="h-3.5 w-3.5" /> {feedback.note}
                </p>
              )}
            </div>
            <button
              onClick={toggleCurrent}
              className="flex items-center gap-1 rounded-lg border border-orange-300 bg-white px-2.5 py-1.5 text-xs font-medium text-orange-800 hover:bg-orange-50"
            >
              {marked ? <BookmarkMinus className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
              {marked ? '오답 플래시에서 빼기' : '오답 플래시에 저장'}
              <kbd className="ml-0.5 rounded bg-orange-100 px-1 font-mono text-[10px]">Alt+X</kbd>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
