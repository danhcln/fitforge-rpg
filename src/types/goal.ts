export type GoalCategory = 'muscle_gain' | 'fat_loss' | 'strength' | 'habit'

export interface Goal {
  id: string
  title: string
  category: GoalCategory
  currentWeightKg: number
  targetWeightKg: number
  currentSmmKg: number
  targetSmmKg: number
  currentPbfPercent: number
  targetPbfPercent: number
  targetCaloDaily: number
  targetProteinDailyGrams: number
  targetCarbDailyGrams: number
  targetFatDailyGrams: number
  targetWeeklyWorkouts: number
  deadline: string
  progressPercent: number
  isCompleted: boolean
}

export interface TrainingSplitPlan {
  id: string
  dayIndex: number // 1 to 7
  dayNameVi: string
  splitTitleVi: string
  focusMuscleGroups: string[]
  isRestDay: boolean
  estimatedMinutes: number
}
