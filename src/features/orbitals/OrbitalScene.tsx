import { Line, OrbitControls } from '@react-three/drei'
import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { SpriteLabel } from '../../components/SpriteLabel'
import { electronCloud, lobeMesh, type OrbitalId, type Vec3 } from '../../utils/orbital'
import { PHASE_COLOR, toScene } from './orbitalTheme'

export type OrbitalMode = 'lobe' | 'cloud'

/** 장면에서 오비탈이 차지하는 반지름 */
const SIZE = 2.1
const PLUS = new THREE.Color(PHASE_COLOR.plus)
const MINUS = new THREE.Color(PHASE_COLOR.minus)

function buildColors(signs: ArrayLike<number>): Float32Array {
  const colors = new Float32Array(signs.length * 3)
  for (let i = 0; i < signs.length; i++) {
    const c = signs[i] >= 0 ? PLUS : MINUS
    colors[i * 3] = c.r
    colors[i * 3 + 1] = c.g
    colors[i * 3 + 2] = c.b
  }
  return colors
}

function toScenePositions(chem: ArrayLike<number>, scale: number): Float32Array {
  const out = new Float32Array(chem.length)
  for (let i = 0; i < chem.length; i += 3) {
    const [x, y, z] = toScene([chem[i], chem[i + 1], chem[i + 2]])
    out[i] = x * scale
    out[i + 1] = y * scale
    out[i + 2] = z * scale
  }
  return out
}

/** 경계면(로브) 모형 */
function Lobes({ l, m }: { l: number; m: number }) {
  const geometry = useMemo(() => {
    const mesh = lobeMesh(l, m)
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(toScenePositions(mesh.positions, SIZE * 0.85), 3))
    g.setAttribute('color', new THREE.BufferAttribute(buildColors(mesh.signs), 3))
    g.setIndex(new THREE.BufferAttribute(mesh.indices, 1))
    g.computeVertexNormals()
    return g
  }, [l, m])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh geometry={geometry}>
      <meshStandardMaterial vertexColors side={THREE.DoubleSide} roughness={0.35} metalness={0.05} transparent opacity={0.92} />
    </mesh>
  )
}

/** 전자 구름(확률 밀도) 모형. slice면 xz 평면 근처 얇은 단면만 */
function Cloud({ n, l, m, slice }: OrbitalId & { slice: boolean }) {
  const geometry = useMemo(() => {
    const cloud = electronCloud({ n, l, m }, slice ? 140000 : 26000)
    let pos: ArrayLike<number> = cloud.positions
    let signs: ArrayLike<number> = cloud.signs
    if (slice) {
      // 화학 좌표 |y| < 0.035 (화면 정면을 보는 xz 평면)
      const p: number[] = []
      const s: number[] = []
      for (let i = 0; i < cloud.signs.length; i++) {
        if (Math.abs(cloud.positions[i * 3 + 1]) < 0.035) {
          p.push(cloud.positions[i * 3], 0, cloud.positions[i * 3 + 2])
          s.push(cloud.signs[i])
        }
      }
      pos = p
      signs = s
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(toScenePositions(pos, SIZE), 3))
    g.setAttribute('color', new THREE.BufferAttribute(buildColors(signs), 3))
    return g
  }, [n, l, m, slice])
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <points geometry={geometry}>
      <pointsMaterial
        size={slice ? 0.03 : 0.028}
        vertexColors
        transparent
        opacity={slice ? 0.9 : 0.55}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  )
}

const AXES: { label: string; dir: Vec3 }[] = [
  { label: 'x', dir: [1, 0, 0] },
  { label: 'y', dir: [0, 1, 0] },
  { label: 'z', dir: [0, 0, 1] },
]

function Axes() {
  const L = SIZE + 0.1
  return (
    <>
      {AXES.map(({ label, dir }) => {
        const end = toScene([dir[0] * L, dir[1] * L, dir[2] * L])
        const start = toScene([-dir[0] * L, -dir[1] * L, -dir[2] * L])
        const tip = toScene([dir[0] * (L + 0.2), dir[1] * (L + 0.2), dir[2] * (L + 0.2)])
        return (
          <group key={label}>
            <Line points={[start, end]} color="#64748b" lineWidth={1} dashed dashSize={0.08} gapSize={0.06} />
            <SpriteLabel text={label} position={tip} color="#cbd5e1" background={null} height={0.3} />
          </group>
        )
      })}
    </>
  )
}

interface OrbitalSceneProps {
  orbital: OrbitalId
  mode: OrbitalMode
  slice: boolean
  showAxes: boolean
  autoRotate: boolean
}

export function OrbitalScene({ orbital, mode, slice, showAxes, autoRotate }: OrbitalSceneProps) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 5]} intensity={1.4} />
      <directionalLight position={[-5, -3, -4]} intensity={0.4} color="#a5b4fc" />
      <OrbitControls enableDamping enablePan={false} minDistance={3} maxDistance={14} autoRotate={autoRotate} autoRotateSpeed={1.2} />

      {mode === 'lobe' ? <Lobes l={orbital.l} m={orbital.m} /> : <Cloud n={orbital.n} l={orbital.l} m={orbital.m} slice={slice} />}
      {showAxes && <Axes />}
      {/* 원자핵 */}
      <mesh>
        <sphereGeometry args={[0.06, 24, 24]} />
        <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={1.2} />
      </mesh>
    </>
  )
}
