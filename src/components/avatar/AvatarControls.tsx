import type { BodyMorphParameters } from '@/types'
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/components/ui'
import { normalizedKeys } from '@/services/character/evolution'
interface AvatarControlsProps {
  morph: BodyMorphParameters
  onChange: (updates: Partial<BodyMorphParameters>) => void
  onReset: () => void
  auraEnabled: boolean
  onToggleAura: () => void
  title?: string
}
const labels: Record<keyof BodyMorphParameters, string> = {
  heightCm: 'Chiều cao minh họa (cm)', fatMorph: 'Lớp mỡ minh họa', muscleMorph: 'Cơ tổng thể minh họa',
  chestWidth: 'Độ rộng ngực', shoulderWidth: 'Độ rộng vai', waistWidth: 'Độ rộng eo', armThickness: 'Độ dày tay', legThickness: 'Độ dày chân', definition: 'Độ nét cách điệu',
  overallVolume: 'Thể tích tổng thể', upperBodyMuscle: 'Cơ thân trên minh họa', lowerBodyMuscle: 'Cơ thân dưới minh họa', armProportion: 'Tỷ lệ tay', legProportion: 'Tỷ lệ chân', trunkProportion: 'Tỷ lệ thân',
}
export function AvatarControls({ morph, onChange, onReset, auraEnabled, onToggleAura, title = 'Xem thử thủ công' }: AvatarControlsProps) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-xs text-slate-400">Thang hình ảnh, không phải số đo cơ thể. Các thanh 0–1 không biểu thị PBF thực tế.</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{(Object.keys(labels) as (keyof BodyMorphParameters)[]).map(key => {
      const normalized = normalizedKeys.includes(key as typeof normalizedKeys[number]) || ['fatMorph', 'muscleMorph', 'definition'].includes(key)
      return <label key={key} className="text-xs text-slate-300 space-y-2"><span className="flex justify-between gap-2"><span>{labels[key]}</span><span className="font-mono text-teal-400">{(morph[key] ?? 0.5).toFixed(key === 'heightCm' ? 0 : 2)}</span></span>
        <input aria-label={labels[key]} type="range" min={key === 'heightCm' ? 80 : normalized ? 0 : 0.5} max={key === 'heightCm' ? 250 : normalized ? 1 : 2} step={key === 'heightCm' ? 1 : 0.01} value={morph[key] ?? 0.5} onChange={e => onChange({ [key]: Number(e.target.value) })} className="w-full accent-teal-400" />
      </label>
    })}</div><div className="flex gap-2 flex-wrap"><Button size="sm" variant="outline" onClick={onReset}>Đặt lại bản xem thử</Button><Button size="sm" variant="outline" onClick={onToggleAura}>{auraEnabled ? 'Tắt hào quang' : 'Bật hào quang'}</Button></div>
  </CardContent></Card>
}
