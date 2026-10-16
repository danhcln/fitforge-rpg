import type { CharacterState, UserProfile } from '@/types'
import { mockCharacterState } from '@/mock'
import { localDate } from '@/services/workout/calculations'

export function defaultUser(): UserProfile {
  return { id: 'local-user', name: 'Chiến binh', title: 'Tân binh', level: 1, currentXp: 0,
    nextLevelXp: 1000, gold: 0, gems: 0, energy: 100, maxEnergy: 100, streakDays: 0,
    lastActiveDate: '', avatarClass: 'All-Rounder', createdAt: localDate() }
}
export function defaultCharacter(userId = 'local-user'): CharacterState {
  return { ...structuredClone(mockCharacterState), id: `character:${userId}`, userId,
    auraUnlocked: false, equippedGear: {}, unlockedSkins: ['Tân binh'] }
}
