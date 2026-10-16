export type CharacterMode = 'current' | 'goal'

export interface BodyMorphParameters {
  heightCm: number
  fatMorph: number // Artistic 0–1 proxy, not a measured body-fat percentage.
  muscleMorph: number // Artistic 0–1 proxy, not an anatomical muscle measurement.
  chestWidth: number // multiplier e.g. 0.8 - 1.4
  shoulderWidth: number // multiplier e.g. 0.8 - 1.4
  waistWidth: number // multiplier e.g. 0.7 - 1.3
  armThickness: number // multiplier e.g. 0.8 - 1.5
  legThickness: number // multiplier e.g. 0.8 - 1.5
  definition: number // 0 to 1 muscle cuts
  overallVolume?: number
  upperBodyMuscle?: number
  lowerBodyMuscle?: number
  armProportion?: number
  legProportion?: number
  trunkProportion?: number
}

export interface CharacterAppearance {
  preset: 'forge' | 'scout' | 'guardian'
  skinColor: string
  clothingColor: string
  accentColor: string
  clothing: 'training' | 'suit' | 'shorts'
}

export interface CharacterEquipment {
  headgear?: string
  wristWraps?: string
  liftingBelt?: string
  kneeSleeves?: string
  auraColor?: string
}

export interface CharacterState {
  id: string
  userId: string
  mode: CharacterMode
  currentBody: BodyMorphParameters
  goalBody: BodyMorphParameters
  equippedGear: CharacterEquipment
  auraUnlocked: boolean
  unlockedSkins: string[]
  visualSource?: 'measurement' | 'manual'
  appearance?: CharacterAppearance
}
