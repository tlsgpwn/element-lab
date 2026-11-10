import { motion } from 'framer-motion'
import { Flame, PartyPopper, RotateCcw, Target, Timer, Trophy } from 'lucide-react'
import type { ReactNode } from 'react'
import type { GameStats } from '../../hooks/useGameSession'
import { formatDuration } from '../../lib/puzzle'

export function CompletePanel({ stats, total, onRestart }: { stats: GameStats; total: number; onRestart: () => void }) {
  const attempts = stats.correct + stats.wrong
  const accuracy = attempts ? Math.round((stats.correct / attempts) * 100) : 100
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className="flex flex-col items-center gap-4 rounded-3xl border border-emerald-200 bg-emerald-50/60 px-6 py-8 text-center"
    >
      <PartyPopper className="h-10 w-10 text-amber-500" />
      <h2 className="text-2xl font-bold text-slate-900">퍼즐 완성! {total}개 원소를 모두 맞혔어요</h2>
      <div className="grid w-full max-w-xl grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat icon={<Trophy className="h-4 w-4 text-amber-500" />} label="점수" value={stats.score.toLocaleString()} />
        <Stat icon={<Timer className="h-4 w-4 text-blue-600" />} label="시간" value={formatDuration(stats.elapsed)} />
        <Stat icon={<Flame className="h-4 w-4 text-orange-500" />} label="최고 콤보" value={`×${stats.maxCombo}`} />
        <Stat icon={<Target className="h-4 w-4 text-emerald-600" />} label="정확도" value={`${accuracy}%`} />
      </div>
      <button
        onClick={onRestart}
        className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        <RotateCcw className="h-4 w-4" /> 다시 도전하기
      </button>
    </motion.div>
  )
}

function Stat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
      <div className="flex items-center justify-center gap-1 text-[11px] text-slate-500">
        {icon} {label}
      </div>
      <div className="mt-0.5 font-mono text-lg font-bold text-slate-900">{value}</div>
    </div>
  )
}
