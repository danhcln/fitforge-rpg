export type MuscleGroup = 'Ngực' | 'Lưng' | 'Chân' | 'Vai' | 'Tay' | 'Bụng' | 'Toàn thân'
export type EquipmentType = 'Tạ đơn' | 'Tạ đòn' | 'Máy tập' | 'Dây cáp' | 'Bodyweight'

export interface Exercise {
  id: string
  nameVi: string
  nameEn: string
  muscleGroup: MuscleGroup
  secondaryMuscles?: string[]
  equipment: EquipmentType
  instructionsVi?: string
  defaultRestSeconds: number
}

export interface WorkoutSet {
  id: string
  setNumber: number
  weightKg: number
  reps: number
  rpe?: number
  completed: boolean
  isWarmup?: boolean
  isPr?: boolean
}

export interface SessionExerciseItem {
  exerciseId: string
  exerciseName: string
  muscleGroup: MuscleGroup
  sets: WorkoutSet[]
}

export interface WorkoutSession {
  id: string
  date: string
  name: string
  splitType: string
  durationMinutes: number
  totalVolumeKg: number
  xpEarned: number
  exercises: SessionExerciseItem[]
  notes?: string
}

export interface PersonalRecord {
  id: string
  exerciseId: string
  exerciseName: string
  maxWeightKg: number
  reps: number
  estimated1RM: number
  achievedDate: string
  previousWeightKg?: number
}
