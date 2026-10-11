import { create } from 'zustand'
import type { CharacterState, CharacterMode, BodyMorphParameters } from '@/types'
import { defaultCharacter } from '@/services/db/defaults'
import { db } from '@/services/db'
import { BodyCompositionToAvatar, type BodyAvatarMapping } from '@/services/bodyComposition/BodyCompositionToAvatar'
interface CharacterStoreState {
  character: CharacterState
  error: string | null
  pendingWrites: number
  measuredBody: BodyAvatarMapping
  goalBodies: Record<string, BodyAvatarMapping>
  selectedGoalId: string | null
  selectBodyGoal: (id: string | null) => void
  setMode: (mode: CharacterMode) => void
  updateCurrentBody: (params: Partial<BodyMorphParameters>) => void
  updateGoalBody: (params: Partial<BodyMorphParameters>) => void
  toggleAura: () => void
  resetToDefault: () => void
}
let writes = Promise.resolve()
export const useCharacterStore = create<CharacterStoreState>((set, get) => {
  const update = (character: CharacterState) => {
    set(state => ({ character, error: null, pendingWrites: state.pendingWrites + 1 }))
    writes = writes.then(() => db.putEntity('characterStates', character)).catch(error => set({ error: String(error) }))
      .finally(() => set(state => ({ pendingWrites: state.pendingWrites - 1 })))
  }
  return {
    character: defaultCharacter(), error: null, pendingWrites: 0,
    measuredBody: BodyCompositionToAvatar(), goalBodies: {}, selectedGoalId: null,
    selectBodyGoal: selectedGoalId => set({ selectedGoalId }),
    setMode: mode => update({ ...get().character, mode }),
    updateCurrentBody: params => update({ ...get().character, currentBody: { ...get().character.currentBody, ...params } }),
    updateGoalBody: params => update({ ...get().character, goalBody: { ...get().character.goalBody, ...params } }),
    toggleAura: () => update({ ...get().character, auraUnlocked: !get().character.auraUnlocked }),
    resetToDefault: () => update({ ...defaultCharacter(get().character.userId), id: get().character.id }),
  }
})
