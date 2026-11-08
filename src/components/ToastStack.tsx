import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Info, X, XCircle } from 'lucide-react'
import type { Toast, ToastTone } from '../hooks/useToasts'

const STYLE: Record<ToastTone, { cls: string; Icon: typeof Info }> = {
  success: { cls: 'border-emerald-400/50 bg-emerald-950/90 text-emerald-100', Icon: CheckCircle2 },
  error: { cls: 'border-rose-400/50 bg-rose-950/90 text-rose-100', Icon: XCircle },
  info: { cls: 'border-cyan-400/50 bg-slate-900/95 text-cyan-100', Icon: Info },
}

export function ToastStack({ toasts, onDismiss }: { toasts: Toast[]; onDismiss: (id: number) => void }) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-28 z-[60] flex flex-col items-center gap-2 px-4 lg:items-end"
      role="status"
      aria-live="polite"
    >
      <AnimatePresence initial={false}>
        {toasts.map((t) => {
          const { cls, Icon } = STYLE[t.tone]
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className={`pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border px-4 py-3 shadow-2xl backdrop-blur ${cls}`}
            >
              <Icon className="mt-0.5 h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{t.title}</p>
                {t.body && <p className="mt-0.5 text-sm opacity-90">{t.body}</p>}
              </div>
              <button onClick={() => onDismiss(t.id)} className="opacity-60 hover:opacity-100" aria-label="알림 닫기">
                <X className="h-4 w-4" />
              </button>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}
