import type { BodyMeasurement } from '@/types/inbody'
import type { Goal } from '@/types/goal'
import type { BodyMorphParameters } from '@/types/character'
import { available, calculateBodyFatMass } from './calculations'

export interface AvatarComposition {
  overallVolume: number
  upperBodyMuscle: number
  lowerBodyMuscle: number
  bodyFat: number
  arms: number
  legs: number
  trunk: number
}
export interface BodyAvatarMapping {
  version: 1
  mode: 'current' | 'goal'
  sourceId: string | null
  normalized: AvatarComposition
  renderParameters: BodyMorphParameters
  missing: string[]
  approximate: true
}
const clamp = (value: number) => Number.isFinite(value) ? Math.max(0, Math.min(1, value)) : 0.5
/** Artistic scales, not physiological norms or classifications. See docs/BODY_COMPOSITION.md. */
export function BodyCompositionToAvatar(input?: BodyMeasurement | null, mode: 'current' | 'goal' = 'current'): BodyAvatarMapping {
  const missing: string[] = []
  const normalizedValue = (key: string, value: number | null | undefined, divisor: number) => {
    if (!available(value) || value < 0) { missing.push(key); return 0.5 }
    return clamp(value / divisor)
  }
  const weight = input?.weightKg
  const height = input?.heightCm
  const ratio = (value?: number | null) => available(value) && value >= 0 && available(weight) && weight > 0 ? value / weight : null
  const pair = (a?: number | null, b?: number | null) => available(a) && available(b) && a >= 0 && b >= 0 ? a + b : null
  // Mass/height³ is an artistic size proxy only; it never estimates SMM.
  const volume = available(weight) && weight > 0 && available(height) && height > 0 ? weight / (height / 100) ** 3 : null
  const muscle = normalizedValue('smmKg', ratio(input?.smmKg), 0.7)
  const arms = normalizedValue('segmentalLean.arms', ratio(pair(input?.segmentalLean?.leftArmKg, input?.segmentalLean?.rightArmKg)), 0.16)
  const legs = normalizedValue('segmentalLean.legs', ratio(pair(input?.segmentalLean?.leftLegKg, input?.segmentalLean?.rightLegKg)), 0.5)
  const trunk = normalizedValue('segmentalLean.trunk', ratio(input?.segmentalLean?.trunkKg), 0.65)
  const normalized: AvatarComposition = {
    overallVolume: normalizedValue('height/weight', volume, 30), bodyFat: normalizedValue('pbfPercent', input?.pbfPercent, 60),
    // Segmental lean reflects all lean tissue, not an exact local muscle measurement.
    upperBodyMuscle: clamp((muscle + arms + trunk) / 3), lowerBodyMuscle: clamp((muscle + legs) / 2), arms, legs, trunk,
  }
  const dimensions = (v: number) => 0.75 + v * 0.5
  return { version: 1, mode, sourceId: input?.id ?? null, normalized, missing, approximate: true,
    renderParameters: {
      heightCm: available(height) && height > 0 ? Math.max(80, Math.min(250, height)) : 175,
      fatMorph: normalized.bodyFat, muscleMorph: muscle, chestWidth: dimensions(trunk), shoulderWidth: dimensions(normalized.upperBodyMuscle),
      waistWidth: dimensions((normalized.bodyFat + normalized.overallVolume) / 2), armThickness: dimensions(arms), legThickness: dimensions(legs),
      definition: clamp(muscle * (1 - normalized.bodyFat)),
    } }
}
export function goalMeasurement(goal: Goal | null | undefined, current?: BodyMeasurement | null): BodyMeasurement | null {
  if (!goal) return null
  // Zero in legacy goal fields means unset, not a predicted value or zero body fat.
  const target = (value: number) => available(value) && value > 0 ? value : null
  return { id: goal.id, date: goal.deadline, heightCm: current?.heightCm ?? null,
    weightKg: target(goal.targetWeightKg), smmKg: target(goal.targetSmmKg), pbfPercent: target(goal.targetPbfPercent),
    bodyFatMassKg: calculateBodyFatMass(target(goal.targetWeightKg), target(goal.targetPbfPercent)) }
}
export function mapCurrentAndGoal(current?: BodyMeasurement | null, goal?: Goal | null) {
  return { current: BodyCompositionToAvatar(current), goal: BodyCompositionToAvatar(goalMeasurement(goal, current), 'goal') }
}
