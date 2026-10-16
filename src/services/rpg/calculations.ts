import type { Achievement, Quest, UserProfile, WorkoutSession } from '@/types'
import { estimatedOneRepMax, trainingVolume } from '@/services/workout/calculations'

export function levelThreshold(level: number): number {
  if (!Number.isInteger(level) || level < 1 || level > 100) throw new Error('Cấp RPG không hợp lệ.')
  let value = 1000
  for (let n = 1; n < level; n++) value = Math.round(value * 1.25)
  return value
}
export function totalProfileXp(user: Pick<UserProfile, 'level' | 'currentXp'>): number {
  levelThreshold(user.level)
  let total = user.currentXp
  for (let level = 1; level < user.level; level++) total += levelThreshold(level)
  return total
}
export function levelFromXp(total: number) {
  let level = 1, currentXp = Math.max(0, Math.round(Number.isFinite(total) ? total : 0)), nextLevelXp = 1000
  while (currentXp >= nextLevelXp) { currentXp -= nextLevelXp; level++; nextLevelXp = levelThreshold(level) }
  return { level, currentXp, nextLevelXp }
}
/** Retains Phase 2's base formula, caps volume bonus to discourage load chasing. */
export function workoutXp(volume: number): number { return 200 + Math.min(200, Math.round(Math.max(0, Number.isFinite(volume) ? volume : 0) * 0.035)) }
export function shiftDate(date: string, days: number): string { return new Date(Date.parse(date + 'T12:00:00Z') + days * 86400000).toISOString().slice(0, 10) }
export function weekStart(date: string): string {
  const day = new Date(date + 'T12:00:00Z').getUTCDay()
  return shiftDate(date, -(day + 6) % 7)
}
export const completedWorkouts = (rows: WorkoutSession[], today: string) => rows.filter(s => s.source !== 'demo' && s.status !== 'draft' && s.date <= today)
export function questDefinitions(date: string, workouts: WorkoutSession[]): Quest[] {
  const week = weekStart(date), end = shiftDate(week, 6)
  const dates = new Set(workouts.map(s => s.date))
  const daily = dates.has(date) ? 1 : 0
  const weekly = Math.min(3, [...dates].filter(d => d >= week && d <= end).length)
  const make = (kind: NonNullable<Quest['questKind']>, start: string, stop: string, progress: number, target: number, xp: number, gold: number, title: string, description: string): Quest => ({
    id: `rpg:${kind}:${start}`, titleVi: title, descriptionVi: description, frequency: kind === 'workout-day' ? 'daily' : 'weekly', currentProgress: progress,
    targetProgress: target, unitVi: kind === 'recovery' ? 'lần' : 'ngày', rewardXp: xp, rewardGold: gold,
    isCompleted: progress >= target, isClaimed: false, periodStart: start, periodEnd: stop, questKind: kind,
  })
  return [make('workout-day', date, date, daily, 1, 50, 5, 'Buổi tập trong ngày', 'Một buổi phù hợp kế hoạch là đủ. Ngày nghỉ không cần hoàn thành nhiệm vụ này.'),
    make('workout-week', week, end, weekly, 3, 150, 15, 'Nhịp tập trong tuần', 'Ba ngày tập riêng biệt; không cần tập liên tiếp. Tập thêm không tăng thưởng nhiệm vụ.'),
    make('recovery', week, end, 0, 1, 30, 5, 'Chăm sóc phục hồi', 'Tự xác nhận đã dành thời gian nghỉ ngơi, ngủ và lắng nghe cơ thể. Không cần tập thêm.')]
}
export function achievementDefinitions(workouts: WorkoutSession[]): Achievement[] {
  const sorted = [...workouts].sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id))
  const volume = sorted.reduce((total, s) => total + s.exercises.reduce((n, ex) => n + trainingVolume(ex.sets), 0), 0)
  const weeks = new Map<string, Set<string>>()
  for (const s of sorted) { const key = weekStart(s.date); const dates = weeks.get(key) ?? new Set<string>(); dates.add(s.date); weeks.set(key, dates) }
  const first = new Map<string, number>()
  let improved = 0
  for (const s of sorted) for (const ex of s.exercises) {
    const best = Math.max(0, ...ex.sets.filter(set => set.completed).map(set => estimatedOneRepMax(set.weightKg, set.reps) ?? 0))
    if (best <= 0) continue
    if (!first.has(ex.exerciseId)) first.set(ex.exerciseId, best)
    else if (best >= first.get(ex.exerciseId)! * 1.05) improved = 1
  }
  const make = (code: string, title: string, description: string, category: Achievement['category'], current: number, max: number, rewardTitle: string, rewardAccent: string): Achievement => ({
    id: `rpg-ach:${code}`, code, titleVi: title, descriptionVi: description, category, tier: 'bronze', icon: 'Award', currentVal: Math.min(current, max), maxVal: max,
    unlocked: current >= max, rewardXp: 0, rewardGold: 0, rewardTitle, rewardAccent,
  })
  return [make('first', 'Khởi đầu', 'Lưu buổi tập đầu tiên.', 'workout', sorted.length, 1, 'Người khởi đầu', '#14b8a6'),
    make('strength', 'Tiến bộ sức mạnh', '1RM ước tính của một bài tăng ít nhất 5% so với buổi đầu (1–10 reps). Không cần thử sức tối đa.', 'strength', improved, 1, 'Bền bỉ tiến bộ', '#f59e0b'),
    make('volume', 'Tích lũy dài hạn', 'Tổng 10.000 kg volume qua các buổi đã lưu; không có hạn hoàn thành.', 'workout', volume, 10000, 'Người tích lũy', '#a78bfa'),
    make('consistency', 'Nhịp tập bền vững', 'Hai tuần có ít nhất ba ngày tập riêng biệt, không bắt buộc liên tiếp.', 'streak', [...weeks.values()].filter(days => days.size >= 3).length, 2, 'Nhịp tập bền vững', '#38bdf8')]
}
