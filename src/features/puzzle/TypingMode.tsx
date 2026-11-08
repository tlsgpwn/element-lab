import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { Eye, Keyboard, MousePointerClick, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ELEMENT_BY_Z } from '../../data/elements'
import { useGameSession } from '../../hooks/useGameSession'
import type { Toast } from '../../hooks/useToasts'
import { isCorrectAnswer, positionLabel, typingHint } from '../../lib/puzzle'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import { CompletePanel } from './CompletePanel'
import { GameHud } from './GameHud'
import { PeriodicGrid } from './PeriodicGrid'

interface TypingModeProps {
  unlockedZs: number[]
  pushToast: (t: Omit<Toast, 'id'>) => void
  onRestart: () => void
}

export function TypingMode({ unlockedZs, pushToast, onRestart }: TypingModeProps) {
  const targets = useMemo(() => [...unlockedZs].sort((a, b) => a - b), [unlockedZs])
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

      <div className="rounded-2xl border border-lab-border bg-lab-panel/50 p-3">
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
                    className={`flex h-full w-full flex-col items-center justify-center rounded-md border ${
                      isRevealed ? 'border-slate-500/60 bg-slate-700/40 opacity-70' : `${t.border} ${t.gradient}`
                    } ${pop ? 'shadow-[0_0_18px_4px_rgba(52,211,153,0.7)] ring-2 ring-emerald-400' : ''}`}
                  >
                    <span className={`text-sm font-black ${isRevealed ? 'text-slate-300' : t.text}`}>{el.symbol}</span>
                    <span className="w-full truncate px-0.5 text-center text-[8px] text-slate-300">{el.nameKo}</span>
                  </motion.div>
                  <AnimatePresence>
                    {pop && (
                      <motion.span
                        initial={{ opacity: 0, y: 0 }}
                        animate={{ opacity: [0, 1, 1, 0], y: -34 }}
                        transition={{ duration: 0.9 }}
                        className="pointer-events-none absolute inset-x-0 top-0 z-20 text-center font-mono text-sm font-bold text-emerald-300"
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
                      ? 'border-cyan-300 bg-cyan-400/25 text-cyan-100 shadow-[0_0_14px_2px_rgba(34,211,238,0.5)]'
                      : 'border-cyan-500/50 bg-cyan-500/5 text-cyan-500/70 hover:bg-cyan-500/15'
                  }`}
                >
                  ?
                </button>
              )
            }
            return <div className="h-full w-full rounded-md border border-slate-800/80 bg-slate-900/20" />
          }}
        />
      </div>

      {done ? (
        <CompletePanel stats={stats} total={targets.length} onRestart={onRestart} />
      ) : (
        <div className="sticky bottom-0 z-30 -mx-4 border-t border-lab-border bg-lab-bg/95 px-4 pt-3 pb-4 backdrop-blur-md">
          {selected ? (
            <motion.form
              animate={shake}
              onSubmit={(e) => {
                e.preventDefault()
                submit()
              }}
              className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center"
            >
              <div className="flex items-center gap-2 text-sm text-slate-300 sm:w-44">
                <Keyboard className="h-4 w-4 text-lab-accent" />
                <span>
                  <b className="text-white">{positionLabel(selected)}</b> 칸
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
                className="flex-1 rounded-xl border border-lab-border bg-slate-900/80 px-4 py-2.5 text-white placeholder:text-slate-500 focus:border-lab-accent focus:outline-none"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
                >
                  입력
                </button>
                <button
                  type="button"
                  onClick={giveUp}
                  title="정답 보기 (점수 없음, 콤보 초기화)"
                  className="flex items-center gap-1 rounded-xl border border-lab-border px-3 py-2.5 text-sm text-slate-300 hover:bg-white/5"
                >
                  <Eye className="h-4 w-4" /> 정답
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedZ(null)}
                  aria-label="선택 해제"
                  className="rounded-xl border border-lab-border px-2.5 text-slate-400 hover:bg-white/5"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.form>
          ) : (
            <p className="flex items-center justify-center gap-2 py-2 text-sm text-slate-400">
              <MousePointerClick className="h-4 w-4 text-lab-accent" />
              <span>
                <b className="text-cyan-300">?</b> 표시된 빈칸(해금한 원소 자리)을 클릭하고 기호나 이름을 입력하세요.
              </span>
            </p>
          )}
        </div>
      )}
    </div>
  )
}
