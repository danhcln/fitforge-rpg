import { create } from 'zustand'
import type { Quest, Achievement } from '@/types'
export const useQuestStore = create<{ quests: Quest[]; achievements: Achievement[] }>(() => ({ quests: [], achievements: [] }))
