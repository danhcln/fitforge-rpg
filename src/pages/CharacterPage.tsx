import { useCharacterStore, useInBodyStore } from '@/stores'
import { AvatarCanvas, AvatarControls } from '@/components/avatar'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { BodyTargets } from '@/components/BodyComposition'
import { formatBodyValue, mappingInputLabels, metricLabels } from '@/services/bodyComposition/presentation'
import { bodyMetrics, compareMeasurements, units } from '@/services/bodyComposition/calculations'
import { mappedMorph, resolveEvolution, resolveMeasurement } from '@/services/character/evolution'
import { BodyCompositionToAvatar } from '@/services/bodyComposition/BodyCompositionToAvatar'
import type { CharacterAppearance } from '@/types'
import { CosmeticRewards } from '@/components/RpgProgression'

export function CharacterPage() {
  const { measurements, latestMeasurement } = useInBodyStore()
  const { character, setMode, updateCurrentBody, updateGoalBody, toggleAura, error, measuredBody, goalBodies, selectedGoalId,
    selectedMeasurementId, comparisonMeasurementId, selectMeasurement, selectComparison, setVisualSource, updateAppearance, setAppearancePreset } = useCharacterStore()
  const preview = resolveEvolution(character, measurements, selectedMeasurementId, goalBodies, selectedGoalId)
  const isGoal = character.mode === 'goal'
  const comparison = !isGoal && !preview.manual && comparisonMeasurementId ? resolveMeasurement(measurements, comparisonMeasurementId) : null
  const changes = compareMeasurements(comparison, preview.measurement)
  const historical = !isGoal && selectedMeasurementId !== null && preview.measurement?.id !== latestMeasurement?.id
  const label = preview.manual ? 'Xem thử thủ công · hình minh họa' : isGoal ? 'Mục tiêu · mô phỏng giả định, không bảo đảm kết quả' : `${historical ? 'Phiếu lịch sử' : 'Phiếu hiện tại'} · ${preview.measurement?.date ?? 'chưa có số đo'} · minh họa gần đúng`
  const activeManual = isGoal ? character.goalBody : character.currentBody
  const updateManual = isGoal ? updateGoalBody : updateCurrentBody
  return <div className="space-y-6 animate-in fade-in-50 duration-200">
    {error && <p role="alert" className="text-rose-400">{error}</p>}
    <div className="flex flex-wrap justify-between gap-4 pb-2 border-b border-slate-800"><div><h1 className="text-2xl sm:text-3xl font-extrabold text-white">Phòng Rèn Nhân Vật 3D</h1><p className="text-sm text-slate-400 mt-1">Hình minh họa từ các mốc đo đã lưu. XP và Level không làm tăng cơ trên avatar.</p></div>
      <div className="flex flex-wrap gap-2"><Button size="sm" variant={!isGoal ? 'primary' : 'outline'} onClick={() => setMode('current')}>Thể trạng hiện tại</Button><Button size="sm" variant={isGoal ? 'gold' : 'outline'} onClick={() => setMode('goal')}>Mục tiêu · mô phỏng</Button></div>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div className="lg:col-span-7 space-y-4">
        <Card className="p-3"><AvatarCanvas currentMorph={isGoal ? mappedMorph(measuredBody) : preview.morph} goalMorph={isGoal ? preview.morph : mappedMorph(selectedGoalId ? goalBodies[selectedGoalId] ?? BodyCompositionToAvatar(null, 'goal') : BodyCompositionToAvatar(null, 'goal'))}
          mode={character.mode} onModeChange={setMode} auraEnabled={character.auraUnlocked} appearance={preview.appearance} label={label}
          comparisonMorph={comparison ? mappedMorph(BodyCompositionToAvatar(comparison)) : undefined} comparisonLabel={comparison ? `${preview.measurement?.date} / ${comparison.date}` : undefined} /></Card>
        <Card className="p-4 space-y-2 text-sm text-slate-300"><Badge variant={isGoal ? 'gold' : 'cyan'}>{preview.manual ? 'Thủ công' : isGoal ? 'Giả định' : historical ? 'Lịch sử' : 'Hiện tại'}</Badge><p>{label}</p>
          {!preview.manual && !preview.mapping.sourceId && <p className="text-amber-300">Chưa có {isGoal ? 'mục tiêu đã chọn' : 'phiếu đo'}. Đang hiển thị hình trung tính.</p>}
          {!preview.manual && preview.mapping.missing.length > 0 && <p className="text-xs text-slate-400">Dữ liệu chưa có: {preview.mapping.missing.map(key => mappingInputLabels[key]).join(', ')}. Các vùng này dùng tham số trung tính.</p>}
          <p className="text-xs text-slate-400">Mô nạc phân đoạn gồm nhiều loại mô, không phải kích thước cơ chính xác. Không có hình thể nào được coi là lý tưởng cho mọi người.</p>
        </Card>
        <Card><CardHeader><CardTitle>Mốc đo & so sánh lịch sử</CardTitle></CardHeader><CardContent className="space-y-3">
          {!measurements.length ? <p className="text-sm text-slate-400">Thêm phiếu tại trang InBody để xem các mốc thay đổi.</p> : <>
            <label className="text-xs text-slate-400 block">Phiếu bên trái<select aria-label="Chọn phiếu đo avatar" className="block w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700" value={selectedMeasurementId ?? ''} onChange={e => { selectMeasurement(e.target.value || null); selectComparison(null) }}><option value="">Phiếu mới nhất · {latestMeasurement?.date}</option>{measurements.map(m => <option key={m.id} value={m.id}>{m.date} · {formatBodyValue(m.weightKg)} kg · {m.id.slice(0, 6)}</option>)}</select></label>
            <label className="text-xs text-slate-400 block">Phiếu bên phải<select aria-label="Chọn phiếu đo so sánh" disabled={isGoal || preview.manual} className="block w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700 disabled:opacity-50" value={comparisonMeasurementId ?? ''} onChange={e => selectComparison(e.target.value || null)}><option value="">Không so sánh</option>{measurements.filter(m => m.id !== preview.measurement?.id).map(m => <option key={m.id} value={m.id}>{m.date} · {formatBodyValue(m.weightKg)} kg · {m.id.slice(0, 6)}</option>)}</select></label>
            <Button size="sm" variant="outline" onClick={() => { selectMeasurement(null); selectComparison(null) }}>Về phiếu mới nhất</Button>
          </>}
          {comparison && <div className="overflow-x-auto"><table className="w-full text-sm text-slate-300 text-left"><thead><tr><th>Chênh lệch</th><th>{comparison.date} − {preview.measurement?.date}</th></tr></thead><tbody>{bodyMetrics.map(metric => <tr key={metric} className="border-t border-slate-800"><td className="py-2">{metricLabels[metric]}</td><td>{formatBodyValue(changes[metric])} {metric === 'pbfPercent' ? 'điểm %' : units[metric]}</td></tr>)}</tbody></table><p className="text-xs text-slate-500">Hai hình dùng cùng phong cách và tỷ lệ hiển thị. Chọn ngày chỉ thay đổi bản xem, không sửa phiếu.</p></div>}
        </CardContent></Card>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <Card><CardHeader><CardTitle>Nguồn hình thể & phong cách</CardTitle></CardHeader><CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2"><Button size="sm" variant={!preview.manual ? 'primary' : 'outline'} onClick={() => setVisualSource('measurement')}>Dùng số đo / mục tiêu</Button><Button size="sm" variant={preview.manual ? 'primary' : 'outline'} onClick={() => setVisualSource('manual')}>Xem thử thủ công</Button></div>
          <p className="text-xs text-slate-400">Tùy chỉnh màu và trang phục được lưu riêng, không thay đổi số đo. Mục tiêu là mô phỏng giả định, không dự đoán kết quả tương lai.</p>
          <label className="text-xs text-slate-400 block">Phong cách<select aria-label="Phong cách nhân vật" className="block w-full mt-1 p-2 rounded-xl bg-slate-950 border border-slate-700" value={preview.appearance.preset} onChange={e => setAppearancePreset(e.target.value as CharacterAppearance['preset'])}><option value="forge">Forge · xanh ngọc</option><option value="scout">Scout · xanh lá</option><option value="guardian">Guardian · tím</option></select></label>
          <div className="grid grid-cols-3 gap-3">{(['skinColor', 'clothingColor', 'accentColor'] as const).map(key => <label key={key} className="text-xs text-slate-400">{{ skinColor: 'Màu da', clothingColor: 'Trang phục', accentColor: 'Điểm nhấn' }[key]}<input aria-label={{ skinColor: 'Màu da', clothingColor: 'Màu trang phục', accentColor: 'Màu điểm nhấn' }[key]} type="color" value={preview.appearance[key]} onChange={e => updateAppearance({ [key]: e.target.value })} className="mt-2 block h-8 w-full bg-slate-950 rounded" /></label>)}</div>
          <p className="text-xs text-slate-400">Diện mạo cơ bản: thân trên để trần và quần ngắn. Các lựa chọn trang phục cũ vẫn được lưu, không thay đổi số đo.</p>
          <Button size="sm" variant="outline" onClick={toggleAura}>{character.auraUnlocked ? 'Tắt hào quang' : 'Bật hào quang'}</Button>
        </CardContent></Card>
        {preview.manual && <AvatarControls morph={activeManual} onChange={updateManual} onReset={() => updateManual(isGoal ? mappedMorph(selectedGoalId ? goalBodies[selectedGoalId] ?? BodyCompositionToAvatar(null, 'goal') : BodyCompositionToAvatar(null, 'goal')) : mappedMorph(BodyCompositionToAvatar(preview.measurement)))} auraEnabled={character.auraUnlocked} onToggleAura={toggleAura} title="Bản xem thử · không sửa InBody" />}
        <Card className="p-4 text-xs text-slate-400"><p className="font-bold text-teal-300 mb-2">Trang bị RPG đã lưu</p><p>Đai lưng: {character.equippedGear.liftingBelt ?? 'Chưa trang bị'}</p><p>Băng cổ tay: {character.equippedGear.wristWraps ?? 'Chưa trang bị'}</p><p>Băng gối: {character.equippedGear.kneeSleeves ?? 'Chưa trang bị'}</p><p className="mt-2">Trang phục đã mở: {character.unlockedSkins.join(', ')}</p></Card>
      </div>
    </div>
    <BodyTargets />
    <CosmeticRewards />
  </div>
}
