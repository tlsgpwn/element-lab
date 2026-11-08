import type { ReactNode } from 'react'
import { ELEMENTS } from '../../data/elements'
import type { ChemicalElement } from '../../types/chemistry'

interface PeriodicGridProps {
  /** 각 원소 칸의 내용. 칸 크기는 그리드가 결정한다 */
  renderCell: (el: ChemicalElement) => ReactNode
  /** 족/주기 좌표 라벨 강조 (퍼즐 모드) */
  emphasizeAxes?: boolean
}

const GROUPS = Array.from({ length: 18 }, (_, i) => i + 1)
const PERIODS = [1, 2, 3, 4, 5, 6, 7]

/**
 * 표준 18족 × 7주기 + f-블록 2줄 주기율표 레이아웃.
 * CSS grid: 1열 = 주기 라벨, 1행 = 족 라벨, 9행 = 간격, 10·11행 = 란타넘족·악티늄족
 */
export function PeriodicGrid({ renderCell, emphasizeAxes = false }: PeriodicGridProps) {
  const axis = emphasizeAxes ? 'text-cyan-300/90 font-semibold' : 'text-slate-500'
  return (
    <div className="overflow-x-auto pb-2">
      <div
        className="grid min-w-[880px] gap-1"
        style={{
          gridTemplateColumns: '1.75rem repeat(18, minmax(0, 1fr))',
          gridTemplateRows: 'auto repeat(7, auto) 0.75rem auto auto',
        }}
      >
        {GROUPS.map((g) => (
          <div key={`g${g}`} className={`pb-1 text-center font-mono text-[11px] ${axis}`} style={{ gridRow: 1, gridColumn: g + 1 }}>
            {g}
          </div>
        ))}
        {PERIODS.map((p) => (
          <div
            key={`p${p}`}
            className={`flex items-center justify-center font-mono text-[11px] ${axis}`}
            style={{ gridRow: p + 1, gridColumn: 1 }}
          >
            {p}
          </div>
        ))}

        {/* f-블록 자리 표시 */}
        {[
          { row: 7, label: '57–71', name: '란타넘족' },
          { row: 8, label: '89–103', name: '악티늄족' },
        ].map((f) => (
          <div
            key={f.label}
            className="flex aspect-square flex-col items-center justify-center rounded-md border border-dashed border-slate-700/70 text-center text-[9px] leading-tight text-slate-500"
            style={{ gridRow: f.row, gridColumn: 4 }}
          >
            <span className="font-mono">{f.label}</span>
            <span>{f.name}</span>
          </div>
        ))}
        {[
          { row: 10, name: '란타넘족' },
          { row: 11, name: '악티늄족' },
        ].map((f) => (
          <div
            key={f.name}
            className="flex items-center justify-end pr-1 text-[10px] text-slate-500"
            style={{ gridRow: f.row, gridColumn: '1 / span 3' }}
          >
            {f.name}
          </div>
        ))}

        {ELEMENTS.map((el) => (
          <div key={el.atomicNumber} className="aspect-square min-w-0" style={{ gridRow: el.gridRow + 1, gridColumn: el.gridCol + 1 }}>
            {renderCell(el)}
          </div>
        ))}
      </div>
    </div>
  )
}
