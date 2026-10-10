export type AvatarClass = 'Juggernaut' | 'Aesthetic' | 'Powerlifter' | 'All-Rounder'

export interface UserProfile {
  id: string
  name: string
  title: string
  level: number
  currentXp: number
  nextLevelXp: number
  gold: number
  gems: number
  energy: number
  maxEnergy: number
  streakDays: number
  lastActiveDate: string
  avatarClass: AvatarClass
  createdAt: string
}
