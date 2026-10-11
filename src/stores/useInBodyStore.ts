import { create } from 'zustand'
import type { BodyMeasurement } from '@/types'
import { db } from '@/services/db'
interface InBodyStoreState {
  measurements: BodyMeasurement[]
  latestMeasurement: BodyMeasurement | null
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id'>) => Promise<void>
  deleteMeasurement: (id: string) => Promise<void>
}
export const useInBodyStore = create<InBodyStoreState>(() => ({
  measurements: [], latestMeasurement: null,
  addMeasurement: async measurement => { await db.putEntity('bodyMeasurements', { ...measurement, id: crypto.randomUUID() }) },
  deleteMeasurement: async id => { await db.bodyMeasurements.delete(id) },
}))
