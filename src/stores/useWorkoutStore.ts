import { create } from 'zustand'
import type { Exercise, WorkoutSession, PersonalRecord, WorkoutSet, MuscleGroup } from '@/types'
import { mockExercises, mockWorkoutSessions, mockPersonalRecords } from '@/mock'

interface ActiveSessionState {
  name: string
  splitType: string
  startTime: number
  exercises: {
    exerciseId: string
    exerciseName: string
    muscleGroup: MuscleGroup
    sets: WorkoutSet[]
  }[]
}

interface WorkoutStoreState {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  personalRecords: PersonalRecord[]
  activeSession: ActiveSessionState | null

  startSession: (name: string, splitType: string) => void
  addExerciseToSession: (exercise: Exercise) => void
  addSetToExercise: (exerciseId: string, weightKg: number, reps: number) => void
  toggleSetCompleted: (exerciseId: string, setId: string) => void
  finishSession: () => WorkoutSession | null
  cancelSession: () => void
}

export const useWorkoutStore = create<WorkoutStoreState>((set, get) => ({
  exercises: mockExercises,
  sessions: mockWorkoutSessions,
  personalRecords: mockPersonalRecords,
  activeSession: null,

  startSession: (name: string, splitType: string) => {
    set({
      activeSession: {
        name,
        splitType,
        startTime: Date.now(),
        exercises: [],
      },
    })
  },

  addExerciseToSession: (exercise: Exercise) => {
    const { activeSession } = get()
    if (!activeSession) return

    const existing = activeSession.exercises.find((e) => e.exerciseId === exercise.id)
    if (existing) return

    set({
      activeSession: {
        ...activeSession,
        exercises: [
          ...activeSession.exercises,
          {
            exerciseId: exercise.id,
            exerciseName: exercise.nameVi,
            muscleGroup: exercise.muscleGroup,
            sets: [
              {
                id: `set_${Date.now()}_1`,
                setNumber: 1,
                weightKg: 60,
                reps: 10,
                completed: false,
              },
            ],
          },
        ],
      },
    })
  },

  addSetToExercise: (exerciseId: string, weightKg: number, reps: number) => {
    const { activeSession } = get()
    if (!activeSession) return

    set({
      activeSession: {
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex
          const nextSetNumber = ex.sets.length + 1
          return {
            ...ex,
            sets: [
              ...ex.sets,
              {
                id: `set_${Date.now()}_${nextSetNumber}`,
                setNumber: nextSetNumber,
                weightKg,
                reps,
                completed: false,
              },
            ],
          }
        }),
      },
    })
  },

  toggleSetCompleted: (exerciseId: string, setId: string) => {
    const { activeSession } = get()
    if (!activeSession) return

    set({
      activeSession: {
        ...activeSession,
        exercises: activeSession.exercises.map((ex) => {
          if (ex.exerciseId !== exerciseId) return ex
          return {
            ...ex,
            sets: ex.sets.map((s) => (s.id === setId ? { ...s, completed: !s.completed } : s)),
          }
        }),
      },
    })
  },

  finishSession: () => {
    const { activeSession, sessions } = get()
    if (!activeSession) return null

    const durationMinutes = Math.max(1, Math.round((Date.now() - activeSession.startTime) / (1000 * 60)))
    let totalVolume = 0

    activeSession.exercises.forEach((ex) => {
      ex.sets.forEach((s) => {
        if (s.completed) {
          totalVolume += s.weightKg * s.reps
        }
      })
    })

    const newSession: WorkoutSession = {
      id: `ses_${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      name: activeSession.name,
      splitType: activeSession.splitType,
      durationMinutes,
      totalVolumeKg: totalVolume,
      xpEarned: Math.round(totalVolume * 0.035) + 200,
      exercises: activeSession.exercises,
      notes: 'Buổi tập hoàn thành thành công trong FitForge RPG.',
    }

    set({
      sessions: [newSession, ...sessions],
      activeSession: null,
    })

    return newSession
  },

  cancelSession: () => {
    set({ activeSession: null })
  },
}))
