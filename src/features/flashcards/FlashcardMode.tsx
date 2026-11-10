import { motion } from 'framer-motion'
import { Bookmark, BookmarkMinus, BookmarkPlus, Eye, EyeOff, Keyboard, RotateCcw, Trash2, X } from 'lucide-react'
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { ElementTile } from '../../components/ElementTile'
import { PeriodicGrid } from '../../components/PeriodicGrid'
import { ToastStack } from '../../components/ToastStack'
import { ELEMENTS, ELEMENT_BY_Z } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { useToasts } from '../../hooks/useToasts'
import { positionLabel } from '../../lib/puzzle'
import { CATEGORY_THEME } from '../../theme/categoryColors'
import type { ChemicalElement } from '../../types/chemistry'

const FACE: CSSProperties = { backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }

export function FlashcardMode() {
  const { save, toggleReview, removeReview, clearReview } = useSaveData()
  const { toasts, push, dismiss } = useToasts()
  const [revealed, setRevealed] = useState<Set<number>>(() => new Set())
  const [current, setCurrent] = useState<number | null>(null)
  const [reviewOnly, setReviewOnly] = useState(false)
  const [confirmClear, setConfirmClear] = useState(false)

  const review = useMemo(() => new Set(save.reviewElements), [save.reviewElements])
  /** 오답을 모두 빼면 복습 모드는 자동으로 풀린다 */
  const reviewMode = reviewOnly && review.size > 0
  const isPlayable = useCallback((z: number) => !reviewMode || review.has(z), [reviewMode, review])
  const playable = ELEMENTS.filter((e) => isPlayable(e.atomicNumber))
  const seen = playable.filter((e) => revealed.has(e.atomicNumber)).length
  const currentEl = current !== null ? ELEMENT_BY_Z.get(current) : undefined

  const flip = (z: number) => {
    setCurrent(z)
    setRevealed((prev) => {
      const next = new Set(prev)
      if (next.has(z)) next.delete(z)
      else next.add(z)
      return next
    })
  }

  const markCurrent = useCallback(() => {
    if (current === null) {
      push({ tone: 'info', title: '먼저 원소 칸을 눌러 주세요', body: '마지막으로 누른 칸이 오답 플래시에 저장돼요.' })
      return
    }
    const el = ELEMENT_BY_Z.get(current)
    if (!el) return
    const added = toggleReview(current)
    const who = revealed.has(current) ? `${el.nameKo}(${el.symbol})` : `${positionLabel(el)} 칸`
    push(
      added
        ? { tone: 'success', title: '오답 플래시에 저장했어요', body: `${who} — 나중에 [오답만 복습]으로 다시 볼 수 있어요.` }
        : { tone: 'info', title: '오답 플래시에서 뺐어요', body: who },
    )
  }, [current, revealed, push, toggleReview])

  // Alt+X 단축키 (event.code 기준이라 한글 자판에서도 동작)
  const markRef = useRef(markCurrent)
  useLayoutEffect(() => {
    markRef.current = markCurrent
  }, [markCurrent])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey && e.code === 'KeyX' && !e.repeat) {
        e.preventDefault()
        markRef.current()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const hideAll = () => setRevealed(new Set())
  const showAll = () => setRevealed(new Set(playable.map((e) => e.atomicNumber)))

  const toggleReviewOnly = () => {
    if (!reviewMode && review.size === 0) {
      push({ tone: 'info', title: '오답 플래시가 비어 있어요', body: '칸을 누른 뒤 Alt+X로 다시 볼 원소를 저장해 보세요.' })
      return
    }
    setReviewOnly(!reviewMode)
    setRevealed(new Set())
  }

  const reviewList = save.reviewElements.map((z) => ELEMENT_BY_Z.get(z)).filter((e): e is ChemicalElement => !!e)

  return (
    <div className="space-y-4">
      {/* 도구 모음 */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={hideAll} className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
          <EyeOff className="h-4 w-4" /> 모두 가리기
        </button>
        <button onClick={showAll} className="flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
          <Eye className="h-4 w-4" /> 모두 보기
        </button>
        <button
          onClick={toggleReviewOnly}
          aria-pressed={reviewMode}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-semibold transition ${
            reviewMode ? 'border-orange-500 bg-orange-500 text-white' : 'border-orange-300 bg-orange-50 text-orange-800 hover:bg-orange-100'
          }`}
        >
          <Bookmark className="h-4 w-4" /> 오답만 복습 ({review.size})
        </button>
        <button
          onClick={markCurrent}
          className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          title="마지막으로 누른 원소를 오답 플래시에 저장하거나 뺍니다"
        >
          {current !== null && review.has(current) ? <BookmarkMinus className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
          {current !== null && review.has(current) ? '오답에서 빼기' : '오답에 저장'}
          <kbd className="ml-1 rounded bg-white/20 px-1.5 py-0.5 font-mono text-[11px]">Alt+X</kbd>
        </button>
        <span className="ml-auto text-sm text-slate-500">
          확인한 원소 <b className="font-mono text-slate-900">{seen}</b> / {playable.length}
        </span>
      </div>

      <p className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Keyboard className="h-3.5 w-3.5" />
        칸을 누르면 뒤집혀요(다시 누르면 가려짐). 헷갈린 원소는 누른 뒤 <kbd className="rounded border border-slate-300 bg-white px-1 font-mono">Alt</kbd>+
        <kbd className="rounded border border-slate-300 bg-white px-1 font-mono">X</kbd>(맥은 Option+X)로 오답 플래시에 저장하세요.
      </p>
      {/* 선택 표시: 높이를 고정해 두어야 탭(포커스) 직후 표가 밀려 클릭이 빗나가지 않는다 */}
      <div className="flex h-6 items-center text-xs" aria-live="polite">
        {currentEl ? (
          <span className="truncate rounded-full bg-blue-50 px-2 py-0.5 text-blue-800 ring-1 ring-blue-200">
            선택: {revealed.has(currentEl.atomicNumber) ? `${currentEl.nameKo}(${currentEl.symbol})` : `${positionLabel(currentEl)} 칸`}
          </span>
        ) : (
          <span className="text-slate-400">선택한 칸 없음</span>
        )}
      </div>

      {/* 주기율표 */}
      <div className="rounded-2xl border border-lab-border bg-white p-3">
        <PeriodicGrid
          renderCell={(el) => {
            const z = el.atomicNumber
            const t = CATEGORY_THEME[el.category]
            const marked = review.has(z)
            const isCurrent = current === z

            if (!isPlayable(z)) {
              return (
                <div className="h-full w-full rounded-md border border-slate-100 bg-slate-50 text-slate-400 opacity-60">
                  <ElementTile element={el} symbolClass="text-slate-400" nameClass="text-slate-400" />
                </div>
              )
            }

            const open = revealed.has(z)
            return (
              <button
                onClick={() => flip(z)}
                onFocus={() => setCurrent(z)}
                aria-label={open ? `${el.nameKo} ${el.symbol}${marked ? ', 오답 플래시' : ''}` : `${positionLabel(el)} 가려진 칸${marked ? ', 오답 플래시' : ''}`}
                aria-pressed={open}
                className={`relative h-full w-full rounded-md focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                  isCurrent ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                }`}
                style={{ perspective: 400 }}
              >
                <motion.span
                  className="relative block h-full w-full"
                  style={{ transformStyle: 'preserve-3d' }}
                  initial={false}
                  animate={{ rotateY: open ? 180 : 0 }}
                  transition={{ duration: 0.35, ease: 'easeInOut' }}
                >
                  {/* 앞면: 물음표 */}
                  <span
                    style={FACE}
                    className="absolute inset-0 flex items-center justify-center rounded-md border border-slate-300 bg-slate-100 text-lg font-black text-slate-400 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-500"
                  >
                    ?
                  </span>
                  {/* 뒷면: 원소 */}
                  <span style={{ ...FACE, transform: 'rotateY(180deg)' }} className={`absolute inset-0 rounded-md border ${t.border} ${t.bg} text-slate-600`}>
                    <ElementTile element={el} symbolClass={t.text} nameClass="text-slate-600" />
                  </span>
                </motion.span>
                {marked && (
                  <Bookmark className="absolute -top-1 -right-0.5 h-3.5 w-3.5 fill-orange-500 text-orange-500" aria-hidden />
                )}
              </button>
            )
          }}
        />
      </div>

      {/* 오답 플래시 목록 */}
      <section className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4">
        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-1.5 text-sm font-bold text-orange-900">
            <Bookmark className="h-4 w-4 fill-orange-500 text-orange-500" /> 오답 플래시 ({reviewList.length})
          </h3>
          <div className="flex gap-2">
            {reviewMode && (
              <button onClick={hideAll} className="flex items-center gap-1 rounded-lg border border-orange-300 bg-white px-2.5 py-1 text-xs text-orange-800 hover:bg-orange-100">
                <RotateCcw className="h-3.5 w-3.5" /> 다시 가리기
              </button>
            )}
            {reviewList.length > 0 && (
              <button
                onClick={() => {
                  if (!confirmClear) {
                    setConfirmClear(true)
                    setTimeout(() => setConfirmClear(false), 3000)
                    return
                  }
                  clearReview()
                  setReviewOnly(false)
                  setConfirmClear(false)
                }}
                className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs ${
                  confirmClear ? 'border-rose-500 bg-rose-500 text-white' : 'border-orange-300 bg-white text-orange-800 hover:bg-orange-100'
                }`}
              >
                <Trash2 className="h-3.5 w-3.5" /> {confirmClear ? '한 번 더 누르면 모두 비워요' : '모두 비우기'}
              </button>
            )}
          </div>
        </div>
        {reviewList.length === 0 ? (
          <p className="text-sm text-orange-900/70">아직 저장한 원소가 없어요. 헷갈리는 원소 칸을 누르고 Alt+X를 눌러 보세요.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {reviewList.map((el) => (
              <li key={el.atomicNumber} className="flex items-center gap-1 rounded-full bg-white py-0.5 pr-1 pl-2.5 text-sm ring-1 ring-orange-200">
                {reviewMode && !revealed.has(el.atomicNumber) ? (
                  <span className="text-slate-600">{positionLabel(el)} 칸</span>
                ) : (
                  <>
                    <span className="font-mono text-[11px] text-slate-400">{el.atomicNumber}</span>
                    <b className="text-slate-900">{el.symbol}</b>
                    <span className="text-slate-600">{el.nameKo}</span>
                  </>
                )}
                <button
                  onClick={() => removeReview(el.atomicNumber)}
                  className="rounded-full p-0.5 text-slate-400 hover:bg-orange-100 hover:text-orange-700"
                  aria-label={`${el.nameKo} 오답 플래시에서 빼기`}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
