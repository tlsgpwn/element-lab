import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { EffectStyle, ReactionEffect } from '../../types/reaction'

/** 시드 기반 난수 (같은 nonce → 같은 파티클 배치) */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

interface ReactionEffectsProps {
  effects: ReactionEffect[]
  style: EffectStyle
  nonce: number
}

/** 반응 챔버 위에 겹쳐 그리는 연출 레이어 (부모가 relative + overflow-hidden) */
export function ReactionEffects({ effects, style, nonce }: ReactionEffectsProps) {
  const color = style.flameColor ?? '#fbbf24'
  const p = useMemo(() => {
    const r = mulberry32(nonce * 9973 + 17)
    return {
      sparks: Array.from({ length: 28 }, () => ({ angle: r() * Math.PI * 2, dist: 90 + r() * 160, size: 3 + r() * 5, delay: r() * 0.15 })),
      bubbles: Array.from({ length: 22 }, () => ({ x: 8 + r() * 84, size: 6 + r() * 16, delay: r() * 1.6, dur: 1.4 + r() * 1.2 })),
      flames: Array.from({ length: 5 }, (_, i) => ({ x: 22 + i * 14 + (r() - 0.5) * 6, h: 70 + r() * 60, delay: r() * 0.4 })),
      embers: Array.from({ length: 16 }, () => ({ x: 20 + r() * 60, delay: r() * 1.5, drift: (r() - 0.5) * 40 })),
      grains: Array.from({ length: 40 }, () => ({ x: 4 + r() * 92, delay: r() * 1.2, size: 2 + r() * 4 })),
      smoke: Array.from({ length: 8 }, () => ({ x: 20 + r() * 60, delay: r() * 1.2, size: 50 + r() * 60 })),
    }
  }, [nonce])

  return (
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-[inherit]" aria-hidden>
      {effects.includes('glow') && (
        <motion.div
          className="absolute inset-0"
          style={{ background: `radial-gradient(circle at 50% 60%, ${color}88, transparent 65%)` }}
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.5, 0.9, 0.3] }}
          transition={{ duration: 2.6, ease: 'easeInOut' }}
        />
      )}

      {effects.includes('color-change') && style.solutionColor && (
        <motion.div
          className="absolute inset-x-0 bottom-0 h-2/5"
          initial={{ backgroundColor: 'rgba(56,189,248,0.25)', opacity: 0.4 }}
          animate={{ backgroundColor: `${style.solutionColor}66`, opacity: 1 }}
          transition={{ duration: 2.2 }}
        />
      )}

      {effects.includes('explosion') && (
        <>
          <motion.div
            className="absolute top-1/2 left-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{ background: `radial-gradient(circle, #ffffff, ${color} 40%, transparent 70%)` }}
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 4, opacity: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
          <motion.div
            className="absolute inset-0 bg-white"
            initial={{ opacity: 0.9 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          />
          {p.sparks.map((s, i) => (
            <motion.span
              key={i}
              className="absolute top-1/2 left-1/2 rounded-full"
              style={{ width: s.size, height: s.size, background: i % 3 ? color : '#fff', boxShadow: `0 0 8px ${color}` }}
              initial={{ x: 0, y: 0, opacity: 1 }}
              animate={{ x: Math.cos(s.angle) * s.dist, y: Math.sin(s.angle) * s.dist, opacity: 0 }}
              transition={{ duration: 1.1, delay: s.delay, ease: 'easeOut' }}
            />
          ))}
        </>
      )}

      {effects.includes('flame') && (
        <>
          {p.flames.map((f, i) => (
            <motion.div
              key={i}
              className="absolute bottom-0 w-16 -translate-x-1/2 rounded-[50%_50%_40%_40%] blur-[2px]"
              style={{
                left: `${f.x}%`,
                height: f.h,
                background: `radial-gradient(ellipse at 50% 85%, #ffffff 0%, ${color} 35%, ${color}00 72%)`,
                transformOrigin: 'bottom center',
              }}
              initial={{ scaleY: 0, opacity: 0 }}
              animate={{ scaleY: [0, 1.15, 0.85, 1.1, 0.9, 1, 0], opacity: [0, 1, 0.9, 1, 0.9, 0.8, 0] }}
              transition={{ duration: 2.8, delay: f.delay, ease: 'easeInOut' }}
            />
          ))}
          {p.embers.map((e, i) => (
            <motion.span
              key={`e${i}`}
              className="absolute bottom-6 h-1.5 w-1.5 rounded-full"
              style={{ left: `${e.x}%`, background: color, boxShadow: `0 0 6px ${color}` }}
              initial={{ y: 0, x: 0, opacity: 0 }}
              animate={{ y: -180, x: e.drift, opacity: [0, 1, 0] }}
              transition={{ duration: 1.6, delay: 0.3 + e.delay }}
            />
          ))}
        </>
      )}

      {effects.includes('bubbles') &&
        p.bubbles.map((b, i) => (
          <motion.span
            key={i}
            className="absolute bottom-0 rounded-full border border-white/70 bg-white/10"
            style={{ left: `${b.x}%`, width: b.size, height: b.size }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: -260, opacity: [0, 0.9, 0.9, 0] }}
            transition={{ duration: b.dur, delay: b.delay, repeat: 1, ease: 'easeIn' }}
          />
        ))}

      {effects.includes('precipitate') && (
        <>
          {p.grains.map((g, i) => (
            <motion.span
              key={i}
              className="absolute top-1/4 rounded-sm"
              style={{ left: `${g.x}%`, width: g.size, height: g.size, background: style.precipitateColor ?? '#f8fafc' }}
              initial={{ y: 0, opacity: 0 }}
              animate={{ y: 190, opacity: [0, 1, 1] }}
              transition={{ duration: 1.6, delay: g.delay, ease: 'easeIn' }}
            />
          ))}
          <motion.div
            className="absolute inset-x-4 bottom-2 rounded-b-xl"
            style={{ background: style.precipitateColor ?? '#f8fafc' }}
            initial={{ height: 0, opacity: 0.6 }}
            animate={{ height: 18, opacity: 0.9 }}
            transition={{ duration: 2.4, delay: 0.6 }}
          />
        </>
      )}

      {effects.includes('smoke') &&
        p.smoke.map((s, i) => (
          <motion.span
            key={i}
            className="absolute bottom-8 rounded-full bg-slate-300/30 blur-xl"
            style={{ left: `${s.x}%`, width: s.size, height: s.size }}
            initial={{ y: 0, scale: 0.4, opacity: 0 }}
            animate={{ y: -200, scale: 1.8, opacity: [0, 0.7, 0] }}
            transition={{ duration: 2.6, delay: 0.4 + s.delay }}
          />
        ))}
    </div>
  )
}
