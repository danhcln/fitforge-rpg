import type { WorkoutSession, BodyMeasurement } from '@/types'
import { levelFromXp } from '@/services/rpg/calculations'

export interface AvatarProgressionMetrics {
  totalSessions: number
  totalVolumeKg: number
  totalXp: number
  rpgLevel: number
  splitBreakdown: {
    pushVolumeKg: number
    pullVolumeKg: number
    legsVolumeKg: number
    otherVolumeKg: number
  }
  measurementsCount: number
  latestWeightKg?: number | null
  latestSmmKg?: number | null
  latestPbfPercent?: number | null
  autoProgressionEnabled: boolean
  adapterStatus: 'active_manual_mode' | 'progression_disabled'
  note: string
}

/**
 * Extracts and adapts workout and RPG progression data for avatar visualization.
 * Per specification: Automatic body deformation based on workout count is disabled,
 * preserving manual control while keeping the adapter architecture ready.
 */
export function extractAvatarProgressionData(
  sessions: WorkoutSession[] = [],
  measurements: BodyMeasurement[] = [],
  currentXp = 0,
): AvatarProgressionMetrics {
  let totalVolumeKg = 0
  let pushVolumeKg = 0
  let pullVolumeKg = 0
  let legsVolumeKg = 0
  let otherVolumeKg = 0

  for (const session of sessions) {
    const vol = session.totalVolumeKg || 0
    totalVolumeKg += vol

    const split = (session.splitType || session.name || '').toLowerCase()
    if (split.includes('push') || split.includes('ngực') || split.includes('vai') || split.includes('tay sau')) {
      pushVolumeKg += vol
    } else if (split.includes('pull') || split.includes('lưng') || split.includes('xô') || split.includes('tay trước')) {
      pullVolumeKg += vol
    } else if (split.includes('leg') || split.includes('chân') || split.includes('đùi') || split.includes('mông')) {
      legsVolumeKg += vol
    } else {
      otherVolumeKg += vol
    }
  }

  const { level: rpgLevel } = levelFromXp(currentXp)
  const sortedMeasurements = [...measurements].sort((a, b) => b.date.localeCompare(a.date))
  const latest = sortedMeasurements[0]

  return {
    totalSessions: sessions.length,
    totalVolumeKg: Math.round(totalVolumeKg),
    totalXp: currentXp,
    rpgLevel,
    splitBreakdown: {
      pushVolumeKg: Math.round(pushVolumeKg),
      pullVolumeKg: Math.round(pullVolumeKg),
      legsVolumeKg: Math.round(legsVolumeKg),
      otherVolumeKg: Math.round(otherVolumeKg),
    },
    measurementsCount: measurements.length,
    latestWeightKg: latest?.weightKg,
    latestSmmKg: latest?.smmKg,
    latestPbfPercent: latest?.pbfPercent,
    autoProgressionEnabled: false, // Explicitly disabled per requirements
    adapterStatus: 'active_manual_mode',
    note: 'Tiến trình tự động dựa trên số buổi tập đang tạm tắt để ưu tiên kiểm thử thủ công và bảo toàn tính toàn vẹn dữ liệu.',
  }
}
