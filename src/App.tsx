import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { AppHeader } from './components/AppHeader'
import type { ModeId } from './components/tabs'
import { FlashcardMode } from './features/flashcards/FlashcardMode'
import { PuzzleMode } from './features/puzzle/PuzzleMode'
import { BasicMode } from './features/table/BasicMode'

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
            {mode === 'table' && <BasicMode />}
            {mode === 'puzzle' && <PuzzleMode />}
            {mode === 'flashcards' && <FlashcardMode />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}

export default App
