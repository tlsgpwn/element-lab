import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import type { ModeId } from './components/tabs'
import { BasicMode } from './features/table/BasicMode'

// 기본 모드 외에는 해당 탭을 열 때 불러온다 (코드 분할)
const PuzzleMode = lazy(() => import('./features/puzzle/PuzzleMode').then((m) => ({ default: m.PuzzleMode })))
const FlashcardMode = lazy(() => import('./features/flashcards/FlashcardMode').then((m) => ({ default: m.FlashcardMode })))
const QuizMode = lazy(() => import('./features/quiz/QuizMode').then((m) => ({ default: m.QuizMode })))

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
      <Loader2 className="h-5 w-5 animate-spin text-lab-accent" /> 불러오는 중…
    </div>
  )
}

function App() {
  const [mode, setMode] = useState<ModeId>('table')

  return (
    <div className="min-h-screen">
      <AppHeader active={mode} onChange={setMode} />
      <main className="mx-auto max-w-7xl px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            <Suspense fallback={<Loading />}>
              {mode === 'table' && <BasicMode />}
              {mode === 'puzzle' && <PuzzleMode />}
              {mode === 'flashcards' && <FlashcardMode />}
              {mode === 'quiz' && <QuizMode />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
