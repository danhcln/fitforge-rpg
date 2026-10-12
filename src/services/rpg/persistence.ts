import type { FitForgeDatabase } from '@/services/db/db'
import type { ProgressionEvent, Quest } from '@/types'
import { completedWorkouts, levelFromXp, questDefinitions, achievementDefinitions, totalProfileXp } from './calculations'
import { localDate } from '@/services/workout/calculations'
import { appearancePresets } from '@/services/character/evolution'

/** Additive migration bridge: account for existing XP without rewriting legacy workout awards. */
export async function initializeProgression(database: FitForgeDatabase): Promise<void> {
  const users = (await database.users.toArray()).filter(u => u.source !== 'demo')
  const sessions = (await database.workoutSessions.toArray()).filter(s => s.source !== 'demo' && s.status !== 'draft')
  for (const [index, user] of users.entries()) {
    const id = `baseline:${user.id}`
    if (await database.progressionEvents.get(id)) continue
    const owned = index === 0 ? sessions : [] // Existing single-profile workouts do not have an owner column.
    const at = new Date().toISOString()
    await database.progressionEvents.add({ id, userId: user.id, kind: 'baseline', sourceId: user.id, revision: 0,
      xpDelta: totalProfileXp(user) - owned.reduce((n, s) => n + s.xpEarned, 0), goldDelta: user.gold, at })
    for (const s of owned) await database.progressionEvents.add({ id: `workout:${user.id}:${s.id}:0`, userId: user.id, kind: 'workout', sourceId: s.id, revision: 0, xpDelta: s.xpEarned, goldDelta: 0, at })
  }
}
export async function setAward(database: FitForgeDatabase, userId: string, kind: 'workout' | 'quest', sourceId: string, xp: number, gold = 0): Promise<void> {
  const events = (await database.progressionEvents.where('[userId+sourceId]').equals([userId, sourceId]).toArray()).filter(e => e.kind === kind)
  const xpDelta = xp - events.reduce((n, e) => n + e.xpDelta, 0), goldDelta = gold - events.reduce((n, e) => n + e.goldDelta, 0)
  if (!xpDelta && !goldDelta && events.length) return
  const revision = Math.max(-1, ...events.map(e => e.revision)) + 1
  const event: ProgressionEvent = { id: `${kind}:${userId}:${sourceId}:${revision}`, userId, kind, sourceId, revision, xpDelta, goldDelta, at: new Date().toISOString() }
  await database.progressionEvents.add(event)
}
export async function refreshRpg(database: FitForgeDatabase, today = localDate()): Promise<void> {
  await initializeProgression(database)
  const user = (await database.users.toArray()).find(u => u.source !== 'demo')
  if (!user) return
  const workouts = completedWorkouts(await database.workoutSessions.toArray(), today)
  // Materialize current periods and periods containing actual workouts, never mock progress.
  const definitions = new Map<string, Quest>()
  for (const date of new Set([today, ...workouts.map(s => s.date)])) for (const q of questDefinitions(date, workouts)) definitions.set(q.id, q)
  const existing = await database.quests.toArray()
  for (const old of existing.filter(q => q.source !== 'demo' && q.questKind && q.periodStart)) {
    if (!definitions.has(old.id)) {
      const definition = questDefinitions(old.periodStart!, workouts).find(q => q.id === old.id)
      if (definition) definitions.set(old.id, definition)
    }
  }
  for (const definition of definitions.values()) {
    const old = await database.quests.get(definition.id)
    const q = { ...definition, source: 'real' as const, isClaimed: old?.source !== 'demo' && !!old?.isClaimed }
    if (q.questKind === 'recovery' && old?.source !== 'demo' && old?.isCompleted) { q.currentProgress = 1; q.isCompleted = true }
    await database.quests.put(q)
    if (q.isClaimed) await setAward(database, user.id, 'quest', q.id, q.isCompleted ? q.rewardXp : 0, q.isCompleted ? q.rewardGold : 0)
  }
  for (const definition of achievementDefinitions(workouts)) {
    const old = await database.achievements.get(definition.id)
    if (definition.unlocked && !old?.unlocked) {
      const id = `achievement:${user.id}:${definition.id}:0`
      if (!await database.progressionEvents.get(id)) await database.progressionEvents.add({ id, userId: user.id, kind: 'achievement', sourceId: definition.id, revision: 0, xpDelta: 0, goldDelta: 0, at: new Date().toISOString() })
    }
    // Earned cosmetics are permanent history, not withdrawn when a workout is corrected.
    await database.achievements.put({ ...definition, source: 'real', unlocked: definition.unlocked || (old?.source !== 'demo' && !!old?.unlocked),
      ...(old?.unlockedAt ? { unlockedAt: old.unlockedAt } : definition.unlocked ? { unlockedAt: new Date().toISOString() } : {}) })
  }
  const events = await database.progressionEvents.where('userId').equals(user.id).toArray()
  const negativeXp = Math.max(0, -events.reduce((n, e) => n + e.xpDelta, 0)), negativeGold = Math.max(0, -events.reduce((n, e) => n + e.goldDelta, 0))
  // Inconsistent legacy carry balances must not create debt after a deletion.
  if (negativeXp || negativeGold) {
    const revision = Math.max(-1, ...events.filter(e => e.kind === 'adjustment').map(e => e.revision)) + 1
    const adjustment: ProgressionEvent = { id: `adjustment:${user.id}:floor:${revision}`, userId: user.id, kind: 'adjustment', sourceId: 'floor', revision, xpDelta: negativeXp, goldDelta: negativeGold, at: new Date().toISOString() }
    await database.progressionEvents.add(adjustment); events.push(adjustment)
  }
  await database.users.put({ ...user, ...levelFromXp(events.reduce((n, e) => n + e.xpDelta, 0)), gold: Math.max(0, events.reduce((n, e) => n + e.goldDelta, 0)), ...await database.streak() })
}
export async function claimQuest(database: FitForgeDatabase, id: string, recovery = false): Promise<void> {
  await database.transaction('rw', database.tables, async () => {
    const today = localDate()
    await refreshRpg(database, today)
    if (!questDefinitions(today, []).some(definition => definition.id === id)) throw new Error('Chỉ nhận nhiệm vụ do hệ thống tạo trong kỳ hiện tại.')
    let q = await database.quests.get(id)
    if (!q?.questKind || q.source === 'demo' || !q.periodStart || !q.periodEnd || q.periodStart > today || q.periodEnd < today) throw new Error('Nhiệm vụ không thuộc kỳ hiện tại.')
    if (q.isClaimed) return
    if (q.questKind === 'recovery' && recovery) { q = { ...q, isCompleted: true, currentProgress: 1 }; await database.quests.put(q) }
    if (!q.isCompleted) throw new Error('Nhiệm vụ chưa hoàn thành.')
    const user = (await database.users.toArray()).find(u => u.source !== 'demo')
    if (!user) throw new Error('Chưa có hồ sơ.')
    await database.quests.update(q.id, { isClaimed: true })
    await setAward(database, user.id, 'quest', q.id, q.rewardXp, q.rewardGold)
    await refreshRpg(database, today)
    await database.log('claim-quest', id)
  })
}
export async function applyCosmetic(database: FitForgeDatabase, achievementId: string, kind: 'title' | 'accent'): Promise<void> {
  await database.transaction('rw', database.tables, async () => {
    await refreshRpg(database)
    const reward = await database.achievements.get(achievementId)
    if (!reward?.unlocked || reward.source === 'demo' || !reward.id.startsWith('rpg-ach:')) throw new Error('Phần thưởng chưa mở khóa.')
    const user = (await database.users.toArray()).find(u => u.source !== 'demo')
    if (!user) throw new Error('Chưa có hồ sơ.')
    if (kind === 'title' && reward.rewardTitle) await database.users.update(user.id, { title: reward.rewardTitle })
    if (kind === 'accent' && reward.rewardAccent) {
      const character = (await database.characterStates.where('userId').equals(user.id).toArray()).find(c => c.source !== 'demo')
      if (character) await database.characterStates.update(character.id, { appearance: { ...(character.appearance ?? appearancePresets.forge), accentColor: reward.rewardAccent } })
    }
    await database.log('cosmetic-reward', achievementId)
  })
}
