export interface SegmentalLean {
  rightArmKg: number
  rightArmPercent: number
  leftArmKg: number
  leftArmPercent: number
  trunkKg: number
  trunkPercent: number
  rightLegKg: number
  rightLegPercent: number
  leftLegKg: number
  leftLegPercent: number
}

export interface BodyMeasurement {
  id: string
  date: string
  weightKg: number
  smmKg: number // Skeletal Muscle Mass (Khối lượng cơ xương)
  pbfPercent: number // Percent Body Fat (Tỷ lệ mỡ cơ thể)
  bmi: number // Chỉ số khối cơ thể
  bodyFatMassKg: number // Khối lượng mỡ
  bmrKcal: number // Tỷ lệ trao đổi chất cơ bản
  visceralFatLevel: number // Mức mỡ nội tạng (1 - 20)
  bodyWaterKg: number // Lượng nước trong cơ thể
  boneMassKg: number // Khối lượng khoáng chất xương
  inBodyScore?: number // Điểm InBody (ví dụ: 78/100)
  segmentalLean: SegmentalLean
  notes?: string
}
