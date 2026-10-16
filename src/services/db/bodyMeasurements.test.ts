import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FitForgeDatabase } from './db'
import type { BodyMeasurement } from '@/types/inbody'
import { mockBodyMeasurements } from '@/mock'
import { composition } from '@/services/bodyComposition/calculations'

const row = (overrides: Partial<BodyMeasurement> = {}): BodyMeasurement => ({ id: crypto.randomUUID(), date: '2026-10-12', measurementVersion: 3,
  heightCm: 175, weightKg: 80, smmKg: 35, pbfPercent: 20, bodyFatMassKg: 16, ...overrides })
let db: FitForgeDatabase
beforeEach(async () => { db = new FitForgeDatabase(`body-${crypto.randomUUID()}`); await db.seedInitialData() })
afterEach(async () => { await db.delete() })
describe('measurement transactions and backups', () => {
  it('creates, edits, reopens and deletes only the selected measurement with audit entries', async () => {
    const first = row({ date: '2026-10-11' }), second = row()
    await db.saveMeasurement(first); await db.saveMeasurement(second)
    await db.saveMeasurement({ ...second, weightKg: 81 }, true)
    db.close(); db = new FitForgeDatabase(db.name)
    expect((await db.bodyMeasurements.get(second.id))?.weightKg).toBe(81)
    expect((await db.bodyMeasurements.orderBy('date').toArray()).map(m => m.id)).toEqual([first.id, second.id])
    await db.deleteMeasurement(second.id)
    expect(await db.bodyMeasurements.get(first.id)).toMatchObject(first)
    expect(await db.bodyMeasurements.count()).toBe(1)
    expect((await db.auditLog.toArray()).map(a => a.action).sort()).toEqual(['create-measurement', 'create-measurement', 'delete-measurement', 'edit-measurement'])
    await expect(db.saveMeasurement(second, true)).rejects.toThrow()
  })
  it('rejects invalid input, duplicate IDs and demo edits without mutating history', async () => {
    const first = row(); await db.saveMeasurement(first)
    await expect(db.saveMeasurement(first)).rejects.toThrow()
    await expect(db.saveMeasurement({ ...first, pbfPercent: 101 }, true)).rejects.toThrow()
    const demo = { ...row(), source: 'demo' as const }; await db.bodyMeasurements.add(demo)
    await expect(db.putEntity('bodyMeasurements', { ...demo, id: 'new-demo-id' })).rejects.toThrow()
    await expect(db.saveMeasurement(demo, true)).rejects.toThrow()
    await expect(db.putEntity('bodyMeasurements', { ...demo, source: 'real' })).rejects.toThrow()
    await db.deleteMeasurement(demo.id)
    expect((await db.bodyMeasurements.get(demo.id))?.source).toBe('demo')
    expect((await db.bodyMeasurements.get(first.id))?.pbfPercent).toBe(20)
  })
  it('rolls back edits and deletes if the audit write fails', async () => {
    const first = row(); await db.saveMeasurement(first)
    const fail = () => { throw new Error('disk failure') }; db.auditLog.hook('creating', fail)
    await expect(db.saveMeasurement({ ...first, smmKg: 36 }, true)).rejects.toThrow('disk failure')
    await expect(db.deleteMeasurement(first.id)).rejects.toThrow('disk failure')
    db.auditLog.hook('creating').unsubscribe(fail)
    expect((await db.bodyMeasurements.get(first.id))?.smmKg).toBe(35)
  })
  it('round trips optional readings, nulls, segmental lean and device references through JSON v3', async () => {
    const first = row({ smmKg: null, bmrKcal: null, segmentalLean: { leftArmKg: 3 }, references: { pbfPercent: { min: 10, max: 20, unit: '%', label: 'Personal device interval', scope: 'individual' } } })
    await db.saveMeasurement(first)
    const backup = JSON.parse(JSON.stringify(await db.exportFullBackup()))
    expect(backup.version).toBe(4)
    const restored = new FitForgeDatabase(`restore-body-${crypto.randomUUID()}`)
    try { await restored.importBackup(backup); expect(await restored.bodyMeasurements.get(first.id)).toEqual({ ...first, source: 'real' }) }
    finally { await restored.delete() }
  })
  it('imports v1 and v2 legacy measurements without inventing height or overwriting real IDs', async () => {
    const first = row(); await db.saveMeasurement(first)
    const backup = await db.exportFullBackup()
    for (const version of [1, 2]) {
      const legacy = { ...mockBodyMeasurements[0], id: `legacy-${version}` }
      await db.importBackup({ ...backup, version, bodyMeasurements: [legacy, { ...first, weightKg: 70, source: 'demo' }] })
      const saved = await db.bodyMeasurements.get(legacy.id)
      expect(saved?.heightCm).toBeUndefined(); expect(saved?.bmi).toBe(legacy.bmi)
      expect(composition(saved!).bmi).toBeNull(); expect((await db.bodyMeasurements.get(first.id))?.weightKg).toBe(80)
    }
  })
  it('rejects malformed measurement backups atomically', async () => {
    const backup = await db.exportFullBackup()
    await expect(db.importBackup({ ...backup, bodyMeasurements: [row(), row({ heightCm: -1 })] })).rejects.toThrow()
    expect(await db.bodyMeasurements.count()).toBe(0)
  })
  it('keeps exact legacy demo rows isolated during restore', async () => {
    const backup = await db.exportFullBackup()
    await db.importBackup({ ...backup, version: 1, bodyMeasurements: mockBodyMeasurements })
    expect((await db.bodyMeasurements.toArray()).every(m => m.source === 'demo')).toBe(true)
    await db.seedInitialData()
    expect((await db.bodyMeasurements.toArray()).filter(m => m.source !== 'demo')).toHaveLength(0)
  })
})
describe('safe v2 to v3 measurement migration', () => {
  it('preserves legacy real and demo readings exactly, adding only an index', async () => {
    const name = `v2-body-${crypto.randomUUID()}`, legacy = new Dexie(name)
    legacy.version(2).stores({ users: 'id, level', exercises: 'id, muscleGroup, equipment', workoutSessions: 'id, date, splitType, status, source',
      workoutSets: 'id, sessionId, exerciseId, [sessionId+exerciseId]', personalRecords: 'id, exerciseId, achievedDate', bodyMeasurements: 'id, date', goals: 'id, category',
      characterStates: 'id, userId', achievements: 'id, code, category, unlocked', quests: 'id, frequency, isCompleted', auditLog: 'id, at, entityId' })
    const real = { ...mockBodyMeasurements[0], id: 'older-real', source: 'real' }, demo = { ...mockBodyMeasurements[0], source: 'demo' }
    await legacy.table('bodyMeasurements').bulkAdd([real, demo]); legacy.close()
    const upgraded = new FitForgeDatabase(name)
    try {
      await upgraded.open(); expect(upgraded.verno).toBe(4)
      expect(await upgraded.bodyMeasurements.get(real.id)).toEqual(real)
      expect(await upgraded.bodyMeasurements.get(demo.id)).toEqual(demo)
      expect((await upgraded.bodyMeasurements.where('source').equals('real').toArray())).toHaveLength(1)
    } finally { await upgraded.delete() }
  })
})
