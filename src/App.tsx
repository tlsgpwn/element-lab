import { AnimatePresence, motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { lazy, Suspense, useState } from 'react'
import { AppHeader } from './components/AppHeader'
import { DailyGoalModal } from './components/DailyGoalModal'
import type { TabId } from './components/tabs'
import { Flashcards } from './features/flashcards/Flashcards'
import { TodayElements } from './features/today/TodayElements'
import { useSaveData } from './hooks/useSaveData'

// 무거운 화면은 필요할 때 불러온다 (코드 분할)
const PeriodicPuzzle = lazy(() => import('./features/puzzle/PeriodicPuzzle').then((m) => ({ default: m.PeriodicPuzzle })))
const VirtualLab = lazy(() => import('./features/lab/VirtualLab').then((m) => ({ default: m.VirtualLab })))
const MoleculeDex = lazy(() => import('./features/molecules/MoleculeDex').then((m) => ({ default: m.MoleculeDex })))
const OrbitalViewer = lazy(() => import('./features/orbitals/OrbitalViewer').then((m) => ({ default: m.OrbitalViewer })))

function Loading() {
  return (
    <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
      <Loader2 className="h-5 w-5 animate-spin text-lab-accent" /> 불러오는 중…
    </div>
  )
}

function App() {
  const [tab, setTab] = useState<TabId>('today')
  const [goalOpen, setGoalOpen] = useState(false)
  const { save, learnedTodayCount } = useSaveData()

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(34,211,238,0.08),_transparent_60%)]">
      <AppHeader
        active={tab}
        onChange={setTab}
        onOpenGoal={() => setGoalOpen(true)}
        learnedToday={learnedTodayCount}
        dailyGoal={save.dailyGoal}
      />

      <main className="mx-auto max-w-7xl px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <Suspense fallback={<Loading />}>
              {tab === 'today' && <TodayElements onGoToFlashcards={() => setTab('flashcards')} />}
              {tab === 'flashcards' && <Flashcards onGoToToday={() => setTab('today')} />}
              {tab === 'puzzle' && <PeriodicPuzzle onGoToToday={() => setTab('today')} />}
              {tab === 'lab' && <VirtualLab onGoToMolecules={() => setTab('molecules')} />}
              {tab === 'molecules' && <MoleculeDex onGoToLab={() => setTab('lab')} />}
              {tab === 'orbitals' && <OrbitalViewer />}
            </Suspense>
          </motion.div>
        </AnimatePresence>
      </main>

      <DailyGoalModal open={goalOpen} onClose={() => setGoalOpen(false)} />
    </div>
  )
}

export default App
