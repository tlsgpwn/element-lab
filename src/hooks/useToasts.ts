import { useCallback, useEffect, useRef, useState } from 'react'

export type ToastTone = 'success' | 'error' | 'info'

export interface Toast {
  id: number
  tone: ToastTone
  title: string
  body?: string
}

/** 화면 단위 토스트 큐. 최대 3개, 기본 3.2초 후 자동 제거 */
export function useToasts(duration = 3200) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextId = useRef(1)
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>())

  const dismiss = useCallback((id: number) => {
    setToasts((ts) => ts.filter((t) => t.id !== id))
    const timer = timers.current.get(id)
    if (timer) clearTimeout(timer)
    timers.current.delete(id)
  }, [])

  const push = useCallback(
    (toast: Omit<Toast, 'id'>) => {
      const id = nextId.current++
      setToasts((ts) => [...ts.slice(-2), { ...toast, id }])
      timers.current.set(id, setTimeout(() => dismiss(id), duration))
    },
    [dismiss, duration],
  )

  useEffect(() => {
    const map = timers.current
    return () => map.forEach(clearTimeout)
  }, [])

  return { toasts, push, dismiss }
}
