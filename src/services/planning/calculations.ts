import type { Exercise, NutritionEntry, NutritionSettings, PlannedDay, SplitKind, TrainingPlan, WorkoutSession } from '@/types'
import { shiftDate, weekStart } from '@/services/rpg/calculations'

const presets: Record<SplitKind, (string | null)[]> = {
  'full-body': ['Full Body', null, 'Full Body', null, 'Full Body', null, null],
  'upper-lower': ['Upper', 'Lower', null, 'Upper', 'Lower', null, null],
  ppl: ['Push', null, 'Pull', null, 'Legs', null, null],
  custom: [null, null, null, null, null, null, null],
}
export const splitLabels: Record<SplitKind, string> = { 'full-body': 'Full Body', 'upper-lower': 'Upper / Lower', ppl: 'Push / Pull / Legs', custom: 'Tùy chỉnh' }
export function createWeek(userId: string, date: string, split: SplitKind): TrainingPlan {
  const start = weekStart(date)
  return { id: `plan:${userId}:${start}`, userId, weekStart: start, split, days: presets[split].map((title, i) => ({ date: shiftDate(start, i), title: title ?? 'Nghỉ ngơi', isRestDay: title === null, exercises: [], completedSessionId: null })) }
}
export function dayStatus(day: PlannedDay, sessions: WorkoutSession[]): 'rest' | 'completed' | 'scheduled' {
  if (day.isRestDay) return 'rest'
  return sessions.some(s => s.id === day.completedSessionId && s.date === day.date && s.source !== 'demo' && s.status !== 'draft') ? 'completed' : 'scheduled'
}
export function plannedDraft(plan: TrainingPlan, dayIndex: number, exercises: Exercise[]): WorkoutSession {
  const day = plan.days[dayIndex]
  if (!day || day.isRestDay || !day.exercises.length) throw new Error('Chọn bài tập cho ngày tập trước khi mở bản nháp.')
  return { id: crypto.randomUUID(), date: day.date, name: day.title, splitType: splitLabels[plan.split], planId: plan.id, plannedDate: day.date, durationMinutes: 0, totalVolumeKg: 0, xpEarned: 0, status: 'draft', source: 'real', startedAt: Date.now(),
    exercises: day.exercises.map(ex => {
      const definition = exercises.find(e => e.id === ex.exerciseId)
      if (!definition) throw new Error('Bài tập không tồn tại.')
      return { exerciseId: definition.id, exerciseName: definition.nameVi, muscleGroup: definition.muscleGroup, sets: Array.from({ length: ex.sets }, (_, i) => ({ id: crypto.randomUUID(), setNumber: i + 1, weightKg: ex.weightKg, reps: ex.reps, completed: false })) }
    }) }
}
/** Optional suggestion only; never applied without an explicit UI action. */
export function overloadSuggestion(exerciseId: string, sessions: WorkoutSession[]): { weightKg: number; reps: number; explanation: string } | null {
  const relevant = sessions.filter(s => s.source !== 'demo' && s.status !== 'draft').sort((a, b) => b.date.localeCompare(a.date) || (b.startedAt ?? 0) - (a.startedAt ?? 0))
    .flatMap(s => { const ex = s.exercises.find(e => e.exerciseId === exerciseId); const sets = ex?.sets.filter(x => x.completed && !x.isWarmup) ?? []; return sets.length ? [sets] : [] }).slice(0, 2)
  if (relevant.length < 2) return null
  const [latest, previous] = relevant
  const consistent = latest.every(s => s.weightKg === latest[0].weightKg && s.reps >= latest[0].reps) && previous.every(s => s.weightKg === latest[0].weightKg && s.reps >= latest[0].reps)
  if (!consistent || latest[0].reps >= 30) return null
  return { weightKg: latest[0].weightKg, reps: latest[0].reps + 1, explanation: 'Hai buổi có tải và số lần ổn định: có thể thử thêm 1 lần với cùng tải nếu thoải mái. Có thể giữ nguyên hoặc nghỉ; đây không phải chỉ định.' }
}
export function nutritionSummary(rows: NutritionEntry[]) {
  const foods = rows.filter(r => r.meal !== 'hydration')
  const sum = (field: 'proteinGrams' | 'carbGrams' | 'fatGrams' | 'energyKcal') => foods.filter(r => r[field] !== null).reduce((n, r) => n + r[field]!, 0)
  return { foods: foods.length, proteinGrams: sum('proteinGrams'), carbGrams: sum('carbGrams'), fatGrams: sum('fatGrams'), energyKcal: sum('energyKcal'), waterMl: rows.reduce((n, r) => n + r.waterMl, 0),
    incompleteFoods: foods.filter(r => [r.proteinGrams, r.carbGrams, r.fatGrams].includes(null)).length, energyEntries: foods.filter(r => r.energyKcal !== null).length }
}
export const energyAllowed = (settings?: NutritionSettings) => !!settings && settings.ageYears !== null && settings.ageYears >= 18 && settings.energyEnabled
export const defaultNutritionSettings = (userId: string): NutritionSettings => ({ id: `nutrition:${userId}`, userId, ageYears: null, energyEnabled: false, hydrationReminder: true })
