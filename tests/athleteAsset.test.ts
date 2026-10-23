import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
describe('shipped athlete GLB contract', () => {
  const buffer = readFileSync(new URL('../public/models/fitforge_athlete.glb', import.meta.url))
  const gltf = JSON.parse(buffer.toString('utf8', 20, 20 + buffer.readUInt32LE(12)))
  it('ships a complete embedded model with rig, normals, eye texture and idle animation', () => {
    expect(buffer.toString('utf8', 0, 4)).toBe('glTF')
    expect(buffer.readUInt32LE(8)).toBe(buffer.length)
    expect(buffer.length).toBeLessThan(8 * 1024 * 1024)
    expect(gltf.skins.length).toBeGreaterThan(0)
    expect(gltf.animations.some((a: { name: string }) => a.name === 'Idle')).toBe(true)
    expect(gltf.images.length).toBeGreaterThan(0)
    for (const resource of [...gltf.buffers, ...gltf.images]) expect(resource.uri).toBeUndefined()
    for (const mesh of gltf.meshes) for (const primitive of mesh.primitives) {
      expect(primitive.attributes.NORMAL).toBeDefined()
      expect(primitive.attributes.JOINTS_0).toBeDefined()
      expect(primitive.attributes.WEIGHTS_0).toBeDefined()
    }
  })
  it('provides the same four body morphs on skin, tank and shorts', () => {
    for (const name of ['Athlete_Body', 'Training_Tank', 'Training_Shorts']) {
      const node = gltf.nodes.find((node: { name: string }) => node.name === name)
      const mesh = gltf.meshes[node.mesh]
      for (const target of ['Muscle', 'BodyFat', 'Chest', 'Legs']) expect(mesh.extras.targetNames).toContain(target)
    }
  })
})

