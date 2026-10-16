import type { BodyMetric } from '@/types/inbody'
export const metricLabels: Record<BodyMetric, string> = { weightKg: 'Cân nặng', smmKg: 'Cơ xương SMM', pbfPercent: 'Tỷ lệ mỡ PBF', bodyFatMassKg: 'Khối lượng mỡ', bmi: 'BMI tính toán' }
export const formatBodyValue = (value?: number | null) => typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(2)).toLocaleString('vi-VN') : 'Chưa có'
export const mappingInputLabels: Record<string, string> = { smmKg: 'SMM', 'height/weight': 'chiều cao hoặc cân nặng', pbfPercent: 'PBF',
  'segmentalLean.arms': 'mô nạc hai tay', 'segmentalLean.legs': 'mô nạc hai chân', 'segmentalLean.trunk': 'mô nạc thân' }
