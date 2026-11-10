import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { Eye, Keyboard, MousePointerClick, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ELEMENT_BY_Z } from '../../data/elements'
import { ElementTile } from '../../components/ElementTile'
import { PeriodicGrid } from '../../components/PeriodicGrid'
import type { PuzzleRange } from '../../types/save'
import { useGameSession } from '../../hooks/useGameSession'
import type { Toast } from '../../hooks/useToasts'
import { isCorrectAnswer, positionLabel, typingHint } from '../../lib/puzzle'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import { CompletePanel } from './CompletePanel'
import { GameHud } from './GameHud'

interface TypingModeProps {
  range: PuzzleRange
  pushToast: (t: Omit<Toast, 'id'>) => void
  onRestart: () => void
}

export function TypingMode({ range, pushToast, onRestart }: TypingModeProps) {
  const targets = useMemo(() => Array.from({ length: range.to - range.from + 1 }, (_, i) => range.from + i), [range.from, range.to])
  const targetSet = useMemo(() => new Set(targets), [targets])
  const [filled, setFilled] = useState<Set<number>>(() => new Set())
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())
  const [selectedZ, setSelectedZ] = useState<number | null>(null)
  const [input, setInput] = useState('')
  const [lastCorrect, setLastCorrect] = useState<{ z: number; gained: number } | null>(null)
  const attempts = useRef(new Map<number, number>())
  const inputRef = useRef<HTMLInputElement>(null)
  const shake = useAnimationControls()
  const { stats, hit, miss, finish } = useGameSession()

  const doneCount = filled.size + revealed.size
  const done = doneCount === targets.length
  const selected = selectedZ !== null ? ELEMENT_BY_Z.get(selectedZ) : undefined

  useEffect(() => {
    if (selectedZ !== null) inputRef.current?.focus()
  }, [selectedZ])

  useEffect(() => {
    if (!lastCorrect) return
    const id = setTimeout(() => setLastCorrect(null), 900)
    return () => clearTimeout(id)
  }, [lastCorrect])

  const isOpen = (z: number) => targetSet.has(z) && !filled.has(z) && !revealed.has(z)

  /** 현재 칸 다음의 빈칸(원자 번호순, 순환)을 고른다 */
  const advance = (fromZ: number, nextFilled: Set<number>, nextRevealed: Set<number>) => {
    const open = targets.filter((z) => !nextFilled.has(z) && !nextRevealed.has(z))
    setSelectedZ(open.find((z) => z > fromZ) ?? open[0] ?? null)
    setInput('')
  }

  const submit = () => {
    if (!selected || !input.trim()) return
    const z = selected.atomicNumber
    if (isCorrectAnswer(input, selected)) {
      const { gained } = hit()
      const next = new Set(filled).add(z)
      setFilled(next)
      setLastCorrect({ z, gained })
      if (next.size + revealed.size === targets.length) {
        finish()
        setSelectedZ(null)
      } else advance(z, next, revealed)
    } else {
      miss()
      const n = (attempts.current.get(z) ?? 0) + 1
      attempts.current.set(z, n)
      void shake.start({ x: [0, -12, 12, -8, 8, -4, 0], transition: { duration: 0.4 } })
      pushToast({ tone: 'error', title: `"${input.trim()}"은(는) 정답이 아니에요`, body: typingHint(selected, n) })
      setInput('')
    }
  }

  const giveUp = () => {
    if (!selected) return
    const z = selected.atomicNumber
    miss()
    const next = new Set(revealed).add(z)
    setRevealed(next)
    pushToast({ tone: 'info', title: `정답: ${selected.nameKo} (${selected.symbol})`, body: `${positionLabel(selected)} · 원자 번호 ${z}` })
    if (filled.size + next.size === targets.length) {
      finish()
      setSelectedZ(null)
    } else advance(z, filled, next)
  }

  return (
    <div className="space-y-4">
      <GameHud stats={stats} done={doneCount} total={targets.length} onRestart={onRestart} />

      <div className="rounded-2xl border border-lab-border bg-white p-3">
        <PeriodicGrid
          emphasizeAxes
          renderCell={(el) => {
            const z = el.atomicNumber
            const t = CATEGORY_THEME[el.category]
            if (filled.has(z) || revealed.has(z)) {
              const isRevealed = revealed.has(z)
              const pop = lastCorrect?.z === z
              return (
                <div className="relative h-full w-full">
                  <motion.div
                    initial={pop ? { scale: 1.5 } : false}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 18 }}
                    className={`h-full w-full rounded-md border text-slate-600 ${
                      isRevealed ? 'border-slate-300 bg-slate-100 opacity-70' : `${t.border} ${t.bg}`
                    } ${pop ? 'shadow-[0_0_14px_3px_rgba(16,185,129,0.55)] ring-2 ring-emerald-500' : ''}`}
                  >
                    <ElementTile element={el} symbolClass={isRevealed ? 'text-slate-500' : t.text} nameClass="text-slate-600" />
                  </motion.div>
                  <AnimatePresence>
                    {pop && (
                      <motion.span
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -34 }}
                        transition={{ duration: 0.9 }}
                        className="pointer-events-none absolute inset-x-0 top-0 z-20 text-center font-mono text-sm font-bold text-emerald-600"
                      >
                        +{lastCorrect.gained}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              )
            }
            if (isOpen(z)) {
              const active = selectedZ === z
              return (
                <button
                  onClick={() => {
                    setSelectedZ(z)
                    setInput('')
                  }}
                  aria-label={`${positionLabel(el)} 빈칸`}
                  className={`flex h-full w-full items-center justify-center rounded-md border border-dashed font-mono text-sm transition ${
                    active
                      ? 'border-blue-500 bg-blue-100 text-blue-700 shadow-[0_0_10px_2px_rgba(42,120,214,0.35)]'
                      : 'border-blue-300 bg-blue-50/60 text-blue-400 hover:bg-blue-100'
                  }`}
                >
                  ?
                </button>
              )
            }
            return <div className="h-full w-full rounded-md border border-slate-200 bg-slate-50" />
          }}
        />
      </div>

      {done ? (
        <CompletePanel stats={stats} total={targets.length} onRestart={onRestart} />
      ) : (
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-lab-border bg-white/95 px-4 pt-3 pb-4 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur-md">
          {selected ? (
            <motion.form
              animate={shake}
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2 text-sm text-slate-600 sm:w-44">
                <Keyboard className="h-4 w-4 text-lab-accent" />
                <span>
                  <b className="text-slate-900">{positionLabel(selected)}</b> 칸
                </span>
              </div>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && setSelectedZ(null)}
                placeholder="원소 기호 또는 이름 (예: Fe, 철, Iron)"
                autoComplete="off"
                spellCheck={false}
                className="flex-1 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 focus:border-lab-accent focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  입력
                </button>
                <button
                  type="button"
                  onClick={giveUp}
                  title="정답 보기 (점수 없음, 콤보 초기화)"
                  className="flex items-center gap-1 rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-600 hover:bg-slate-100"
                >
                  <Eye className="h-4 w-4" /> 정답
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZ(null)}
                  aria-label="선택 해제"
                  className="rounded-xl border border-slate-300 px-2.5 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.form>
          ) : (
            <p className="flex items-center justify-center gap-2 py-2 text-sm text-slate-500">
              <MousePointerClick className="h-4 w-4 text-lab-accent" />
              <span>
                <b className="text-blue-600">?</b> 표시된 빈칸(고른 범위의 원소 자리)을 클릭하고 기호나 이름을 입력하세요.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
