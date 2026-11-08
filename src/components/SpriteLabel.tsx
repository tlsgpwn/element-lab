import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

interface SpriteLabelProps {
  text: string
  position: [number, number, number] | THREE.Vector3
  /** 글자색 */
  color?: string
  /** 배경색 (null이면 배경 없음) */
  background?: string | null
  /** 월드 단위 글자 높이 */
  height?: number
  bold?: boolean
}

const FONT_PX = 64
const PAD_X = 18
const PAD_Y = 10

/**
 * 3D 장면 속 글자 라벨 (캔버스 텍스처 + 스프라이트).
 * drei <Html>은 라벨마다 별도 React 루트를 만들어 React 19에서 탭 전환(언마운트) 시
 * 루트 해제 경쟁으로 앱 전체가 멈추는 문제가 있어, DOM을 쓰지 않는 이 방식을 쓴다.
 */
export function SpriteLabel({ text, position, color = '#ffffff', background = 'rgba(2,6,23,0.78)', height = 0.26, bold = true }: SpriteLabelProps) {
  const { texture, aspect } = useMemo(() => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')!
    const font = `${bold ? 700 : 500} ${FONT_PX}px ui-sans-serif, system-ui, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`
    ctx.font = font
    const w = Math.ceil(ctx.measureText(text).width) + PAD_X * 2
    const h = FONT_PX + PAD_Y * 2
    canvas.width = w
    canvas.height = h
    ctx.font = font
    if (background) {
      ctx.fillStyle = background
      const r = 16
      ctx.beginPath()
      ctx.roundRect(0, 0, w, h, r)
      ctx.fill()
    }
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, w / 2, h / 2 + 2)
    const tex = new THREE.CanvasTexture(canvas)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return { texture: tex, aspect: w / h }
  }, [text, color, background, bold])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <sprite position={position} scale={[height * aspect, height, 1]} renderOrder={10}>
      <spriteMaterial map={texture} transparent depthTest={false} depthWrite={false} />
    </sprite>
  )
}
