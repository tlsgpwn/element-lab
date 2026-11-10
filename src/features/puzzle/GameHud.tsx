import { AnimatePresence, motion } from 'framer-motion'
import { Flame, RotateCcw, Target, Timer, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GameStats } from '../../hooks/useGameSession'
import { formatDuration } from '../../lib/puzzle'

interface GameHudProps {
  stats: GameStats
  done: number
  total: number
  onRestart: () => void
}

export function GameHud({ stats, done, total, onRestart }: GameHudProps) {
  const attempts = stats.correct + stats.wrong
  const accuracy = attempts ? Math.round((stats.correct / attempts) * 100) : 100
  const hot = stats.combo >= 3

  return (
    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
      <HudItem icon={<Trophy className="h-4 w-4 text-amber-500" />} label="점수">
        <motion.span key={stats.score} initial={{ scale: 1.3, color: '#d97706' }} animate={{ scale: 1, color: '#0f172a' }}>
          {stats.score.toLocaleString()}
        </motion.span>
      </HudItem>

      <div
        className={`relative flex min-w-[110px] items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
          hot ? 'border-orange-300 bg-orange-50' : 'border-lab-border bg-white'
        }`}
      >
        <Flame className={`h-4 w-4 ${hot ? 'text-orange-500' : 'text-slate-400'}`} />
        <div className="leading-tight">
          <div className="text-[10px] tracking-wide text-slate-500">콤보 · 최고 {stats.maxCombo}</div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={stats.combo}
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`font-mono text-base font-bold ${hot ? 'text-orange-600' : 'text-slate-900'}`}
            >
              ×{stats.combo}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <HudItem icon={<Timer className="h-4 w-4 text-blue-600" />} label={stats.finished ? '완료 시간' : '타이머'}>
        {formatDuration(stats.elapsed)}
      </HudItem>

      <HudItem icon={<Target className="h-4 w-4 text-emerald-600" />} label={`정확도 ${accuracy}%`}>
        {done} / {total}
      </HudItem>

      <button
        onClick={onRestart}
        className="ml-auto flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-100"
      >
        <RotateCcw className="h-4 w-4" /> 다시 섞기
      </button>
    </div>
  )
}

function HudItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[100px] items-center gap-2 rounded-xl border border-lab-border bg-white px-3 py-2">
      {icon}
      <div className="leading-tight">
        <div className="text-[10px] tracking-wide text-slate-500">{label}</div>
        <div className="font-mono text-base font-bold text-slate-900">{children}</div>
      </div>
    </div>
  )
}
