import { BookOpen, Box, FlaskConical, Layers, Orbit, Puzzle, type LucideIcon } from 'lucide-react'

export type TabId = 'today' | 'flashcards' | 'puzzle' | 'lab' | 'molecules' | 'orbitals'

export const TABS: { id: TabId; label: string; sub: string; icon: LucideIcon }[] = [
  { id: 'today', label: '오늘의 원소', sub: '학습', icon: BookOpen },
  { id: 'flashcards', label: '플래시카드', sub: '테스트', icon: Layers },
  { id: 'puzzle', label: '주기율표 퍼즐', sub: '퍼즐', icon: Puzzle },
  { id: 'lab', label: '가상 실험실', sub: '결합', icon: FlaskConical },
  { id: 'molecules', label: '3D 분자 도감', sub: 'VSEPR', icon: Box },
  { id: 'orbitals', label: '오비탈', sub: '양자수', icon: Orbit },
]
