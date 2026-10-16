import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest'
import { db } from '@/services/db'
import { useWorkoutStore } from './useWorkoutStore'
import { sessionRow } from '@/test/fixtures'
const store = () => useWorkoutStore.getState()
const flush = () => vi.waitFor(() => { expect(store().pendingWrites).toBe(0) })
beforeEach(async () => {
  await db.delete(); await db.open(); await db.seedInitialData()
  useWorkoutStore.setState({ activeSession: null, sessions: [], personalRecords: [], error: null, busy: false, pendingWrites: 0 })
})
afterEach(async () => { await flush(); await db.delete() })
describe('persistent workout actions', () => {
  it('creates a timestamped draft, edits sets, deletes sets and completes once', async () => {
    store().startSession(' ', 'Push')
    expect(store().activeSession).toBeNull()
    store().startSession('My workout', 'Push')
    const exercise = (await db.exercises.get('ex_bench_press'))!
    store().addExerciseToSession(exercise)
    const first = store().activeSession!.exercises[0].sets[0]
    store().updateSet(exercise.id, first.id, { weightKg: 60, reps: 10 })
    store().addSetToExercise(exercise.id, 70, 5)
    const second = store().activeSession!.exercises[0].sets[1]
    store().deleteSet(exercise.id, second.id)
    store().toggleSetCompleted(exercise.id, first.id)
    await flush()
    const id = store().activeSession!.id
    db.close(); await db.open()
    expect((await db.workoutSessions.get(id))?.exercises[0].sets[0]).toMatchObject({ weightKg: 60, reps: 10, completed: true })
    expect((await db.workoutSessions.get(id))?.startedAt).toBeGreaterThan(1e12)
    const [saved, ignored] = await Promise.all([store().finishSession(), store().finishSession()])
    expect(saved?.totalVolumeKg).toBe(600)
    expect(ignored).toBeNull()
    expect(store().activeSession).toBeNull()
    expect((await db.users.get('local-user'))?.currentXp).toBe(221)
  })
  it('retains original workouts until edited drafts are saved, and removes the draft atomically', async () => {
    const saved = await db.saveWorkout(sessionRow())
    store().editSession(saved)
    const draftId = store().activeSession!.id
    const row = store().activeSession!.exercises[0].sets[0]
    store().updateSet('ex_bench_press', row.id, { weightKg: 100, reps: 5 })
    await flush()
    expect((await db.workoutSessions.get(saved.id))?.totalVolumeKg).toBe(600)
    expect((await db.workoutSessions.get(draftId))?.editOf).toBe(saved.id)
    await store().finishSession()
    expect(await db.workoutSessions.get(draftId)).toBeUndefined()
    expect((await db.workoutSessions.get(saved.id))?.totalVolumeKg).toBe(500)
    expect((await db.workoutSessions.get(saved.id))?.editOf).toBeUndefined()
    expect(await db.workoutSets.count()).toBe(1)
  })
  it('does not save invalid edits and preserves the last valid draft', async () => {
    store().startSession('Test', 'Push')
    store().addExerciseToSession((await db.exercises.get('ex_bench_press'))!)
    await flush()
    const draft = store().activeSession!
    store().updateSet('ex_bench_press', draft.exercises[0].sets[0].id, { reps: NaN })
    await flush()
    expect(store().error).toContain('Không thể lưu')
    expect((await db.workoutSessions.get(draft.id))?.exercises[0].sets[0].reps).toBe(1)
    await expect(store().finishSession()).rejects.toThrow()
    expect(store().activeSession).not.toBeNull()
  })
  it('cancels drafts without changing saved workouts', async () => {
    const saved = await db.saveWorkout(sessionRow())
    store().editSession(saved)
    await store().cancelSession()
    expect(await db.workoutSessions.count()).toBe(1)
    expect((await db.workoutSessions.get(saved.id))?.status).toBe('completed')
    expect(store().activeSession).toBeNull()
  })
})
