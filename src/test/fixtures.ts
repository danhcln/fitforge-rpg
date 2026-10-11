import type { WorkoutSession, WorkoutSet } from '@/types'
export function setRow(weightKg = 60, reps = 10, completed = true): WorkoutSet {
  return { id: crypto.randomUUID(), setNumber: 1, weightKg, reps, completed }
}
export function sessionRow(sets = [setRow()], id: string = crypto.randomUUID()): WorkoutSession {
  return { id, name: 'Test workout', splitType: 'Push', date: '2026-10-11', durationMinutes: 60, totalVolumeKg: 0, xpEarned: 0,
    startedAt: Date.now(), status: 'completed', source: 'real', exercises: [{ exerciseId: 'ex_bench_press', exerciseName: 'Bench', muscleGroup: 'Ngực', sets }] }
}
