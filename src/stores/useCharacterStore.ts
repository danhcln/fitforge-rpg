import { create } from 'zustand'
import type { CharacterState, CharacterMode, BodyMorphParameters } from '@/types'
import { mockCharacterState } from '@/mock'

interface CharacterStoreState {
  character: CharacterState
  setMode: (mode: CharacterMode) => void
  updateCurrentBody: (params: Partial<BodyMorphParameters>) => void
  updateGoalBody: (params: Partial<BodyMorphParameters>) => void
  toggleAura: () => void
  resetToDefault: () => void
}

export const useCharacterStore = create<CharacterStoreState>((set) => ({
  character: mockCharacterState,

  setMode: (mode: CharacterMode) => {
    set((state) => ({
      character: { ...state.character, mode },
    }))
  },

  updateCurrentBody: (params: Partial<BodyMorphParameters>) => {
    set((state) => ({
      character: {
        ...state.character,
        currentBody: { ...state.character.currentBody, ...params },
      },
    }))
  },

  updateGoalBody: (params: Partial<BodyMorphParameters>) => {
    set((state) => ({
      character: {
        ...state.character,
        goalBody: { ...state.character.goalBody, ...params },
      },
    }))
  },

  toggleAura: () => {
    set((state) => ({
      character: {
        ...state.character,
        auraUnlocked: !state.character.auraUnlocked,
      },
    }))
  },

  resetToDefault: () => {
    set({ character: mockCharacterState })
  },
}))
