import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FitForgeDatabase } from './db'
import { sessionRow, setRow } from '@/test/fixtures'
import * as mocks from '@/mock'
import { defaultUser } from './defaults'
import { localDate } from '@/services/workout/calculations'
let db: FitForgeDatabase
beforeEach(async () => { db = new FitForgeDatabase(`test-${crypto.randomUUID()}`); await db.seedInitialData() })
afterEach(async () => { await db.delete() })

describe('local database', () => {
  it('initializes without demo progress and never overwrites existing entities', async () => {
    expect(await db.workoutSessions.count()).toBe(0)
    expect(await db.personalRecords.count()).toBe(0)
    expect(await db.bodyMeasurements.count()).toBe(0)
    expect(await db.goals.count()).toBe(0)
    await db.putEntity('users', { ...defaultUser(), name: 'Actual user' })
    await db.exercises.update('ex_bench_press', { nameVi: 'Custom bench' })
    await db.seedInitialData()
    expect((await db.users.get('local-user'))?.name).toBe('Actual user')
    expect((await db.exercises.get('ex_bench_press'))?.nameVi).toBe('Custom bench')
    expect(await db.users.count()).toBe(1)
  })
  it('persists sessions, individual sets, PRs and profiles across connections', async () => {
    const saved = await db.saveWorkout(sessionRow())
    expect(saved.totalVolumeKg).toBe(600)
    expect(await db.workoutSets.count()).toBe(1)
    expect(await db.personalRecords.count()).toBe(4)
    const name = db.name
    db.close()
    db = new FitForgeDatabase(name)
    expect((await db.workoutSessions.get(saved.id))?.totalVolumeKg).toBe(600)
    expect((await db.users.get('local-user'))?.currentXp).toBe(221)
    expect(await db.auditLog.count()).toBe(1)
  })
  it('persists empty drafts without XP and completes atomically', async () => {
    const draft = { ...sessionRow(), exercises: [], status: 'draft' as const }
    await db.saveDraft(draft)
    expect((await db.users.get('local-user'))?.currentXp).toBe(0)
    db.close(); db = new FitForgeDatabase(db.name)
    expect((await db.workoutSessions.get(draft.id))?.status).toBe('draft')
    await db.saveWorkout({ ...draft, exercises: sessionRow().exercises })
    expect((await db.workoutSessions.get(draft.id))?.status).toBe('completed')
    expect((await db.users.get('local-user'))?.currentXp).toBe(221)
  })
  it('recalculates PRs on edit/delete and does not duplicate XP on resave', async () => {
    const original = await db.saveWorkout(sessionRow([setRow(100, 5)]))
    const xp = (await db.users.get('local-user'))?.currentXp
    await db.saveWorkout(original)
    expect((await db.users.get('local-user'))?.currentXp).toBe(xp)
    await db.saveWorkout({ ...original, exercises: sessionRow([setRow(50, 5)]).exercises })
    expect((await db.personalRecords.toArray()).find(r => r.kind === 'weight')?.value).toBe(50)
    expect(await db.workoutSets.count()).toBe(1)
    await db.deleteWorkout(original.id)
    expect(await db.personalRecords.count()).toBe(0)
    expect(await db.workoutSets.count()).toBe(0)
    expect((await db.users.get('local-user'))?.currentXp).toBe(0)
  })
  it('rolls back workout/profile/PR writes if a transaction fails', async () => {
    const before = await db.exportFullBackup()
    const subscription = () => { throw new Error('disk failure') }
    db.auditLog.hook('creating', subscription)
    await expect(db.saveWorkout(sessionRow())).rejects.toThrow('disk failure')
    db.auditLog.hook('creating').unsubscribe(subscription)
    expect(await db.workoutSessions.count()).toBe(0)
    expect(await db.workoutSets.count()).toBe(0)
    expect(await db.personalRecords.count()).toBe(0)
    expect((await db.exportFullBackup()).user).toEqual(before.user)
  })
  it('rejects invalid workouts and missing exercise references without writes', async () => {
    await expect(db.saveWorkout(sessionRow([setRow(-1, 3)]))).rejects.toThrow()
    const unknown = sessionRow(); unknown.exercises[0].exerciseId = 'unknown'
    await expect(db.saveWorkout(unknown)).rejects.toThrow()
    expect(await db.workoutSessions.count()).toBe(0)
  })
  it('calculates unique-day streaks from local calendar dates', async () => {
    await db.saveWorkout({ ...sessionRow(), date: localDate() })
    await db.saveWorkout({ ...sessionRow(), date: localDate() })
    expect((await db.streak()).streakDays).toBe(1)
  })
  it('validates profile, measurements, goals and character inputs', async () => {
    await expect(db.putEntity('users', { ...defaultUser(), name: '' })).rejects.toThrow()
    await expect(db.putEntity('users', { ...defaultUser(), nextLevelXp: 0 })).rejects.toThrow()
    await expect(db.putEntity('bodyMeasurements', { ...mocks.mockBodyMeasurements[0], pbfPercent: 101 })).rejects.toThrow()
    await expect(db.putEntity('goals', { ...mocks.mockGoal, targetWeightKg: NaN })).rejects.toThrow()
    await expect(db.putEntity('characterStates', { ...mocks.mockCharacterState, currentBody: { ...mocks.mockCharacterState.currentBody, fatMorph: 2 } })).rejects.toThrow()
    await db.putEntity('bodyMeasurements', { ...mocks.mockBodyMeasurements[0], id: 'actual-measurement' })
    expect((await db.bodyMeasurements.get('actual-measurement'))?.source).toBe('real')
  })
})

describe('backups', () => {
  it('rolls back an entire restore on write failure', async () => {
    const backup = await db.exportFullBackup()
    const fail = () => { throw new Error('restore failure') }
    db.auditLog.hook('creating', fail)
    await expect(db.importBackup({ ...backup, workoutSessions: [sessionRow()] })).rejects.toThrow('restore failure')
    db.auditLog.hook('creating').unsubscribe(fail)
    expect(await db.workoutSessions.count()).toBe(0)
    expect(await db.workoutSets.count()).toBe(0)
    expect(await db.personalRecords.count()).toBe(0)
  })
  it('round trips all entities and rebuilds normalized sets/derived PRs', async () => {
    const saved = await db.saveWorkout(sessionRow())
    await db.putEntity('goals', { ...mocks.mockGoal, id: 'actual-goal' })
    await db.putEntity('bodyMeasurements', { ...mocks.mockBodyMeasurements[0], id: 'actual-measurement' })
    const backup = JSON.parse(JSON.stringify(await db.exportFullBackup())) as unknown
    const target = new FitForgeDatabase(`restore-${crypto.randomUUID()}`)
    try {
      expect(await target.importBackup(backup)).toBeGreaterThan(0)
      expect((await target.workoutSessions.get(saved.id))?.totalVolumeKg).toBe(600)
      expect(await target.workoutSets.count()).toBe(1)
      expect(await target.personalRecords.count()).toBe(4)
      expect(await target.goals.count()).toBe(1)
      expect(await target.bodyMeasurements.count()).toBe(1)
      expect(await target.importBackup(backup)).toBe(0)
    } finally { await target.delete() }
  })
  it.each(['user', 'exercises', 'workoutSessions', 'personalRecords', 'bodyMeasurements', 'goals', 'characterStates', 'achievements', 'quests'])('rejects missing table %s without mutation', async table => {
    const backup = await db.exportFullBackup(); delete backup[table]
    await expect(db.importBackup(backup)).rejects.toThrow()
    expect(await db.workoutSessions.count()).toBe(0)
  })
  it('rejects unsupported versions, malformed nested data, duplicate IDs and dangling references', async () => {
    const backup = await db.exportFullBackup()
    await expect(db.importBackup({ ...backup, version: 99 })).rejects.toThrow()
    await expect(db.importBackup({ ...backup, user: [{ ...defaultUser(), level: '1' }] })).rejects.toThrow()
    await expect(db.importBackup({ ...backup, user: [defaultUser(), defaultUser()] })).rejects.toThrow()
    await expect(db.importBackup({ ...backup, workoutSessions: [{ ...sessionRow(), exercises: [{ ...sessionRow().exercises[0], sets: 'bad' }] }] })).rejects.toThrow()
    await expect(db.importBackup({ ...backup, exercises: [], workoutSessions: [sessionRow()] })).rejects.toThrow()
    expect(await db.workoutSessions.count()).toBe(0)
  })
  it('supports v1 backups, isolates demo data, and cannot overwrite real records', async () => {
    const backup = { version: 1, user: [mocks.mockUserProfile], exercises: mocks.mockExercises,
      workoutSessions: mocks.mockWorkoutSessions, personalRecords: mocks.mockPersonalRecords, bodyMeasurements: mocks.mockBodyMeasurements,
      goals: [mocks.mockGoal], characterStates: [mocks.mockCharacterState], achievements: mocks.mockAchievements, quests: mocks.mockQuests }
    await db.importBackup(backup)
    expect((await db.workoutSessions.toArray()).every(s => s.source === 'demo')).toBe(true)
    expect((await db.personalRecords.toArray()).every(r => r.source === 'demo')).toBe(true)
    const actual = await db.saveWorkout(sessionRow())
    const current = await db.exportFullBackup()
    await db.importBackup({ ...current, workoutSessions: [{ ...actual, name: 'Overwrite attempt', source: 'demo' }] })
    expect((await db.workoutSessions.get(actual.id))?.name).toBe(actual.name)
    expect((await db.personalRecords.toArray()).find(r => r.kind === 'weight')?.value).toBe(60)
  })
  it('accepts backups containing empty drafts', async () => {
    await db.saveDraft({ ...sessionRow(), status: 'draft', exercises: [] })
    const backup = await db.exportFullBackup()
    await expect(db.importBackup(backup)).resolves.toBe(0)
  })
})

describe('v1 migration', () => {
  it('keeps all rows, classifies only exact demo matches, and normalizes sets', async () => {
    const name = `legacy-${crypto.randomUUID()}`
    const legacy = new Dexie(name)
    legacy.version(1).stores({ users: 'id, level', exercises: 'id, muscleGroup, equipment', workoutSessions: 'id, date, splitType',
      personalRecords: 'id, exerciseId, achievedDate', bodyMeasurements: 'id, date', goals: 'id, category', characterStates: 'id, userId',
      achievements: 'id, code, category, unlocked', quests: 'id, frequency, isCompleted' })
    await legacy.table('users').add(mocks.mockUserProfile)
    await legacy.table('exercises').bulkAdd(mocks.mockExercises)
    const actual = { ...sessionRow(), source: undefined, status: undefined }
    await legacy.table('workoutSessions').bulkAdd([...mocks.mockWorkoutSessions, actual])
    await legacy.table('bodyMeasurements').add({ ...mocks.mockBodyMeasurements[0], weightKg: 80 })
    legacy.close()
    const migrated = new FitForgeDatabase(name)
    try {
      await migrated.open(); await migrated.seedInitialData()
      expect(await migrated.workoutSessions.count()).toBe(mocks.mockWorkoutSessions.length + 1)
      expect((await migrated.workoutSessions.get(actual.id))?.source).toBe('real')
      expect((await migrated.workoutSessions.get(actual.id))?.totalVolumeKg).toBe(600)
      expect((await migrated.workoutSessions.get(mocks.mockWorkoutSessions[0].id))?.source).toBe('demo')
      expect((await migrated.bodyMeasurements.get(mocks.mockBodyMeasurements[0].id))?.source).toBe('real')
      expect(await migrated.users.count()).toBe(2)
      expect(await migrated.workoutSets.count()).toBeGreaterThan(1)
      expect((await migrated.personalRecords.toArray()).find(r => r.kind === 'weight')?.value).toBe(60)
    } finally { await migrated.delete() }
  })
})
