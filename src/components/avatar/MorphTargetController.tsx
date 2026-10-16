import { useState } from 'react'
import type { MorphTargetInfo } from '@/services/character/avatarMorphTypes'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { RotateCcw, Sliders, Search, Info } from 'lucide-react'

interface MorphTargetControllerProps {
  morphTargets: MorphTargetInfo[]
  meshName: string
  currentInfluences: Record<string, number>
  onChange: (targetName: string, value: number) => void
  onResetAll: () => void
  onResetSingle?: (targetName: string) => void
}

export function MorphTargetController({
  morphTargets,
  meshName,
  currentInfluences,
  onChange,
  onResetAll,
  onResetSingle,
}: MorphTargetControllerProps) {
  const [search, setSearch] = useState('')

  const filteredTargets = morphTargets.filter((t) => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return (
      t.name.toLowerCase().includes(q) ||
      t.friendlyName.toLowerCase().includes(q) ||
      String(t.index).includes(q)
    )
  })

  return (
    <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
      <CardHeader className="pb-3 border-b border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sliders className="h-5 w-5 text-teal-400" />
            <CardTitle className="text-base text-white">Trình gỡ lỗi & Điều khiển Morph Targets</CardTitle>
          </div>
          <Button size="sm" variant="outline" onClick={onResetAll} className="gap-1 text-xs">
            <RotateCcw className="h-3.5 w-3.5" />
            Đặt lại tất cả về mặc định
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-2 text-xs text-slate-400">
          <span>Mesh: <strong className="text-teal-300 font-mono">{meshName || 'Human'}</strong></span>
          <span>•</span>
          <span>Tổng số: <strong className="text-cyan-300">{morphTargets.length}</strong> targets</span>
          <span>•</span>
          <span>Phạm vi runtime: <strong className="text-amber-300 font-mono">0.0 – 1.0</strong></span>
        </div>
      </CardHeader>

      <CardContent className="pt-4 space-y-4">
        <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-teal-300">
            <Info className="h-4 w-4" />
            <span>Thông tin kỹ thuật MPFB / Blender</span>
          </div>
          <p className="text-slate-400">
            Mô hình <strong className="text-slate-200">gym_avatar_v3.glb</strong> chứa 8 Macro Morph Targets của MPFB biểu thị nhân trắc học tổng thể (tuổi, giới tính, chủng tộc). Điều chỉnh trực tiếp bên dưới sẽ cập nhật lưới 3D theo thời gian thực.
          </p>
        </div>

        {morphTargets.length > 4 && (
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
            <input
              type="text"
              placeholder="Tìm kiếm morph target theo tên hoặc mã..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
        )}

        {filteredTargets.length === 0 ? (
          <p className="text-xs text-center py-6 text-slate-500">
            {morphTargets.length === 0 ? 'Đang trích xuất morph targets từ mô hình...' : 'Không tìm thấy morph target phù hợp từ khóa.'}
          </p>
        ) : (
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            {filteredTargets.map((target) => {
              const value = currentInfluences[target.name] ?? target.defaultInfluence
              const isModified = Math.abs(value - target.defaultInfluence) > 0.001

              return (
                <div
                  key={target.name}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <Badge variant="cyan" className="font-mono text-[10px] px-1.5 py-0">
                          #{target.index}
                        </Badge>
                        <span className="text-xs font-medium text-slate-200">
                          {target.friendlyName}
                        </span>
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 truncate" title={target.name}>
                        {target.name}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`font-mono text-xs font-bold ${isModified ? 'text-amber-400' : 'text-teal-400'}`}>
                        {value.toFixed(2)}
                      </span>
                      {onResetSingle && isModified && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-slate-400 hover:text-white"
                          title="Đặt lại về mặc định"
                          onClick={() => onResetSingle(target.name)}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono text-slate-600">0.0</span>
                    <input
                      type="range"
                      min={target.min}
                      max={target.max}
                      step={0.01}
                      value={value}
                      aria-label={`Morph ${target.friendlyName}`}
                      onChange={(e) => onChange(target.name, Number(e.target.value))}
                      className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-600">1.0</span>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
