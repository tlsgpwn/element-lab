import { Box, Droplet, Wind, type LucideProps } from 'lucide-react'
import type { Phase } from '../types/chemistry'
import { PHASE_LABEL } from '../lib/phase'

const ICONS = { solid: Box, liquid: Droplet, gas: Wind } as const
const COLORS: Record<Phase, string> = {
  solid: 'text-amber-300',
  liquid: 'text-sky-300',
  gas: 'text-emerald-300',
}

export function PhaseIcon({ phase, className = 'h-4 w-4', ...rest }: { phase: Phase } & LucideProps) {
  const Icon = ICONS[phase]
  return <Icon className={`${COLORS[phase]} ${className}`} aria-label={PHASE_LABEL[phase]} {...rest} />
}
