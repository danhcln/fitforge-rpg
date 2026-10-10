import { create } from 'zustand'
import type { Quest, Achievement } from '@/types'
import { mockQuests, mockAchievements } from '@/mock'

interface QuestStoreState {
  quests: Quest[]
  achievements: Achievement[]
  claimQuest: (questId: string) => { xp: number; gold: number } | null
  unlockAchievement: (achievementId: string) => void
}

export const useQuestStore = create<QuestStoreState>((set, get) => ({
  quests: mockQuests,
  achievements: mockAchievements,

  claimQuest: (questId: string) => {
    const quest = get().quests.find((q) => q.id === questId)
    if (!quest || !quest.isCompleted || quest.isClaimed) return null

    set((state) => ({
      quests: state.quests.map((q) =>
        q.id === questId ? { ...q, isClaimed: true } : q
      ),
    }))

    return { xp: quest.rewardXp, gold: quest.rewardGold }
  },

  unlockAchievement: (achievementId: string) => {
    set((state) => ({
      achievements: state.achievements.map((a) =>
        a.id === achievementId
          ? { ...a, unlocked: true, unlockedAt: new Date().toISOString() }
          : a
      ),
    }))
  },
}))
