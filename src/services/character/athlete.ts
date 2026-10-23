import type { BodyMorphParameters, CharacterAppearance } from '@/types'
import { clampMorph } from './evolution'

export const ATHLETE_MODEL = '/models/fitforge_athlete.glb'
export const ATHLETE_MODEL_ID = 'fitforge-athlete-v1'
export const athleteStyles = {
  forge: { preset: 'forge', skinColor: '#b98966', hairColor: '#30231e', clothingColor: '#15b8a6', accentColor: '#ff8a3d', clothing: 'training' },
  scout: { preset: 'scout', skinColor: '#d4ac85', hairColor: '#573c26', clothingColor: '#527e39', accentColor: '#d5e879', clothing: 'training' },
  guardian: { preset: 'guardian', skinColor: '#865b42', hairColor: '#211e26', clothingColor: '#8768d0', accentColor: '#f4b7d2', clothing: 'training' },
} satisfies Record<string, CharacterAppearance>
export const athleteControls = [
  { key: 'muscleMorph', label: 'Cơ tổng thể', target: 'Muscle', min: 0, max: 1 },
  { key: 'fatMorph', label: 'Mỡ cơ thể', target: 'BodyFat', min: 0, max: 1 },
  { key: 'chestWidth', label: 'Vai & ngực', target: 'Chest', min: .75, max: 1.25 },
  { key: 'legThickness', label: 'Cơ chân', target: 'Legs', min: .75, max: 1.25 },
] as const

/** Artistic render proxies; XP and workout counts never enter this mapping. */
export function athleteInfluences(input: BodyMorphParameters): Record<string, number> {
  const m = clampMorph(input)
  return Object.fromEntries(athleteControls.map(control => [control.target,
    Math.max(0, Math.min(1, (m[control.key] - control.min) / (control.max - control.min)))]))
}

export const athletePresets: Record<string, { label: string; morph: Partial<BodyMorphParameters> }> = {
  light: { label: 'Gọn nhẹ', morph: { muscleMorph: 0, fatMorph: .08, chestWidth: .75, legThickness: .75 } },
  balanced: { label: 'Cân đối', morph: { muscleMorph: .35, fatMorph: .18, chestWidth: .95, legThickness: .95 } },
  strong: { label: 'Khỏe khoắn', morph: { muscleMorph: .8, fatMorph: .12, chestWidth: 1.17, legThickness: 1.12 } },
}
