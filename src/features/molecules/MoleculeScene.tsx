import { Line, OrbitControls } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { angleBetween, type Vec3, type VseprResult } from '../../utils/vseprCalculator'
import { SpriteLabel } from '../../components/SpriteLabel'
import { atomRadius, cpkColor, DIPOLE_COLOR, LONE_PAIR_COLOR, RADICAL_COLOR } from './cpk'

const UP = new THREE.Vector3(0, 1, 0)
const v3 = (p: Vec3) => new THREE.Vector3(p[0], p[1], p[2])

/** Y축 기본 방향을 dir로 돌리는 쿼터니언 */
function alignY(dir: THREE.Vector3): THREE.Quaternion {
  return new THREE.Quaternion().setFromUnitVectors(UP, dir.clone().normalize())
}

/* ------------------------------ 원자 ------------------------------ */

function AtomBall({ symbol, position, showLabel }: { symbol: string; position: Vec3; showLabel: boolean }) {
  const r = atomRadius(symbol)
  return (
    <group position={position}>
      <mesh castShadow>
        <sphereGeometry args={[r, 48, 48]} />
        <meshStandardMaterial color={cpkColor(symbol)} roughness={0.35} metalness={0.1} />
      </mesh>
      {showLabel && (
        <SpriteLabel text={symbol} position={[0, 0, 0]} height={0.24} />
      )}
    </group>
  )
}

/* ------------------------------ 결합 (반쪽씩 원자 색) ------------------------------ */

function Cylinder({ from, to, color, radius }: { from: THREE.Vector3; to: THREE.Vector3; color: string; radius: number }) {
  const dir = to.clone().sub(from)
  const length = dir.length()
  const mid = from.clone().add(to).multiplyScalar(0.5)
  return (
    <mesh position={mid} quaternion={alignY(dir)}>
      <cylinderGeometry args={[radius, radius, length, 20]} />
      <meshStandardMaterial color={color} roughness={0.45} />
    </mesh>
  )
}

function BondSticks({ a, b, symA, symB, order }: { a: Vec3; b: Vec3; symA: string; symB: string; order: number }) {
  const A = v3(a)
  const B = v3(b)
  const dir = B.clone().sub(A).normalize()
  // 다중 결합: 결합축에 수직인 방향으로 평행 이동
  const ref = Math.abs(dir.dot(new THREE.Vector3(0, 0, 1))) > 0.9 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)
  const perp = new THREE.Vector3().crossVectors(dir, ref).normalize()
  const radius = order === 1 ? 0.08 : 0.055
  const gap = 0.15
  const mid = A.clone().add(B).multiplyScalar(0.5)
  return (
    <>
      {Array.from({ length: order }, (_, i) => {
        const off = perp.clone().multiplyScalar((i - (order - 1) / 2) * gap)
        return (
          <group key={i}>
            <Cylinder from={A.clone().add(off)} to={mid.clone().add(off)} color={cpkColor(symA)} radius={radius} />
            <Cylinder from={mid.clone().add(off)} to={B.clone().add(off)} color={cpkColor(symB)} radius={radius} />
          </group>
        )
      })}
    </>
  )
}

/* ------------------------------ 비공유 전자쌍 구름 ------------------------------ */

function LonePairLobe({ direction, centralRadius, single }: { direction: Vec3; centralRadius: number; single: boolean }) {
  const group = useRef<THREE.Group>(null)
  const dir = v3(direction).normalize()
  const pos = dir.clone().multiplyScalar(centralRadius + 0.42)
  const q = alignY(dir)
  const t0 = useRef<number | null>(null)

  // 나타날 때 부풀어 오르고, 이후 은은하게 맥동
  useFrame(({ clock }) => {
    if (!group.current) return
    if (t0.current === null) t0.current = clock.elapsedTime
    const age = clock.elapsedTime - t0.current
    const grow = Math.min(1, age / 0.45)
    const eased = 1 - Math.pow(1 - grow, 3)
    const pulse = 1 + Math.sin(clock.elapsedTime * 2.2) * 0.04
    group.current.scale.setScalar(eased * pulse)
  })

  const color = single ? RADICAL_COLOR : LONE_PAIR_COLOR
  return (
    <group ref={group} position={pos} quaternion={q} scale={0}>
      <mesh scale={single ? [0.22, 0.42, 0.22] : [0.32, 0.62, 0.32]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      {(single ? [[0, 0.12, 0]] : [[-0.09, 0.14, 0], [0.09, 0.14, 0]]).map((p, i) => (
        <mesh key={i} position={p as Vec3}>
          <sphereGeometry args={[0.045, 16, 16]} />
          <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.9} />
        </mesh>
      ))}
    </group>
  )
}

/* ------------------------------ 결합각 호 ------------------------------ */

function AngleArc({ d1, d2, radius = 0.85 }: { d1: Vec3; d2: Vec3; radius?: number }) {
  const angle = angleBetween(d1, d2)
  const pts = useMemo(() => {
    const a = v3(d1).normalize()
    const b = v3(d2).normalize()
    const th = (angle * Math.PI) / 180
    if (Math.sin(th) < 1e-3) return null
    return Array.from({ length: 33 }, (_, i) => {
      const t = i / 32
      const p = a.clone().multiplyScalar(Math.sin((1 - t) * th) / Math.sin(th)).add(b.clone().multiplyScalar(Math.sin(t * th) / Math.sin(th)))
      return p.multiplyScalar(radius)
    })
  }, [d1, d2, angle, radius])
  if (!pts) return null
  const mid = pts[16].clone().multiplyScalar(1.35)
  return (
    <>
      <Line points={pts} color="#fde68a" lineWidth={2} dashed dashSize={0.06} gapSize={0.04} />
      <SpriteLabel text={`${Math.round(angle * 10) / 10}°`} position={mid} color="#020617" background="rgba(251,191,36,0.92)" height={0.24} />
    </>
  )
}

/* ------------------------------ 쌍극자 화살표 ------------------------------ */

function DipoleArrow({ vector, magnitude }: { vector: Vec3; magnitude: number }) {
  const dir = v3(vector).normalize()
  const length = 1.0 + Math.min(0.9, magnitude * 0.45)
  const shaft = dir.clone().multiplyScalar(length - 0.25)
  const q = alignY(dir)
  return (
    <group>
      <mesh position={shaft.clone().multiplyScalar(0.5)} quaternion={q}>
        <cylinderGeometry args={[0.035, 0.035, length - 0.25, 16]} />
        <meshStandardMaterial color={DIPOLE_COLOR} emissive={DIPOLE_COLOR} emissiveIntensity={0.4} />
      </mesh>
      <mesh position={dir.clone().multiplyScalar(length - 0.12)} quaternion={q}>
        <coneGeometry args={[0.1, 0.25, 20]} />
        <meshStandardMaterial color={DIPOLE_COLOR} emissive={DIPOLE_COLOR} emissiveIntensity={0.4} />
      </mesh>
      <SpriteLabel text="μ (δ⁻ 방향)" position={dir.clone().multiplyScalar(length + 0.3)} background="rgba(236,72,153,0.9)" height={0.22} />
    </group>
  )
}

/* ------------------------------ 장면 ------------------------------ */

interface SceneProps {
  model: VseprResult
  showLonePairs: boolean
  showLabels: boolean
  showDipole: boolean
  showAngle: boolean
  autoRotate: boolean
}

/** 대표 결합각을 보여 줄 결합 두 개 (실측/대표 결합각에 가장 가까운 쌍) */
function anglePair(model: VseprResult): [Vec3, Vec3] | null {
  if (model.kind === 'diatomic') return null
  const target = model.experimentalAngle ?? model.geometry.angle
  const dirs = model.bonds.filter((b) => b.a === 0).map((b) => model.atoms[b.b].position)
  let best: [Vec3, Vec3] | null = null
  let bestDiff = Infinity
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const diff = Math.abs(angleBetween(dirs[i], dirs[j]) - target)
      if (diff < bestDiff) {
        bestDiff = diff
        best = [dirs[i], dirs[j]]
      }
    }
  }
  return best
}

export function MoleculeScene({ model, showLonePairs, showLabels, showDipole, showAngle, autoRotate }: SceneProps) {
  // 큰 분자도 화면에 들어오도록 축소
  const fit = useMemo(() => {
    const extent = Math.max(...model.atoms.map((a) => v3(a.position).length() + atomRadius(a.symbol)), 1)
    return extent > 2.0 ? 2.0 / extent : 1
  }, [model])
  const pair = anglePair(model)
  const centralR = atomRadius(model.atoms[0].symbol)

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight position={[5, 6, 5]} intensity={1.3} />
      <pointLight position={[-5, -3, -4]} intensity={18} color="#67e8f9" />
      <OrbitControls enableDamping enablePan={false} minDistance={3} maxDistance={14} autoRotate={autoRotate} autoRotateSpeed={1.4} />

      <group scale={fit}>
        {model.bonds.map((b, i) => (
          <BondSticks
            key={i}
            a={model.atoms[b.a].position}
            b={model.atoms[b.b].position}
            symA={model.atoms[b.a].symbol}
            symB={model.atoms[b.b].symbol}
            order={b.order}
          />
        ))}
        {model.atoms.map((a, i) => (
          <AtomBall key={i} symbol={a.symbol} position={a.position} showLabel={showLabels} />
        ))}
        {showLonePairs &&
          model.lonePairs.map((lp, i) => (
            <LonePairLobe key={`${model.formula}-${i}`} direction={lp.direction} centralRadius={centralR} single={lp.single} />
          ))}
        {showAngle && pair && <AngleArc d1={pair[0]} d2={pair[1]} />}
        {showDipole && model.polar && <DipoleArrow vector={model.dipole} magnitude={model.dipoleMagnitude} />}
      </group>
    </>
  )
}
