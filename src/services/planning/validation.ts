import type { TrainingPlan, NutritionEntry, NutritionSettings, ProgressionEvent } from '@/types'
import { shiftDate, weekStart } from '@/services/rpg/calculations'

const fail = () => { throw new Error('Dữ liệu kế hoạch / dinh dưỡng / tiến trình không hợp lệ.') }
const record = (v: unknown): Record<string, unknown> => { if (!v || typeof v !== 'object' || Array.isArray(v)) return fail(); return v as Record<string, unknown> }
function keys(v: unknown, fields: string[]) { const r = record(v); if (Object.keys(r).some(k => !fields.includes(k)) || fields.some(k => !(k in r))) fail(); return r }
const text = (v: unknown, max = 300) => { if (typeof v !== 'string' || !v.trim() || v.length > max) fail() }
export function validDate(v: unknown): asserts v is string { if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v) || !Number.isFinite(Date.parse(v)) || new Date(v).toISOString().slice(0, 10) !== v) fail() }
const number = (v: unknown, min: number, max: number, integer = false) => { if (typeof v !== 'number' || !Number.isFinite(v) || v < min || v > max || (integer && !Number.isInteger(v))) fail() }
const bool = (v: unknown) => { if (typeof v !== 'boolean') fail() }
export const phase5Tables = ['progressionEvents', 'trainingPlans', 'nutritionEntries', 'nutritionSettings'] as const
export function validatePhase5(table: string, value: unknown): void {
  const r = record(value); text(r.id); text(r.userId)
  if (table === 'progressionEvents') {
    keys(r, ['id', 'userId', 'kind', 'sourceId', 'revision', 'xpDelta', 'goldDelta', 'at'])
    if (!['baseline', 'workout', 'quest', 'achievement', 'adjustment'].includes(String(r.kind))) fail()
    text(r.sourceId); number(r.revision, 0, 1000000, true); number(r.xpDelta, -1e9, 1e9, true); number(r.goldDelta, -1e9, 1e9, true)
    if (typeof r.at !== 'string' || !Number.isFinite(Date.parse(r.at))) fail()
    const e = r as unknown as ProgressionEvent
    if (e.id !== (e.kind === 'baseline' ? `baseline:${e.userId}` : `${e.kind}:${e.userId}:${e.sourceId}:${e.revision}`)) fail()
    if (e.kind === 'baseline' && (e.sourceId !== e.userId || e.revision !== 0)) fail()
    if (e.kind === 'achievement' && (e.xpDelta !== 0 || e.goldDelta !== 0 || e.revision !== 0)) fail()
    if (e.kind === 'workout' && e.goldDelta !== 0) fail()
    if (e.kind === 'adjustment' && (e.sourceId !== 'floor' || e.xpDelta < 0 || e.goldDelta < 0 || (!e.xpDelta && !e.goldDelta))) fail()
  } else if (table === 'trainingPlans') {
    keys(r, ['id', 'userId', 'weekStart', 'split', 'days']); validDate(r.weekStart)
    if (weekStart(r.weekStart) !== r.weekStart || !['full-body', 'upper-lower', 'ppl', 'custom'].includes(String(r.split)) || !Array.isArray(r.days) || r.days.length !== 7) fail()
    if (r.id !== `plan:${r.userId}:${r.weekStart}`) fail()
    for (const [i, value] of (r as unknown as TrainingPlan).days.entries()) {
      const d = keys(value, ['date', 'title', 'isRestDay', 'exercises', 'completedSessionId']); validDate(d.date)
      if (d.date !== shiftDate(r.weekStart, i)) fail(); text(d.title, 200); bool(d.isRestDay)
      if (d.completedSessionId !== null) text(d.completedSessionId)
      if (!Array.isArray(d.exercises) || d.exercises.length > 20 || (d.isRestDay && d.exercises.length)) fail()
      const ids = new Set<string>()
      for (const entry of d.exercises as TrainingPlan['days'][0]['exercises']) {
        const ex = keys(entry, ['exerciseId', 'sets', 'reps', 'weightKg']); text(ex.exerciseId)
        if (ids.has(entry.exerciseId)) fail(); ids.add(entry.exerciseId)
        number(ex.sets, 1, 10, true); number(ex.reps, 1, 50, true); number(ex.weightKg, 0, 500)
      }
    }
  } else if (table === 'nutritionEntries') {
    keys(r, ['id', 'userId', 'date', 'meal', 'name', 'portion', 'proteinGrams', 'carbGrams', 'fatGrams', 'energyKcal', 'waterMl'])
    validDate(r.date); text(r.name); text(r.portion)
    if (!['breakfast', 'lunch', 'dinner', 'snack', 'hydration'].includes(String(r.meal))) fail()
    for (const field of ['proteinGrams', 'carbGrams', 'fatGrams', 'energyKcal']) if (r[field] !== null) number(r[field], 0, field === 'energyKcal' ? 10000 : 1000)
    number(r.waterMl, 0, 10000)
    const n = r as unknown as NutritionEntry
    if (n.meal === 'hydration' && (n.waterMl <= 0 || [n.proteinGrams, n.carbGrams, n.fatGrams, n.energyKcal].some(x => x !== null))) fail()
  } else if (table === 'nutritionSettings') {
    keys(r, ['id', 'userId', 'ageYears', 'energyEnabled', 'hydrationReminder'])
    if (r.ageYears !== null) number(r.ageYears, 1, 120, true)
    bool(r.energyEnabled); bool(r.hydrationReminder)
    if ((r as unknown as NutritionSettings).energyEnabled && (r.ageYears === null || Number(r.ageYears) < 18)) fail()
    if (r.id !== `nutrition:${r.userId}`) fail()
  } else fail()
}
