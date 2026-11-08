import { motion } from 'framer-motion'
import { Atom, Target } from 'lucide-react'
import { TABS, type TabId } from './tabs'

interface AppHeaderProps {
  active: TabId
  onChange: (id: TabId) => void
  onOpenGoal: () => void
  learnedToday: number
  dailyGoal: number
}

export function AppHeader({ active, onChange, onOpenGoal, learnedToday, dailyGoal }: AppHeaderProps) {
  const done = learnedToday >= dailyGoal
  return (
    <header className="sticky top-0 z-40 border-b border-lab-border bg-lab-bg/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500/30 to-violet-500/30 ring-1 ring-cyan-400/40">
            <Atom className="h-5 w-5 text-lab-accent" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white">
            Element<span className="text-lab-accent">Lab</span>
          </span>
        </div>

        <button
          onClick={onOpenGoal}
          className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
            done
              ? 'border-emerald-400/40 bg-emerald-500/10 text-emerald-200 hover:bg-emerald-500/20'
              : 'border-lab-border bg-lab-panel text-slate-200 hover:border-cyan-400/50'
          }`}
          aria-label="일일 학습 목표 설정"
        >
          <Target className="h-4 w-4" />
          <span className="hidden sm:inline">일일 목표</span>
          <span className="font-mono font-semibold">
            {learnedToday}/{dailyGoal}
          </span>
        </button>
      </div>

      <nav className="mx-auto max-w-7xl overflow-x-auto px-2" aria-label="주요 메뉴">
        <ul className="flex min-w-max gap-1" role="tablist">
          {TABS.map(({ id, label, sub, icon: Icon }) => {
            const isActive = id === active
            return (
              <li key={id}>
                <button
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => onChange(id)}
                  className={`relative flex items-center gap-2 px-3 py-2.5 text-sm font-medium transition ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className={`h-4 w-4 ${isActive ? 'text-lab-accent' : ''}`} />
                  {label}
                  <span className="hidden text-[10px] text-slate-500 md:inline">{sub}</span>
                  {isActive && (
                    <motion.span
                      layoutId="tab-underline"
                      className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                    />
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </header>
  )
}
