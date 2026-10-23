import { describe, expect, it } from 'vitest'

import { athleteInfluences, athleteStyles } from './athlete'
import { mappedMorph } from './evolution'
import { BodyCompositionToAvatar } from '@/services/bodyComposition/BodyCompositionToAvatar'
import { validateEntity } from '@/services/db/validation'
import { defaultCharacter } from '@/services/db/defaults'

describe('athlete checkpoint integration', () => {
  it('updates fat and muscle proxies from saved checkpoints without modifying source measurements', () => {
    const earlier = { id: 'a', date: '2026-10-01', heightCm: 175, weightKg: 80, smmKg: 30, pbfPercent: 30 }
    const later = { ...earlier, id: 'b', date: '2026-10-22', smmKg: 37, pbfPercent: 20 }
    const before = structuredClone([earlier, later])
    const from = athleteInfluences(mappedMorph(BodyCompositionToAvatar(earlier)))
    const to = athleteInfluences(mappedMorph(BodyCompositionToAvatar(later)))
    expect(to.Muscle).toBeGreaterThan(from.Muscle)
    expect(to.BodyFat).toBeLessThan(from.BodyFat)
    expect([earlier, later]).toEqual(before)
  })
  it('bounds corrupt and missing inputs before they reach GPU morph weights', () => {
    const input = { ...defaultCharacter().currentBody, muscleMorph: NaN, fatMorph: Infinity, chestWidth: 40, legThickness: -20 }
    for (const value of Object.values(athleteInfluences(input))) {
      expect(Number.isFinite(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThanOrEqual(1)
    }
  })
  it('accepts old appearance records and validates new hair colors for backup compatibility', () => {
    expect(() => validateEntity('characterStates', defaultCharacter())).not.toThrow()
    expect(() => validateEntity('characterStates', { ...defaultCharacter(), appearance: athleteStyles.forge })).not.toThrow()
    expect(() => validateEntity('characterStates', { ...defaultCharacter(), appearance: { ...athleteStyles.forge, hairColor: 'invalid' } })).toThrow()
  })
})


