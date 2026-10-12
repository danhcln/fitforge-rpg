import { describe, expect, it } from 'vitest'
import type { BodyMeasurement } from '@/types'
import { defaultCharacter } from '@/services/db/defaults'
import { BodyCompositionToAvatar } from '@/services/bodyComposition/BodyCompositionToAvatar'
import { appearancePresets, clampMorph, mappedMorph, orderedMeasurements, resolveEvolution, resolveMeasurement, smoothMorph } from './evolution'
import { canUseWebGL } from './webgl'
const old: BodyMeasurement = { id: 'old', date: '2026-10-01', heightCm: 175, weightKg: 80, smmKg: 35, pbfPercent: 25 }
const recent: BodyMeasurement = { ...old, id: 'recent', date: '2026-10-12', weightKg: 78, smmKg: 36, pbfPercent: 20 }
const goal = BodyCompositionToAvatar({ ...recent, id: 'goal', weightKg: 75, pbfPercent: 17 }, 'goal')
describe('checkpoint rendering integration', () => {
  it('defaults to the latest actual measurement and automatically uses a new checkpoint', () => {
    const character = defaultCharacter()
    expect(resolveEvolution(character, [old], null, {}, null).measurement?.id).toBe(old.id)
    const preview = resolveEvolution(character, [recent, old], null, {}, null)
    expect(preview.measurement?.id).toBe(recent.id)
    expect(preview.morph).toEqual(mappedMorph(BodyCompositionToAvatar(recent)))
  })
  it('selects older dates and compares without modifying source records', () => {
    const rows = [recent, old], before = structuredClone(rows)
    expect(resolveEvolution(defaultCharacter(), rows, old.id, {}, null).mapping.sourceId).toBe(old.id)
    expect(resolveMeasurement(rows, recent.id)?.id).toBe(recent.id)
    expect(rows).toEqual(before)
  })
  it('ignores demo checkpoints and orders same-date IDs deterministically', () => {
    const demo = { ...recent, id: 'demo', date: '2099-01-01', source: 'demo' }
    const rows = [demo, { ...recent, id: 'b' }, { ...recent, id: 'a' }, old]
    expect(orderedMeasurements(rows).map(m => m.id)).toEqual(['old', 'a', 'b'])
    expect(resolveMeasurement(rows, demo.id)?.id).toBe('b')
  })
  it('falls back to latest when a selected record is removed and neutral when no readings exist', () => {
    expect(resolveMeasurement([recent], old.id)).toEqual(recent)
    const preview = resolveEvolution(defaultCharacter(), [], null, {}, null)
    expect(preview.measurement).toBeNull(); expect(preview.mapping.sourceId).toBeNull()
    expect(preview.morph.overallVolume).toBe(0.5)
    expect(preview.mapping.missing).toContain('smmKg')
  })
  it('switches current and selected goal separately, with safe unavailable-goal fallback', () => {
    const character = defaultCharacter()
    const current = resolveEvolution(character, [recent], null, { goal }, 'goal')
    const target = resolveEvolution({ ...character, mode: 'goal' }, [recent], old.id, { goal }, 'goal')
    expect(current.mapping.mode).toBe('current'); expect(target.mapping.mode).toBe('goal')
    expect(target.morph.fatMorph).not.toBe(current.morph.fatMorph)
    expect(target.mapping.sourceId).toBe('goal')
    expect(resolveEvolution({ ...character, mode: 'goal' }, [recent], null, {}, null).mapping.sourceId).toBeNull()
  })
  it('keeps appearance and manual current/goal settings independent from checkpoint mapping', () => {
    const original = defaultCharacter()
    const character = { ...original, visualSource: 'manual' as const, appearance: appearancePresets.scout }
    const current = resolveEvolution(character, [recent], null, { goal }, 'goal')
    expect(current.morph).toEqual(clampMorph(original.currentBody)); expect(current.appearance).toEqual(appearancePresets.scout)
    expect(resolveEvolution({ ...character, mode: 'goal' }, [recent], null, { goal }, 'goal').morph).toEqual(clampMorph(original.goalBody))
    expect(resolveEvolution({ ...character, visualSource: 'measurement' }, [recent], null, { goal }, 'goal').morph).toEqual(mappedMorph(BodyCompositionToAvatar(recent)))
    expect(original.currentBody).toEqual(character.currentBody)
  })
})
describe('bounded smooth morphing', () => {
  it('maps all seven normalized parameters into legacy-compatible render fields', () => {
    const m = mappedMorph(goal), n = goal.normalized
    expect(m).toMatchObject({ overallVolume: n.overallVolume, upperBodyMuscle: n.upperBodyMuscle, lowerBodyMuscle: n.lowerBodyMuscle,
      fatMorph: n.bodyFat, armProportion: n.arms, legProportion: n.legs, trunkProportion: n.trunk })
    expect(m.chestWidth).toBeGreaterThan(0)
  })
  it('clamps corrupt, extreme and missing render values to finite safe ranges', () => {
    const m = clampMorph({ heightCm: Infinity, fatMorph: 99, muscleMorph: -3, shoulderWidth: 100, armThickness: NaN, legThickness: -2,
      overallVolume: -1, upperBodyMuscle: Infinity, lowerBodyMuscle: 100, armProportion: NaN, legProportion: -1, trunkProportion: 999 })
    expect(m.heightCm).toBe(175); expect(m.fatMorph).toBe(1); expect(m.muscleMorph).toBe(0)
    expect(m.shoulderWidth).toBe(2); expect(m.legThickness).toBe(0.5)
    expect(Object.values(m).every(Number.isFinite)).toBe(true)
    expect(m.trunkProportion).toBe(1); expect(m.armProportion).toBe(0.5)
  })
  it('interpolates monotonically without jumps or overshoot and handles long frame gaps', () => {
    const a = clampMorph({ fatMorph: 0, shoulderWidth: 0.5 }), b = clampMorph({ fatMorph: 1, shoulderWidth: 2 })
    const mid = smoothMorph(a, b, 1 / 60)
    expect(mid.fatMorph).toBeGreaterThan(0); expect(mid.fatMorph).toBeLessThan(1)
    expect(mid.shoulderWidth).toBeGreaterThan(0.5); expect(mid.shoulderWidth).toBeLessThan(2)
    let next = a
    for (let i = 0; i < 120; i++) next = smoothMorph(next, b, 1 / 60)
    expect(next.fatMorph).toBeCloseTo(1, 5)
    expect(smoothMorph(a, b, 50).fatMorph).toBeLessThan(1)
    expect(smoothMorph(a, b, -1)).toEqual(a); expect(smoothMorph(a, b, NaN)).toEqual(a)
  })
})
describe('WebGL capability fallback', () => {
  it('handles absent or throwing WebGL without throwing into the app', () => {
    expect(canUseWebGL(() => ({ getContext: () => null } as unknown as HTMLCanvasElement))).toBe(false)
    expect(canUseWebGL(() => { throw new Error('blocked graphics') })).toBe(false)
  })
  it('releases the disposable probe context before mounting the renderer', () => {
    let released = false
    const canvas = { getContext: () => ({ getExtension: () => ({ loseContext: () => { released = true } }) }) }
    expect(canUseWebGL(() => canvas as unknown as HTMLCanvasElement)).toBe(true)
    expect(released).toBe(true)
  })
})
