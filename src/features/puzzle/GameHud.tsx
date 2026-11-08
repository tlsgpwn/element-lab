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
      <HudItem icon={<Trophy className="h-4 w-4 text-amber-300" />} label="점수">
        <motion.span key={stats.score} initial={{ scale: 1.3, color: '#fde68a' }} animate={{ scale: 1, color: '#ffffff' }}>
          {stats.score.toLocaleString()}
        </motion.span>
      </HudItem>

      <div
        className={`relative flex min-w-[110px] items-center gap-2 rounded-xl border px-3 py-2 transition-colors ${
          hot ? 'border-orange-400/60 bg-orange-500/15 shadow-lg shadow-orange-500/20' : 'border-lab-border bg-lab-panel/80'
        }`}
      >
        <Flame className={`h-4 w-4 ${hot ? 'text-orange-300' : 'text-slate-500'}`} />
        <div className="leading-tight">
          <div className="text-[10px] tracking-wide text-slate-400 uppercase">콤보 · 최고 {stats.maxCombo}</div>
          <AnimatePresence mode="popLayout">
            <motion.div
              key={stats.combo}
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className={`font-mono text-base font-bold ${hot ? 'text-orange-200' : 'text-white'}`}
            >
              ×{stats.combo}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <HudItem icon={<Timer className="h-4 w-4 text-cyan-300" />} label={stats.finished ? '완료 시간' : '타이머'}>
        {formatDuration(stats.elapsed)}
      </HudItem>

      <HudItem icon={<Target className="h-4 w-4 text-emerald-300" />} label={`정확도 ${accuracy}%`}>
        {done} / {total}
      </HudItem>

      <button
        onClick={onRestart}
        className="ml-auto flex items-center gap-1.5 rounded-xl border border-lab-border px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5"
      >
        <RotateCcw className="h-4 w-4" /> 다시 시작
      </button>
    </div>
  )
}

function HudItem({ icon, label, children }: { icon: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-[100px] items-center gap-2 rounded-xl border border-lab-border bg-lab-panel/80 px-3 py-2">
      {icon}
      <div className="leading-tight">
        <div className="text-[10px] tracking-wide text-slate-400 uppercase">{label}</div>
        <div className="font-mono text-base font-bold text-white">{children}</div>
      </div>
    </div>
  )
}
