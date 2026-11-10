import { motion } from 'framer-motion'
import { Atom } from 'lucide-react'
import { MODES, type ModeId } from './tabs'

export function AppHeader({ active, onChange }: { active: ModeId; onChange: (id: ModeId) => void }) {
  return (
    <header className="sticky top-0 z-40 border-b border-lab-border bg-white/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 ring-1 ring-blue-200">
            <Atom className="h-5 w-5 text-lab-accent" />
          </div>
          <div className="leading-tight">
            <span className="block text-lg font-bold tracking-tight text-slate-900">
              Element<span className="text-lab-accent">Lab</span>
            </span>
            <span className="block text-[11px] text-slate-500">118개 원소 주기율표</span>
          </div>
        </div>

        <nav aria-label="모드">
          <ul className="flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist">
            {MODES.map(({ id, label, sub, icon: Icon }) => {
              const isActive = id === active
              return (
                <li key={id} className="relative">
                  {isActive && (
                    <motion.span layoutId="mode-pill" className="absolute inset-0 rounded-lg bg-white shadow-sm ring-1 ring-slate-200" />
                  )}
                  <button
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => onChange(id)}
                    className={`relative flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                      isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Icon className={`h-4 w-4 ${isActive ? 'text-lab-accent' : ''}`} />
                    {label}
                    <span className="hidden text-[10px] text-slate-400 sm:inline">{sub}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </nav>
      </div>
    </header>
  )
}
