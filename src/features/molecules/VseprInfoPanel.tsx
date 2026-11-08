import { Atom, Compass, Info, Magnet, Ruler, Triangle } from 'lucide-react'
import type { ReactNode } from 'react'
import { formatFormula } from '../../utils/formula'
import type { VseprResult } from '../../utils/vseprCalculator'

/** 비공유 전자쌍이 없을 때의 이상적 결합각 */
const IDEAL_BY_SN: Record<number, number> = { 2: 180, 3: 120, 4: 109.5, 5: 90, 6: 90 }

function Section({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-white/5 bg-slate-950/40 p-3.5">
      <h4 className="mb-2 flex items-center gap-1.5 text-xs font-semibold tracking-wide text-slate-400 uppercase">
        {icon} {title}
      </h4>
      {children}
    </section>
  )
}

export function VseprInfoPanel({ model, nameKo, nameEn }: { model: VseprResult; nameKo: string; nameEn: string }) {
  const lpOnly = model.E - model.unpaired
  const diatomic = model.kind === 'diatomic'
  const ideal = IDEAL_BY_SN[model.SN]
  const shownAngle = model.experimentalAngle ?? model.geometry.angle

  return (
    <aside className="space-y-3">
      <div className="rounded-2xl border border-lab-border bg-lab-panel/80 p-4">
        <p className="font-mono text-4xl font-black text-white">{formatFormula(model.formula)}</p>
        <p className="mt-1 text-base font-semibold text-slate-100">
          {nameKo} <span className="text-sm font-normal text-slate-400">{nameEn}</span>
        </p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="rounded-lg bg-cyan-500/15 px-2.5 py-1 text-lg font-bold text-cyan-100 ring-1 ring-cyan-400/40">
            {diatomic ? '이원자 분자 (직선형)' : model.geometry.ko}
          </span>
          <span className="text-xs text-slate-400">{diatomic ? 'linear' : model.geometry.en}</span>
          {!diatomic && <span className="rounded-md bg-white/5 px-2 py-0.5 font-mono text-sm text-violet-200">{model.notation}</span>}
        </div>
      </div>

      <Section icon={<Ruler className="h-3.5 w-3.5" />} title="결합각">
        {diatomic ? (
          <p className="text-sm text-slate-300">원자가 두 개뿐이라 결합각이 없습니다. 항상 일직선입니다.</p>
        ) : (
          <>
            <p className="font-mono text-2xl font-bold text-amber-200">{model.experimentalAngle ? `${model.experimentalAngle}°` : model.geometry.angleLabel}</p>
            <p className="mt-1 text-xs text-slate-400">
              {model.experimentalAngle ? `실측값 (VSEPR 대표값 ${model.geometry.angleLabel})` : 'VSEPR 대표값'}
              {model.measuredAngles.length > 1 && ` · 모형 속 결합각: ${model.measuredAngles.map((a) => `${a}°`).join(', ')}`}
            </p>
            {model.E > 0 && ideal && shownAngle < ideal && (
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                전자쌍 영역 {model.SN}개의 이상적인 배치는 {ideal}°이지만, 비공유 전자쌍이 결합 전자쌍을 더 세게 밀어내{' '}
                <b className="text-amber-200">{shownAngle}°</b>로 좁아졌습니다.
              </p>
            )}
          </>
        )}
      </Section>

      <Section icon={<Magnet className="h-3.5 w-3.5" />} title="극성 (쌍극자 모멘트)">
        <div className="flex items-center gap-2">
          <span
            className={`rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ${
              model.polar ? 'bg-pink-500/15 text-pink-200 ring-pink-400/40' : 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/40'
            }`}
          >
            {model.polar ? '극성 분자 (μ ≠ 0)' : '무극성 분자 (μ = 0)'}
          </span>
          <span className="font-mono text-xs text-slate-500">|Σμ| ≈ {model.dipoleMagnitude}</span>
        </div>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">{model.polarReason}</p>
      </Section>

      {!diatomic && (
        <Section icon={<Atom className="h-3.5 w-3.5" />} title="전자쌍 계산">
          <ol className="space-y-1 text-sm text-slate-300">
            <li>
              ① 중심 원자 <b className="text-white">{model.central}</b>의 원자가 전자: <b className="font-mono text-white">{model.valence}</b>개
            </li>
            <li>
              ② 주변 원자와 결합에 쓴 전자: <b className="font-mono text-white">{model.bondingElectrons}</b>개
              {model.kind === 'oxyacid' && <span className="text-slate-500"> (–OH 단일, =O 이중)</span>}
            </li>
            <li>
              ③ 비공유 전자쌍 E = ({model.valence} − {model.bondingElectrons}) ÷ 2 = <b className="font-mono text-white">{lpOnly}</b>
              {model.unpaired > 0 && <span className="text-amber-300"> + 홀전자 {model.unpaired}개</span>}
            </li>
            <li>
              ④ 결합 전자쌍 B = <b className="font-mono text-white">{model.B}</b> → 입체수 SN = B + E ={' '}
              <b className="font-mono text-cyan-200">{model.SN}</b>
            </li>
          </ol>
        </Section>
      )}

      {model.E > 0 && (
        <Section icon={<Triangle className="h-3.5 w-3.5" />} title="왜 이런 모양일까?">
          <p className="text-xs leading-relaxed text-slate-300">
            전자쌍끼리는 서로 최대한 멀어지려 합니다. 비공유 전자쌍은 한 원자핵에만 붙잡혀 있어 더 넓게 퍼지므로 반발 세기가{' '}
            <b className="text-violet-200">비공유–비공유 &gt; 비공유–결합 &gt; 결합–결합</b> 순입니다. [비공유 전자쌍 표시]를 켜면 결합을
            밀어내는 보라색 전자 구름을 볼 수 있어요.
          </p>
        </Section>
      )}

      {(model.octet !== 'ok' || model.unpaired > 0) && (
        <Section icon={<Info className="h-3.5 w-3.5" />} title="옥텟 메모">
          <p className="text-xs leading-relaxed text-slate-300">
            {model.unpaired > 0 && '홀전자가 있는 라디칼이라 반응성이 큽니다. '}
            {model.octet === 'incomplete' && `${model.central}는 전자가 8개보다 적은 불완전한 옥텟입니다. `}
            {model.octet === 'expanded' && `${model.central}는 3주기 이상 원소라 8개보다 많은 전자를 수용합니다(확장된 옥텟). `}
            {model.octet === 'violated' && '2주기 원소가 옥텟을 넘어 실제로는 존재하기 어려운 구조입니다. '}
          </p>
        </Section>
      )}

      <p className="flex items-center gap-1.5 px-1 text-[11px] text-slate-500">
        <Compass className="h-3.5 w-3.5" /> 드래그로 회전, 휠/핀치로 확대할 수 있어요.
      </p>
    </aside>
  )
}
