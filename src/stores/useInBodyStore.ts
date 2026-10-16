import { create } from 'zustand'
import type { BodyMeasurement } from '@/types'
import { db } from '@/services/db'
interface InBodyStoreState {
  measurements: BodyMeasurement[]
  latestMeasurement: BodyMeasurement | null
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id'>) => Promise<void>
  updateMeasurement: (measurement: BodyMeasurement) => Promise<void>
  deleteMeasurement: (id: string) => Promise<void>
}
export const useInBodyStore = create<InBodyStoreState>(() => ({
  measurements: [], latestMeasurement: null,
  addMeasurement: async measurement => { await db.saveMeasurement({ ...measurement, id: crypto.randomUUID() }) },
  updateMeasurement: async measurement => { await db.saveMeasurement(measurement, true) },
  deleteMeasurement: async id => { await db.deleteMeasurement(id) },
}))
