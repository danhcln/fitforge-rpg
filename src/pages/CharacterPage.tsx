import { useState, useCallback } from 'react'
import { useCharacterStore, useInBodyStore, useWorkoutStore, useUserStore } from '@/stores'
import {
  AvatarCanvas,
  AvatarControls,
  CharacterViewer,
  AvatarCustomizationPanel,
} from '@/components/avatar'
import type { MorphTargetInfo } from '@/services/character/avatarMorphTypes'
import { loadAvatarMorphConfig } from '@/services/character/avatarStorage'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { BodyTargets } from '@/components/BodyComposition'
import { formatBodyValue, mappingInputLabels, metricLabels } from '@/services/bodyComposition/presentation'
import { bodyMetrics, compareMeasurements, units } from '@/services/bodyComposition/calculations'
import { mappedMorph, resolveEvolution, resolveMeasurement } from '@/services/character/evolution'
import { BodyCompositionToAvatar } from '@/services/bodyComposition/BodyCompositionToAvatar'
import type { CharacterAppearance } from '@/types'
import { CosmeticRewards } from '@/components/RpgProgression'
import { Box, Sparkles, ShieldCheck } from 'lucide-react'

export function CharacterPage() {
  const { measurements, latestMeasurement } = useInBodyStore()
  const { sessions } = useWorkoutStore()
  const { user } = useUserStore()

  const {
    character,
    setMode,
    updateCurrentBody,
    updateGoalBody,
    toggleAura,
    error,
    measuredBody,
    goalBodies,
    selectedGoalId,
    selectedMeasurementId,
    comparisonMeasurementId,
    selectMeasurement,
    selectComparison,
    setVisualSource,
    updateAppearance,
    setAppearancePreset,
  } = useCharacterStore()

  // Avatar representation mode: GLB model (Default) or Procedural geometry
  const [avatarMode, setAvatarMode] = useState<'glb' | 'procedural'>('glb')

  // GLB morph target state
  const [morphTargets, setMorphTargets] = useState<MorphTargetInfo[]>([])
  const [meshName, setMeshName] = useState<string>('Human')
  const [morphInfluences, setMorphInfluences] = useState<Record<string, number>>(() => {
    return loadAvatarMorphConfig() ?? {}
  })

  // Handle inspected morph targets reported by AvatarModel
  const handleInspectTargets = useCallback((targets: MorphTargetInfo[], detectedMeshName: string) => {
    setMorphTargets(targets)
    setMeshName(detectedMeshName)

    setMorphInfluences((prev) => {
      const next = { ...prev }
      for (const t of targets) {
        if (next[t.name] === undefined) {
          next[t.name] = t.defaultInfluence
        }
      }
      return next
    })
  }, [])

  // Morph change handler
  const handleChangeMorph = useCallback((targetName: string, value: number) => {
    setMorphInfluences((prev) => ({
      ...prev,
      [targetName]: value,
    }))
  }, [])

  // Batch update handler
  const handleBatchUpdateMorphs = useCallback((updates: Record<string, number>) => {
    setMorphInfluences((prev) => ({
      ...prev,
      ...updates,
    }))
  }, [])

  // Reset all handler
  const handleResetAllMorphs = useCallback(() => {
    const defaults: Record<string, number> = {}
    for (const t of morphTargets) {
      defaults[t.name] = t.defaultInfluence
    }
    setMorphInfluences(defaults)
  }, [morphTargets])

  const preview = resolveEvolution(character, measurements, selectedMeasurementId, goalBodies, selectedGoalId)
  const isGoal = character.mode === 'goal'
  const comparison =
    !isGoal && !preview.manual && comparisonMeasurementId ? resolveMeasurement(measurements, comparisonMeasurementId) : null
  const changes = compareMeasurements(comparison, preview.measurement)
  const historical = !isGoal && selectedMeasurementId !== null && preview.measurement?.id !== latestMeasurement?.id
  const label = preview.manual
    ? 'Xem thử thủ công · hình minh họa'
    : isGoal
    ? 'Mục tiêu · mô phỏng giả định, không bảo đảm kết quả'
    : `${historical ? 'Phiếu lịch sử' : 'Phiếu hiện tại'} · ${preview.measurement?.date ?? 'chưa có số đo'} · minh họa gần đúng`
  const activeManual = isGoal ? character.goalBody : character.currentBody
  const updateManual = isGoal ? updateGoalBody : updateCurrentBody

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {error && (
        <p role="alert" className="text-rose-400">
          {error}
        </p>
      )}

      {/* Page Header */}
      <div className="flex flex-wrap justify-between items-center gap-4 pb-3 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Phòng Rèn Nhân Vật 3D</h1>
            <Badge variant="cyan" className="text-xs font-mono">
              v3.0 Interactive
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Mô hình nhân vật 3D tương tác toàn diện với điều khiển xoay 360°, thu phóng, góc nhìn camera và Morph Targets MPFB.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Renderer mode switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800">
            <Button
              size="sm"
              variant={avatarMode === 'glb' ? 'primary' : 'ghost'}
              onClick={() => setAvatarMode('glb')}
              className="text-xs gap-1.5 h-8 rounded-lg"
            >
              <Box className="h-3.5 w-3.5" />
              3D Gym Avatar (GLB)
            </Button>
            <Button
              size="sm"
              variant={avatarMode === 'procedural' ? 'primary' : 'ghost'}
              onClick={() => setAvatarMode('procedural')}
              className="text-xs gap-1.5 h-8 rounded-lg"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Mô hình Thủ tục
            </Button>
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-950 border border-slate-800">
            <Button
              size="sm"
              variant={!isGoal ? 'primary' : 'ghost'}
              onClick={() => setMode('current')}
              className="text-xs h-8 rounded-lg"
            >
              Hiện tại
            </Button>
            <Button
              size="sm"
              variant={isGoal ? 'gold' : 'ghost'}
              onClick={() => setMode('goal')}
              className="text-xs h-8 rounded-lg"
            >
              Mục tiêu
            </Button>
          </div>
        </div>
      </div>

      {/* Main 3D Avatar Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: 3D Canvas & Measurements */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-3 bg-slate-950/40 border-slate-800/80">
            {avatarMode === 'glb' ? (
              <CharacterViewer
                modelUrl="/models/gym_avatar_v3.glb"
                morphInfluences={morphInfluences}
                onInspectTargets={handleInspectTargets}
                showDefectNotice={true}
              />
            ) : (
              <AvatarCanvas
                currentMorph={isGoal ? mappedMorph(measuredBody) : preview.morph}
                goalMorph={
                  isGoal
                    ? preview.morph
                    : mappedMorph(
                        selectedGoalId
                          ? goalBodies[selectedGoalId] ?? BodyCompositionToAvatar(null, 'goal')
                          : BodyCompositionToAvatar(null, 'goal')
                      )
                }
                mode={character.mode}
                onModeChange={setMode}
                auraEnabled={character.auraUnlocked}
                appearance={preview.appearance}
                label={label}
                comparisonMorph={comparison ? mappedMorph(BodyCompositionToAvatar(comparison)) : undefined}
                comparisonLabel={comparison ? `${preview.measurement?.date} / ${comparison.date}` : undefined}
              />
            )}
          </Card>

          {/* Info Card */}
          <Card className="p-4 space-y-2 text-sm text-slate-300">
            <div className="flex items-center justify-between gap-2">
              <Badge variant={isGoal ? 'gold' : 'cyan'}>
                {avatarMode === 'glb' ? 'Mô hình 3D Blender GLB' : preview.manual ? 'Thủ công' : isGoal ? 'Giả định' : historical ? 'Lịch sử' : 'Hiện tại'}
              </Badge>
              {avatarMode === 'glb' && (
                <span className="text-xs font-mono text-teal-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {morphTargets.length} morph targets khả dụng
                </span>
              )}
            </div>
            <p>{label}</p>
            {!preview.manual && !preview.mapping.sourceId && (
              <p className="text-amber-300">
                Chưa có {isGoal ? 'mục tiêu đã chọn' : 'phiếu đo'}. Đang hiển thị hình trung tính.
              </p>
            )}
            {!preview.manual && preview.mapping.missing.length > 0 && (
              <p className="text-xs text-slate-400">
                Dữ liệu chưa có: {preview.mapping.missing.map((key) => mappingInputLabels[key]).join(', ')}. Các vùng
                này dùng tham số trung tính.
              </p>
            )}
            <p className="text-xs text-slate-400">
              Mô nạc phân đoạn gồm nhiều loại mô, không phải kích thước cơ chính xác. Không có hình thể nào được coi là lý
              tưởng cho mọi người.
            </p>
          </Card>

          {/* Measurements & Historical Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>Mốc đo & so sánh lịch sử</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {!measurements.length ? (
                <p className="text-sm text-slate-400">Thêm phiếu tại trang InBody để xem các mốc thay đổi.</p>
              ) : (
                <>
                  <label className="text-xs text-slate-400 block">
                    Phiếu bên trái
                    <select
                      aria-label="Chọn phiếu đo avatar"
                      className="block w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700"
                      value={selectedMeasurementId ?? ''}
                      onChange={(e) => {
                        selectMeasurement(e.target.value || null)
                        selectComparison(null)
                      }}
                    >
                      <option value="">Phiếu mới nhất · {latestMeasurement?.date}</option>
                      {measurements.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.date} · {formatBodyValue(m.weightKg)} kg · {m.id.slice(0, 6)}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs text-slate-400 block">
                    Phiếu bên phải
                    <select
                      aria-label="Chọn phiếu đo so sánh"
                      disabled={isGoal || preview.manual}
                      className="block w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700 disabled:opacity-50"
                      value={comparisonMeasurementId ?? ''}
                      onChange={(e) => selectComparison(e.target.value || null)}
                    >
                      <option value="">Không so sánh</option>
                      {measurements
                        .filter((m) => m.id !== preview.measurement?.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.date} · {formatBodyValue(m.weightKg)} kg · {m.id.slice(0, 6)}
                          </option>
                        ))}
                    </select>
                  </label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      selectMeasurement(null)
                      selectComparison(null)
                    }}
                  >
                    Về phiếu mới nhất
                  </Button>
                </>
              )}
              {comparison && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-slate-300 text-left">
                    <thead>
                      <tr>
                        <th>Chênh lệch</th>
                        <th>
                          {comparison.date} − {preview.measurement?.date}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {bodyMetrics.map((metric) => (
                        <tr key={metric} className="border-t border-slate-800">
                          <td className="py-2">{metricLabels[metric]}</td>
                          <td>
                            {formatBodyValue(changes[metric])}{' '}
                            {metric === 'pbfPercent' ? 'điểm %' : units[metric]}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-xs text-slate-500">
                    Hai hình dùng cùng phong cách và tỷ lệ hiển thị. Chọn ngày chỉ thay đổi bản xem, không sửa phiếu.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Customization Panel & RPG Gear */}
        <div className="lg:col-span-5 space-y-4">
          {avatarMode === 'glb' ? (
            <AvatarCustomizationPanel
              morphTargets={morphTargets}
              meshName={meshName}
              currentInfluences={morphInfluences}
              onChangeMorph={handleChangeMorph}
              onBatchUpdateMorphs={handleBatchUpdateMorphs}
              onResetAllMorphs={handleResetAllMorphs}
              workoutSessions={sessions}
              bodyMeasurements={measurements}
              totalXp={user.currentXp}
            />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle>Nguồn hình thể & phong cách</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={!preview.manual ? 'primary' : 'outline'}
                      onClick={() => setVisualSource('measurement')}
                    >
                      Dùng số đo / mục tiêu
                    </Button>
                    <Button
                      size="sm"
                      variant={preview.manual ? 'primary' : 'outline'}
                      onClick={() => setVisualSource('manual')}
                    >
                      Xem thử thủ công
                    </Button>
                  </div>
                  <p className="text-xs text-slate-400">
                    Tùy chỉnh màu và trang phục được lưu riêng, không thay đổi số đo. Mục tiêu là mô phỏng giả định,
                    không dự đoán kết quả tương lai.
                  </p>
                  <label className="text-xs text-slate-400 block">
                    Phong cách
                    <select
                      aria-label="Phong cách nhân vật"
                      className="block w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700"
                      value={preview.appearance.preset}
                      onChange={(e) => setAppearancePreset(e.target.value as CharacterAppearance['preset'])}
                    >
                      <option value="forge">Forge · xanh ngọc</option>
                      <option value="scout">Scout · xanh lá</option>
                      <option value="guardian">Guardian · tím</option>
                    </select>
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['skinColor', 'clothingColor', 'accentColor'] as const).map((key) => (
                      <label key={key} className="text-xs text-slate-400">
                        {{ skinColor: 'Màu da', clothingColor: 'Trang phục', accentColor: 'Điểm nhấn' }[key]}
                        <input
                          aria-label={
                            { skinColor: 'Màu da', clothingColor: 'Màu trang phục', accentColor: 'Màu điểm nhấn' }[key]
                          }
                          type="color"
                          value={preview.appearance[key]}
                          onChange={(e) => updateAppearance({ [key]: e.target.value })}
                          className="mt-2 block h-8 w-full bg-slate-950 rounded"
                        />
                      </label>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400">
                    Diện mạo cơ bản: thân trên để trần và quần ngắn. Các lựa chọn trang phục cũ vẫn được lưu, không
                    thay đổi số đo.
                  </p>
                  <Button size="sm" variant="outline" onClick={toggleAura}>
                    {character.auraUnlocked ? 'Tắt hào quang' : 'Bật hào quang'}
                  </Button>
                </CardContent>
              </Card>

              {preview.manual && (
                <AvatarControls
                  morph={activeManual}
                  onChange={updateManual}
                  onReset={() =>
                    updateManual(
                      isGoal
                        ? mappedMorph(
                            selectedGoalId
                              ? goalBodies[selectedGoalId] ?? BodyCompositionToAvatar(null, 'goal')
                              : BodyCompositionToAvatar(null, 'goal')
                          )
                        : mappedMorph(BodyCompositionToAvatar(preview.measurement))
                    )
                  }
                  auraEnabled={character.auraUnlocked}
                  onToggleAura={toggleAura}
                  title="Bản xem thử · không sửa InBody"
                />
              )}
            </>
          )}

          {/* Equipped Gear Card */}
          <Card className="p-4 text-xs text-slate-400 border-slate-800 bg-slate-900/60">
            <p className="font-bold text-teal-300 mb-2">Trang bị RPG đã lưu</p>
            <p>Đai lưng: {character.equippedGear.liftingBelt ?? 'Chưa trang bị'}</p>
            <p>Băng cổ tay: {character.equippedGear.wristWraps ?? 'Chưa trang bị'}</p>
            <p>Băng gối: {character.equippedGear.kneeSleeves ?? 'Chưa trang bị'}</p>
            <p className="mt-2">Trang phục đã mở: {character.unlockedSkins.join(', ')}</p>
          </Card>
        </div>
      </div>

      <BodyTargets />
      <CosmeticRewards />
    </div>
  )
}
