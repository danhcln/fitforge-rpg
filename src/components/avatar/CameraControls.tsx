import { forwardRef, useImperativeHandle, useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'

export type CameraPreset =
  | 'front'
  | 'back'
  | 'side-left'
  | 'side-right'
  | 'full-body'
  | 'upper-body'
  | 'face'
  | 'reset'

export interface CameraControlsHandle {
  setPreset: (preset: CameraPreset) => void
  zoomIn: () => void
  zoomOut: () => void
  resetCamera: () => void
  getControls: () => OrbitControlsImpl | null
}

interface CameraControlsProps {
  autoRotate?: boolean
  autoRotateSpeed?: number
  onPresetComplete?: () => void
}

const PRESET_CONFIGS: Record<CameraPreset, { position: [number, number, number]; target: [number, number, number] }> = {
  'front': { position: [0, 0.85, 2.6], target: [0, 0.85, 0] },
  'back': { position: [0, 0.85, -2.6], target: [0, 0.85, 0] },
  'side-left': { position: [-2.6, 0.85, 0], target: [0, 0.85, 0] },
  'side-right': { position: [2.6, 0.85, 0], target: [0, 0.85, 0] },
  'full-body': { position: [0, 0.85, 2.8], target: [0, 0.85, 0] },
  'upper-body': { position: [0, 1.25, 1.6], target: [0, 1.25, 0] },
  'face': { position: [0, 1.52, 0.95], target: [0, 1.52, 0] },
  'reset': { position: [0, 0.85, 2.6], target: [0, 0.85, 0] },
}

export const CameraControls = forwardRef<CameraControlsHandle, CameraControlsProps>(function CameraControls(
  { autoRotate = false, autoRotateSpeed = 1.0, onPresetComplete },
  ref,
) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()

  const targetPosition = useRef<Vector3 | null>(null)
  const targetLookAt = useRef<Vector3 | null>(null)
  const transitioningRef = useRef(false)

  const triggerPreset = (preset: CameraPreset) => {
    const config = PRESET_CONFIGS[preset] || PRESET_CONFIGS.reset
    targetPosition.current = new Vector3(...config.position)
    targetLookAt.current = new Vector3(...config.target)
    transitioningRef.current = true
  }

  const zoom = (factor: number) => {
    const controls = controlsRef.current
    if (!controls) return
    const offset = camera.position.clone().sub(controls.target)
    const distance = Math.max(0.6, Math.min(6.5, offset.length() * factor))
    camera.position.copy(controls.target).add(offset.normalize().multiplyScalar(distance))
    controls.update()
  }

  useImperativeHandle(ref, () => ({
    setPreset: (preset: CameraPreset) => triggerPreset(preset),
    zoomIn: () => zoom(0.85),
    zoomOut: () => zoom(1.18),
    resetCamera: () => triggerPreset('reset'),
    getControls: () => controlsRef.current,
  }))

  useFrame((_, delta) => {
    if (!controlsRef.current) return

    // Manage autoRotate imperative property to avoid accessing ref during render
    controlsRef.current.autoRotate = autoRotate && !transitioningRef.current

    if (!transitioningRef.current || !targetPosition.current || !targetLookAt.current) {
      return
    }

    const t = 1 - Math.exp(-9 * Math.min(delta, 0.1))
    camera.position.lerp(targetPosition.current, t)
    controlsRef.current.target.lerp(targetLookAt.current, t)
    controlsRef.current.update()

    const posDist = camera.position.distanceTo(targetPosition.current)
    const targetDist = controlsRef.current.target.distanceTo(targetLookAt.current)

    if (posDist < 0.01 && targetDist < 0.01) {
      camera.position.copy(targetPosition.current)
      controlsRef.current.target.copy(targetLookAt.current)
      controlsRef.current.update()
      transitioningRef.current = false
      targetPosition.current = null
      targetLookAt.current = null
      onPresetComplete?.()
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={false}
      enableDamping={true}
      dampingFactor={0.08}
      rotateSpeed={0.85}
      zoomSpeed={0.9}
      autoRotateSpeed={autoRotateSpeed}
      minDistance={0.5}
      maxDistance={6.0}
      minPolarAngle={Math.PI / 12}
      maxPolarAngle={Math.PI * 0.52}
      target={[0, 0.85, 0]}
    />
  )
})
