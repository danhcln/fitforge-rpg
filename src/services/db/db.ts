import Dexie, { type Table } from 'dexie'
import type { UserProfile, Exercise, WorkoutSession, WorkoutSet, PersonalRecord, BodyMeasurement, Goal, CharacterState, Achievement, Quest } from '@/types'
import { mockExercises } from '@/mock'
import { calculatePersonalRecords, localDate, trainingVolume, validateWorkout } from '@/services/workout/calculations'
import { classifyLegacy, examples, object, validateEntity, type LocalRecord } from './validation'
import { defaultCharacter, defaultUser } from './defaults'
import type { ProgressionEvent, TrainingPlan, NutritionEntry, NutritionSettings } from '@/types'
import { phase5Tables, validatePhase5 } from '@/services/planning/validation'
import { energyAllowed, defaultNutritionSettings } from '@/services/planning/calculations'
import { workoutXp } from '@/services/rpg/calculations'
import { initializeProgression, refreshRpg, setAward, claimQuest, applyCosmetic } from '@/services/rpg/persistence'
import { validateProgressionSnapshot } from '@/services/rpg/backupValidation'

export interface StoredSet extends WorkoutSet { sessionId: string; exerciseId: string }
export interface AuditEntry { id: string; at: string; action: string; entityId: string }
const schema = {
  users: 'id, level', exercises: 'id, muscleGroup, equipment', workoutSessions: 'id, date, splitType',
  personalRecords: 'id, exerciseId, achievedDate', bodyMeasurements: 'id, date', goals: 'id, category',
  characterStates: 'id, userId', achievements: 'id, code, category, unlocked', quests: 'id, frequency, isCompleted',
}
export class FitForgeDatabase extends Dexie {
  users!: Table<LocalRecord<UserProfile>, string>
  exercises!: Table<Exercise, string>
  workoutSessions!: Table<WorkoutSession, string>
  workoutSets!: Table<StoredSet, string>
  personalRecords!: Table<PersonalRecord, string>
  bodyMeasurements!: Table<LocalRecord<BodyMeasurement>, string>
  goals!: Table<LocalRecord<Goal>, string>
  characterStates!: Table<LocalRecord<CharacterState>, string>
  achievements!: Table<LocalRecord<Achievement>, string>
  quests!: Table<LocalRecord<Quest>, string>
  auditLog!: Table<AuditEntry, string>
  progressionEvents!: Table<ProgressionEvent, string>
  trainingPlans!: Table<TrainingPlan, string>
  nutritionEntries!: Table<NutritionEntry, string>
  nutritionSettings!: Table<NutritionSettings, string>

  constructor(name = 'FitForgeRPG_DB') {
    super(name)
    this.version(1).stores(schema)
    this.version(2).stores({ ...schema, workoutSessions: 'id, date, splitType, status, source',
      workoutSets: 'id, sessionId, exerciseId, [sessionId+exerciseId]', auditLog: 'id, at, entityId' }).upgrade(async tx => {
      for (const tableName of Object.keys(examples)) {
        if (tableName === 'exercises') continue
        await tx.table(tableName).toCollection().modify(row => {
          row.source = classifyLegacy(tableName, row)
          if (tableName === 'workoutSessions') row.status = 'completed'
        })
      }
      for (const session of await tx.table<WorkoutSession>('workoutSessions').toArray()) {
        if (session.source !== 'demo') {
          await tx.table('workoutSessions').update(session.id, {
            totalVolumeKg: session.exercises.reduce((total, ex) => total + trainingVolume(ex.sets), 0),
          })
        }
        await tx.table('workoutSets').bulkPut(this.flattenSets(session))
      }
      // Preserve legacy PR rows; derived records use distinct IDs.
      await tx.table('personalRecords').bulkPut(calculatePersonalRecords(await tx.table('workoutSessions').toArray()))
    })
    // Add an index only: legacy heights and device readings must not be invented or rewritten.
    this.version(3).stores({ bodyMeasurements: 'id, date, source' })
    this.version(4).stores({ progressionEvents: 'id, userId, kind, sourceId, [userId+sourceId], at',
      trainingPlans: 'id, userId, weekStart', nutritionEntries: 'id, userId, date, [userId+date]', nutritionSettings: 'id, userId' })
      .upgrade(async () => { await initializeProgression(this) })
  }

  flattenSets(session: WorkoutSession): StoredSet[] {
    return session.exercises.flatMap(ex => ex.sets.map(set => ({ ...set,
      id: `${session.id}:${ex.exerciseId}:${set.id}`, sessionId: session.id, exerciseId: ex.exerciseId })))
  }
  async log(action: string, entityId: string): Promise<void> {
    await this.auditLog.add({ id: crypto.randomUUID(), at: new Date().toISOString(), action, entityId })
  }
  async seedInitialData(): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      const realUsers = (await this.users.toArray()).filter(row => row.source !== 'demo')
      if (!realUsers.length) await this.users.add({ ...defaultUser(), source: 'real' })
      const user = realUsers[0] ?? defaultUser()
      if (!(await this.characterStates.where('userId').equals(user.id).toArray()).some(row => row.source !== 'demo')) {
        await this.characterStates.add({ ...defaultCharacter(user.id), source: 'real' })
      }
      for (const exercise of mockExercises) if (!await this.exercises.get(exercise.id)) await this.exercises.add(exercise)
      const profile = await this.users.get(user.id)
      if (profile) await this.users.put({ ...profile, ...await this.streak() })
      await refreshRpg(this)
    })
  }
  async putEntity(tableName: string, row: unknown): Promise<void> {
    validateEntity(tableName, row)
    if (tableName === 'bodyMeasurements' && object(row).source === 'demo') throw new Error('Không lưu dữ liệu mẫu thành phiếu đo thực tế.')
    if (['workoutSessions', 'personalRecords', 'quests', 'achievements'].includes(tableName)) throw new Error('Dùng giao dịch nghiệp vụ để cập nhật tiến trình.')
    await this.transaction('rw', this.table(tableName), this.auditLog, async () => {
      if (tableName === 'bodyMeasurements' && (await this.bodyMeasurements.get(String(object(row).id)))?.source === 'demo') throw new Error('Không ghi đè phiếu đo mẫu thành dữ liệu thực.')
      const incoming: Record<string, unknown> = { ...object(row), source: 'real' }
      if (tableName === 'users') {
        const existing = await this.users.get(String(incoming.id))
        if (existing) Object.assign(incoming, { level: existing.level, currentXp: existing.currentXp, nextLevelXp: existing.nextLevelXp, gold: existing.gold })
      }
      await this.table(tableName).put(incoming)
      await this.log('update', String(object(row).id))
    })
  }
  async saveMeasurement(row: BodyMeasurement, editing = false): Promise<void> {
    validateEntity('bodyMeasurements', row)
    if (object(row).source === 'demo') throw new Error('Không lưu dữ liệu mẫu thành phiếu đo thực tế.')
    await this.transaction('rw', this.bodyMeasurements, this.auditLog, async () => {
      const previous = await this.bodyMeasurements.get(row.id)
      if (previous?.source === 'demo') throw new Error('Không chỉnh sửa dữ liệu mẫu thành dữ liệu thực.')
      if (editing && !previous) throw new Error('Phiếu đo đã bị xóa. Vui lòng mở lại lịch sử.')
      if (!editing && previous) throw new Error('ID phiếu đo đã tồn tại.')
      await this.bodyMeasurements.put({ ...row, source: 'real' })
      await this.log(editing ? 'edit-measurement' : 'create-measurement', row.id)
    })
  }
  async deleteMeasurement(id: string): Promise<void> {
    await this.transaction('rw', this.bodyMeasurements, this.auditLog, async () => {
      const previous = await this.bodyMeasurements.get(id)
      if (!previous || previous.source === 'demo') return
      await this.bodyMeasurements.delete(id)
      await this.log('delete-measurement', id)
    })
  }
  async saveDraft(session: WorkoutSession): Promise<void> {
    // Empty exercise lists are valid while assembling a draft.
    if (!session.id || !session.name.trim() || !session.splitType.trim()) throw new Error('Nhập tên và nhóm cơ buổi tập.')
    validateEntity('workoutSessions', { ...session, status: 'draft' })
    await this.transaction('rw', this.workoutSessions, this.workoutSets, async () => {
      const existing = await this.workoutSessions.get(session.id)
      if (existing && (existing.source === 'demo' || existing.status !== 'draft')) throw new Error('Bản nháp không được ghi đè buổi tập đã lưu.')
      await this.workoutSessions.put({ ...session, source: 'real', status: 'draft', totalVolumeKg: 0, xpEarned: 0 })
      await this.workoutSets.where('sessionId').equals(session.id).delete()
      await this.workoutSets.bulkPut(this.flattenSets(session))
    })
  }
  async rebuildRecords(): Promise<void> {
    await this.personalRecords.toCollection().filter(row => row.id.startsWith('record:')).delete()
    await this.personalRecords.bulkPut(calculatePersonalRecords(await this.workoutSessions.toArray()))
  }
  async saveWorkout(session: WorkoutSession, draftId?: string): Promise<WorkoutSession> {
    validateEntity('workoutSessions', { ...session, status: 'completed' })
    validateWorkout(session)
    return this.transaction('rw', this.tables, async () => {
      await initializeProgression(this)
      const previous = await this.workoutSessions.get(session.id)
      if (session.editOf && (session.editOf !== session.id || previous?.status !== 'completed')) throw new Error('Buổi tập gốc đã bị thay đổi hoặc xóa. Không thể lưu chỉnh sửa.')
      if (previous?.source === 'demo') throw new Error('Không chỉnh sửa bản ghi mẫu thành dữ liệu thực.')
      for (const ex of session.exercises) if (!await this.exercises.get(ex.exerciseId)) throw new Error('Bài tập không tồn tại.')
      const volume = session.exercises.reduce((n, ex) => n + trainingVolume(ex.sets), 0)
      const saved: WorkoutSession = { ...session, totalVolumeKg: volume, source: 'real', status: 'completed',
        xpEarned: workoutXp(volume) }
      delete saved.editOf
      await this.workoutSessions.put(saved)
      await this.clearInvalidPlanLinks(saved.id, saved.date)
      if (saved.planId && saved.plannedDate === saved.date) {
        const plan = await this.trainingPlans.get(saved.planId)
        if (plan && plan.days.some(d => d.date === saved.date && !d.isRestDay && !d.completedSessionId)) await this.trainingPlans.put({ ...plan, days: plan.days.map(d => d.date === saved.date && !d.isRestDay && !d.completedSessionId ? { ...d, completedSessionId: saved.id } : d) })
      }
      await this.workoutSets.where('sessionId').equals(saved.id).delete()
      await this.workoutSets.bulkPut(this.flattenSets(saved))
      if (draftId && draftId !== saved.id) {
        const draft = await this.workoutSessions.get(draftId)
        if (draft?.status !== 'draft' || draft.editOf !== saved.id) throw new Error('Bản nháp chỉnh sửa không hợp lệ.')
        await this.workoutSessions.delete(draftId)
        await this.workoutSets.where('sessionId').equals(draftId).delete()
      }
      await this.rebuildRecords()
      const user = (await this.users.toArray()).find(row => row.source !== 'demo')
      if (user) {
        await setAward(this, user.id, 'workout', saved.id, saved.xpEarned)
      }
      await refreshRpg(this)
      await this.log(previous?.status === 'completed' ? 'edit-workout' : 'complete-workout', saved.id)
      return saved
    })
  }
  async streak(): Promise<{ streakDays: number; lastActiveDate: string }> {
    const dates = [...new Set((await this.workoutSessions.toArray()).filter(s => s.source !== 'demo' && s.status !== 'draft').map(s => s.date))].sort().reverse()
    if (!dates.length) return { streakDays: 0, lastActiveDate: '' }
    const today = localDate()
    const gap = (Date.parse(today) - Date.parse(dates[0])) / 86400000
    let days = gap >= 0 && gap <= 1 ? 1 : 0
    if (days) for (let i = 1; i < dates.length && (Date.parse(dates[i - 1]) - Date.parse(dates[i])) / 86400000 === 1; i++) days++
    return { streakDays: days, lastActiveDate: dates[0] }
  }
  async deleteWorkout(id: string): Promise<void> {
    await this.transaction('rw', this.tables, async () => {
      await initializeProgression(this)
      const previous = await this.workoutSessions.get(id)
      if (!previous || previous.source === 'demo') return
      await this.workoutSessions.delete(id)
      await this.clearInvalidPlanLinks(id)
      await this.workoutSets.where('sessionId').equals(id).delete()
      await this.rebuildRecords()
      const user = (await this.users.toArray()).find(row => row.source !== 'demo')
      if (user && previous.status !== 'draft') await setAward(this, user.id, 'workout', id, 0)
      await refreshRpg(this)
      await this.log('delete-workout', id)
    })
  }
  async exportFullBackup(): Promise<Record<string, unknown>> {
    return this.transaction('r', this.tables, async () => {
      const backup: Record<string, unknown> = { version: 4, exportedAt: new Date().toISOString() }
      for (const name of Object.keys(examples)) backup[name === 'users' ? 'user' : name] = await this.table(name).toArray()
      backup.auditLog = await this.auditLog.toArray()
      for (const name of phase5Tables) backup[name] = await this.table(name).toArray()
      return backup
    })
  }
  async importBackup(input: unknown): Promise<number> {
    const backup = object(input)
    if (![1, 2, 3, 4].includes(Number(backup.version)) || typeof backup.version !== 'number') throw new Error('Phiên bản sao lưu không được hỗ trợ.')
    const rows: Record<string, Record<string, unknown>[]> = {}
    for (const name of Object.keys(examples)) {
      const entries = backup[name === 'users' ? 'user' : name]
      if (!Array.isArray(entries) || entries.length > 100000) throw new Error(`Thiếu hoặc sai bảng ${name}.`)
      const ids = new Set<string>()
      rows[name] = entries.map(entry => {
        validateEntity(name, entry)
        const row = object(entry)
        if (ids.has(String(row.id))) throw new Error('ID bị trùng trong sao lưu.')
        ids.add(String(row.id))
        return { ...row, source: backup.version === 1 ? classifyLegacy(name, row) : row.source ?? classifyLegacy(name, row) }
      })
    }
    const exerciseIds = new Set(rows.exercises.map(row => row.id))
    const userIds = new Set(rows.users.map(row => row.id))
    const sessionIds = new Set(rows.workoutSessions.map(row => row.id))
    for (const row of rows.workoutSessions) for (const ex of (row as unknown as WorkoutSession).exercises) {
      if (!exerciseIds.has(ex.exerciseId)) throw new Error('Sao lưu thiếu bài tập được tham chiếu.')
    }
    for (const row of rows.characterStates) if (!userIds.has(row.userId)) throw new Error('Sao lưu thiếu hồ sơ nhân vật.')
    for (const row of rows.personalRecords) if (!exerciseIds.has(row.exerciseId)) throw new Error('Sao lưu thiếu bài tập của kỷ lục.')
    for (const row of rows.workoutSessions) if (row.editOf !== undefined && !sessionIds.has(row.editOf)) throw new Error('Sao lưu thiếu buổi tập gốc của bản nháp.')
    const extraRows: Record<string, Record<string, unknown>[]> = {}
    for (const name of phase5Tables) {
      const entries = backup[name] ?? (backup.version === 4 ? undefined : [])
      if (!Array.isArray(entries) || entries.length > 100000) throw new Error(`Thiếu hoặc sai bảng ${name}.`)
      const ids = new Set<string>()
      extraRows[name] = entries.map(entry => { validatePhase5(name, entry); const row = object(entry)
        if (ids.has(String(row.id)) || !userIds.has(row.userId)) throw new Error('ID trùng hoặc thiếu hồ sơ tiến trình.')
        ids.add(String(row.id)); return row })
    }
    for (const row of extraRows.trainingPlans) for (const day of (row as unknown as TrainingPlan).days) {
      if (day.exercises.some(ex => !exerciseIds.has(ex.exerciseId))) throw new Error('Kế hoạch thiếu bài tập.')
      if (day.completedSessionId) { const session = rows.workoutSessions.find(s => s.id === day.completedSessionId)
        // Deleted or moved links are safely treated as scheduled; preserved for history.
        if (session && (session.date !== day.date || session.source === 'demo' || session.status === 'draft')) throw new Error('Liên kết buổi tập không hợp lệ.') }
    }
    if (backup.version === 4) validateProgressionSnapshot(rows.users as unknown as LocalRecord<UserProfile>[], rows.workoutSessions as unknown as WorkoutSession[], rows.quests as unknown as Quest[], rows.achievements as unknown as Achievement[], extraRows.progressionEvents as unknown as ProgressionEvent[])
    const auditEntries: AuditEntry[] = []
    if (backup.auditLog !== undefined) {
      if (!Array.isArray(backup.auditLog)) throw new Error('Nhật ký sao lưu không hợp lệ.')
      for (const entry of backup.auditLog) {
        const row = object(entry)
        if (['id', 'at', 'action', 'entityId'].some(key => typeof row[key] !== 'string' || !String(row[key]).trim()) || !Number.isFinite(Date.parse(String(row.at)))) throw new Error('Nhật ký sao lưu không hợp lệ.')
        auditEntries.push(row as unknown as AuditEntry)
      }
    }
    // Merge only new IDs. Existing rows are never overwritten, even by a demo backup.
    return this.transaction('rw', this.tables, async () => {
      await initializeProgression(this)
      let imported = 0
      const inserted = new Map<string, Set<string>>()
      for (const [name, entries] of Object.entries(rows)) {
        for (const row of entries) {
          if (name === 'personalRecords' && String(row.id).startsWith('record:')) continue
          if (await this.table(name).get(String(row.id))) continue
          if (name === 'workoutSessions') {
            const session = row as unknown as WorkoutSession
            row.totalVolumeKg = session.exercises.reduce((n, ex) => n + trainingVolume(ex.sets), 0)
            row.status ??= 'completed'
            await this.workoutSets.bulkPut(this.flattenSets(session))
          }
          await this.table(name).add(row)
          const ids = inserted.get(name) ?? new Set<string>(); ids.add(String(row.id)); inserted.set(name, ids)
          imported++
        }
      }
      // Keep event history for new sources; never merge later revisions over an existing source.
      for (const [name, entries] of Object.entries(extraRows)) for (const row of entries) {
        if (await this.table(name).get(String(row.id))) continue
        if (name === 'progressionEvents') {
          const e = row as unknown as ProgressionEvent
          const isNewUser = inserted.get('users')?.has(e.userId)
          const isNewSource = inserted.get(e.kind === 'workout' ? 'workoutSessions' : e.kind === 'achievement' ? 'achievements' : 'quests')?.has(e.sourceId)
          if ((e.kind === 'adjustment' && !isNewUser) || (!isNewUser && !isNewSource)) continue
        }
        await this.table(name).add(row); imported++
      }
      await initializeProgression(this)
      const owner = (await this.users.toArray()).find(u => u.source !== 'demo')
      if (owner) for (const id of inserted.get('workoutSessions') ?? []) {
        const s = await this.workoutSessions.get(id)
        if (s?.source !== 'demo' && s?.status !== 'draft') await setAward(this, owner.id, 'workout', id, s!.xpEarned)
      }
      for (const row of auditEntries) if (!await this.auditLog.get(row.id)) await this.auditLog.add(row)
      await this.rebuildRecords()
      await refreshRpg(this)
      await this.log('merge-backup', String(imported))
      return imported
    })
  }

  async refreshRpg(): Promise<void> { await this.transaction('rw', this.tables, () => refreshRpg(this)) }
  private async clearInvalidPlanLinks(id: string, retainedDate?: string): Promise<void> {
    for (const plan of await this.trainingPlans.toArray()) {
      if (plan.days.some(d => d.completedSessionId === id && d.date !== retainedDate)) await this.trainingPlans.put({ ...plan, days: plan.days.map(d => d.completedSessionId === id && d.date !== retainedDate ? { ...d, completedSessionId: null } : d) })
    }
  }
  async claimQuest(id: string, recovery = false): Promise<void> { await claimQuest(this, id, recovery) }
  async applyCosmetic(id: string, kind: 'title' | 'accent'): Promise<void> { await applyCosmetic(this, id, kind) }
  async savePlan(plan: TrainingPlan): Promise<void> {
    validatePhase5('trainingPlans', plan)
    await this.transaction('rw', this.tables, async () => {
      if ((await this.users.get(plan.userId))?.source === 'demo' || !await this.users.get(plan.userId)) throw new Error('Hồ sơ không tồn tại.')
      for (const day of plan.days) {
        for (const ex of day.exercises) if (!await this.exercises.get(ex.exerciseId)) throw new Error('Bài tập không tồn tại.')
        if (day.completedSessionId) {
          const s = await this.workoutSessions.get(day.completedSessionId)
          if (!s || s.source === 'demo' || s.status === 'draft' || s.date !== day.date) throw new Error('Chọn buổi đã hoàn thành đúng ngày.')
        }
      }
      await this.trainingPlans.put(plan); await this.log('save-plan', plan.id)
    })
  }
  async saveNutritionSettings(settings: NutritionSettings): Promise<void> {
    validatePhase5('nutritionSettings', settings)
    await this.transaction('rw', this.users, this.nutritionSettings, this.auditLog, async () => {
      const user = await this.users.get(settings.userId)
      if (!user || user.source === 'demo') throw new Error('Hồ sơ không tồn tại.')
      await this.nutritionSettings.put(settings); await this.log('nutrition-settings', settings.id)
    })
  }
  async saveNutrition(entry: NutritionEntry): Promise<void> {
    validatePhase5('nutritionEntries', entry)
    await this.transaction('rw', this.users, this.nutritionSettings, this.nutritionEntries, this.auditLog, async () => {
      const user = await this.users.get(entry.userId)
      if (!user || user.source === 'demo') throw new Error('Hồ sơ không tồn tại.')
      const settings = await this.nutritionSettings.get(`nutrition:${entry.userId}`) ?? defaultNutritionSettings(entry.userId)
      const previous = await this.nutritionEntries.get(entry.id)
      if (entry.energyKcal !== null && !energyAllowed(settings) && entry.energyKcal !== previous?.energyKcal) throw new Error('Năng lượng tùy chọn chỉ bật khi xác nhận từ 18 tuổi.')
      if (previous && previous.userId !== entry.userId) throw new Error('Không được sửa nhật ký hồ sơ khác.')
      await this.nutritionEntries.put(entry); await this.log('save-nutrition', entry.id)
    })
  }
  async deletePlanningEntry(table: 'trainingPlans' | 'nutritionEntries', id: string): Promise<void> {
    await this.transaction('rw', this.table(table), this.auditLog, async () => { await this.table(table).delete(id); await this.log('delete-' + table, id) })
  }
}
export const db = new FitForgeDatabase()
