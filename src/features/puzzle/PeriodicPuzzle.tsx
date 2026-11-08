import { BookOpen, Compass, Hand, Keyboard, Lock, type LucideIcon } from 'lucide-react'
import { useState } from 'react'
import { ToastStack } from '../../components/ToastStack'
import { ELEMENTS } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { useToasts } from '../../hooks/useToasts'
import { DragPuzzleMode } from './DragPuzzleMode'
import { ExploreMode } from './ExploreMode'
import { TypingMode } from './TypingMode'

type PuzzleMode = 'explore' | 'drag' | 'typing'

const MODES: { id: PuzzleMode; label: string; desc: string; icon: LucideIcon }[] = [
  { id: 'explore', label: '탐색 모드', desc: '해금한 원소를 눌러 상세 정보를 확인하세요. 범례를 누르면 분류별로 강조됩니다.', icon: Compass },
  { id: 'drag', label: '드래그 퍼즐', desc: '덱의 원소 카드를 끌어 빈 주기율표의 정확한 위치(주기·족)에 놓으세요.', icon: Hand },
  { id: 'typing', label: '하드코어 타이핑', desc: '빈칸을 클릭하고 원소 기호나 이름을 직접 입력하는 백지 테스트입니다.', icon: Keyboard },
]

export function PeriodicPuzzle({ onGoToToday }: { onGoToToday: () => void }) {
  const { save } = useSaveData()
  const { toasts, push, dismiss } = useToasts()
  const [mode, setMode] = useState<PuzzleMode>('explore')
  /** 게임 재시작용 key */
  const [round, setRound] = useState(0)
  const restart = () => setRound((r) => r + 1)
  const info = MODES.find((m) => m.id === mode)!
  const unlockedCount = save.unlockedElements.length

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="inline-flex flex-wrap rounded-xl border border-lab-border bg-lab-panel/70 p-1" role="tablist">
          {MODES.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              role="tab"
              aria-selected={mode === id}
              onClick={() => {
                setMode(id)
                restart()
              }}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                mode === id ? 'bg-cyan-500/20 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="h-4 w-4" /> {label}
            </button>
          ))}
        </div>
        <span className="flex items-center gap-1.5 text-sm text-slate-400">
          <Lock className="h-3.5 w-3.5" /> 해금 {unlockedCount} / {ELEMENTS.length}
        </span>
      </div>
      <p className="text-xs text-slate-500">{info.desc}</p>

      {mode === 'explore' ? (
        <ExploreMode
          onLockedClick={(learnable, name) =>
            push({
              tone: 'info',
              title: `${name}은(는) 아직 잠겨 있어요`,
              body: learnable ? '[오늘의 원소]에서 학습하면 해금됩니다.' : '이 원소의 학습 데이터는 준비 중이에요.',
            })
          }
        />
      ) : unlockedCount === 0 ? (
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4 rounded-3xl border border-lab-border bg-lab-panel/70 px-6 py-14 text-center">
          <Lock className="h-12 w-12 text-slate-500" />
          <h2 className="text-xl font-bold text-white">퍼즐에 쓸 원소가 없어요</h2>
          <p className="text-sm text-slate-400">해금한 원소만 퍼즐에 등장합니다. 먼저 원소를 학습해 보세요.</p>
          <button
            onClick={onGoToToday}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-500 to-violet-500 px-4 py-2.5 text-sm font-semibold text-white"
          >
            <BookOpen className="h-4 w-4" /> 오늘의 원소 학습하기
          </button>
        </div>
      ) : mode === 'drag' ? (
        <DragPuzzleMode key={round} unlockedZs={save.unlockedElements} pushToast={push} onRestart={restart} />
      ) : (
        <TypingMode key={round} unlockedZs={save.unlockedElements} pushToast={push} onRestart={restart} />
      )}

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
