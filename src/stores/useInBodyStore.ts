import { create } from 'zustand'
import type { BodyMeasurement } from '@/types'
import { mockBodyMeasurements } from '@/mock'

interface InBodyStoreState {
  measurements: BodyMeasurement[]
  latestMeasurement: BodyMeasurement
  addMeasurement: (measurement: Omit<BodyMeasurement, 'id'>) => void
  deleteMeasurement: (id: string) => void
}

export const useInBodyStore = create<InBodyStoreState>((set) => ({
  measurements: mockBodyMeasurements,
  latestMeasurement: mockBodyMeasurements[mockBodyMeasurements.length - 1],

  addMeasurement: (measurementData) => {
    set((state) => {
      const newMeasurement: BodyMeasurement = {
        ...measurementData,
        id: `inb_${Date.now()}`,
      }
      const updated = [...state.measurements, newMeasurement]
      return {
        measurements: updated,
        latestMeasurement: newMeasurement,
      }
    })
  },

  deleteMeasurement: (id: string) => {
    set((state) => {
      const filtered = state.measurements.filter((m) => m.id !== id)
      return {
        measurements: filtered,
        latestMeasurement: filtered[filtered.length - 1] || state.latestMeasurement,
      }
    })
  },
}))
