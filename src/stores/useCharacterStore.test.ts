import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { db, FitForgeDatabase } from '@/services/db/db'
import { defaultCharacter } from '@/services/db/defaults'
import { useCharacterStore } from './useCharacterStore'
import { resolveEvolution, appearancePresets } from '@/services/character/evolution'
import { BodyCompositionToAvatar } from '@/services/bodyComposition/BodyCompositionToAvatar'
import { sessionRow } from '@/test/fixtures'
const checkpoint = { id: 'checkpoint-real', date: '2026-10-12', measurementVersion: 3 as const, heightCm: 175, weightKg: 80, smmKg: 35, pbfPercent: 20, bodyFatMassKg: 16 }
const flush = async () => { await vi.waitFor(() => expect(useCharacterStore.getState().pendingWrites).toBe(0)); expect(useCharacterStore.getState().error).toBeNull() }
beforeEach(async () => {
  await db.delete(); await db.open(); await db.seedInitialData(); await db.saveMeasurement(checkpoint)
  useCharacterStore.setState({ character: defaultCharacter(), error: null, pendingWrites: 0, measuredBody: BodyCompositionToAvatar(checkpoint), goalBodies: {}, selectedGoalId: null, selectedMeasurementId: null, comparisonMeasurementId: null })
})
afterEach(async () => { await flush(); await db.delete() })
describe('persistent customization and source separation', () => {
  it('persists appearance, clothing, manual proportions and mode after reconnect', async () => {
    const store = useCharacterStore.getState()
    store.setAppearancePreset('scout'); store.updateAppearance({ accentColor: '#ff8800', clothing: 'suit' })
    store.updateCurrentBody({ armProportion: 0.7, lowerBodyMuscle: 0.6 }); store.setMode('goal'); await flush()
    const other = new FitForgeDatabase(db.name)
    try {
      const saved = await other.characterStates.get(defaultCharacter().id)
      expect(saved?.appearance).toEqual({ ...appearancePresets.scout, accentColor: '#ff8800', clothing: 'suit' })
      expect(saved?.currentBody.armProportion).toBe(0.7); expect(saved?.visualSource).toBe('manual'); expect(saved?.mode).toBe('goal')
    } finally { other.close() }
    expect(await db.bodyMeasurements.get(checkpoint.id)).toEqual({ ...checkpoint, source: 'real' })
  })
  it('returning to measurement rendering preserves manual settings and historical readings', async () => {
    useCharacterStore.getState().updateCurrentBody({ fatMorph: 0.9 }); await flush()
    const manual = structuredClone(useCharacterStore.getState().character.currentBody)
    useCharacterStore.getState().setVisualSource('measurement'); await flush()
    expect(useCharacterStore.getState().character.currentBody).toEqual(manual)
    const preview = resolveEvolution(useCharacterStore.getState().character, [checkpoint], null, {}, null)
    expect(preview.morph.fatMorph).toBeCloseTo(20 / 60)
    expect((await db.bodyMeasurements.get(checkpoint.id))?.pbfPercent).toBe(20)
  })
  it('history and comparison selection never writes measurement records', async () => {
    const before = await db.bodyMeasurements.toArray()
    useCharacterStore.getState().selectMeasurement(checkpoint.id)
    useCharacterStore.getState().selectComparison(checkpoint.id); await flush()
    expect(await db.bodyMeasurements.toArray()).toEqual(before)
    useCharacterStore.getState().selectMeasurement(null); await flush()
    expect(useCharacterStore.getState().selectedMeasurementId).toBeNull()
  })
  it('awards workout XP without changing any measurement, mapped physique or customization', async () => {
    const character = useCharacterStore.getState().character
    const before = resolveEvolution(character, [checkpoint], null, {}, null).morph
    await db.saveWorkout(sessionRow())
    expect((await db.users.get('local-user'))?.currentXp).toBeGreaterThan(0)
    expect(resolveEvolution(character, await db.bodyMeasurements.toArray(), null, {}, null).morph).toEqual(before)
    expect((await db.bodyMeasurements.get(checkpoint.id))?.smmKg).toBe(35)
    expect((await db.characterStates.get(character.id))?.currentBody).toEqual(character.currentBody)
  })
  it('rejects malformed appearance and morph inputs in backups/services without modifying current records', async () => {
    const character = defaultCharacter()
    await expect(db.putEntity('characterStates', { ...character, appearance: { ...appearancePresets.forge, skinColor: 'red' } })).rejects.toThrow()
    await expect(db.putEntity('characterStates', { ...character, currentBody: { ...character.currentBody, overallVolume: 2 } })).rejects.toThrow()
    const backup = await db.exportFullBackup()
    await expect(db.importBackup({ ...backup, characterStates: [{ ...character, appearance: { ...appearancePresets.forge, clothing: 'invalid' } }] })).rejects.toThrow()
    expect((await db.characterStates.get(character.id))?.appearance).toBeUndefined()
  })
  it('round trips extended customization in JSON while retaining legacy character compatibility', async () => {
    useCharacterStore.getState().setAppearancePreset('guardian'); useCharacterStore.getState().updateGoalBody({ overallVolume: 0.75 }); await flush()
    const backup = JSON.parse(JSON.stringify(await db.exportFullBackup()))
    const restored = new FitForgeDatabase(`character-restore-${crypto.randomUUID()}`)
    try {
      await restored.importBackup(backup)
      expect((await restored.characterStates.get(defaultCharacter().id))?.appearance).toEqual(appearancePresets.guardian)
      expect((await restored.characterStates.get(defaultCharacter().id))?.goalBody.overallVolume).toBe(0.75)
    } finally { await restored.delete() }
  })
})
