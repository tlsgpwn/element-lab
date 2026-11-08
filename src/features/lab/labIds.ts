import type { SpeciesKey } from '../../types/reaction'

export const CHAMBER_ID = 'reaction-chamber'
export const dragIdOf = (key: SpeciesKey) => `add:${key}`
export const keyOfDragId = (id: string | number) => String(id).slice(4)
