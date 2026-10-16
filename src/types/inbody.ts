export interface SegmentalLean {
  rightArmKg?: number | null
  rightArmPercent?: number | null
  leftArmKg?: number | null
  leftArmPercent?: number | null
  trunkKg?: number | null
  trunkPercent?: number | null
  rightLegKg?: number | null
  rightLegPercent?: number | null
  leftLegKg?: number | null
  leftLegPercent?: number | null
}
export type BodyMetric = 'weightKg' | 'smmKg' | 'pbfPercent' | 'bodyFatMassKg' | 'bmi'
export interface DeviceReference {
  min: number
  max: number
  unit: 'kg' | '%' | 'kg/m²'
  label: string
  scope: 'individual' | 'adult'
}
export interface BodyMeasurement {
  id: string
  date: string
  /** Version 3 records unavailable core inputs as null. Legacy rows may omit height. */
  measurementVersion?: 3
  heightCm?: number | null
  weightKg?: number | null
  smmKg?: number | null
  pbfPercent?: number | null
  bodyFatMassKg?: number | null
  /** BMI transcribed from the device, never overwritten by derived BMI. */
  bmi?: number | null
  bmrKcal?: number | null
  visceralFatLevel?: number | null
  bodyWaterKg?: number | null
  boneMassKg?: number | null
  inBodyScore?: number | null
  ageYears?: number | null
  segmentalLean?: SegmentalLean
  references?: Partial<Record<BodyMetric, DeviceReference>>
  notes?: string
}
