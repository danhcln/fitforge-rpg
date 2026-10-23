import { useEffect, useMemo, useRef } from 'react'
import { useGLTF, useAnimations } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { clone } from 'three/examples/jsm/utils/SkeletonUtils.js'
import { MathUtils, Mesh, MeshStandardMaterial, Bone, Quaternion, Vector3 } from 'three'
import type { CharacterAppearance } from '@/types'
import { ATHLETE_MODEL } from '@/services/character/athlete'

interface AthleteModelProps {
  morphInfluences?: Record<string, number>
  appearance?: CharacterAppearance
  motionEnabled?: boolean
  celebration?: number
}

export function AthleteModel({ morphInfluences = {}, appearance,
  motionEnabled = true, celebration = 0 }: AthleteModelProps) {
  const gltf = useGLTF(ATHLETE_MODEL)
  // Skeleton, morph arrays and materials belong to each preview independently.
  const { scene, meshes } = useMemo(() => {
    const scene = clone(gltf.scene)
    const meshes: Mesh[] = []
    scene.traverse(child => {
      if (!(child instanceof Mesh)) return
      meshes.push(child)
      child.material = Array.isArray(child.material) ? child.material.map(m => m.clone()) : child.material.clone()
      child.castShadow = true
      child.receiveShadow = true
      child.frustumCulled = false
    })
    return { scene, meshes }
  }, [gltf.scene])
  const { actions, mixer } = useAnimations(gltf.animations, scene)
  const celebrateAt = useRef(-100)
  const clockTime = useRef(0)
  useEffect(() => { if (celebration > 0) celebrateAt.current = clockTime.current }, [celebration])
  useEffect(() => {
    actions.Idle?.reset().play()
    return () => { mixer.stopAllAction() }
  }, [actions, mixer])
  useEffect(() => { Object.values(actions).forEach(action => action?.setEffectiveTimeScale(motionEnabled ? 1 : 0)) }, [actions, motionEnabled])
  useEffect(() => {
    meshes.forEach(mesh => {
      for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
        if (!(material instanceof MeshStandardMaterial)) continue
        const name = material.name
        if (name.startsWith('Skin')) material.color.set(appearance?.skinColor ?? '#b98966')
        if (name.startsWith('Jersey')) material.color.set(appearance?.clothingColor ?? '#15b8a6')
        if (name.startsWith('Accent')) material.color.set(appearance?.accentColor ?? '#ff8a3d')
        if (name.startsWith('Hair')) material.color.set(appearance?.hairColor ?? '#30231e')
      }
    })
  }, [appearance, meshes])
  useEffect(() => () => {
    meshes.forEach(mesh => (Array.isArray(mesh.material) ? mesh.material : [mesh.material]).forEach(m => m.dispose()))
  }, [meshes])
  const axis = useMemo(() => new Vector3(), [])
  const rotation = useMemo(() => new Quaternion(), [])
  const parentRotation = useMemo(() => new Quaternion(), [])
  useFrame((state, delta) => {
    clockTime.current = state.clock.elapsedTime
    const alpha = 1 - Math.exp(-9 * Math.min(delta, .1))
    meshes.forEach(mesh => {
      if (!mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return
      for (const [name, index] of Object.entries(mesh.morphTargetDictionary)) {
        const blinkPhase = state.clock.elapsedTime % 4.7
        const raw = name === 'Blink' ? (motionEnabled && blinkPhase < .23 ? Math.sin(Math.PI * blinkPhase / .23) : 0) : morphInfluences[name] ?? 0
        const target = Number.isFinite(raw) ? MathUtils.clamp(raw, 0, 1) : 0
        mesh.morphTargetInfluences[index] = MathUtils.lerp(mesh.morphTargetInfluences[index], target, alpha)
      }
    })
    const elapsed = state.clock.elapsedTime - celebrateAt.current
    if (motionEnabled && elapsed >= 0 && elapsed < 3.6) {
      const progress = Math.sin(Math.PI * elapsed / 3.6)
      for (const [name, sign] of [['upperarm_l', 1], ['upperarm_r', -1]] as const) {
        const bone = scene.getObjectByName(name)
        if (!(bone instanceof Bone)) continue
        bone.parent?.getWorldQuaternion(parentRotation)
        axis.set(0, 0, 1).applyQuaternion(parentRotation.invert())
        rotation.setFromAxisAngle(axis, sign * progress * 2)
        bone.quaternion.premultiply(rotation)
      }
    }
  })
  return <group position={[0, .02, 0]}><primitive object={scene} dispose={null} /></group>
}

useGLTF.preload(ATHLETE_MODEL)
