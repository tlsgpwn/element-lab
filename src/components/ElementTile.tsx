import type { ReactNode } from 'react'
import type { ChemicalElement } from '../types/chemistry'

interface ElementTileProps {
  element: ChemicalElement
  /** 왼쪽 위 원자 번호 표시 */
  showNumber?: boolean
  /** 오른쪽 위 보조 값 (예: 전기음성도) */
  corner?: ReactNode
  /** 글자색 클래스 (기본 slate) */
  symbolClass?: string
  nameClass?: string
}

/**
 * 원소 칸 내용: 원자 번호 → 원소 기호 → 그 아래 한글 이름 (CLAUDE.md §4).
 * 바깥 상자(테두리·배경·버튼 여부)는 각 모드가 감싼다.
 */
export function ElementTile({
  element: el, showNumber = true, corner, symbolClass = 'text-slate-900', nameClass = 'text-slate-500',
}: ElementTileProps) {
  return (
    <span className="relative flex h-full w-full flex-col items-center justify-center px-0.5 leading-none">
      {showNumber && <span className="absolute top-1 left-1 font-mono text-[9px] opacity-70">{el.atomicNumber}</span>}
      {corner !== undefined && <span className="absolute top-1 right-1 font-mono text-[9px] font-semibold">{corner}</span>}
      <span className={`mt-1 text-[15px] font-extrabold ${symbolClass}`}>{el.symbol}</span>
      <span className={`mt-0.5 w-full truncate text-center text-[9px] ${nameClass}`} title={el.nameKo}>
        {el.nameKo}
      </span>
    </span>
  )
}
