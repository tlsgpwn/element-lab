import {
  DndContext, DragOverlay, KeyboardSensor, PointerSensor, TouchSensor, useDraggable, useDroppable, useSensor, useSensors,
  type Announcements, type DragEndEvent, type DragOverEvent, type DragStartEvent,
} from '@dnd-kit/core'
import { AnimatePresence, motion, useAnimationControls } from 'framer-motion'
import { GripVertical } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ELEMENTS, ELEMENT_BY_Z } from '../../data/elements'
import { useGameSession } from '../../hooks/useGameSession'
import type { Toast } from '../../hooks/useToasts'
import { directionHint, progressiveHint } from '../../lib/puzzle'
import { shuffle } from '../../lib/random'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import type { ChemicalElement } from '../../types/chemistry'
import type { PuzzleRange } from '../../types/save'
import { ElementTile } from '../../components/ElementTile'
import { PeriodicGrid } from '../../components/PeriodicGrid'
import { CompletePanel } from './CompletePanel'
import { GameHud } from './GameHud'

type Flash = { z: number; kind: 'correct' | 'wrong'; gained?: number; nonce: number }

const cellId = (z: number) => `cell-${z}`
const cardId = (z: number) => `card-${z}`
const zOf = (id: string | number) => Number(String(id).split('-')[1])
const nameOf = (id: string | number) => ELEMENT_BY_Z.get(zOf(id))?.nameKo ?? ''

/** 스크린 리더 안내 (한국어). 정답 칸 이름은 노출하지 않는다 */
const ANNOUNCEMENTS: Announcements = {
  onDragStart: ({ active }) => `${nameOf(active.id)} 카드를 들었습니다.`,
  onDragOver: ({ active, over }) => (over ? `${nameOf(active.id)} 카드가 빈칸 위에 있습니다.` : `${nameOf(active.id)} 카드가 표 바깥에 있습니다.`),
  onDragEnd: ({ active, over }) => (over ? `${nameOf(active.id)} 카드를 놓았습니다.` : `${nameOf(active.id)} 카드를 덱으로 되돌렸습니다.`),
  onDragCancel: ({ active }) => `${nameOf(active.id)} 카드 이동을 취소했습니다.`,
}

const SCREEN_READER_INSTRUCTIONS = {
  draggable: '스페이스나 엔터로 카드를 들고, 방향키로 이동한 뒤 다시 스페이스나 엔터로 놓습니다. Esc로 취소합니다.',
}

interface DragPuzzleModeProps {
  range: PuzzleRange
  pushToast: (t: Omit<Toast, 'id'>) => void
  onRestart: () => void
}

export function DragPuzzleMode({ range, pushToast, onRestart }: DragPuzzleModeProps) {
  const [deck] = useState<ChemicalElement[]>(() =>
    shuffle(ELEMENTS.filter((e) => e.atomicNumber >= range.from && e.atomicNumber <= range.to)),
  )
  const [placed, setPlaced] = useState<Set<number>>(() => new Set())
  const [activeZ, setActiveZ] = useState<number | null>(null)
  const [overCorrect, setOverCorrect] = useState(false)
  const [flash, setFlash] = useState<Flash | null>(null)
  const [shake, setShake] = useState<{ z: number; nonce: number } | null>(null)
  const attempts = useRef(new Map<number, number>())
  const nonce = useRef(0)
  const { stats, hit, miss, finish } = useGameSession()

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor),
  )

  // 반짝임 효과 자동 해제
  useEffect(() => {
    if (!flash) return
    const id = setTimeout(() => setFlash(null), 900)
    return () => clearTimeout(id)
  }, [flash])

  const remaining = useMemo(() => deck.filter((e) => !placed.has(e.atomicNumber)), [deck, placed])
  const activeEl = activeZ !== null ? ELEMENT_BY_Z.get(activeZ) : undefined

  const onDragStart = (e: DragStartEvent) => setActiveZ(zOf(e.active.id))

  const onDragOver = (e: DragOverEvent) => {
    setOverCorrect(!!e.over && zOf(e.over.id) === zOf(e.active.id))
  }

  const onDragEnd = (e: DragEndEvent) => {
    const z = zOf(e.active.id)
    setActiveZ(null)
    setOverCorrect(false)
    if (!e.over) return // 빈 곳에 놓음: 덱으로 복귀만

    const targetZ = zOf(e.over.id)
    const el = ELEMENT_BY_Z.get(z)
    const dropped = ELEMENT_BY_Z.get(targetZ)
    if (!el || !dropped) return
    nonce.current++

    if (targetZ === z) {
      const { gained, combo } = hit()
      const next = new Set(placed).add(z)
      setPlaced(next)
      setFlash({ z, kind: 'correct', gained, nonce: nonce.current })
      if (combo > 0 && combo % 5 === 0) pushToast({ tone: 'success', title: `${combo}연속 정답!`, body: '콤보 보너스가 계속 쌓이고 있어요.' })
      if (next.size === deck.length) finish()
    } else {
      miss()
      const n = (attempts.current.get(z) ?? 0) + 1
      attempts.current.set(z, n)
      setFlash({ z: targetZ, kind: 'wrong', nonce: nonce.current })
      setShake({ z, nonce: nonce.current })
      const dir = directionHint(el, dropped)
      pushToast({
        tone: 'error',
        title: `${el.nameKo}(${el.symbol})의 자리가 아니에요`,
        body: [progressiveHint(el, n), dir].filter(Boolean).join(' '),
      })
    }
  }

  const done = placed.size === deck.length

  return (
    <DndContext
      sensors={sensors}
      accessibility={{ announcements: ANNOUNCEMENTS, screenReaderInstructions: SCREEN_READER_INSTRUCTIONS }}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
      onDragCancel={() => {
        setActiveZ(null)
        setOverCorrect(false)
      }}
    >
      <div className="space-y-4">
        <GameHud stats={stats} done={placed.size} total={deck.length} onRestart={onRestart} />

        <div className="rounded-2xl border border-lab-border bg-white p-3">
          <PeriodicGrid
            emphasizeAxes
            renderCell={(el) => (
              <DropCell
                el={el}
                isPlaced={placed.has(el.atomicNumber)}
                flash={flash && flash.z === el.atomicNumber ? flash : null}
                dragging={activeZ !== null}
              />
            )}
          />
        </div>

        {done ? (
          <CompletePanel stats={stats} total={deck.length} onRestart={onRestart} />
        ) : (
          <div className="sticky bottom-0 z-30 -mx-4 border-t border-lab-border bg-white/95 px-4 pt-3 pb-4 shadow-[0_-4px_12px_rgba(15,23,42,0.06)] backdrop-blur-md">
            <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <GripVertical className="h-3.5 w-3.5" /> 원소 덱 — 카드를 끌어 주기율표의 올바른 칸에 놓으세요
              </span>
              <span className="font-mono">남은 카드 {remaining.length}</span>
            </div>
            <div className="flex max-h-[28vh] flex-wrap gap-2 overflow-y-auto py-1">
              {remaining.map((el) => (
                <DeckCard
                  key={el.atomicNumber}
                  el={el}
                  shakeNonce={shake && shake.z === el.atomicNumber ? shake.nonce : 0}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={overCorrect ? null : undefined} zIndex={70}>
        {activeEl ? <CardFace el={activeEl} lifted /> : null}
      </DragOverlay>
    </DndContext>
  )
}

/* ------------------------------ 덱 카드 ------------------------------ */

function CardFace({ el, lifted = false }: { el: ChemicalElement; lifted?: boolean }) {
  const t = CATEGORY_THEME[el.category]
  return (
    <div
      className={`flex h-[72px] w-[64px] cursor-grab flex-col items-center justify-center rounded-xl border-2 ${t.border} ${t.bg} select-none ${
        lifted ? 'scale-110 rotate-3 cursor-grabbing shadow-xl' : 'shadow-sm'
      }`}
    >
      <span className={`text-xl font-black ${t.text}`}>{el.symbol}</span>
      <span className="w-full truncate px-1 text-center text-[10px] text-slate-600">{el.nameKo}</span>
    </div>
  )
}

function DeckCard({ el, shakeNonce }: { el: ChemicalElement; shakeNonce: number }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: cardId(el.atomicNumber) })
  const controls = useAnimationControls()

  useEffect(() => {
    if (!shakeNonce) return
    // 드롭 애니메이션(약 250ms)으로 덱에 돌아온 뒤 흔들기
    const id = setTimeout(() => {
      void controls.start({ x: [0, -10, 10, -7, 7, -3, 0], transition: { duration: 0.45 } })
    }, 260)
    return () => clearTimeout(id)
  }, [shakeNonce, controls])

  return (
    <motion.div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      aria-label={`${el.nameKo} 카드`}
      animate={controls}
      layout
      className={`touch-none rounded-xl focus-visible:ring-2 focus-visible:ring-lab-accent focus-visible:outline-none ${
        isDragging ? 'opacity-25' : ''
      }`}
    >
      <CardFace el={el} />
    </motion.div>
  )
}

/* ------------------------------ 드롭 칸 ------------------------------ */

function DropCell({
  el, isPlaced, flash, dragging,
}: { el: ChemicalElement; isPlaced: boolean; flash: Flash | null; dragging: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: cellId(el.atomicNumber), disabled: isPlaced })
  const t = CATEGORY_THEME[el.category]

  if (isPlaced) {
    const justPlaced = flash?.kind === 'correct'
    return (
      <div ref={setNodeRef} className="relative h-full w-full">
        <motion.div
          initial={justPlaced ? { scale: 1.5, opacity: 0.4 } : false}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 500, damping: 18 }}
          className={`h-full w-full rounded-md border ${t.border} ${t.bg} text-slate-600 ${
            justPlaced ? 'shadow-[0_0_14px_3px_rgba(16,185,129,0.55)] ring-2 ring-emerald-500' : ''
          } transition-shadow duration-700`}
        >
          <ElementTile element={el} symbolClass={t.text} nameClass="text-slate-600" />
        </motion.div>
        <AnimatePresence>
          {justPlaced && flash?.gained && (
            <motion.span
              key={flash.nonce}
              initial={{ opacity: 0, y: 0 }}
              animate={{ opacity: [0, 1, 1, 0], y: -34 }}
              transition={{ duration: 0.9 }}
              className="pointer-events-none absolute inset-x-0 top-0 z-20 text-center font-mono text-sm font-bold text-emerald-600"
            >
              +{flash.gained}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    )
  }

  const wrong = flash?.kind === 'wrong'
  return (
    <motion.div
      ref={setNodeRef}
      key={wrong ? flash.nonce : 'idle'}
      animate={wrong ? { x: [0, -5, 5, -3, 3, 0] } : undefined}
      transition={{ duration: 0.4 }}
      className={`h-full w-full rounded-md border transition-colors ${
        wrong
          ? 'border-rose-500 bg-rose-100 shadow-[0_0_12px_2px_rgba(244,63,94,0.45)]'
          : isOver
            ? 'border-blue-500 bg-blue-100'
            : dragging
              ? 'border-slate-300 bg-slate-100'
              : 'border-slate-200 bg-slate-50'
      }`}
    />
  )
}
