import { create } from 'zustand'
import type { UserProfile } from '@/types'
import { defaultUser } from '@/services/db/defaults'
import { db } from '@/services/db'
interface UserStoreState {
  user: UserProfile
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>
}
export const useUserStore = create<UserStoreState>((_set, get) => ({
  user: defaultUser(),
  updateProfile: async updates => { await db.putEntity('users', { ...get().user, ...updates, id: get().user.id }) },
}))
