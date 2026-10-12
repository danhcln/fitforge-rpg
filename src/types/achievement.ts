export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'mythic'
export type AchievementCategory = 'workout' | 'strength' | 'inbody' | 'streak' | 'quest'

export interface Achievement {
  id: string
  code: string
  titleVi: string
  descriptionVi: string
  category: AchievementCategory
  tier: AchievementTier
  icon: string
  currentVal: number
  maxVal: number
  unlocked: boolean
  unlockedAt?: string
  rewardXp: number
  rewardGold: number
  rewardTitle?: string
  rewardAccent?: string
}

export type QuestFrequency = 'daily' | 'weekly' | 'epic'

export interface Quest {
  id: string
  titleVi: string
  descriptionVi: string
  frequency: QuestFrequency
  currentProgress: number
  targetProgress: number
  unitVi: string
  rewardXp: number
  rewardGold: number
  isCompleted: boolean
  isClaimed: boolean
  periodStart?: string
  periodEnd?: string
  questKind?: 'workout-day' | 'workout-week' | 'recovery'
}
