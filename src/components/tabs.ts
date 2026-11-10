import { Grid3x3, Layers, Puzzle, type LucideIcon } from 'lucide-react'

export type ModeId = 'table' | 'puzzle' | 'flashcards'

export const MODES: { id: ModeId; label: string; sub: string; icon: LucideIcon }[] = [
  { id: 'table', label: '기본', sub: '분류 보기', icon: Grid3x3 },
  { id: 'puzzle', label: '퍼즐', sub: '자리 맞히기', icon: Puzzle },
  { id: 'flashcards', label: '플래시카드', sub: '뒤집어 보기', icon: Layers },
]
