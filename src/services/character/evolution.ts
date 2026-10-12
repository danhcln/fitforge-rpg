import type { BodyMeasurement, BodyMorphParameters, CharacterAppearance, CharacterState } from '@/types'
import { BodyCompositionToAvatar, type BodyAvatarMapping } from '@/services/bodyComposition/BodyCompositionToAvatar'

export const appearancePresets: Record<CharacterAppearance['preset'], CharacterAppearance> = {
  forge: { preset: 'forge', skinColor: '#a67758', clothingColor: '#263b50', accentColor: '#14b8a6', clothing: 'training' },
  scout: { preset: 'scout', skinColor: '#d4ac85', clothingColor: '#243f35', accentColor: '#a3e635', clothing: 'shorts' },
  guardian: { preset: 'guardian', skinColor: '#72513e', clothingColor: '#443558', accentColor: '#c084fc', clothing: 'suit' },
}
export const normalizedKeys = ['overallVolume', 'upperBodyMuscle', 'lowerBodyMuscle', 'armProportion', 'legProportion', 'trunkProportion'] as const
const neutral: BodyMorphParameters = { heightCm: 175, fatMorph: 0.5, muscleMorph: 0.5, chestWidth: 1, shoulderWidth: 1, waistWidth: 1, armThickness: 1, legThickness: 1, definition: 0.25 }
export function bounded(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, value)) : fallback
}
/** Rendering bounds are artistic, not physiological intervals. Legacy fields remain supported. */
export function clampMorph(input: Partial<BodyMorphParameters> = {}): BodyMorphParameters {
  const result = { ...neutral }
  for (const key of Object.keys(neutral) as (keyof typeof neutral)[]) {
    const limits = key === 'heightCm' ? [80, 250] : ['fatMorph', 'muscleMorph', 'definition'].includes(key) ? [0, 1] : [0.5, 2]
    result[key] = bounded(input[key], limits[0], limits[1], neutral[key]!)
  }
  for (const key of normalizedKeys) result[key] = bounded(input[key], 0, 1, key.includes('Muscle') ? result.muscleMorph : 0.5)
  return result
}
export function mappedMorph(mapping: BodyAvatarMapping): BodyMorphParameters {
  const n = mapping.normalized
  return clampMorph({ ...mapping.renderParameters, overallVolume: n.overallVolume, upperBodyMuscle: n.upperBodyMuscle,
    lowerBodyMuscle: n.lowerBodyMuscle, armProportion: n.arms, legProportion: n.legs, trunkProportion: n.trunk })
}
export function smoothMorph(current: BodyMorphParameters, target: BodyMorphParameters, deltaSeconds: number): BodyMorphParameters {
  const from = clampMorph(current), to = clampMorph(target)
  const alpha = 1 - Math.exp(-8 * bounded(deltaSeconds, 0, 0.1, 0))
  for (const key of Object.keys(to) as (keyof BodyMorphParameters)[]) from[key] = from[key]! + (to[key]! - from[key]!) * alpha
  return from
}
export function orderedMeasurements(rows: BodyMeasurement[]): BodyMeasurement[] {
  return rows.filter(row => (row as BodyMeasurement & { source?: string }).source !== 'demo').sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
}
export function resolveMeasurement(rows: BodyMeasurement[], id: string | null): BodyMeasurement | null {
  const ordered = orderedMeasurements(rows)
  return ordered.find(row => row.id === id) ?? ordered.at(-1) ?? null
}
export function resolveEvolution(character: CharacterState, measurements: BodyMeasurement[], selectedId: string | null,
  goalBodies: Record<string, BodyAvatarMapping>, selectedGoalId: string | null) {
  const measurement = resolveMeasurement(measurements, selectedId)
  const mapping = character.mode === 'goal' ? (selectedGoalId ? goalBodies[selectedGoalId] : undefined) ?? BodyCompositionToAvatar(null, 'goal') : BodyCompositionToAvatar(measurement)
  const manual = character.visualSource === 'manual'
  return { measurement, mapping, manual, morph: manual ? clampMorph(character.mode === 'goal' ? character.goalBody : character.currentBody) : mappedMorph(mapping),
    appearance: character.appearance ?? appearancePresets.forge }
}
