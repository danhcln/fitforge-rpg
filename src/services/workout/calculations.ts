import type { PersonalRecord, WorkoutSession, WorkoutSet } from '@/types'

export function validateSet(set: WorkoutSet): void {
  if (!Number.isFinite(set.weightKg) || set.weightKg < 0 || set.weightKg > 2000 ||
    !Number.isInteger(set.reps) || set.reps < 1 || set.reps > 1000 ||
    !Number.isInteger(set.setNumber) || set.setNumber < 1 ||
    typeof set.completed !== 'boolean' || !set.id ||
    (set.rpe !== undefined && (!Number.isFinite(set.rpe) || set.rpe < 1 || set.rpe > 10))) {
    throw new Error('Hiệp tập cần trọng lượng 0–2000 kg, số lần nguyên 1–1000 và RPE 1–10.')
  }
}

export function trainingVolume(sets: WorkoutSet[]): number {
  return sets.reduce((total, set) => {
    validateSet(set)
    return total + (set.completed ? set.weightKg * set.reps : 0)
  }, 0)
}

/** Epley estimate only for 1–10 reps; zero-load exercises have no estimate. */
export function estimatedOneRepMax(weightKg: number, reps: number): number | null {
  if (!Number.isFinite(weightKg) || weightKg <= 0 || weightKg > 2000 ||
    !Number.isInteger(reps) || reps < 1 || reps > 10) return null
  return weightKg * (1 + reps / 30)
}

export function validateWorkout(session: WorkoutSession, requireCompleted = true): void {
  if (!session.id || !session.name.trim() || session.name.length > 200 || !session.splitType.trim() ||
    !/^\d{4}-\d{2}-\d{2}$/.test(session.date) ||
    new Date(session.date).toISOString().slice(0, 10) !== session.date ||
    !Number.isFinite(session.durationMinutes) || session.durationMinutes < 0 || session.durationMinutes > 10080 ||
    (requireCompleted && session.exercises.length === 0)) throw new Error('Tên, ngày và bài tập của buổi tập không hợp lệ.')
  const ids = new Set<string>()
  const exercises = new Set<string>()
  let completed = 0
  for (const exercise of session.exercises) {
    if (!exercise.exerciseId || !exercise.exerciseName.trim() || exercises.has(exercise.exerciseId) || (requireCompleted && !exercise.sets.length)) {
      throw new Error('Buổi tập cần bài tập riêng biệt với ít nhất một hiệp.')
    }
    exercises.add(exercise.exerciseId)
    exercise.sets.forEach(set => {
      validateSet(set)
      if (ids.has(set.id)) throw new Error('ID hiệp tập bị trùng.')
      ids.add(set.id)
      if (set.completed) completed++
    })
  }
  if (requireCompleted && !completed) throw new Error('Hoàn thành ít nhất một hiệp trước khi lưu.')
}

/** Rebuild from saved sessions so edits/deletions can lower obsolete records. */
export function calculatePersonalRecords(sessions: WorkoutSession[]): PersonalRecord[] {
  const records = new Map<string, PersonalRecord>()
  for (const session of [...sessions].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))) {
    if (session.source === 'demo' || session.status === 'draft') continue
    for (const exercise of session.exercises) {
      const sets = exercise.sets.filter(s => s.completed)
      const offer = (kind: NonNullable<PersonalRecord['kind']>, value: number, set?: WorkoutSet) => {
        const key = `${exercise.exerciseId}:${kind}${kind === 'reps' ? `:${set?.weightKg}` : ''}`
        if (!records.has(key) || value > (records.get(key)?.value ?? 0)) {
          records.set(key, {
            id: `record:${key}`, exerciseId: exercise.exerciseId, exerciseName: exercise.exerciseName,
            kind, value, weightKg: set?.weightKg, maxWeightKg: set?.weightKg ?? 0,
            reps: set?.reps ?? 0, estimated1RM: set ? estimatedOneRepMax(set.weightKg, set.reps) ?? 0 : 0,
            achievedDate: session.date, sessionId: session.id, source: 'real',
          })
        }
      }
      for (const set of sets) {
        validateSet(set)
        offer('weight', set.weightKg, set)
        offer('reps', set.reps, set)
        const estimate = estimatedOneRepMax(set.weightKg, set.reps)
        if (estimate !== null) offer('estimated1RM', estimate, set)
      }
      if (sets.length) offer('volume', trainingVolume(sets))
    }
  }
  return [...records.values()]
}

export function localDate(): string {
  const date = new Date()
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
