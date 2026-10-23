import { useEffect, useMemo, useRef } from 'react'
import { useGLTF } from '@react-three/drei'
import type { Group, Mesh } from 'three'
import {
  type MorphTargetInfo,
  getFriendlyMorphTargetName,
} from '@/services/character/avatarMorphTypes'

interface AvatarModelProps {
  modelUrl?: string
  morphInfluences?: Record<string, number>
  onInspectTargets?: (targets: MorphTargetInfo[], meshName: string) => void
  onError?: (error: Error) => void
}

export function AvatarModel({
  modelUrl = '/models/gym_avatar_v3.glb',
  morphInfluences = {},
  onInspectTargets,
}: AvatarModelProps) {
  const groupRef = useRef<Group>(null)
  const targetMeshRef = useRef<Mesh | null>(null)
  const inspectedRef = useRef(false)
  const gltf = useGLTF(modelUrl)

  // Find all meshes and extract morph targets metadata
  const { morphList, meshName } = useMemo(() => {
    let foundMesh: Mesh | null = null
    let name = ''
    const list: MorphTargetInfo[] = []

    gltf.scene.traverse((child) => {
      if ((child as Mesh).isMesh) {
        const mesh = child as Mesh
        if (!foundMesh && mesh.morphTargetDictionary) {
          foundMesh = mesh
          name = mesh.name || 'AvatarMesh'
        }

        // Ensure vertex normals exist for proper studio lighting
        if (!mesh.geometry.attributes.normal) {
          mesh.geometry.computeVertexNormals()
        }

        mesh.castShadow = true
        mesh.receiveShadow = true

        // Ensure materials display cleanly with double-sided rendering
        if (mesh.material) {
          if (Array.isArray(mesh.material)) {
            mesh.material.forEach((mat) => {
              mat.needsUpdate = true
            })
          } else {
            mesh.material.needsUpdate = true
          }
        }
      }
    })

    const activeMesh = foundMesh as Mesh | null
    if (activeMesh && activeMesh.morphTargetDictionary && activeMesh.morphTargetInfluences) {
      const dict = activeMesh.morphTargetDictionary as Record<string, number>
      const influences = activeMesh.morphTargetInfluences as number[]

      for (const [targetName, index] of Object.entries(dict)) {
        const defaultInfluence = Number(influences[index] ?? 0)
        const { friendlyName, category } = getFriendlyMorphTargetName(targetName)

        list.push({
          name: targetName,
          index,
          meshName: name,
          defaultInfluence,
          currentInfluence: defaultInfluence,
          min: 0.0,
          max: 1.0,
          friendlyName,
          category,
        })
      }

      // Sort by index
      list.sort((a, b) => a.index - b.index)
    }

    return { morphList: list, meshName: name }
  }, [gltf])

  // Cache mesh reference in effect
  useEffect(() => {
    let found: Mesh | null = null
    gltf.scene.traverse((child) => {
      if ((child as Mesh).isMesh && (child as Mesh).morphTargetDictionary) {
        if (!found) found = child as Mesh
      }
    })
    targetMeshRef.current = found
  }, [gltf])

  // Notify parent component about extracted morph targets
  useEffect(() => {
    if (!inspectedRef.current && morphList.length > 0 && onInspectTargets) {
      inspectedRef.current = true
      onInspectTargets(morphList, meshName)
    }
  }, [morphList, meshName, onInspectTargets])

  // Apply real-time morph influences to the mesh
  useEffect(() => {
    const mesh = targetMeshRef.current
    if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) {
      return
    }

    const dict = mesh.morphTargetDictionary as Record<string, number>
    const influences = mesh.morphTargetInfluences as number[]

    for (const [name, value] of Object.entries(morphInfluences)) {
      const idx = dict[name]
      if (idx !== undefined && idx < influences.length) {
        influences[idx] = Math.max(0, Math.min(1, value))
      }
    }
  }, [morphInfluences])

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      <primitive object={gltf.scene} />
    </group>
  )
}

// Preload the GLB model for faster rendering
// Legacy MPFB viewer is retained for old tooling; the athlete model preloads separately.
