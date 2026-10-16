import { describe, expect, it } from 'vitest'
import { setRow, sessionRow } from '@/test/fixtures'
import { calculatePersonalRecords, estimatedOneRepMax, trainingVolume, validateWorkout } from './calculations'
describe('workout calculations', () => {
  it('sums only completed sets, including warmups and zero load', () => {
    expect(trainingVolume([setRow(60, 10), setRow(70, 5), setRow(99, 20, false), { ...setRow(20, 10), isWarmup: true }, setRow(0, 10)])).toBe(1150)
    expect(trainingVolume([])).toBe(0)
  })
  it('uses Epley for 1–10 integer reps', () => {
    expect(estimatedOneRepMax(60, 10)).toBe(80)
    expect(estimatedOneRepMax(100, 1)).toBeCloseTo(103.3333)
    expect(estimatedOneRepMax(100, 5)).toBeCloseTo(116.6667)
    for (const reps of [0, -1, 11, 2.5, NaN, Infinity]) expect(estimatedOneRepMax(60, reps)).toBeNull()
    for (const weight of [0, -1, NaN, Infinity, 2001]) expect(estimatedOneRepMax(weight, 5)).toBeNull()
  })
  it.each([[-1, 5], [60, 0], [60, -1], [60, 1.5], [NaN, 5], [Infinity, 5], [60, 1001]])('rejects invalid set %s × %s', (weight, reps) => {
    expect(() => trainingVolume([setRow(weight, reps)])).toThrow()
  })
  it('rejects empty, incomplete, duplicate and invalid-date workouts', () => {
    const empty = { ...sessionRow(), exercises: [] }
    expect(() => validateWorkout(empty)).toThrow()
    expect(() => validateWorkout(sessionRow([setRow(10, 10, false)]))).toThrow()
    expect(() => validateWorkout({ ...sessionRow(), name: '  ' })).toThrow()
    expect(() => validateWorkout({ ...sessionRow(), date: '2026-02-30' })).toThrow()
    const row = setRow()
    expect(() => validateWorkout(sessionRow([row, row]))).toThrow()
    expect(() => validateWorkout(empty, false)).not.toThrow()
  })
  it('tracks independent weight, reps-at-weight, volume and estimated 1RM records', () => {
    const a = sessionRow([setRow(100, 2), setRow(60, 10)], 'a')
    const b = sessionRow([setRow(90, 10), setRow(60, 12)], 'b')
    const prs = calculatePersonalRecords([b, a])
    expect(prs.find(r => r.kind === 'weight')?.value).toBe(100)
    expect(prs.find(r => r.kind === 'estimated1RM')?.value).toBe(120)
    expect(prs.find(r => r.kind === 'volume')?.value).toBe(1620)
    expect(prs.find(r => r.kind === 'reps' && r.weightKg === 60)?.value).toBe(12)
    expect(prs.filter(r => r.kind === 'reps')).toHaveLength(3)
    expect(calculatePersonalRecords([a]).find(r => r.kind === 'volume')?.value).toBe(800)
  })
  it('excludes demo/draft/uncompleted sets and keeps the first equal record', () => {
    const a = sessionRow([setRow(50, 5)], 'a')
    const b = sessionRow([setRow(50, 5), setRow(999, 1, false)], 'b')
    const records = calculatePersonalRecords([b, a, { ...sessionRow([setRow(1000, 1)]), source: 'demo' }, { ...sessionRow(), status: 'draft' }])
    expect(records.find(r => r.kind === 'weight')?.value).toBe(50)
    expect(records.find(r => r.kind === 'weight')?.sessionId).toBe('a')
    expect(calculatePersonalRecords([])).toEqual([])
  })
})
