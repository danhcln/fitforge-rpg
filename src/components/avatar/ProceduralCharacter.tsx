import React, { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { BodyMorphParameters } from '@/types'

interface ProceduralCharacterProps {
  morph: BodyMorphParameters
  isGoalMode?: boolean
  auraEnabled?: boolean
}

export const ProceduralCharacter: React.FC<ProceduralCharacterProps> = ({
  morph,
  isGoalMode = false,
  auraEnabled = true,
}) => {
  const groupRef = useRef<THREE.Group>(null)
  const chestRef = useRef<THREE.Mesh>(null)

  // Subtle breathing idle animation
  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    if (chestRef.current) {
      chestRef.current.scale.z = (1 + Math.sin(t * 1.5) * 0.03) * (morph.chestWidth || 1)
    }
    if (groupRef.current) {
      groupRef.current.position.y = Math.sin(t * 1.2) * 0.02
    }
  })

  // Color theme: Teal Cyan for Current, Radiant Amber/Gold for Goal
  const accentColor = isGoalMode ? '#f59e0b' : '#14b8a6'
  const skinColor = isGoalMode ? '#1e293b' : '#0f172a'
  const gearColor = isGoalMode ? '#334155' : '#1e293b'

  // Morph scaling factors derived from parameters
  const muscleFactor = 1 + morph.muscleMorph * 0.35
  const fatFactor = 1 + morph.fatMorph * 0.35
  const waistFactor = morph.waistWidth * (1 + morph.fatMorph * 0.25 - morph.muscleMorph * 0.15)
  const chestFactor = morph.chestWidth * muscleFactor
  const shoulderFactor = morph.shoulderWidth * muscleFactor
  const armFactor = morph.armThickness * muscleFactor
  const legFactor = morph.legThickness * (1 + morph.muscleMorph * 0.2)

  return (
    <group ref={groupRef} position={[0, -1.1, 0]}>
      {/* --- PODIUM / PEDESTAL --- */}
      <mesh position={[0, -0.05, 0]}>
        <cylinderGeometry args={[1.2, 1.3, 0.1, 32]} />
        <meshStandardMaterial color="#090d16" roughness={0.6} metalness={0.4} />
      </mesh>
      {/* Podium Neon Ring */}
      <mesh position={[0, 0.005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.05, 1.15, 32]} />
        <meshBasicMaterial color={accentColor} />
      </mesh>

      {/* --- HEAD & NECK --- */}
      {/* Head */}
      <mesh position={[0, 2.05, 0]}>
        <sphereGeometry args={[0.18, 24, 24]} />
        <meshStandardMaterial color={skinColor} roughness={0.3} metalness={0.2} />
      </mesh>
      {/* Visor / Eye Glow */}
      <mesh position={[0, 2.07, 0.15]}>
        <boxGeometry args={[0.22, 0.05, 0.08]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={0.8}
          roughness={0.1}
        />
      </mesh>
      {/* Neck */}
      <mesh position={[0, 1.86, 0]}>
        <cylinderGeometry args={[0.08 * muscleFactor, 0.1 * muscleFactor, 0.15, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* --- TORSO & CHEST --- */}
      {/* Chest / Upper Torso */}
      <mesh
        ref={chestRef}
        position={[0, 1.62, 0]}
        scale={[chestFactor, 1, 1]}
      >
        <boxGeometry args={[0.5, 0.36, 0.28]} />
        <meshStandardMaterial color={skinColor} roughness={0.35} metalness={0.3} />
      </mesh>
      {/* Core Chest Emblem */}
      <mesh position={[0, 1.65, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.03, 6]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Abdomen / Waist */}
      <mesh position={[0, 1.32, 0]} scale={[waistFactor, 1, fatFactor]}>
        <boxGeometry args={[0.4, 0.28, 0.24]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} metalness={0.25} />
      </mesh>

      {/* Pelvis / Hips */}
      <mesh position={[0, 1.1, 0]} scale={[waistFactor * 1.05, 1, 1]}>
        <boxGeometry args={[0.42, 0.2, 0.25]} />
        <meshStandardMaterial color={gearColor} roughness={0.5} />
      </mesh>

      {/* Weightlifting Belt */}
      <mesh position={[0, 1.18, 0]} scale={[waistFactor * 1.08, 1, fatFactor * 1.08]}>
        <boxGeometry args={[0.44, 0.1, 0.27]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.5} />
      </mesh>
      {/* Belt Buckle */}
      <mesh position={[0, 1.18, 0.15]}>
        <boxGeometry args={[0.08, 0.08, 0.02]} />
        <meshStandardMaterial color={accentColor} metalness={0.8} roughness={0.2} />
      </mesh>

      {/* --- SHOULDERS & ARMS --- */}
      {/* Left Shoulder */}
      <mesh position={[-0.34 * shoulderFactor, 1.7, 0]} scale={[shoulderFactor, shoulderFactor, shoulderFactor]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={gearColor} roughness={0.4} metalness={0.3} />
      </mesh>
      {/* Right Shoulder */}
      <mesh position={[0.34 * shoulderFactor, 1.7, 0]} scale={[shoulderFactor, shoulderFactor, shoulderFactor]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshStandardMaterial color={gearColor} roughness={0.4} metalness={0.3} />
      </mesh>

      {/* Left Upper Arm */}
      <mesh position={[-0.38 * shoulderFactor, 1.48, 0]} scale={[armFactor, 1, armFactor]}>
        <cylinderGeometry args={[0.09, 0.08, 0.26, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.35} />
      </mesh>
      {/* Right Upper Arm */}
      <mesh position={[0.38 * shoulderFactor, 1.48, 0]} scale={[armFactor, 1, armFactor]}>
        <cylinderGeometry args={[0.09, 0.08, 0.26, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.35} />
      </mesh>

      {/* Left Forearm */}
      <mesh position={[-0.4 * shoulderFactor, 1.2, 0.05]} scale={[armFactor, 1, armFactor]}>
        <cylinderGeometry args={[0.08, 0.065, 0.28, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      {/* Right Forearm */}
      <mesh position={[0.4 * shoulderFactor, 1.2, 0.05]} scale={[armFactor, 1, armFactor]}>
        <cylinderGeometry args={[0.08, 0.065, 0.28, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* Left Hand / Wrist Wrap */}
      <mesh position={[-0.4 * shoulderFactor, 0.98, 0.08]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>
      {/* Right Hand / Wrist Wrap */}
      <mesh position={[0.4 * shoulderFactor, 0.98, 0.08]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial color={accentColor} roughness={0.5} />
      </mesh>

      {/* --- LEGS & FEET --- */}
      {/* Left Thigh */}
      <mesh position={[-0.14, 0.82, 0]} scale={[legFactor, 1, legFactor]}>
        <cylinderGeometry args={[0.13, 0.1, 0.38, 16]} />
        <meshStandardMaterial color={gearColor} roughness={0.5} />
      </mesh>
      {/* Right Thigh */}
      <mesh position={[0.14, 0.82, 0]} scale={[legFactor, 1, legFactor]}>
        <cylinderGeometry args={[0.13, 0.1, 0.38, 16]} />
        <meshStandardMaterial color={gearColor} roughness={0.5} />
      </mesh>

      {/* Knee Sleeves */}
      <mesh position={[-0.14, 0.58, 0]} scale={[legFactor * 1.05, 1, legFactor * 1.05]}>
        <cylinderGeometry args={[0.105, 0.095, 0.14, 16]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>
      <mesh position={[0.14, 0.58, 0]} scale={[legFactor * 1.05, 1, legFactor * 1.05]}>
        <cylinderGeometry args={[0.105, 0.095, 0.14, 16]} />
        <meshStandardMaterial color={accentColor} roughness={0.6} />
      </mesh>

      {/* Left Calf / Shin */}
      <mesh position={[-0.14, 0.32, 0]} scale={[legFactor, 1, legFactor]}>
        <cylinderGeometry args={[0.095, 0.075, 0.38, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>
      {/* Right Calf / Shin */}
      <mesh position={[0.14, 0.32, 0]} scale={[legFactor, 1, legFactor]}>
        <cylinderGeometry args={[0.095, 0.075, 0.38, 16]} />
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </mesh>

      {/* Left Foot */}
      <mesh position={[-0.14, 0.06, 0.06]}>
        <boxGeometry args={[0.14, 0.1, 0.26]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>
      {/* Right Foot */}
      <mesh position={[0.14, 0.06, 0.06]}>
        <boxGeometry args={[0.14, 0.1, 0.26]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} />
      </mesh>

      {/* --- AURA EFFECT --- */}
      {auraEnabled && (
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.85, 0.95, 2.4, 24, 1, true]} />
          <meshBasicMaterial
            color={accentColor}
            wireframe
            transparent
            opacity={0.12}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  )
}
