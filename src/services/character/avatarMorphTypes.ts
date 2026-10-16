export interface MorphTargetInfo {
  name: string
  index: number
  meshName: string
  defaultInfluence: number
  currentInfluence: number
  min: number
  max: number
  friendlyName: string
  category: 'macro' | 'muscle' | 'face' | 'other'
}

export type MuscleGroupId =
  | 'shoulders'
  | 'chest'
  | 'upperArms'
  | 'forearms'
  | 'abdomen'
  | 'waist'
  | 'back'
  | 'thighs'
  | 'calves'

export interface BodyCustomizationGroup {
  id: MuscleGroupId
  label: string
  labelVi: string
  description: string
  targetName?: string
  status: 'available' | 'missing'
}

export type FacialFeatureId =
  | 'headShape'
  | 'eyes'
  | 'nose'
  | 'jaw'
  | 'chin'
  | 'mouth'

export interface FacialCustomizationGroup {
  id: FacialFeatureId
  label: string
  labelVi: string
  description: string
  targetName?: string
  status: 'available' | 'missing'
}

export interface AvatarMorphConfiguration {
  version: string
  timestamp: string
  modelFile: string
  morphs: Record<string, number>
  notes?: string
}

export const BODY_MUSCLE_GROUPS: Omit<BodyCustomizationGroup, 'status'>[] = [
  { id: 'shoulders', label: 'Shoulders', labelVi: 'Vai (Deltoids)', description: 'Độ rộng và khối cơ vai' },
  { id: 'chest', label: 'Chest', labelVi: 'Ngực (Pectorals)', description: 'Độ dày và rộng cơ ngực' },
  { id: 'upperArms', label: 'Upper arms', labelVi: 'Bắp tay (Biceps & Triceps)', description: 'Độ dày bắp tay trước và sau' },
  { id: 'forearms', label: 'Forearms', labelVi: 'Cẳng tay (Brachioradialis)', description: 'Độ dày cẳng tay' },
  { id: 'abdomen', label: 'Abdomen', labelVi: 'Cơ bụng (Abs)', description: 'Độ nét và dày cơ bụng' },
  { id: 'waist', label: 'Waist', labelVi: 'Vòng eo (Waist)', description: 'Độ thon gọn vòng eo' },
  { id: 'back', label: 'Back', labelVi: 'Lưng & Xô (Lats & Traps)', description: 'Độ rộng xô và dày cơ lưng' },
  { id: 'thighs', label: 'Thighs', labelVi: 'Đùi (Quadriceps & Hamstrings)', description: 'Độ dày cơ đùi trước và sau' },
  { id: 'calves', label: 'Calves', labelVi: 'Bắp chân (Calves)', description: 'Khối cơ bắp chân' },
]

export const FACIAL_FEATURE_GROUPS: Omit<FacialCustomizationGroup, 'status'>[] = [
  { id: 'headShape', label: 'Head shape', labelVi: 'Hình dáng đầu', description: 'Tỷ lệ khung sọ và kích thước đầu' },
  { id: 'eyes', label: 'Eyes', labelVi: 'Mắt', description: 'Hình dáng, kích thước và hốc mắt' },
  { id: 'nose', label: 'Nose', labelVi: 'Mũi', description: 'Độ cao sống mũi và cánh mũi' },
  { id: 'jaw', label: 'Jaw', labelVi: 'Quai hàm', description: 'Độ bạnh và góc hàm' },
  { id: 'chin', label: 'Chin', labelVi: 'Cằm', description: 'Độ nhô và rộng của cằm' },
  { id: 'mouth', label: 'Mouth', labelVi: 'Miệng & Môi', description: 'Độ dày và rộng của môi' },
]

/**
 * Friendly descriptions for known MPFB macro morph targets in gym_avatar_v3.glb
 */
export function getFriendlyMorphTargetName(technicalName: string): { friendlyName: string; category: MorphTargetInfo['category'] } {
  const map: Record<string, { friendlyName: string; category: MorphTargetInfo['category'] }> = {
    '$md-$as-$fe-$yn': { friendlyName: 'Nữ Châu Á (Asian Female Young)', category: 'macro' },
    '$md-$as-$ma-$yn': { friendlyName: 'Nam Châu Á (Asian Male Young)', category: 'macro' },
    '$md-$ca-$fe-$yn': { friendlyName: 'Nữ Da Trắng (Caucasian Female Young)', category: 'macro' },
    '$md-$ca-$ma-$yn': { friendlyName: 'Nam Da Trắng (Caucasian Male Young)', category: 'macro' },
    '$md-$af-$fe-$yn': { friendlyName: 'Nữ Châu Phi (African Female Young)', category: 'macro' },
    '$md-$af-$ma-$yn': { friendlyName: 'Nam Châu Phi (African Male Young)', category: 'macro' },
    '$md-universal-$fe-$yn-$av$mu-$av$wg': { friendlyName: 'Nữ Toàn Năng (Universal Female Young - Avg Muscle/Weight)', category: 'macro' },
    '$md-universal-$ma-$yn-$av$mu-$av$wg': { friendlyName: 'Nam Toàn Năng (Universal Male Young - Avg Muscle/Weight)', category: 'macro' },
  }

  if (map[technicalName]) return map[technicalName]

  // Fallback heuristic
  const lower = technicalName.toLowerCase()
  if (lower.includes('muscle') || lower.includes('arm') || lower.includes('chest') || lower.includes('leg')) {
    return { friendlyName: technicalName, category: 'muscle' }
  }
  if (lower.includes('eye') || lower.includes('nose') || lower.includes('jaw') || lower.includes('head') || lower.includes('mouth')) {
    return { friendlyName: technicalName, category: 'face' }
  }
  if (lower.startsWith('$md-') || lower.includes('macro')) {
    return { friendlyName: technicalName, category: 'macro' }
  }
  return { friendlyName: technicalName, category: 'other' }
}
