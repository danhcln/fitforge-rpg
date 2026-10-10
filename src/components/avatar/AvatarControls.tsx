import React from 'react'
import type { BodyMorphParameters } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Sliders, Sparkles, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface AvatarControlsProps {
  morph: BodyMorphParameters
  onChange: (updates: Partial<BodyMorphParameters>) => void
  onReset: () => void
  auraEnabled: boolean
  onToggleAura: () => void
  title?: string
}

export const AvatarControls: React.FC<AvatarControlsProps> = ({
  morph,
  onChange,
  onReset,
  auraEnabled,
  onToggleAura,
  title = 'Điều Chỉnh Tham Số Hình Thể (Morph Targets)',
}) => {
  return (
    <Card className="border-slate-800 bg-slate-900/80">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-semibold text-teal-300">
          <Sliders className="w-4 h-4 text-teal-400" />
          {title}
        </CardTitle>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="h-7 text-xs border-slate-700 text-slate-300"
            onClick={onToggleAura}
          >
            <Sparkles className={`w-3.5 h-3.5 ${auraEnabled ? 'text-amber-400' : 'text-slate-500'}`} />
            {auraEnabled ? 'Tắt Hào Quang' : 'Bật Hào Quang'}
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 text-slate-400 hover:text-white"
            onClick={onReset}
            title="Đặt lại thông số mặc định"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 pt-1">
        {/* Muscle Hypertrophy Morph */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Phát Triển Cơ Bắp (Muscle Hypertrophy)</span>
            <span className="font-mono text-teal-400">{Math.round(morph.muscleMorph * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.02"
            value={morph.muscleMorph}
            onChange={(e) => onChange({ muscleMorph: parseFloat(e.target.value) })}
            className="w-full accent-teal-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Fat Layer Morph */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Độ Dày Mỡ Dưới Da (Body Fat Thickness)</span>
            <span className="font-mono text-amber-400">{Math.round(morph.fatMorph * 100)}%</span>
          </div>
          <input
            type="range"
            min="0.05"
            max="0.8"
            step="0.02"
            value={morph.fatMorph}
            onChange={(e) => onChange({ fatMorph: parseFloat(e.target.value) })}
            className="w-full accent-amber-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
        </div>

        {/* Shoulder & Chest Width */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Độ Rộng Vai</span>
              <span className="font-mono text-slate-400">{morph.shoulderWidth.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.85"
              max="1.45"
              step="0.02"
              value={morph.shoulderWidth}
              onChange={(e) => onChange({ shoulderWidth: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Độ Dày Ngực</span>
              <span className="font-mono text-slate-400">{morph.chestWidth.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.85"
              max="1.4"
              step="0.02"
              value={morph.chestWidth}
              onChange={(e) => onChange({ chestWidth: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        {/* Waist & Arm Proportions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Vòng Eo (Tỉ Lệ V-Taper)</span>
              <span className="font-mono text-slate-400">{morph.waistWidth.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.75"
              max="1.3"
              step="0.02"
              value={morph.waistWidth}
              onChange={(e) => onChange({ waistWidth: parseFloat(e.target.value) })}
              className="w-full accent-indigo-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300">
              <span>Độ Dày Bắp Tay</span>
              <span className="font-mono text-slate-400">{morph.armThickness.toFixed(2)}x</span>
            </div>
            <input
              type="range"
              min="0.85"
              max="1.45"
              step="0.02"
              value={morph.armThickness}
              onChange={(e) => onChange({ armThickness: parseFloat(e.target.value) })}
              className="w-full accent-purple-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
