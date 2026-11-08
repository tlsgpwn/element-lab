import { AnimatePresence, motion } from 'framer-motion'
import { BookOpenCheck, CheckCircle2, ChevronRight, Layers, PartyPopper, Plus, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ElementCard } from '../../components/ElementCard'
import { LEARNABLE_ELEMENTS, ELEMENT_BY_Z } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { CATEGORY_THEME } from '../../theme/categoryColors'

interface TodayElementsProps {
  onGoToFlashcards: () => void
}

export function TodayElements({ onGoToFlashcards }: TodayElementsProps) {
  const { save, learnedTodayCount, completeLearning } = useSaveData()
  const [selectedZ, setSelectedZ] = useState<number | null>(null)
  const [extraMode, setExtraMode] = useState(false)

  const unlocked = useMemo(() => new Set(save.unlockedElements), [save.unlockedElements])
  const nextUnlearned = LEARNABLE_ELEMENTS.find((e) => !unlocked.has(e.atomicNumber)) ?? null
  const current = selectedZ !== null ? (ELEMENT_BY_Z.get(selectedZ) ?? null) : nextUnlearned

  const goal = save.dailyGoal
  const goalReached = learnedTodayCount >= goal
  const allLearned = nextUnlearned === null
  const showCard = current !== null && (!goalReached || extraMode || selectedZ !== null)
  const isCurrentUnlocked = current !== null && unlocked.has(current.atomicNumber)
  const progress = Math.min(1, learnedTodayCount / goal)

  const handleComplete = () => {
    if (!current) return
    completeLearning(current.atomicNumber)
    setSelectedZ(null)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <section className="min-w-0 space-y-5">
        {/* 진행도 */}
        <div className="rounded-2xl border border-lab-border bg-lab-panel/70 p-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 font-medium text-slate-200">
              <BookOpenCheck className="h-4 w-4 text-lab-accent" /> 오늘의 학습
            </span>
            <span className="font-mono text-slate-300">
              <b className="text-white">{learnedTodayCount}</b> / {goal}
              {learnedTodayCount > goal && <span className="ml-1 text-amber-300">(+{learnedTodayCount - goal})</span>}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-800">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
              initial={false}
              animate={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            총 해금 {save.unlockedElements.length} / {LEARNABLE_ELEMENTS.length}개
          </p>
        </div>

        <AnimatePresence mode="wait">
          {showCard && current ? (
            <motion.div
              key={current.atomicNumber}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="space-y-4"
            >
              <ElementCard element={current} />
              <div className="flex flex-wrap justify-end gap-3">
                {selectedZ !== null && (
                  <button
                    onClick={() => setSelectedZ(null)}
                    className="rounded-xl border border-lab-border px-4 py-2.5 text-sm text-slate-300 transition hover:bg-white/5"
                  >
                    다음 학습 원소로
                  </button>
                )}
                {isCurrentUnlocked ? (
                  <span className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300 ring-1 ring-emerald-400/30">
                    <CheckCircle2 className="h-4 w-4" /> 이미 해금한 원소예요
                  </span>
                ) : (
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 transition hover:brightness-110"
                  >
                    <CheckCircle2 className="h-4 w-4" /> 학습 완료
                  </button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-4 rounded-3xl border border-lab-border bg-lab-panel/70 px-6 py-12 text-center"
            >
              {allLearned ? (
                <Sparkles className="h-12 w-12 text-violet-300" />
              ) : (
                <PartyPopper className="h-12 w-12 text-amber-300" />
              )}
              <h2 className="text-2xl font-bold text-white">
                {allLearned ? '모든 원소를 학습했어요!' : '오늘의 목표를 달성했어요!'}
              </h2>
              <p className="max-w-md text-sm text-slate-400">
                {allLearned
                  ? '현재 준비된 원소를 모두 해금했습니다. 플래시카드로 복습하며 기억을 단단히 다져 보세요.'
                  : `오늘 ${learnedTodayCount}개의 원소를 새로 익혔습니다. 복습을 하거나, 원한다면 더 학습할 수 있어요.`}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {!allLearned && (
                  <button
                    onClick={() => setExtraMode(true)}
                    className="flex items-center gap-2 rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-2.5 text-sm font-medium text-cyan-200 transition hover:bg-cyan-500/20"
                  >
                    <Plus className="h-4 w-4" /> 추가 학습하기
                  </button>
                )}
                <button
                  onClick={onGoToFlashcards}
                  className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
                >
                  <Layers className="h-4 w-4" /> 플래시카드로 복습 <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>

      {/* 원소 선택 패널 */}
      <aside className="rounded-2xl border border-lab-border bg-lab-panel/70 p-4 lg:sticky lg:top-24 lg:self-start">
        <h3 className="mb-1 text-sm font-semibold text-slate-200">원소 골라서 학습하기</h3>
        <p className="mb-3 text-xs text-slate-500">순서대로 진행되지만, 원하는 원소를 직접 선택할 수도 있어요.</p>
        <div className="grid grid-cols-6 gap-1.5 sm:grid-cols-9 lg:grid-cols-6">
          {LEARNABLE_ELEMENTS.map((el) => {
            const theme = CATEGORY_THEME[el.category]
            const isUnlocked = unlocked.has(el.atomicNumber)
            const isActive = current?.atomicNumber === el.atomicNumber && showCard
            return (
              <button
                key={el.atomicNumber}
                onClick={() => setSelectedZ(el.atomicNumber)}
                title={`${el.atomicNumber}. ${el.nameKo}${isUnlocked ? ' (해금됨)' : ''}`}
                className={`relative flex aspect-square flex-col items-center justify-center rounded-lg border text-xs transition ${
                  isUnlocked
                    ? `${theme.border} ${theme.gradient} ${theme.text}`
                    : 'border-slate-700/60 bg-slate-900/40 text-slate-500 hover:text-slate-300'
                } ${isActive ? 'ring-2 ring-lab-accent ring-offset-2 ring-offset-lab-panel' : ''}`}
              >
                <span className="text-[8px] leading-none opacity-70">{el.atomicNumber}</span>
                <span className="font-bold">{el.symbol}</span>
              </button>
            )
          })}
        </div>
      </aside>
    </div>
  )
}
