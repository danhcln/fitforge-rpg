import type { BodyMeasurement, BodyMetric, DeviceReference } from '@/types/inbody'
import { metricLabels } from './presentation'

export function available(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}
export function calculateBMI(weight?: number | null, heightCm?: number | null): number | null {
  if (!available(weight) || weight <= 0 || !available(heightCm) || heightCm <= 0) return null
  const result = weight / (heightCm / 100) ** 2
  return Number.isFinite(result) ? result : null
}
export function calculateBodyFatMass(weight?: number | null, pbf?: number | null): number | null {
  return available(weight) && weight > 0 && available(pbf) && pbf >= 0 && pbf <= 100 ? weight * (pbf / 100) : null
}
export function calculateFatFreeMass(weight?: number | null, fatMass?: number | null): number | null {
  return available(weight) && weight > 0 && available(fatMass) && fatMass >= 0 && fatMass <= weight ? weight - fatMass : null
}
export function composition(measurement: BodyMeasurement) {
  const calculatedFatMass = calculateBodyFatMass(measurement.weightKg, measurement.pbfPercent)
  const fatMass = measurement.bodyFatMassKg ?? calculatedFatMass
  return {
    bmi: calculateBMI(measurement.weightKg, measurement.heightCm), calculatedFatMass,
    fatFreeMass: calculateFatFreeMass(measurement.weightKg, fatMass),
    fatFreeMassBasis: available(measurement.bodyFatMassKg) ? 'device' : 'calculated',
  } as const
}
export const bodyMetrics: BodyMetric[] = ['weightKg', 'smmKg', 'pbfPercent', 'bodyFatMassKg', 'bmi']
export function metricValue(measurement: BodyMeasurement | null | undefined, metric: BodyMetric): number | null {
  if (!measurement) return null
  // History uses only height-derived BMI; legacy device BMI remains separate.
  return metric === 'bmi' ? composition(measurement).bmi : measurement[metric] ?? null
}
export function compareMeasurements(current?: BodyMeasurement | null, previous?: BodyMeasurement | null): Record<BodyMetric, number | null> {
  return Object.fromEntries(bodyMetrics.map(metric => {
    const a = metricValue(current, metric), b = metricValue(previous, metric)
    return [metric, available(a) && available(b) ? a - b : null]
  })) as Record<BodyMetric, number | null>
}
export const units: Record<BodyMetric, DeviceReference['unit']> = { weightKg: 'kg', smmKg: 'kg', pbfPercent: '%', bodyFatMassKg: 'kg', bmi: 'kg/m²' }
export function validReference(metric: BodyMetric, ref: DeviceReference): boolean {
  return available(ref.min) && available(ref.max) && ref.min >= 0 && ref.max > ref.min && ref.max <= 1000
    && (metric !== 'pbfPercent' || ref.max <= 100) && ref.unit === units[metric]
    && typeof ref.label === 'string' && !!ref.label.trim() && ref.label.length <= 200
    && ['individual', 'adult'].includes(ref.scope)
}
export function classifyMetric(metric: BodyMetric, value: number | null | undefined, reference?: DeviceReference, ageYears?: number | null) {
  if (!available(value) || !reference || !validReference(metric, reference)) return { status: 'unclassified', explanation: 'Không có số đo hoặc khoảng tham chiếu hợp lệ.' } as const
  if (reference.scope === 'adult' && (!available(ageYears) || ageYears < 18)) return { status: 'unclassified', explanation: 'Khoảng người lớn không áp dụng khi dưới 18 tuổi hoặc chưa biết tuổi.' } as const
  const status = value < reference.min ? 'low' : value > reference.max ? 'high' : 'normal'
  return { status, explanation: `${metricLabels[metric]}: ${reference.min}–${reference.max} ${reference.unit} · ${reference.label} · ${reference.scope === 'adult' ? 'người lớn' : 'cá nhân theo phiếu'}` } as const
}
