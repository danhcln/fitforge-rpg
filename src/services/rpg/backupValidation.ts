import type { Achievement, ProgressionEvent, Quest, UserProfile, WorkoutSession } from '@/types'
import { achievementDefinitions, questDefinitions, totalProfileXp } from './calculations'

/** Validate a v4 snapshot before merging it; existing destination records still win. */
export function validateProgressionSnapshot(users: (UserProfile & { source?: string })[], sessions: WorkoutSession[], quests: Quest[], achievements: Achievement[], events: ProgressionEvent[]): void {
  const fail = () => { throw new Error('Nhật ký XP không khớp dữ liệu trong sao lưu.') }
  const realUsers = users.filter(u => u.source !== 'demo')
  if (events.some(e => !realUsers.some(u => u.id === e.userId))) fail()
  for (const user of realUsers) {
    const owned = events.filter(e => e.userId === user.id)
    if (!owned.some(e => e.kind === 'baseline') || owned.reduce((n, e) => n + e.xpDelta, 0) !== totalProfileXp(user) || owned.reduce((n, e) => n + e.goldDelta, 0) !== user.gold) fail()
  }
  const groups = new Map<string, ProgressionEvent[]>()
  for (const e of events.filter(e => e.kind !== 'baseline')) { const key = `${e.kind}:${e.sourceId}`; groups.set(key, [...groups.get(key) ?? [], e]) }
  for (const group of groups.values()) {
    const { kind, sourceId } = group[0], xp = group.reduce((n, e) => n + e.xpDelta, 0), gold = group.reduce((n, e) => n + e.goldDelta, 0)
    if (kind === 'workout') {
      const s = sessions.find(s => s.id === sourceId)
      if (xp !== (s && s.source !== 'demo' && s.status !== 'draft' ? s.xpEarned : 0) || gold !== 0) fail()
    } else if (kind === 'quest') {
      const q = quests.find(q => q.id === sourceId)
      if (!q?.periodStart || !q.questKind) return fail()
      const definition = questDefinitions(q.periodStart, []).find(d => d.id === q.id)
      if (!definition || xp !== (q.isClaimed && q.isCompleted ? definition.rewardXp : 0) || gold !== (q.isClaimed && q.isCompleted ? definition.rewardGold : 0)) fail()
    } else if (kind === 'achievement') {
      if (!achievementDefinitions([]).some(a => a.id === sourceId) || !achievements.some(a => a.id === sourceId && a.unlocked) || xp || gold) fail()
    }
  }
  for (const s of sessions.filter(s => s.source !== 'demo' && s.status !== 'draft')) if (!groups.has(`workout:${s.id}`)) fail()
}
