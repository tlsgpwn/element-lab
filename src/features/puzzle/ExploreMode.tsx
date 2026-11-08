import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { useMemo, useState } from 'react'
import { ElementCard } from '../../components/ElementCard'
import { Modal } from '../../components/Modal'
import { ELEMENT_BY_Z, isDetailed } from '../../data/elements'
import { useSaveData } from '../../hooks/useSaveData'
import { CATEGORY_KEYS, CATEGORY_THEME } from '../../theme/categoryColors'
import type { ElementCategory } from '../../types/chemistry'
import { PeriodicGrid } from './PeriodicGrid'

export function ExploreMode({ onLockedClick }: { onLockedClick: (learnable: boolean, name: string) => void }) {
  const { save } = useSaveData()
  const unlocked = useMemo(() => new Set(save.unlockedElements), [save.unlockedElements])
  const [openZ, setOpenZ] = useState<number | null>(null)
  const [focusCat, setFocusCat] = useState<ElementCategory | null>(null)
  const openEl = openZ !== null ? ELEMENT_BY_Z.get(openZ) : undefined

  return (
    <div className="space-y-4">
      {/* 범례: 클릭하면 해당 분류만 강조 */}
      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_KEYS.map((c) => {
          const t = CATEGORY_THEME[c]
          const active = focusCat === c
          return (
            <button
              key={c}
              onClick={() => setFocusCat(active ? null : c)}
              className={`rounded-full px-2.5 py-1 text-xs transition ${t.badge} ${
                focusCat && !active ? 'opacity-40' : ''
              } ${active ? 'ring-2' : ''}`}
            >
              {t.label}
            </button>
          )
        })}
      </div>

      <PeriodicGrid
        renderCell={(el) => {
          const t = CATEGORY_THEME[el.category]
          const isUnlocked = unlocked.has(el.atomicNumber)
          const dimmed = focusCat !== null && focusCat !== el.category
          if (!isUnlocked) {
            return (
              <button
                onClick={() => onLockedClick(isDetailed(el), el.nameKo)}
                title={`${el.atomicNumber}. ${el.nameKo} — 잠김`}
                className={`relative flex h-full w-full flex-col items-center justify-center rounded-md border border-slate-700/50 bg-slate-900/40 text-slate-600 transition hover:border-slate-500 ${
                  dimmed ? 'opacity-20' : 'opacity-70'
                }`}
              >
                <span className="absolute top-0.5 left-1 font-mono text-[8px]">{el.atomicNumber}</span>
                <span className="text-xs font-bold">{el.symbol}</span>
                <Lock className="mt-0.5 h-2.5 w-2.5" />
              </button>
            )
          }
          return (
            <motion.button
              whileHover={{ scale: 1.12, zIndex: 10 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setOpenZ(el.atomicNumber)}
              title={`${el.atomicNumber}. ${el.nameKo}`}
              className={`relative flex h-full w-full flex-col items-center justify-center rounded-md border ${t.border} ${t.gradient} shadow-md ${t.glow} transition-opacity ${
                dimmed ? 'opacity-20' : ''
              }`}
            >
              <span className="absolute top-0.5 left-1 font-mono text-[8px] text-slate-300">{el.atomicNumber}</span>
              <span className={`text-sm font-black ${t.text}`}>{el.symbol}</span>
              <span className="w-full truncate px-0.5 text-center text-[8px] text-slate-300">{el.nameKo}</span>
            </motion.button>
          )
        }}
      />

      <Modal open={!!openEl} onClose={() => setOpenZ(null)} title="원소 상세 정보" size="xl">
        {openEl && <ElementCard element={openEl} />}
      </Modal>
    </div>
  )
}
