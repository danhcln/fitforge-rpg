import { create } from 'zustand'
import type { Exercise, WorkoutSession, PersonalRecord, WorkoutSet } from '@/types'
import { db } from '@/services/db'
import { localDate, validateSet } from '@/services/workout/calculations'

interface WorkoutStoreState {
  exercises: Exercise[]
  sessions: WorkoutSession[]
  personalRecords: PersonalRecord[]
  activeSession: WorkoutSession | null
  error: string | null
  busy: boolean
  pendingWrites: number
  startSession: (name: string, splitType: string) => void
  startPlannedSession: (session: WorkoutSession) => void
  editSession: (session: WorkoutSession) => void
  updateSession: (updates: Partial<Pick<WorkoutSession, 'name' | 'date' | 'splitType' | 'notes' | 'durationMinutes'>>) => void
  addExerciseToSession: (exercise: Exercise) => void
  removeExercise: (exerciseId: string) => void
  addSetToExercise: (exerciseId: string, weightKg: number, reps: number) => void
  updateSet: (exerciseId: string, setId: string, updates: Partial<WorkoutSet>) => void
  deleteSet: (exerciseId: string, setId: string) => void
  toggleSetCompleted: (exerciseId: string, setId: string) => void
  finishSession: () => Promise<WorkoutSession | null>
  cancelSession: () => Promise<void>
}
let writes: Promise<void> = Promise.resolve()
function persist(session: WorkoutSession) {
  useWorkoutStore.setState(state => ({ pendingWrites: state.pendingWrites + 1 }))
  writes = writes.then(() => db.saveDraft(session)).catch(error => {
    useWorkoutStore.setState({ error: `Không thể lưu bản nháp: ${String(error)}` })
  }).finally(() => {
    useWorkoutStore.setState(state => ({ pendingWrites: state.pendingWrites - 1 }))
  })
}
export const useWorkoutStore = create<WorkoutStoreState>((set, get) => {
  const change = (update: (session: WorkoutSession) => WorkoutSession) => {
    const current = get().activeSession
    if (!current || get().busy) return
    const next = update(current)
    set({ activeSession: next, error: null })
    persist(next)
  }
  return {
    exercises: [], sessions: [], personalRecords: [], activeSession: null, error: null, busy: false, pendingWrites: 0,
    startSession: (name, splitType) => {
      if (!name.trim() || !splitType.trim()) { set({ error: 'Nhập tên buổi tập và nhóm cơ.' }); return }
      if (get().activeSession) return
      const session: WorkoutSession = { id: crypto.randomUUID(), date: localDate(), name: name.trim(), splitType: splitType.trim(),
        startedAt: Date.now(), status: 'draft', source: 'real', durationMinutes: 0, totalVolumeKg: 0, xpEarned: 0, exercises: [] }
      set({ activeSession: session, error: null })
      persist(session)
    },
    startPlannedSession: session => {
      if (get().activeSession || get().busy) { set({ error: 'Lưu hoặc hủy bản nháp hiện tại trước.' }); return }
      const draft = { ...session, status: 'draft' as const, xpEarned: 0, totalVolumeKg: 0 }
      set({ activeSession: draft, error: null }); persist(draft)
    },
    editSession: session => {
      if (get().activeSession) { set({ error: 'Lưu hoặc hủy bản nháp trước khi chỉnh sửa.' }); return }
      const draft = { ...structuredClone(session), id: crypto.randomUUID(), editOf: session.id, status: 'draft' as const }
      set({ activeSession: draft, error: null })
      persist(draft)
    },
    updateSession: updates => change(s => ({ ...s, ...updates })),
    addExerciseToSession: exercise => change(s => s.exercises.some(ex => ex.exerciseId === exercise.id) ? s : ({ ...s,
      exercises: [...s.exercises, { exerciseId: exercise.id, exerciseName: exercise.nameVi, muscleGroup: exercise.muscleGroup,
        sets: [{ id: crypto.randomUUID(), setNumber: 1, weightKg: 0, reps: 1, completed: false }] }] })),
    removeExercise: id => change(s => ({ ...s, exercises: s.exercises.filter(ex => ex.exerciseId !== id) })),
    addSetToExercise: (id, weightKg, reps) => change(s => ({ ...s, exercises: s.exercises.map(ex => ex.exerciseId !== id ? ex : {
      ...ex, sets: [...ex.sets, { id: crypto.randomUUID(), setNumber: ex.sets.length + 1, weightKg, reps, completed: false }] }) })),
    updateSet: (id, setId, updates) => change(s => ({ ...s, exercises: s.exercises.map(ex => ex.exerciseId !== id ? ex : {
      ...ex, sets: ex.sets.map(row => row.id === setId ? { ...row, ...updates } : row) }) })),
    deleteSet: (id, setId) => change(s => ({ ...s, exercises: s.exercises.map(ex => ex.exerciseId !== id ? ex : {
      ...ex, sets: ex.sets.filter(row => row.id !== setId).map((row, i) => ({ ...row, setNumber: i + 1 })) }) })),
    toggleSetCompleted: (id, setId) => {
      const row = get().activeSession?.exercises.find(ex => ex.exerciseId === id)?.sets.find(row => row.id === setId)
      if (!row) return
      try { validateSet(row); get().updateSet(id, setId, { completed: !row.completed }) }
      catch (error) { set({ error: String(error) }) }
    },
    finishSession: async () => {
      if (get().busy) return null
      set({ busy: true })
      try {
      await writes
      const active = get().activeSession
      if (!active) return null
      const session = { ...active, id: active.editOf ?? active.id,
        durationMinutes: active.editOf ? active.durationMinutes : Math.max(1, Math.round((Date.now() - (active.startedAt ?? Date.now())) / 60000)) }
      const saved = await db.saveWorkout(session, active.editOf ? active.id : undefined)
      set({ activeSession: null, error: null })
      return saved
      } finally { set({ busy: false }) }
    },
    cancelSession: async () => {
      if (get().busy) return
      set({ busy: true })
      try {
      await writes
      const active = get().activeSession
      if (active) await db.deleteWorkout(active.id)
      set({ activeSession: null, error: null })
      } finally { set({ busy: false }) }
    },
  }
})
