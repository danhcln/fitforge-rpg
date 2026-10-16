import { useState, useRef } from 'react'
import {
  type MorphTargetInfo,
  BODY_MUSCLE_GROUPS,
  FACIAL_FEATURE_GROUPS,
} from '@/services/character/avatarMorphTypes'
import {
  saveAvatarMorphConfig,
  loadAvatarMorphConfig,
  exportAvatarMorphJson,
  validateAvatarMorphConfigJson,
  downloadAvatarMorphConfigFile,
  clearAvatarMorphConfig,
} from '@/services/character/avatarStorage'
import { extractAvatarProgressionData } from '@/services/character/avatarProgressionAdapter'
import { MorphTargetController } from './MorphTargetController'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
  Dumbbell,
  Smile,
  Sliders,
  Save,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  FileCode,
} from 'lucide-react'
import type { WorkoutSession, BodyMeasurement } from '@/types'

interface AvatarCustomizationPanelProps {
  morphTargets: MorphTargetInfo[]
  meshName: string
  currentInfluences: Record<string, number>
  onChangeMorph: (targetName: string, value: number) => void
  onBatchUpdateMorphs: (updates: Record<string, number>) => void
  onResetAllMorphs: () => void
  workoutSessions?: WorkoutSession[]
  bodyMeasurements?: BodyMeasurement[]
  totalXp?: number
}

type ActiveTab = 'body' | 'face' | 'morphs' | 'storage' | 'progression'

export function AvatarCustomizationPanel({
  morphTargets,
  meshName,
  currentInfluences,
  onChangeMorph,
  onBatchUpdateMorphs,
  onResetAllMorphs,
  workoutSessions = [],
  bodyMeasurements = [],
  totalXp = 0,
}: AvatarCustomizationPanelProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('body')
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [importText, setImportText] = useState('')
  const [showImportDialog, setShowImportDialog] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const progression = extractAvatarProgressionData(workoutSessions, bodyMeasurements, totalXp)

  // Message flash helper
  const notify = (type: 'success' | 'error', text: string) => {
    setStatusMessage({ type, text })
    setTimeout(() => setStatusMessage(null), 4500)
  }

  // Handle Save
  const handleSaveToLocalStorage = () => {
    const success = saveAvatarMorphConfig(currentInfluences)
    if (success) {
      notify('success', 'Đã lưu cấu hình avatar thành công vào bộ nhớ cục bộ (localStorage).')
    } else {
      notify('error', 'Không thể lưu cấu hình avatar. Vui lòng kiểm tra dung lượng bộ nhớ trình duyệt.')
    }
  }

  // Handle Load
  const handleLoadFromLocalStorage = () => {
    const loaded = loadAvatarMorphConfig()
    if (loaded && Object.keys(loaded).length > 0) {
      onBatchUpdateMorphs(loaded)
      notify('success', `Đã tải lại cấu hình đã lưu (${Object.keys(loaded).length} tham số morph).`)
    } else {
      notify('error', 'Chưa có cấu hình nào được lưu trước đó trong bộ nhớ cục bộ.')
    }
  }

  // Handle Reset
  const handleResetToDefaults = () => {
    clearAvatarMorphConfig()
    onResetAllMorphs()
    notify('success', 'Đã khôi phục toàn bộ thông số về mặc định ban đầu của file 3D.')
  }

  // Handle Export File
  const handleExportJson = () => {
    downloadAvatarMorphConfigFile(currentInfluences, `fitforge_avatar_${new Date().toISOString().slice(0, 10)}.json`)
    notify('success', 'Đã xuất tệp cấu hình JSON thành công.')
  }

  // Handle File Input Import
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const content = event.target?.result as string
      const validation = validateAvatarMorphConfigJson(content)
      if (validation.success && validation.data) {
        onBatchUpdateMorphs(validation.data)
        notify('success', `Đã nhập thành công ${Object.keys(validation.data).length} thông số morph từ tệp!`)
        setShowImportDialog(false)
      } else {
        notify('error', validation.error || 'Tệp cấu hình không hợp lệ.')
      }
    }
    reader.onerror = () => notify('error', 'Lỗi khi đọc tệp từ thiết bị.')
    reader.readAsText(file)
    e.target.value = ''
  }

  // Handle Text Paste Import
  const handleImportTextSubmit = () => {
    const validation = validateAvatarMorphConfigJson(importText)
    if (validation.success && validation.data) {
      onBatchUpdateMorphs(validation.data)
      notify('success', `Đã nhập thành công ${Object.keys(validation.data).length} thông số morph từ JSON!`)
      setShowImportDialog(false)
      setImportText('')
    } else {
      notify('error', validation.error || 'Dữ liệu JSON không hợp lệ.')
    }
  }

  return (
    <div className="space-y-4">
      {/* Navigation tabs */}
      <div className="flex flex-wrap gap-1.5 p-1 rounded-2xl bg-slate-950/90 border border-slate-800">
        <Button
          size="sm"
          variant={activeTab === 'body' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('body')}
          className="gap-1.5 text-xs rounded-xl"
        >
          <Dumbbell className="h-3.5 w-3.5" />
          Nhóm cơ
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'face' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('face')}
          className="gap-1.5 text-xs rounded-xl"
        >
          <Smile className="h-3.5 w-3.5" />
          Khuôn mặt
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'morphs' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('morphs')}
          className="gap-1.5 text-xs rounded-xl"
        >
          <Sliders className="h-3.5 w-3.5" />
          Trình gỡ lỗi ({morphTargets.length})
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'storage' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('storage')}
          className="gap-1.5 text-xs rounded-xl"
        >
          <Save className="h-3.5 w-3.5" />
          Lưu & Xuất
        </Button>
        <Button
          size="sm"
          variant={activeTab === 'progression' ? 'primary' : 'ghost'}
          onClick={() => setActiveTab('progression')}
          className="gap-1.5 text-xs rounded-xl"
        >
          <Sparkles className="h-3.5 w-3.5" />
          Tiến trình RPG
        </Button>
      </div>

      {/* Status Notifications */}
      {statusMessage && (
        <div
          role="alert"
          className={`p-3 rounded-xl flex items-center gap-2 text-xs border animate-in fade-in-50 duration-150 ${
            statusMessage.type === 'success'
              ? 'bg-teal-950/60 border-teal-800/80 text-teal-200'
              : 'bg-rose-950/60 border-rose-800/80 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="h-4 w-4 shrink-0 text-teal-400" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* TAB 1: Body Muscle Groups Customization */}
      {activeTab === 'body' && (
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Dumbbell className="h-5 w-5 text-teal-400" />
                Tùy chỉnh nhóm cơ & hình thể
              </span>
              <Badge variant="outline" className="text-[11px] text-amber-300 border-amber-800/60">
                Sẵn sàng cho morph tùy chỉnh
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Hệ thống ánh xạ nhóm cơ theo kiến trúc module. Các nhóm cơ yêu cầu Shape Key chuyên biệt từ Blender để kích hoạt thanh trượt.
            </p>
          </CardHeader>

          <CardContent className="pt-4 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {BODY_MUSCLE_GROUPS.map((group) => {
                // Check if a genuinely matching morph target exists in current GLB
                const matchingTarget = morphTargets.find(
                  (t) => t.category === 'muscle' && t.name.toLowerCase().includes(group.id.toLowerCase())
                )
                const isAvailable = !!matchingTarget

                return (
                  <div
                    key={group.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isAvailable
                        ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{group.labelVi}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({group.label})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{group.description}</p>
                      </div>

                      {isAvailable ? (
                        <Badge variant="cyan" className="text-[10px] shrink-0">
                          Khả dụng
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-400/90 border-amber-900/60 shrink-0">
                          Requires custom morph target
                        </Badge>
                      )}
                    </div>

                    {isAvailable ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={currentInfluences[matchingTarget.name] ?? matchingTarget.defaultInfluence}
                          onChange={(e) => onChangeMorph(matchingTarget.name, Number(e.target.value))}
                          className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-xs font-mono text-teal-400 font-bold">
                          {(currentInfluences[matchingTarget.name] ?? matchingTarget.defaultInfluence).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={0}
                          disabled
                          className="w-full h-1.5 bg-slate-800/40 rounded-lg cursor-not-allowed opacity-40"
                        />
                        <p className="text-[10px] text-amber-500/80 italic flex items-center gap-1">
                          <HelpCircle className="h-3 w-3 shrink-0" />
                          <span>Cần export thêm Shape Key từ MakeHuman/MPFB trong Blender để kích hoạt.</span>
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
              <strong className="text-teal-300">Ghi chú kiến trúc:</strong>
              <p>
                Mô hình <code className="text-slate-300">gym_avatar_v3.glb</code> hiện tại chứa 8 morph targets nhân trắc học vĩ mô ($md), chưa có shape key riêng lẻ cho từng bó cơ. Để kích hoạt, chỉ cần bổ sung shape keys tương ứng vào file GLB mà không cần sửa code giao diện.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 2: Facial Features Customization */}
      {activeTab === 'face' && (
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Smile className="h-5 w-5 text-teal-400" />
                Tùy chỉnh khuôn mặt & đầu
              </span>
              <Badge variant="outline" className="text-[11px] text-teal-300 border-teal-800/60">
                Module khuôn mặt
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Điều chỉnh các tỷ lệ khung mặt, mắt, mũi, hàm và cằm.
            </p>
          </CardHeader>

          <CardContent className="pt-4 space-y-3.5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {FACIAL_FEATURE_GROUPS.map((feature) => {
                const matchingTarget = morphTargets.find(
                  (t) => t.category === 'face' && t.name.toLowerCase().includes(feature.id.toLowerCase())
                )
                const isAvailable = !!matchingTarget

                return (
                  <div
                    key={feature.id}
                    className={`p-3 rounded-xl border transition-all ${
                      isAvailable
                        ? 'bg-slate-950/70 border-slate-800 hover:border-slate-700'
                        : 'bg-slate-950/40 border-slate-800/50 opacity-80'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-200">{feature.labelVi}</span>
                          <span className="text-[10px] text-slate-500 font-mono">({feature.label})</span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5">{feature.description}</p>
                      </div>

                      {isAvailable ? (
                        <Badge variant="cyan" className="text-[10px] shrink-0">
                          Khả dụng
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] text-amber-400/90 border-amber-900/60 shrink-0">
                          Requires custom morph target
                        </Badge>
                      )}
                    </div>

                    {isAvailable ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={currentInfluences[matchingTarget.name] ?? matchingTarget.defaultInfluence}
                          onChange={(e) => onChangeMorph(matchingTarget.name, Number(e.target.value))}
                          className="w-full accent-teal-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                        />
                        <span className="text-xs font-mono text-teal-400 font-bold">
                          {(currentInfluences[matchingTarget.name] ?? matchingTarget.defaultInfluence).toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <div className="space-y-1.5">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={0}
                          disabled
                          className="w-full h-1.5 bg-slate-800/40 rounded-lg cursor-not-allowed opacity-40"
                        />
                        <p className="text-[10px] text-amber-500/80 italic flex items-center gap-1">
                          <HelpCircle className="h-3 w-3 shrink-0" />
                          <span>Cần morph target tùy chỉnh từ Blender/MPFB để kích hoạt.</span>
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 space-y-1">
              <strong className="text-teal-300">Khuôn mặt trong MPFB:</strong>
              <p>
                Hiện tại hình thái mặt tổng quan bị chi phối bởi các macro morph target nhân trắc học trong tab <strong className="text-slate-200">Trình gỡ lỗi (Morph Targets)</strong>. Các morph mắt/mũi chi tiết sẽ được tự động kích hoạt khi có tệp cập nhật.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 3: Raw Morph Targets Debug Controller */}
      {activeTab === 'morphs' && (
        <MorphTargetController
          morphTargets={morphTargets}
          meshName={meshName}
          currentInfluences={currentInfluences}
          onChange={onChangeMorph}
          onResetAll={onResetAllMorphs}
          onResetSingle={(name) => {
            const t = morphTargets.find((m) => m.name === name)
            if (t) onChangeMorph(name, t.defaultInfluence)
          }}
        />
      )}

      {/* TAB 4: Storage, Presets & JSON Export/Import */}
      {activeTab === 'storage' && (
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-base text-white flex items-center gap-2">
              <Save className="h-5 w-5 text-teal-400" />
              Lưu & Quản lý Cấu hình Avatar
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Lưu cấu hình nhân vật vào bộ nhớ trình duyệt hoặc xuất/nhập tệp JSON để đồng bộ giữa các thiết bị.
            </p>
          </CardHeader>

          <CardContent className="pt-4 space-y-5">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button onClick={handleSaveToLocalStorage} className="gap-2 justify-center" variant="primary">
                <Save className="h-4 w-4" />
                Lưu vào trình duyệt
              </Button>
              <Button onClick={handleLoadFromLocalStorage} className="gap-2 justify-center" variant="outline">
                <Upload className="h-4 w-4" />
                Tải cấu hình đã lưu
              </Button>
              <Button onClick={handleResetToDefaults} className="gap-2 justify-center text-rose-300 hover:text-rose-200" variant="ghost">
                <RotateCcw className="h-4 w-4" />
                Khôi phục mặc định GLB
              </Button>
            </div>

            <div className="border-t border-slate-800/80 pt-4 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider">Xuất / Nhập tệp cấu hình JSON</h4>
              <p className="text-xs text-slate-400">
                Xuất thông số nhân vật dạng tệp JSON tiêu chuẩn có thể tái sử dụng cho các phiên bản tiếp theo.
              </p>

              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={handleExportJson} className="gap-2">
                  <Download className="h-4 w-4" />
                  Tải tệp JSON về máy
                </Button>

                <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-2">
                  <Upload className="h-4 w-4" />
                  Chọn tệp JSON từ máy
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".json,application/json"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                <Button size="sm" variant="ghost" onClick={() => setShowImportDialog(!showImportDialog)} className="gap-2 text-teal-300">
                  <FileCode className="h-4 w-4" />
                  {showImportDialog ? 'Đóng hộp dán JSON' : 'Dán trực tiếp mã JSON'}
                </Button>
              </div>

              {/* Paste JSON dialog */}
              {showImportDialog && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 animate-in fade-in-50">
                  <label className="text-xs font-semibold text-slate-300 block">
                    Dán nội dung JSON cấu hình nhân vật:
                  </label>
                  <textarea
                    rows={6}
                    value={importText}
                    onChange={(e) => setImportText(e.target.value)}
                    placeholder={exportAvatarMorphJson(currentInfluences)}
                    className="w-full p-2.5 text-xs font-mono rounded-xl bg-slate-900 border border-slate-800 text-slate-200 focus:outline-none focus:border-teal-500"
                  />
                  <div className="flex justify-end gap-2">
                    <Button size="sm" variant="ghost" onClick={() => setShowImportDialog(false)}>
                      Hủy
                    </Button>
                    <Button size="sm" variant="primary" onClick={handleImportTextSubmit}>
                      Áp dụng cấu hình JSON
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Current Values Preview */}
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Trạng thái cấu hình hiện tại:</span>
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="cyan">Model: gym_avatar_v3.glb</Badge>
                <Badge variant="gold">Morphs đã chỉnh: {Object.keys(currentInfluences).length}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* TAB 5: RPG Progression Adapter */}
      {activeTab === 'progression' && (
        <Card className="border-slate-800 bg-slate-900/90 shadow-xl">
          <CardHeader className="pb-3 border-b border-slate-800">
            <CardTitle className="text-base text-white flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-teal-400" />
                Bộ chuyển đổi Tiến trình RPG (Progression Adapter)
              </span>
              <Badge variant="outline" className="text-[11px] text-amber-300 border-amber-800/60">
                Thủ công / Độc lập
              </Badge>
            </CardTitle>
            <p className="text-xs text-slate-400 mt-1">
              Đọc và ánh xạ dữ liệu buổi tập, khối lượng tập luyện (Volume) và cấp độ RPG vào mô hình nhân vật.
            </p>
          </CardHeader>

          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Cấp độ RPG</p>
                <p className="text-xl font-extrabold text-teal-300 mt-1">Lv. {progression.rpgLevel}</p>
                <p className="text-[10px] text-slate-500 font-mono mt-0.5">{progression.totalXp} XP</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Buổi tập đã lưu</p>
                <p className="text-xl font-extrabold text-cyan-300 mt-1">{progression.totalSessions}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">buổi tập</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Tổng Volume</p>
                <p className="text-xl font-extrabold text-amber-300 mt-1">
                  {(progression.totalVolumeKg / 1000).toFixed(1)}k
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">kg tải trọng</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <p className="text-[11px] text-slate-400">Số đo InBody</p>
                <p className="text-xl font-extrabold text-teal-300 mt-1">{progression.measurementsCount}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {progression.latestWeightKg ? `${progression.latestWeightKg} kg` : 'chưa có'}
                </p>
              </div>
            </div>

            {/* Split breakdown */}
            <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2">
              <span className="text-xs font-semibold text-slate-300 block">Phân bố Volume theo nhóm bài tập:</span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Đẩy (Push):</span>
                  <span className="font-mono text-teal-400 font-bold">{progression.splitBreakdown.pushVolumeKg.toLocaleString()} kg</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Kéo (Pull):</span>
                  <span className="font-mono text-cyan-400 font-bold">{progression.splitBreakdown.pullVolumeKg.toLocaleString()} kg</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Chân (Legs):</span>
                  <span className="font-mono text-amber-400 font-bold">{progression.splitBreakdown.legsVolumeKg.toLocaleString()} kg</span>
                </div>
                <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 block">Khác:</span>
                  <span className="font-mono text-slate-400 font-bold">{progression.splitBreakdown.otherVolumeKg.toLocaleString()} kg</span>
                </div>
              </div>
            </div>

            {/* Adapter Policy Notice */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-center gap-1.5 font-semibold text-amber-400">
                <AlertCircle className="h-4 w-4" />
                <span>Quy định tích hợp RPG</span>
              </div>
              <p>
                {progression.note}
              </p>
              <p className="text-[11px] text-slate-500">
                Hình thể avatar không tự động phình to hay biến dạng theo số lần bấm bài tập, nhằm tôn trọng cơ chế thể hình thực tế và bảo đảm độ ổn định của nhân vật.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
