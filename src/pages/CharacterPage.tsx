import { useEffect } from 'react'
import { useCharacterStore, useInBodyStore } from '@/stores'
import { AthleteViewer } from '@/components/avatar/AthleteViewer'
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '@/components/ui'
import { BodyTargets } from '@/components/BodyComposition'
import { CosmeticRewards } from '@/components/RpgProgression'
import { resolveEvolution, mappedMorph } from '@/services/character/evolution'
import { BodyCompositionToAvatar } from '@/services/bodyComposition/BodyCompositionToAvatar'
import { athleteControls, athletePresets, athleteStyles as styles } from '@/services/character/athlete'
import { formatBodyValue, metricLabels } from '@/services/bodyComposition/presentation'
import { bodyMetrics, compareMeasurements, units } from '@/services/bodyComposition/calculations'
import { Check, Palette, SlidersHorizontal } from 'lucide-react'

export function CharacterPage() {
  const { measurements, latestMeasurement } = useInBodyStore()
  const store = useCharacterStore()
  const { character, goalBodies, selectedGoalId, selectedMeasurementId, comparisonMeasurementId } = store
  const preview = resolveEvolution(character, measurements, selectedMeasurementId, goalBodies, selectedGoalId)
  const isGoal = character.mode === 'goal'
  const appearance = character.appearance ?? styles.forge
  const selectedComparison = !isGoal && !preview.manual ? measurements.find(m => m.id === comparisonMeasurementId) : undefined
  const comparison = selectedComparison ? mappedMorph(BodyCompositionToAvatar(selectedComparison)) : undefined
  const differences = compareMeasurements(preview.measurement, selectedComparison)
  const manualBody = isGoal ? character.goalBody : character.currentBody
  const update = isGoal ? store.updateGoalBody : store.updateCurrentBody
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (useCharacterStore.getState().pendingWrites > 0) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])
  const label = preview.manual ? 'Bản xem thử thủ công' : isGoal ? 'Mục tiêu · mô phỏng giả định' : `Phiếu đo · ${preview.measurement?.date ?? 'chưa có số đo'}`

  return <div className="space-y-6 animate-in fade-in-50 duration-200">
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
      <div><p className="mb-2 text-[10px] font-bold tracking-[.25em] text-teal-400">YOUR FITNESS JOURNEY</p>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Chiến binh của bạn</h1>
        <p className="mt-2 text-sm text-slate-400">Diện mạo riêng. Từng bước khỏe hơn.</p>
      </div>
      <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800 gap-1">
        <Button size="sm" variant={!isGoal ? 'primary' : 'ghost'} onClick={() => store.setMode('current')}>Hiện tại</Button>
        <Button size="sm" variant={isGoal ? 'gold' : 'ghost'} onClick={() => store.setMode('goal')}>Mục tiêu</Button>
      </div>
    </div>
    {store.error && <p role="alert" className="text-rose-300 border border-rose-900 rounded-xl p-3">{store.error}</p>}
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
      <div className="lg:col-span-7 space-y-4">
        <AthleteViewer morph={preview.morph} appearance={appearance} comparisonMorph={comparison} label={label} />
        <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs text-slate-400">
          <Badge variant={preview.manual ? 'purple' : isGoal ? 'gold' : 'cyan'}>{preview.manual ? 'Tùy chỉnh tự do' : isGoal ? 'Mô phỏng mục tiêu' : 'Theo số đo'}</Badge>
          <span role="status" className="inline-flex items-center gap-1"><Check className="w-3 h-3 text-teal-400" />{store.pendingWrites ? 'Đang lưu diện mạo…' : store.error ? 'Chưa lưu được thay đổi' : 'Diện mạo được lưu trên thiết bị'}</span>
        </div>
        {!preview.manual && <Card className="p-4 text-sm text-slate-400">
          {!preview.mapping.sourceId ? <p>Chưa có {isGoal ? 'mục tiêu đã chọn' : 'phiếu đo'}. Nhân vật đang dùng hình thể trung tính.</p> : <p>{label}. Chỉ số còn thiếu được thể hiện bằng tỷ lệ trung tính.</p>}
          <p className="text-xs mt-2">Hình thể là minh họa gần đúng; XP và Level không làm tăng cơ trên nhân vật.</p>
        </Card>}
        <details className="rounded-2xl border border-slate-800 bg-slate-900/50 p-4">
          <summary className="font-semibold text-sm text-slate-200 cursor-pointer">Mốc đo & so sánh lịch sử</summary>
          <div className="mt-4 space-y-3">
            {!measurements.length ? <p className="text-sm text-slate-400">Thêm phiếu ở trang Chỉ số InBody để theo dõi thay đổi.</p> : <>
              <label className="block text-xs text-slate-400">Phiếu đang xem<select aria-label="Chọn phiếu đo avatar" className="block w-full mt-2 rounded-xl bg-slate-950 border border-slate-700 p-2 text-slate-200" value={selectedMeasurementId ?? ''} onChange={e => { store.selectMeasurement(e.target.value || null); store.selectComparison(null) }}><option value="">Mới nhất · {latestMeasurement?.date}</option>{measurements.map(m => <option key={m.id} value={m.id}>{m.date} · {formatBodyValue(m.weightKg)} kg</option>)}</select></label>
              <label className="block text-xs text-slate-400">So sánh với<select aria-label="Chọn phiếu đo so sánh" className="block w-full mt-2 rounded-xl bg-slate-950 border border-slate-700 p-2 text-slate-200 disabled:opacity-50" disabled={isGoal || preview.manual} value={comparisonMeasurementId ?? ''} onChange={e => store.selectComparison(e.target.value || null)}><option value="">Không so sánh</option>{measurements.filter(m => m.id !== preview.measurement?.id).map(m => <option key={m.id} value={m.id}>{m.date} · {formatBodyValue(m.weightKg)} kg</option>)}</select></label>
              <Button size="sm" variant="outline" onClick={() => { store.selectMeasurement(null); store.selectComparison(null) }}>Về phiếu mới nhất</Button>
            </>}
            {selectedComparison && <><p className="text-xs text-teal-300">Trái: {preview.measurement?.date} · Phải: {selectedComparison.date}</p><table className="w-full text-sm text-slate-400 text-left"><thead><tr><th>Chỉ số</th><th>Trái − phải</th></tr></thead><tbody>{bodyMetrics.map(metric => <tr key={metric} className="border-t border-slate-800"><td className="py-2">{metricLabels[metric]}</td><td>{formatBodyValue(differences[metric])} {metric === 'pbfPercent' ? 'điểm %' : units[metric]}</td></tr>)}</tbody></table></>}
          </div>
        </details>
        <p className="text-[10px] leading-relaxed text-slate-500 px-1">Mô hình thủ tục 3D minh họa thể trạng RPG - Không phản ánh chính xác cấu trúc giải phẫu y khoa. Mục tiêu thể hình là mô phỏng giả định, không bảo đảm kết quả.</p>
      </div>
      <div className="lg:col-span-5 space-y-4">
        <Card><CardHeader><CardTitle><Palette className="w-4 h-4 text-teal-400" /> Phong cách của bạn</CardTitle></CardHeader><CardContent className="space-y-5">
          <div className="grid grid-cols-3 gap-2">{Object.entries(styles).map(([key, style]) => <button key={key} type="button" aria-label={`Phong cách ${key}`} onClick={() => store.updateAppearance(style)} className={`rounded-xl border p-3 text-xs capitalize transition-colors ${appearance.preset === key ? 'border-teal-500 bg-teal-950/30 text-white' : 'border-slate-700 text-slate-400 hover:border-slate-500'}`}><span className="mx-auto mb-2 block w-7 h-7 rounded-full ring-4 ring-white/5" style={{ background: style.clothingColor }} />{key}</button>)}</div>
          <div className="grid grid-cols-2 gap-3">{([['skinColor', 'Màu da'], ['hairColor', 'Màu tóc'], ['clothingColor', 'Áo tập'], ['accentColor', 'Điểm nhấn']] as const).map(([key, text]) => <label key={key} className="rounded-xl bg-slate-950/60 border border-slate-800 p-3 text-xs text-slate-400">{text}<input type="color" aria-label={text} value={appearance[key] ?? '#30231e'} onChange={e => store.updateAppearance({ ...appearance, [key]: e.target.value })} className="mt-2 block w-full h-8 bg-transparent cursor-pointer" /></label>)}</div>
          <p className="text-[11px] text-slate-500">Áo ba lỗ, quần short và giày tập. Màu sắc được lưu riêng với số đo.</p>
        </CardContent></Card>
        <Card><CardHeader><CardTitle><SlidersHorizontal className="w-4 h-4 text-teal-400" /> Hình thể</CardTitle></CardHeader><CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-2"><Button size="sm" variant={!preview.manual ? 'primary' : 'outline'} onClick={() => store.setVisualSource('measurement')}>Theo số đo</Button><Button size="sm" variant={preview.manual ? 'primary' : 'outline'} onClick={() => store.setVisualSource('manual')}>Tự tùy chỉnh</Button></div>
          {preview.manual ? <>
            <div className="flex flex-wrap gap-2">{Object.entries(athletePresets).map(([key, preset]) => <Button key={key} size="sm" variant="outline" onClick={() => update(preset.morph)}>{preset.label}</Button>)}</div>
            {athleteControls.map(control => <label key={control.key} className="block text-xs text-slate-300"><span className="flex justify-between mb-3"><span>{control.label}</span><span className="font-mono text-teal-400">{Math.round(Math.max(0,Math.min(1,(manualBody[control.key]-control.min)/(control.max-control.min)))*100)}%</span></span><input aria-label={control.label} type="range" min={control.min} max={control.max} step=".01" value={manualBody[control.key]} onChange={e => update({ [control.key]: Number(e.target.value) })} className="w-full accent-teal-400 cursor-pointer" /></label>)}
            <Button size="sm" variant="ghost" onClick={() => update(athletePresets.balanced.morph)}>Về dáng cân đối</Button>
            <p className="text-[11px] text-slate-500">Thanh trượt thể hiện mức tùy chỉnh hình ảnh, không phải tỷ lệ số đo. Bản xem thử không sửa phiếu InBody.</p>
          </> : <p className="text-xs leading-relaxed text-slate-400">Hình thể theo phiếu đo đang chọn hoặc mục tiêu. Chuyển sang “Tự tùy chỉnh” để thử các dáng người và điều chỉnh riêng bốn vùng cơ thể.</p>}
        </CardContent></Card>
      </div>
    </div>
    <BodyTargets />
    <CosmeticRewards />
  </div>
}
