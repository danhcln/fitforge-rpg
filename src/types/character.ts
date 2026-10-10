export type CharacterMode = 'current' | 'goal'

export interface BodyMorphParameters {
  heightCm: number
  fatMorph: number // 0 (lean 6%) to 1 (high fat 35%)
  muscleMorph: number // 0 (low muscle) to 1 (hypertrophy max)
  chestWidth: number // multiplier e.g. 0.8 - 1.4
  shoulderWidth: number // multiplier e.g. 0.8 - 1.4
  waistWidth: number // multiplier e.g. 0.7 - 1.3
  armThickness: number // multiplier e.g. 0.8 - 1.5
  legThickness: number // multiplier e.g. 0.8 - 1.5
  definition: number // 0 to 1 muscle cuts
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
}
