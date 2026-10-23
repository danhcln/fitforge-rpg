import * as mocks from '@/mock'
import { validateMeasurement } from '@/services/bodyComposition/validation'
import { validateWorkout } from '@/services/workout/calculations'
import type { WorkoutSession } from '@/types'

export type LocalRecord<T> = T & { source?: 'real' | 'demo' }
export const examples: Record<string, Record<string, unknown>> = {
  users: { ...mocks.mockUserProfile }, exercises: { ...mocks.mockExercises[0] },
  workoutSessions: { ...mocks.mockWorkoutSessions[0] }, personalRecords: { ...mocks.mockPersonalRecords[0] },
  bodyMeasurements: { ...mocks.mockBodyMeasurements[0] }, goals: { ...mocks.mockGoal },
  characterStates: { ...mocks.mockCharacterState }, achievements: { ...mocks.mockAchievements[0] },
  quests: { ...mocks.mockQuests[0] },
}
const optional = new Set(['source', 'notes', 'secondaryMuscles', 'instructionsVi', 'rpe', 'isWarmup', 'isPr',
  'inBodyScore', 'previousWeightKg', 'unlockedAt', 'headgear', 'wristWraps', 'liftingBelt', 'kneeSleeves',
  'auraColor', 'status', 'startedAt', 'kind', 'value', 'weightKg', 'sessionId', 'editOf', 'visualSource', 'appearance',
  'overallVolume', 'upperBodyMuscle', 'lowerBodyMuscle', 'armProportion', 'legProportion', 'trunkProportion',
  'periodStart', 'periodEnd', 'questKind', 'rewardTitle', 'rewardAccent', 'planId', 'plannedDate', 'hairColor'])
const extras = { source: 'real', status: 'completed', startedAt: 0, kind: 'weight', value: 0,
  weightKg: 0, sessionId: '', rpe: 0, isWarmup: false, isPr: false, notes: '', unlockedAt: '',
  inBodyScore: 0, previousWeightKg: 0, instructionsVi: '', secondaryMuscles: [''],
  headgear: '', wristWraps: '', liftingBelt: '', kneeSleeves: '', auraColor: '', editOf: '', visualSource: 'measurement', hairColor: '#30231e',
  appearance: { preset: 'forge', skinColor: '#a67758', clothingColor: '#263b50', accentColor: '#14b8a6', clothing: 'training' },
  overallVolume: 0, upperBodyMuscle: 0, lowerBodyMuscle: 0, armProportion: 0, legProportion: 0, trunkProportion: 0,
  periodStart: '', periodEnd: '', questKind: 'workout-day', rewardTitle: '', rewardAccent: '#14b8a6', planId: '', plannedDate: '' }
const enums: Record<string, string[]> = {
  source: ['real', 'demo'], status: ['draft', 'completed'], kind: ['weight', 'reps', 'volume', 'estimated1RM'],
  muscleGroup: ['Ngực', 'Lưng', 'Chân', 'Vai', 'Tay', 'Bụng', 'Toàn thân'],
  equipment: ['Tạ đơn', 'Tạ đòn', 'Máy tập', 'Dây cáp', 'Bodyweight'],
  avatarClass: ['Juggernaut', 'Aesthetic', 'Powerlifter', 'All-Rounder'], mode: ['current', 'goal'],
  tier: ['bronze', 'silver', 'gold', 'mythic'], frequency: ['daily', 'weekly', 'epic'],
  visualSource: ['measurement', 'manual'], preset: ['forge', 'scout', 'guardian'], clothing: ['training', 'suit', 'shorts'],
  questKind: ['workout-day', 'workout-week', 'recovery'],
}
export function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) throw new Error('Dữ liệu phải là đối tượng JSON.')
  return value as Record<string, unknown>
}
function shape(value: unknown, template: unknown, key = ''): void {
  if (Array.isArray(template)) {
    if (!Array.isArray(value) || value.length > 100000) throw new Error(`Mảng ${key} không hợp lệ.`)
    value.forEach(item => shape(item, template[0] ?? '', key))
  } else if (template !== null && typeof template === 'object') {
    const row = object(value)
    const schema = template as Record<string, unknown>
    for (const [field, sample] of Object.entries(schema)) {
      if (row[field] === undefined && optional.has(field)) continue
      shape(row[field], sample, field)
    }
    for (const [field, entry] of Object.entries(row)) {
      if (entry === undefined && optional.has(field)) continue
      if (!(field in schema)) {
        if (!(field in extras)) throw new Error(`Trường không được hỗ trợ: ${field}`)
        shape(entry, extras[field as keyof typeof extras], field)
      }
    }
  } else {
    if (typeof value !== typeof template) throw new Error(`Kiểu dữ liệu ${key} không hợp lệ.`)
    if (typeof value === 'number') {
      if (!Number.isFinite(value) || value < 0 || value > (key === 'startedAt' ? 8.64e15 : 1e9)) throw new Error(`Giá trị ${key} không hợp lệ.`)
      if ((['pbfPercent', 'currentPbfPercent', 'targetPbfPercent', 'progressPercent', 'inBodyScore'].includes(key)) && value > 100) throw new Error(`${key} vượt quá 100.`)
      if (['rightArmPercent', 'leftArmPercent', 'trunkPercent', 'rightLegPercent', 'leftLegPercent'].includes(key) && value > 300) throw new Error(`${key} vượt quá 300.`)
      if (['level', 'nextLevelXp', 'maxEnergy', 'targetProgress', 'maxVal'].includes(key) && value <= 0) throw new Error(`${key} cần lớn hơn 0.`)
      if (['level', 'reps', 'setNumber', 'streakDays', 'targetWeeklyWorkouts'].includes(key) && !Number.isInteger(value)) throw new Error(`${key} cần là số nguyên.`)
      if (['fatMorph', 'muscleMorph', 'definition', 'overallVolume', 'upperBodyMuscle', 'lowerBodyMuscle', 'armProportion', 'legProportion', 'trunkProportion'].includes(key) && value > 1) throw new Error(`${key} vượt quá 1.`)
      if (key === 'heightCm' && (value < 80 || value > 250)) throw new Error('Chiều cao avatar cần nằm trong 80–250 cm.')
      if (['chestWidth', 'shoulderWidth', 'waistWidth', 'armThickness', 'legThickness'].includes(key) && (value < 0.5 || value > 2)) throw new Error(`${key} cần nằm trong 0.5–2.`)
      if (key === 'targetWeeklyWorkouts' && value > 14) throw new Error('Số buổi tập mục tiêu vượt quá 14 / tuần.')
    }
    if (typeof value === 'string') {
      if (value.length > 10000 || (['id', 'name', 'nameVi', 'nameEn', 'title', 'exerciseId', 'userId', 'exerciseName'].includes(key) && !value.trim())) throw new Error(`Chuỗi ${key} không hợp lệ.`)
      if (enums[key] && !enums[key].includes(value)) throw new Error(`${key} không được hỗ trợ.`)
      if (['skinColor', 'hairColor', 'clothingColor', 'accentColor', 'rewardAccent'].includes(key) && !/^#[0-9a-fA-F]{6}$/.test(value)) throw new Error('Màu cần có dạng #RRGGBB.')
      if (['date', 'deadline', 'achievedDate', 'createdAt', 'unlockedAt', 'periodStart', 'periodEnd', 'plannedDate'].includes(key) || (key === 'lastActiveDate' && value)) {
        if (!/^\d{4}-\d{2}-\d{2}/.test(value) || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value.slice(0, 10)) throw new Error(`Ngày ${key} không hợp lệ.`)
      }
    }
  }
}
export function validateEntity(table: string, value: unknown): void {
  if (!examples[table]) throw new Error('Bảng không được hỗ trợ.')
  if (table === 'bodyMeasurements') { validateMeasurement(value); return }
  shape(value, examples[table])
  const row = object(value)
  if (table === 'workoutSessions') validateWorkout(value as WorkoutSession, row.status !== 'draft')
  if (table === 'goals' && !['muscle_gain', 'fat_loss', 'strength', 'habit'].includes(String(row.category))) throw new Error('Loại mục tiêu không hợp lệ.')
  if (table === 'achievements' && !['workout', 'strength', 'inbody', 'streak', 'quest'].includes(String(row.category))) throw new Error('Loại danh hiệu không hợp lệ.')
  if (table === 'users' && Number(row.energy) > Number(row.maxEnergy)) throw new Error('Năng lượng vượt quá giới hạn.')
  if (table === 'users' && Number(row.level) > 100) throw new Error('Cấp RPG vượt quá giới hạn lưu trữ.')
}

export const demoRows: Record<string, { id: string }[]> = {
  users: [mocks.mockUserProfile], exercises: [], workoutSessions: mocks.mockWorkoutSessions,
  personalRecords: mocks.mockPersonalRecords, bodyMeasurements: mocks.mockBodyMeasurements,
  goals: [mocks.mockGoal], characterStates: [mocks.mockCharacterState],
  achievements: mocks.mockAchievements, quests: mocks.mockQuests,
}
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') return JSON.stringify(Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)])))
  return JSON.stringify(value)
}
export function classifyLegacy(table: string, row: Record<string, unknown>): 'real' | 'demo' {
  const { source: _source, ...original } = row
  return demoRows[table]?.some(sample => canonical(sample) === canonical(original)) ? 'demo' : 'real'
}
