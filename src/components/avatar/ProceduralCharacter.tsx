import { memo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import type { Group, Mesh } from 'three'
import type { BodyMorphParameters, CharacterAppearance } from '@/types'
import { appearancePresets, bounded, clampMorph, smoothMorph } from '@/services/character/evolution'

interface ProceduralCharacterProps {
  morph: BodyMorphParameters
  isGoalMode?: boolean
  auraEnabled?: boolean
  appearance?: CharacterAppearance
}
/** Fixed smooth geometries: morphing updates transforms, never rebuilds geometry per frame. */
export const ProceduralCharacter = memo(function ProceduralCharacter({ morph, isGoalMode = false, auraEnabled = false, appearance = appearancePresets.forge }: ProceduralCharacterProps) {
  const body = useRef<Group>(null)
  const parts = useRef<Record<string, Mesh>>({})
  const current = useRef(clampMorph(morph))
  const target = clampMorph(morph)
  const skin = appearance.skinColor
  const fabric = appearance.clothingColor
  const accent = appearance.accentColor
  const setPart = (name: string, x: number, y: number, z: number, sx: number, sy: number, sz: number) => {
    const mesh = parts.current[name]
    if (mesh) { mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz) }
  }
  useFrame((state, delta) => {
    const m = current.current = smoothMorph(current.current, target, delta)
    const volume = 0.85 + m.overallVolume! * 0.3
    const upper = 0.82 + (m.upperBodyMuscle! + m.muscleMorph) * 0.16
    const lower = 0.82 + (m.lowerBodyMuscle! + m.muscleMorph) * 0.16
    const fat = m.fatMorph
    // Narrower render bounds inside the legacy input range prevent intersecting limbs and detached shoulders.
    const chest = bounded(m.chestWidth, 0.8, 1.3, 1) * upper * volume
    const waist = bounded(m.waistWidth, 0.8, 1.25, 1) * volume * (0.93 + fat * 0.18)
    const arm = bounded(m.armThickness, 0.8, 1.3, 1) * upper * (0.9 + m.armProportion! * 0.2)
    const leg = bounded(m.legThickness, 0.8, 1.3, 1) * lower * (0.9 + m.legProportion! * 0.2)
    const torso = 0.94 + m.trunkProportion! * 0.12
    const shoulder = chest * 0.255 + 0.08 * bounded(m.shoulderWidth, 0.85, 1.3, 1)
    const breath = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.007
    if (body.current) body.current.scale.setScalar(bounded(m.heightCm / 175, 0.8, 1.25, 1))
    setPart('head', 0, 1.94 + (torso - 1) * 0.4, 0, 0.145, 0.195, 0.15)
    setPart('visor', 0, 1.97 + (torso - 1) * 0.4, 0.133, 0.113, 0.028, 0.03)
    setPart('neck', 0, 1.73, 0, 0.085 * upper, 0.13, 0.085 * upper)
    setPart('chest', 0, 1.49, 0, 0.29 * chest, 0.31 * torso, (0.15 + fat * 0.035) * breath)
    setPart('abdomen', 0, 1.22, 0.012, 0.235 * waist, 0.27 * torso, 0.145 + fat * 0.055)
    setPart('hips', 0, 0.99, 0, 0.235 * waist, 0.16, 0.16 + fat * 0.025)
    setPart('belt', 0, 1.045, 0, 0.241 * waist, 0.035, 0.164 + fat * 0.025)
    setPart('emblem', 0, 1.52, 0.15 + fat * 0.035, 0.046, 0.046, 0.016)
    const stance = 0.125 + leg * 0.022
    for (const side of [-1, 1]) {
      const suffix = side === -1 ? 'L' : 'R'
      setPart(`shoulder${suffix}`, side * shoulder, 1.63, 0, 0.112 * arm, 0.123 * arm, 0.12 * arm)
      setPart(`upperArm${suffix}`, side * (shoulder + 0.035), 1.39, 0, 0.093 * arm, 0.22, 0.095 * arm)
      setPart(`elbow${suffix}`, side * (shoulder + 0.049), 1.19, 0.01, 0.072 * arm, 0.075, 0.078 * arm)
      setPart(`forearm${suffix}`, side * (shoulder + 0.059), 1.035, 0.025, 0.073 * arm, 0.185, 0.081 * arm)
      setPart(`hand${suffix}`, side * (shoulder + 0.062), 0.845, 0.044, 0.065, 0.095, 0.067)
      setPart(`thigh${suffix}`, side * stance, 0.76, 0, 0.13 * leg, 0.275, 0.135 * leg)
      setPart(`knee${suffix}`, side * stance, 0.5, 0.025, 0.091 * leg, 0.085, 0.1 * leg)
      setPart(`calf${suffix}`, side * stance, 0.285, 0, 0.088 * leg, 0.22, 0.096 * leg)
      setPart(`foot${suffix}`, side * stance, 0.055, 0.075, 0.092 * leg, 0.055, 0.165)
      setPart(`pec${suffix}`, side * 0.126 * chest, 1.52, 0.145 + fat * 0.035, 0.12 * chest, 0.09, 0.015 + m.definition * (1 - fat) * 0.025)
    }
  })
  const ellipsoid = (name: string, color: string, metalness = 0.08) => <mesh key={name} ref={mesh => { if (mesh) parts.current[name] = mesh }}>
    <sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color={color} roughness={0.65} metalness={metalness} />
  </mesh>
  const torsoColor = appearance.clothing === 'suit' ? fabric : skin
  return <group position={[0, -1.12, 0]}>
    <mesh position={[0, -0.05, 0]}><cylinderGeometry args={[0.85, 0.9, 0.1, 40]} /><meshStandardMaterial color="#090d16" roughness={0.7} metalness={0.35} /></mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.77, 0.82, 48]} /><meshBasicMaterial color={accent} /></mesh>
    <group ref={body}>
      {ellipsoid('head', skin)}{ellipsoid('visor', accent, 0.4)}{ellipsoid('neck', torsoColor)}
      {ellipsoid('chest', torsoColor)}{ellipsoid('abdomen', torsoColor)}{ellipsoid('hips', fabric)}{ellipsoid('belt', '#111827')}{ellipsoid('emblem', accent, 0.6)}
      {[-1, 1].flatMap(side => {
        const s = side === -1 ? 'L' : 'R'
        return [ellipsoid(`shoulder${s}`, appearance.clothing === 'training' ? fabric : torsoColor), ellipsoid(`upperArm${s}`, torsoColor), ellipsoid(`elbow${s}`, skin),
          ellipsoid(`forearm${s}`, appearance.clothing === 'suit' ? fabric : skin), ellipsoid(`hand${s}`, skin), ellipsoid(`thigh${s}`, fabric),
          ellipsoid(`knee${s}`, accent), ellipsoid(`calf${s}`, appearance.clothing === 'shorts' ? skin : fabric), ellipsoid(`foot${s}`, '#111827'), ellipsoid(`pec${s}`, torsoColor)]
      })}
      {auraEnabled && <mesh position={[0, 1.05, 0]}><cylinderGeometry args={[0.75, 0.83, 2.25, 24, 1, true]} /><meshBasicMaterial color={accent} wireframe transparent opacity={isGoalMode ? 0.1 : 0.07} /></mesh>}
    </group>
  </group>
})
