import { Target } from 'lucide-react'
import { useState } from 'react'
import { Modal } from './Modal'
import { useSaveData } from '../hooks/useSaveData'
import { DAILY_GOAL_OPTIONS } from '../lib/storage'

export function DailyGoalModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { save, setDailyGoal, learnedTodayCount } = useSaveData()
  const [custom, setCustom] = useState('')

  const choose = (n: number) => {
    setDailyGoal(n)
    onClose()
  }

  const customValue = Number(custom)
  const customValid = Number.isInteger(customValue) && customValue >= 1 && customValue <= 50

  return (
    <Modal open={open} onClose={onClose} title="일일 학습 목표 설정">
      <p className="mb-4 text-sm text-slate-400">
        하루에 새로 학습할 원소 개수를 정하세요. 오늘은 <b className="text-lab-accent">{learnedTodayCount}개</b>를
        학습했어요.
      </p>
      <div className="grid grid-cols-3 gap-3">
        {DAILY_GOAL_OPTIONS.map((n) => {
          const active = save.dailyGoal === n
          return (
            <button
              key={n}
              onClick={() => choose(n)}
              className={`flex flex-col items-center gap-1 rounded-xl border px-3 py-4 transition ${
                active
                  ? 'border-lab-accent bg-cyan-500/10 text-white shadow-lg shadow-cyan-500/20'
                  : 'border-lab-border bg-slate-900/40 text-slate-300 hover:border-slate-500'
              }`}
            >
              <Target className={`h-5 w-5 ${active ? 'text-lab-accent' : 'text-slate-500'}`} />
              <span className="text-2xl font-bold">{n}</span>
              <span className="text-xs text-slate-400">개 / 하루</span>
            </button>
          )
        })}
      </div>
      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (customValid) choose(customValue)
        }}
      >
        <input
          type="number"
          min={1}
          max={50}
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          placeholder={`직접 입력 (현재 ${save.dailyGoal}개)`}
          className="flex-1 rounded-lg border border-lab-border bg-slate-900/60 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-lab-accent focus:outline-none"
        />
        <button
          type="submit"
          disabled={!customValid}
          className="rounded-lg bg-cyan-500/20 px-4 py-2 text-sm font-medium text-cyan-200 transition enabled:hover:bg-cyan-500/30 disabled:opacity-40"
        >
          적용
        </button>
      </form>
    </Modal>
  )
}
