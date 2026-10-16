export interface ProgressionEvent {
  id: string
  userId: string
  kind: 'baseline' | 'workout' | 'quest' | 'achievement' | 'adjustment'
  sourceId: string
  revision: number
  xpDelta: number
  goldDelta: number
  at: string
}
export type SplitKind = 'full-body' | 'upper-lower' | 'ppl' | 'custom'
export interface PlannedExercise { exerciseId: string; sets: number; reps: number; weightKg: number }
export interface PlannedDay { date: string; title: string; isRestDay: boolean; exercises: PlannedExercise[]; completedSessionId: string | null }
export interface TrainingPlan { id: string; userId: string; weekStart: string; split: SplitKind; days: PlannedDay[] }
export interface NutritionEntry {
  id: string; userId: string; date: string; meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'hydration'
  name: string; portion: string
  proteinGrams: number | null; carbGrams: number | null; fatGrams: number | null; energyKcal: number | null; waterMl: number
}
export interface NutritionSettings { id: string; userId: string; ageYears: number | null; energyEnabled: boolean; hydrationReminder: boolean }
