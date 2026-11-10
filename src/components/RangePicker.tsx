import { ELEMENTS } from '../data/elements'
import { parseRange, RANGE_PRESETS, rangeLabel } from '../lib/range'
import { ELEMENT_COUNT } from '../lib/storage'

interface RangePickerProps {
  fromText: string
  toText: string
  onChange: (fromText: string, toText: string) => void
}

/** 원자 번호 범위 고르기: 빠른 선택 + 직접 입력 + 포함 원소 미리보기 (퍼즐·퀴즈 공용) */
export function RangePicker({ fromText, toText, onChange }: RangePickerProps) {
  const range = parseRange(fromText, toText)
  const included = range ? ELEMENTS.slice(range.from - 1, range.to) : []

  return (
    <div className="space-y-4">
      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">빠른 선택</p>
        <div className="flex flex-wrap gap-2">
          {RANGE_PRESETS.map((p) => {
            const on = range?.from === p.range.from && range?.to === p.range.to
            return (
              <button
                key={p.label}
                onClick={() => onChange(String(p.range.from), String(p.range.to))}
                aria-pressed={on}
                className={`rounded-xl border px-3 py-1.5 text-left text-sm transition ${
                  on ? 'border-blue-500 bg-blue-600 text-white' : 'border-slate-300 bg-white text-slate-700 hover:border-blue-400'
                }`}
              >
                <b className="font-mono">{p.label}</b> <span className={on ? 'text-blue-100' : 'text-slate-400'}>{p.sub}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold text-slate-500">직접 입력 (1~{ELEMENT_COUNT})</p>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            시작
            <input
              type="number"
              min={1}
              max={ELEMENT_COUNT}
              value={fromText}
              onChange={(e) => onChange(e.target.value, toText)}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 focus:border-lab-accent focus:outline-none"
            />
          </label>
          <span className="text-slate-400">~</span>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            끝
            <input
              type="number"
              min={1}
              max={ELEMENT_COUNT}
              value={toText}
              onChange={(e) => onChange(fromText, e.target.value)}
              className="w-24 rounded-lg border border-slate-300 px-3 py-2 font-mono text-slate-900 focus:border-lab-accent focus:outline-none"
            />
          </label>
          {range ? (
            <span className="text-sm text-slate-600">{rangeLabel(range)}</span>
          ) : (
            <span className="text-sm text-rose-600">시작은 1 이상, 끝은 {ELEMENT_COUNT} 이하이고 시작 ≤ 끝이어야 해요.</span>
          )}
        </div>
        {included.length > 0 && (
          <div className="mt-3 flex max-h-24 flex-wrap gap-1 overflow-y-auto rounded-xl bg-slate-50 p-2 ring-1 ring-slate-200">
            {included.map((e) => (
              <span key={e.atomicNumber} className="rounded bg-white px-1.5 py-0.5 font-mono text-[11px] text-slate-600 ring-1 ring-slate-200">
                {e.symbol}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
