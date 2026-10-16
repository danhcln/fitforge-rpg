import { describe, it, expect } from 'vitest'
import { extractAvatarProgressionData } from './avatarProgressionAdapter'
import type { WorkoutSession, BodyMeasurement } from '@/types'

describe('avatarProgressionAdapter', () => {
  it('aggregates workout sessions and split volumes correctly', () => {
    const mockSessions: WorkoutSession[] = [
      {
        id: '1',
        date: '2026-03-01',
        name: 'Push Day A',
        splitType: 'Push',
        durationMinutes: 45,
        totalVolumeKg: 5000,
        xpEarned: 150,
        status: 'completed',
        source: 'real',
        exercises: [],
      },
      {
        id: '2',
        date: '2026-03-02',
        name: 'Pull Day A',
        splitType: 'Pull',
        durationMinutes: 50,
        totalVolumeKg: 6000,
        xpEarned: 160,
        status: 'completed',
        source: 'real',
        exercises: [],
      },
      {
        id: '3',
        date: '2026-03-03',
        name: 'Leg Day',
        splitType: 'Legs',
        durationMinutes: 60,
        totalVolumeKg: 8000,
        xpEarned: 200,
        status: 'completed',
        source: 'real',
        exercises: [],
      },
    ]

    const mockMeasurements: BodyMeasurement[] = [
      {
        id: 'm1',
        date: '2026-03-01',
        weightKg: 72.5,
        smmKg: 35.0,
        pbfPercent: 14.5,
      },
    ]

    const result = extractAvatarProgressionData(mockSessions, mockMeasurements, 510)

    expect(result.totalSessions).toBe(3)
    expect(result.totalVolumeKg).toBe(19000)
    expect(result.splitBreakdown.pushVolumeKg).toBe(5000)
    expect(result.splitBreakdown.pullVolumeKg).toBe(6000)
    expect(result.splitBreakdown.legsVolumeKg).toBe(8000)
    expect(result.measurementsCount).toBe(1)
    expect(result.latestWeightKg).toBe(72.5)
    expect(result.latestSmmKg).toBe(35.0)
    expect(result.latestPbfPercent).toBe(14.5)
    expect(result.autoProgressionEnabled).toBe(false)
  })

  it('handles empty sessions and measurements gracefully', () => {
    const result = extractAvatarProgressionData([], [], 0)
    expect(result.totalSessions).toBe(0)
    expect(result.totalVolumeKg).toBe(0)
    expect(result.latestWeightKg).toBeUndefined()
    expect(result.autoProgressionEnabled).toBe(false)
  })
})
