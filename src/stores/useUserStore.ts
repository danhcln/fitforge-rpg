import { create } from 'zustand'
import type { UserProfile } from '@/types'
import { mockUserProfile } from '@/mock'

interface UserStoreState {
  user: UserProfile
  addXp: (amount: number) => void
  addGold: (amount: number) => void
  spendEnergy: (amount: number) => boolean
  restoreEnergy: (amount: number) => void
  updateProfile: (updates: Partial<UserProfile>) => void
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: mockUserProfile,

  addXp: (amount: number) => {
    set((state) => {
      let newXp = state.user.currentXp + amount
      let newLevel = state.user.level
      let nextXp = state.user.nextLevelXp

      while (newXp >= nextXp) {
        newXp -= nextXp
        newLevel += 1
        nextXp = Math.round(nextXp * 1.25)
      }

      return {
        user: {
          ...state.user,
          level: newLevel,
          currentXp: newXp,
          nextLevelXp: nextXp,
        },
      }
    })
  },

  addGold: (amount: number) => {
    set((state) => ({
      user: { ...state.user, gold: state.user.gold + amount },
    }))
  },

  spendEnergy: (amount: number) => {
    const current = get().user.energy
    if (current < amount) return false
    set((state) => ({
      user: { ...state.user, energy: state.user.energy - amount },
    }))
    return true
  },

  restoreEnergy: (amount: number) => {
    set((state) => ({
      user: {
        ...state.user,
        energy: Math.min(state.user.maxEnergy, state.user.energy + amount),
      },
    }))
  },

  updateProfile: (updates: Partial<UserProfile>) => {
    set((state) => ({
      user: { ...state.user, ...updates },
    }))
  },
}))
