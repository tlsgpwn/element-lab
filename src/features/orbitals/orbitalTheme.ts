import type { Vec3 } from '../../utils/orbital'

/** 파동함수 위상 색: + (하늘색) / − (주황색) */
export const PHASE_COLOR = { plus: '#38bdf8', minus: '#fb923c' } as const

/** 화학 좌표(z가 위) → Three.js 좌표(y가 위). 오른손 좌표계 유지: (x, y, z) → (x, z, −y) */
export function toScene([x, y, z]: Vec3): Vec3 {
  return [x, z, -y]
}
