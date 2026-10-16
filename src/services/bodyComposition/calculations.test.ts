import { describe, expect, it } from 'vitest'
import type { BodyMeasurement, DeviceReference } from '@/types/inbody'
import { calculateBMI, calculateBodyFatMass, calculateFatFreeMass, classifyMetric, compareMeasurements, composition } from './calculations'
import { validateMeasurement } from './validation'
import { BodyCompositionToAvatar, goalMeasurement, mapCurrentAndGoal } from './BodyCompositionToAvatar'
import { mockGoal } from '@/mock'

export const measurementRow = (overrides: Partial<BodyMeasurement> = {}): BodyMeasurement => ({
  id: 'body-real', measurementVersion: 3, date: '2026-10-12', heightCm: 175, weightKg: 80,
  smmKg: 35, pbfPercent: 20, bodyFatMassKg: 16, ...overrides,
})
const reference: DeviceReference = { min: 30, max: 40, unit: 'kg', label: 'Device interval from my report', scope: 'individual' }
describe('body composition arithmetic and provenance', () => {
  it('calculates BMI using metres and keeps full precision', () => { expect(calculateBMI(80, 175)).toBeCloseTo(26.1224489796, 8) })
  it('returns unavailable for arithmetic overflow', () => { expect(calculateBMI(80, Number.MIN_VALUE)).toBeNull() })
  it('calculates fat mass and fat-free mass without estimating SMM', () => {
    expect(calculateBodyFatMass(80, 20)).toBe(16); expect(calculateFatFreeMass(80, 16)).toBe(64)
    expect(calculateBodyFatMass(80, 0)).toBe(0); expect(calculateBodyFatMass(80, 100)).toBe(80)
  })
  it.each([undefined, null, NaN, Infinity, -1, 0])('does not calculate BMI from invalid weight %s', value => { expect(calculateBMI(value, 175)).toBeNull() })
  it.each([undefined, null, NaN, Infinity, -1, 0])('does not calculate BMI from invalid height %s', value => { expect(calculateBMI(80, value)).toBeNull() })
  it('handles invalid percentages and fat mass', () => {
    expect(calculateBodyFatMass(80, 101)).toBeNull(); expect(calculateBodyFatMass(80, -1)).toBeNull()
    expect(calculateBodyFatMass(80, null)).toBeNull(); expect(calculateBodyFatMass(0, 20)).toBeNull()
    expect(calculateFatFreeMass(80, 81)).toBeNull(); expect(calculateFatFreeMass(80, -1)).toBeNull()
    expect(calculateFatFreeMass(null, 10)).toBeNull(); expect(calculateFatFreeMass(80, Infinity)).toBeNull()
  })
  it('preserves device fat mass and BMI alongside independent derived values', () => {
    const original = measurementRow({ bmi: 25, bodyFatMassKg: 17 })
    expect(composition(original)).toMatchObject({ calculatedFatMass: 16, fatFreeMass: 63, fatFreeMassBasis: 'device' })
    expect(original.bmi).toBe(25); expect(original.bodyFatMassKg).toBe(17)
    expect(composition({ ...original, bodyFatMassKg: null }).fatFreeMassBasis).toBe('calculated')
  })
  it('does not replace absent height with a reported legacy BMI', () => {
    expect(composition(measurementRow({ heightCm: undefined, bmi: 25 })).bmi).toBeNull()
  })
  it('compares all five metrics without treating missing data as zero', () => {
    const previous = measurementRow({ weightKg: 75, smmKg: 32, pbfPercent: 22, bodyFatMassKg: 16.5 })
    const delta = compareMeasurements(measurementRow(), previous)
    expect(delta).toMatchObject({ weightKg: 5, smmKg: 3, pbfPercent: -2, bodyFatMassKg: -0.5 })
    expect(delta.bmi).toBeCloseTo(5 / 1.75 ** 2)
    expect(Object.values(compareMeasurements(measurementRow(), null)).every(v => v === null)).toBe(true)
    expect(compareMeasurements(measurementRow({ smmKg: null }), previous).smmKg).toBeNull()
  })
})
describe('measurement validation', () => {
  it('accepts complete and explicitly unavailable core fields', () => {
    expect(() => validateMeasurement(measurementRow())).not.toThrow()
    expect(() => validateMeasurement(measurementRow({ heightCm: null, smmKg: null, pbfPercent: null, bodyFatMassKg: null }))).not.toThrow()
  })
  it('accepts absent height in a legacy record without fabricating it', () => {
    const legacy = measurementRow({ measurementVersion: undefined, heightCm: undefined })
    validateMeasurement(legacy); expect(legacy.heightCm).toBeUndefined()
  })
  it.each([
    { weightKg: 0 }, { heightCm: -175 }, { heightCm: 251 }, { smmKg: 81 }, { pbfPercent: 101 },
    { bodyFatMassKg: -1 }, { bmrKcal: 0 }, { weightKg: NaN }, { pbfPercent: Infinity }, { heightCm: undefined },
    { date: '2026-02-30' }, { date: '' }, { id: '' }, { notes: 123 }, { weightKg: '80' },
    { heightCm: null, weightKg: null, smmKg: null, pbfPercent: null, bodyFatMassKg: null },
    { segmentalLean: { leftArmKg: 81 } }, { segmentalLean: { trunkPercent: 301 } }, { segmentalLean: { unsupported: 1 } },
    { references: { smmKg: { ...reference, unit: '%' } } }, { references: { smmKg: { ...reference, max: 29 } } },
    { references: { smmKg: { ...reference, min: NaN } } }, { references: { smmKg: { ...reference, label: '' } } },
    { references: { unknown: reference } }, { unexpected: true },
  ])('rejects invalid input %j', overrides => { expect(() => validateMeasurement({ ...measurementRow(), ...overrides })).toThrow() })
  it('accepts partial segmental mass without percentages and validated references', () => {
    expect(() => validateMeasurement(measurementRow({ segmentalLean: { leftArmKg: 3 }, references: { smmKg: reference } }))).not.toThrow()
  })
})
describe('independent device reference classification', () => {
  it.each([[29, 'low'], [30, 'normal'], [35, 'normal'], [40, 'normal'], [41, 'high']] as const)('classifies %s as %s using the stated interval', (value, expected) => {
    expect(classifyMetric('smmKg', value, reference).status).toBe(expected)
    expect(classifyMetric('smmKg', value, reference).explanation).toContain('30–40 kg')
  })
  it('does not invent a classification without a valid metric-specific range', () => {
    expect(classifyMetric('smmKg', 35).status).toBe('unclassified')
    expect(classifyMetric('pbfPercent', 35, reference).status).toBe('unclassified')
    expect(classifyMetric('smmKg', null, reference).status).toBe('unclassified')
    expect(classifyMetric('smmKg', 35, { ...reference, min: 41 }).status).toBe('unclassified')
  })
  it('blocks adult references for minors and unknown ages', () => {
    const adult = { ...reference, scope: 'adult' as const }
    for (const age of [17, 0, undefined, null]) expect(classifyMetric('smmKg', 35, adult, age).status).toBe('unclassified')
    expect(classifyMetric('smmKg', 35, adult, 18).status).toBe('normal')
    expect(classifyMetric('smmKg', 35, reference, 17).status).toBe('normal')
  })
})
describe('approximate avatar mapping', () => {
  it('returns safe normalized outputs and render parameters for extreme and missing inputs', () => {
    for (const input of [null, measurementRow(), measurementRow({ heightCm: null, weightKg: null, smmKg: null, pbfPercent: null }), measurementRow({ weightKg: 1000, heightCm: 40, smmKg: 900, pbfPercent: 100 }), measurementRow({ heightCm: Infinity, weightKg: NaN })]) {
      const result = BodyCompositionToAvatar(input)
      for (const value of Object.values(result.normalized)) { expect(Number.isFinite(value)).toBe(true); expect(value).toBeGreaterThanOrEqual(0); expect(value).toBeLessThanOrEqual(1) }
      expect(result.renderParameters.heightCm).toBeGreaterThanOrEqual(80); expect(result.renderParameters.heightCm).toBeLessThanOrEqual(250)
      for (const key of ['chestWidth', 'shoulderWidth', 'waistWidth', 'armThickness', 'legThickness'] as const) { expect(result.renderParameters[key]).toBeGreaterThanOrEqual(0.5); expect(result.renderParameters[key]).toBeLessThanOrEqual(2) }
      expect(result.approximate).toBe(true)
    }
  })
  it('uses neutral parameters for missing inputs and never derives SMM from BMI', () => {
    const input = measurementRow({ smmKg: null, bmi: 60, segmentalLean: undefined })
    const result = BodyCompositionToAvatar(input)
    expect(result.renderParameters.muscleMorph).toBe(0.5); expect(result.missing).toContain('smmKg')
    expect(result.normalized.arms).toBe(0.5)
  })
  it('uses available segmental lean tissue as an artistic ratio', () => {
    const input = measurementRow({ segmentalLean: { leftArmKg: 3, rightArmKg: 4, leftLegKg: 9, rightLegKg: 10, trunkKg: 25 } })
    const result = BodyCompositionToAvatar(input)
    expect(result.normalized.arms).toBeCloseTo(7 / 80 / 0.16)
    expect(result.normalized.legs).toBeCloseTo(19 / 80 / 0.5)
    expect(result.missing).not.toContain('segmentalLean.arms')
  })
  it('keeps current and goal independent and does not mutate source/customization', () => {
    const input = measurementRow(); const original = structuredClone(input)
    const goal = { ...mockGoal, id: 'real-goal', targetWeightKg: 70, targetSmmKg: 33, targetPbfPercent: 15 }
    const mapped = mapCurrentAndGoal(input, goal)
    expect(mapped.current.mode).toBe('current'); expect(mapped.goal.mode).toBe('goal')
    expect(mapped.current.sourceId).toBe(input.id); expect(mapped.goal.sourceId).toBe(goal.id)
    expect(mapped.current.normalized.bodyFat).not.toBe(mapped.goal.normalized.bodyFat)
    expect(mapped.goal.missing).toContain('segmentalLean.arms'); expect(input).toEqual(original)
    expect(goalMeasurement(goal, input)?.bodyFatMassKg).toBe(10.5)
    expect(goalMeasurement({ ...goal, targetPbfPercent: 0 }, input)?.pbfPercent).toBeNull()
  })
})
