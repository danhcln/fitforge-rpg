import type { BodyMeasurement, BodyMetric, DeviceReference } from '@/types/inbody'
import { available, validReference } from './calculations'
const core = ['heightCm', 'weightKg', 'smmKg', 'pbfPercent', 'bodyFatMassKg'] as const
const limits: Record<string, [number, number]> = { heightCm: [40, 250], weightKg: [0.1, 1000], smmKg: [0, 1000], pbfPercent: [0, 100],
  bodyFatMassKg: [0, 1000], bmi: [0.1, 200], bmrKcal: [1, 10000], visceralFatLevel: [0, 100], bodyWaterKg: [0, 1000], boneMassKg: [0, 1000], inBodyScore: [0, 100], ageYears: [0, 120] }
const segments = ['leftArmKg', 'rightArmKg', 'trunkKg', 'leftLegKg', 'rightLegKg', 'leftArmPercent', 'rightArmPercent', 'trunkPercent', 'leftLegPercent', 'rightLegPercent']
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Phiếu đo cần là đối tượng JSON.')
  return value as Record<string, unknown>
}
function numeric(key: string, value: unknown, min: number, max: number) {
  if (value === undefined || value === null) return
  if (!available(value) || value < min || value > max) throw new Error(`${key}: cần số trong khoảng ${min}–${max}, hoặc để trống khi không có trên phiếu.`)
}
export function validateMeasurement(input: unknown): asserts input is BodyMeasurement {
  const row = record(input)
  const allowed = new Set(['id', 'date', 'measurementVersion', 'source', 'segmentalLean', 'references', 'notes', ...Object.keys(limits)])
  if (Object.keys(row).some(k => !allowed.has(k))) throw new Error('Phiếu đo có trường không được hỗ trợ.')
  if (typeof row.id !== 'string' || !row.id.trim() || row.id.length > 200) throw new Error('ID phiếu đo không hợp lệ.')
  if (typeof row.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(row.date) || !Number.isFinite(Date.parse(row.date)) || new Date(row.date).toISOString().slice(0, 10) !== row.date) throw new Error('Ngày đo không hợp lệ.')
  if (row.measurementVersion !== undefined && row.measurementVersion !== 3) throw new Error('Định dạng phiếu đo không được hỗ trợ.')
  if (row.measurementVersion === 3 && core.some(k => row[k] === undefined)) throw new Error('Thiếu trường cốt lõi: ghi null nếu giá trị không có trên phiếu.')
  if (!core.some(k => available(row[k]))) throw new Error('Cần ít nhất một số đo thực tế.')
  for (const [k, [min, max]] of Object.entries(limits)) numeric(k, row[k], min, max)
  if (row.notes !== undefined && (typeof row.notes !== 'string' || row.notes.length > 10000)) throw new Error('Ghi chú không hợp lệ.')
  if (row.source !== undefined && !['real', 'demo'].includes(String(row.source))) throw new Error('Nguồn dữ liệu không hợp lệ.')
  for (const k of ['smmKg', 'bodyFatMassKg', 'bodyWaterKg', 'boneMassKg']) {
    if (available(row[k]) && available(row.weightKg) && row[k] > row.weightKg) throw new Error(`${k} vượt quá cân nặng.`)
  }
  if (row.segmentalLean !== undefined) {
    const segment = record(row.segmentalLean)
    for (const [k, v] of Object.entries(segment)) {
      if (!segments.includes(k)) throw new Error('Phân đoạn không được hỗ trợ.')
      numeric(k, v, 0, k.endsWith('Kg') ? 1000 : 300)
      if (k.endsWith('Kg') && available(v) && available(row.weightKg) && v > row.weightKg) throw new Error('Khối lượng phân đoạn vượt quá cân nặng.')
    }
    const masses = segments.filter(k => k.endsWith('Kg')).map(k => segment[k])
    if (available(row.weightKg) && masses.every(available) && masses.reduce((sum, value) => sum + value, 0) > row.weightKg) throw new Error('Tổng mô nạc phân đoạn vượt quá cân nặng.')
  }
  if (row.references !== undefined) {
    for (const [metric, raw] of Object.entries(record(row.references))) {
      const ref = record(raw)
      if (!['weightKg', 'smmKg', 'pbfPercent', 'bodyFatMassKg', 'bmi'].includes(metric) || Object.keys(ref).some(k => !['min', 'max', 'unit', 'label', 'scope'].includes(k)) || !validReference(metric as BodyMetric, ref as unknown as DeviceReference)) throw new Error('Khoảng tham chiếu hoặc đơn vị không hợp lệ.')
    }
  }
}
