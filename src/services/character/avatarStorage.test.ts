import { describe, it, expect, beforeEach } from 'vitest'
import {
  saveAvatarMorphConfig,
  loadAvatarMorphConfig,
  clearAvatarMorphConfig,
  exportAvatarMorphJson,
  validateAvatarMorphConfigJson,
} from './avatarStorage'

describe('avatarStorage', () => {
  beforeEach(() => {
    clearAvatarMorphConfig()
  })

  it('saves and loads avatar morph configuration to localStorage', () => {
    const mockMorphs = {
      '$md-$as-$fe-$yn': 0.25,
      '$md-universal-$ma-$yn-$av$mu-$av$wg': 0.75,
    }
    const saved = saveAvatarMorphConfig(mockMorphs, 'Test note')
    expect(saved).toBe(true)

    const loaded = loadAvatarMorphConfig()
    expect(loaded).toEqual(mockMorphs)
  })

  it('returns null when no configuration is in localStorage', () => {
    clearAvatarMorphConfig()
    expect(loadAvatarMorphConfig()).toBeNull()
  })

  it('exports configuration to valid JSON schema string', () => {
    const mockMorphs = { '$md-$as-$fe-$yn': 0.3 }
    const json = exportAvatarMorphJson(mockMorphs)
    const parsed = JSON.parse(json)
    expect(parsed.version).toBe('1.0.0')
    expect(parsed.modelFile).toBe('gym_avatar_v3.glb')
    expect(parsed.morphs['$md-$as-$fe-$yn']).toBe(0.3)
  })

  it('validates and parses valid exported JSON', () => {
    const mockMorphs = {
      '$md-$ca-$fe-$yn': 0.5,
      '$md-$af-$ma-$yn': 0.8,
    }
    const json = exportAvatarMorphJson(mockMorphs)
    const result = validateAvatarMorphConfigJson(json)
    expect(result.success).toBe(true)
    expect(result.data).toEqual(mockMorphs)
  })

  it('validates and clamps out-of-range values in imported JSON', () => {
    const rawJson = JSON.stringify({
      version: '1.0.0',
      morphs: {
        targetA: 1.5,
        targetB: -0.2,
        targetC: 0.4,
      },
    })
    const result = validateAvatarMorphConfigJson(rawJson)
    expect(result.success).toBe(true)
    expect(result.data?.targetA).toBe(1.0)
    expect(result.data?.targetB).toBe(0.0)
    expect(result.data?.targetC).toBe(0.4)
  })

  it('rejects invalid JSON syntax or empty content', () => {
    expect(validateAvatarMorphConfigJson('').success).toBe(false)
    expect(validateAvatarMorphConfigJson('{ broken json').success).toBe(false)
    expect(validateAvatarMorphConfigJson(JSON.stringify({ notMorphs: true })).success).toBe(false)
  })
})
