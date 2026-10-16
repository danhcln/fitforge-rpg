import { useState } from 'react'
import { useInBodyStore } from '@/stores'
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Modal } from '@/components/ui'
import type { BodyMeasurement, BodyMetric, DeviceReference, SegmentalLean } from '@/types/inbody'
import { localDate } from '@/services/workout/calculations'
import { available, bodyMetrics, metricValue, units } from '@/services/bodyComposition/calculations'
import { validateMeasurement } from '@/services/bodyComposition/validation'
import { BodyOverview, BodyHistoryCharts, BodyTargets } from '@/components/BodyComposition'
import { formatBodyValue, metricLabels } from '@/services/bodyComposition/presentation'
const fields = {
  heightCm: 'Chiều cao (cm)', weightKg: 'Cân nặng (kg)', smmKg: 'Cơ xương SMM (kg)', pbfPercent: 'Tỷ lệ mỡ PBF (%)',
  bodyFatMassKg: 'Khối lượng mỡ (kg)', bmi: 'BMI trên phiếu (kg/m², tùy chọn)', bmrKcal: 'BMR (kcal, tùy chọn)', visceralFatLevel: 'Mức mỡ nội tạng (tùy chọn)',
  bodyWaterKg: 'Nước cơ thể (kg, tùy chọn)', boneMassKg: 'Khoáng xương (kg, tùy chọn)', inBodyScore: 'Điểm InBody (tùy chọn)', ageYears: 'Tuổi tại ngày đo (tùy chọn)',
}
const segmentFields: Record<keyof SegmentalLean, string> = { rightArmKg: 'Tay phải (kg)', rightArmPercent: 'Tay phải (%)', leftArmKg: 'Tay trái (kg)', leftArmPercent: 'Tay trái (%)',
  trunkKg: 'Thân (kg)', trunkPercent: 'Thân (%)', rightLegKg: 'Chân phải (kg)', rightLegPercent: 'Chân phải (%)', leftLegKg: 'Chân trái (kg)', leftLegPercent: 'Chân trái (%)' }
function SegmentVisualization({ measurement }: { measurement: BodyMeasurement }) {
  const regions: { key: keyof SegmentalLean; percent: keyof SegmentalLean; label: string; path: string }[] = [
    { key: 'leftArmKg', percent: 'leftArmPercent', label: 'Tay trái', path: 'M65 70 L85 75 L63 155 L43 150 Z' },
    { key: 'rightArmKg', percent: 'rightArmPercent', label: 'Tay phải', path: 'M115 75 L135 70 L157 150 L137 155 Z' },
    { key: 'trunkKg', percent: 'trunkPercent', label: 'Thân', path: 'M80 65 L120 65 L125 155 L75 155 Z' },
    { key: 'leftLegKg', percent: 'leftLegPercent', label: 'Chân trái', path: 'M75 160 L98 160 L94 265 L70 265 Z' },
    { key: 'rightLegKg', percent: 'rightLegPercent', label: 'Chân phải', path: 'M102 160 L125 160 L130 265 L106 265 Z' },
  ]
  const segment = measurement.segmentalLean ?? {}
  const max = Math.max(1, ...regions.map(r => segment[r.key] ?? 0))
  return <Card><CardHeader><CardTitle>Mô nạc phân đoạn · {measurement.date}</CardTitle></CardHeader><CardContent>
    <div className="flex flex-col sm:flex-row gap-6 items-center"><svg viewBox="0 0 200 280" className="h-64 w-44 shrink-0" role="img" aria-label="Sơ đồ các phân đoạn có số đo mô nạc"><circle cx="100" cy="35" r="23" fill="#334155" />{regions.map(r => <path key={r.key} d={r.path} fill={available(segment[r.key]) ? '#0d9488' : '#334155'} stroke="#14b8a6"><title>{r.label}: {formatBodyValue(segment[r.key])} kg</title></path>)}</svg>
      <div className="w-full space-y-3">{regions.map(r => <div key={r.key}><div className="flex justify-between text-sm text-slate-300 gap-2"><span>{r.label}</span><span>{formatBodyValue(segment[r.key])} kg · {formatBodyValue(segment[r.percent])}% theo phiếu</span></div><div className="h-2 rounded bg-slate-800 mt-1"><div className="h-2 rounded bg-teal-500" style={{ width: available(segment[r.key]) ? `${Math.min(100, segment[r.key]! / max * 100)}%` : '0%' }} /></div></div>)}</div>
    </div><p className="text-xs text-slate-500 mt-3">Mô nạc gồm nhiều loại mô, không phải khối lượng cơ riêng của từng vùng. Thanh so sánh kg tương đối với vùng lớn nhất trong phiếu; màu không phân loại sức khỏe. Tỷ lệ % được chép riêng từ thiết bị.</p>
  </CardContent></Card>
}
export function BodyAnalysisPage() {
  const { measurements, latestMeasurement, addMeasurement, updateMeasurement, deleteMeasurement } = useInBodyStore()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BodyMeasurement | null>(null)
  const [deleting, setDeleting] = useState<BodyMeasurement | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const enter = (measurement?: BodyMeasurement) => {
    const initial: Record<string, string> = { date: measurement?.date ?? localDate(), notes: measurement?.notes ?? '' }
    for (const key of Object.keys(fields) as (keyof typeof fields)[]) initial[key] = measurement?.[key] == null ? '' : String(measurement[key])
    for (const key of Object.keys(segmentFields) as (keyof SegmentalLean)[]) initial[key] = measurement?.segmentalLean?.[key] == null ? '' : String(measurement.segmentalLean[key])
    for (const metric of bodyMetrics) {
      const ref = measurement?.references?.[metric]
      initial[`${metric}.min`] = ref ? String(ref.min) : ''; initial[`${metric}.max`] = ref ? String(ref.max) : ''
      initial[`${metric}.label`] = ref?.label ?? ''; initial[`${metric}.scope`] = ref?.scope ?? 'adult'
    }
    setValues(initial); setEditing(measurement ?? null); setError(''); setOpen(true)
  }
  const save = async () => {
    setBusy(true)
    try {
      const parse = (key: string) => values[key]?.trim() ? Number(values[key]) : null
      const numbers = Object.fromEntries(Object.keys(fields).map(k => [k, parse(k)]))
      const segments = Object.fromEntries(Object.keys(segmentFields).filter(k => values[k]?.trim()).map(k => [k, parse(k)]))
      const references: Partial<Record<BodyMetric, DeviceReference>> = {}
      for (const metric of bodyMetrics) if (values[`${metric}.min`]?.trim() || values[`${metric}.max`]?.trim() || values[`${metric}.label`]?.trim()) {
        if (!values[`${metric}.min`]?.trim() || !values[`${metric}.max`]?.trim() || !values[`${metric}.label`]?.trim()) throw new Error('Khoảng tham chiếu cần đủ cận dưới, cận trên và nguồn theo phiếu.')
        references[metric] = { min: Number(values[`${metric}.min`]), max: Number(values[`${metric}.max`]), unit: units[metric], label: values[`${metric}.label`].trim(), scope: values[`${metric}.scope`] as DeviceReference['scope'] }
      }
      const measurement = { ...numbers, id: editing?.id ?? crypto.randomUUID(), measurementVersion: 3, date: values.date,
        segmentalLean: segments, references, notes: values.notes ?? '' }
      validateMeasurement(measurement)
      if (editing) await updateMeasurement(measurement)
      else { const { id: _id, ...data } = measurement; await addMeasurement(data) }
      setOpen(false); setError('')
    } catch (err) { setError(String(err)) } finally { setBusy(false) }
  }
  return <div className="space-y-6 animate-in fade-in-50 duration-200">
    <div className="flex flex-wrap justify-between gap-4 pb-2 border-b border-slate-800"><div><h1 className="text-2xl sm:text-3xl font-extrabold text-white">Chỉ Số InBody & Phân Tích Thể Trạng</h1>
      <p className="text-sm text-slate-400 mt-1">Lưu phiếu đo thực tế tại thiết bị này. Số đo, tính toán và mục tiêu được hiển thị riêng.</p></div><Button onClick={() => enter()}>Thêm phiếu đo</Button></div>
    {!open && !deleting && error && <p role="alert" className="text-rose-400">{error}</p>}
    <BodyOverview measurement={latestMeasurement} previous={measurements.at(-2)} />
    <BodyHistoryCharts />
    {latestMeasurement && <SegmentVisualization measurement={latestMeasurement} />}
    <BodyTargets />
    <Card><CardHeader><CardTitle>Lịch sử phiếu đo · {measurements.length} phiếu</CardTitle></CardHeader><CardContent>
      {!measurements.length ? <p className="text-sm text-slate-400">Chưa có phiếu đo. Dữ liệu mẫu không được hiển thị như tiến trình thực tế.</p> : <div className="overflow-x-auto"><table className="w-full text-sm text-left whitespace-nowrap"><thead className="text-slate-400"><tr><th className="p-2">Ngày</th>{bodyMetrics.map(m => <th key={m} className="p-2">{metricLabels[m]} ({units[m]})</th>)}<th className="p-2">Thao tác</th></tr></thead><tbody>{measurements.map(m => <tr key={m.id} className="text-slate-300 border-t border-slate-800"><td className="p-2">{m.date}</td>{bodyMetrics.map(metric => <td key={metric} className="p-2">{formatBodyValue(metricValue(m, metric))}</td>)}<td className="p-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => enter(m)}>Sửa</Button><Button size="sm" variant="ghost" onClick={() => { setDeleting(m); setError('') }}>Xóa</Button></td></tr>)}</tbody></table></div>}
    </CardContent></Card>
    <Modal isOpen={open} onClose={() => { if (!busy) setOpen(false) }} title={editing ? 'Chỉnh sửa phiếu đo' : 'Nhập phiếu đo thực tế'} maxWidth="xl">
      <form onSubmit={e => { e.preventDefault(); void save() }} className="max-h-[65vh] overflow-y-auto space-y-4 pr-2">
        {error && <p role="alert" className="text-rose-400">{error}</p>}
        <p className="text-xs text-slate-400">Nhập theo đúng đơn vị trên phiếu. Để trống chỉ số không có; ứng dụng lưu là chưa có, không tự điền số 0. Cần ít nhất một số đo.</p>
        <Input label="Ngày đo" type="date" required value={values.date ?? ''} onInput={e => setValues({ ...values, date: e.currentTarget.value })} onChange={e => setValues({ ...values, date: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">{Object.entries(fields).map(([key, label]) => <Input key={key} label={label} type="number" min="0" step="any" value={values[key] ?? ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />)}</div>
        <h3 className="text-sm text-teal-300">Mô nạc phân đoạn (tùy chọn)</h3><div className="grid grid-cols-2 gap-3">{Object.entries(segmentFields).map(([key, label]) => <Input key={key} label={label} type="number" min="0" step="any" value={values[key] ?? ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />)}</div>
        <details className="rounded-xl border border-slate-700 p-3"><summary className="text-sm text-teal-300 cursor-pointer">Khoảng tham chiếu từ phiếu (tùy chọn)</summary><p className="text-xs text-slate-400 mt-2">Chỉ nhập khoảng thật trên phiếu. Chọn “Cá nhân” khi thiết bị đã cung cấp khoảng phù hợp với người được đo; khoảng người lớn bị bỏ qua khi dưới 18 hoặc chưa biết tuổi.</p>
          {bodyMetrics.map(metric => <div key={metric} className="space-y-2 mt-4"><h4 className="text-sm text-slate-200">{metricLabels[metric]} ({units[metric]})</h4><div className="grid grid-cols-2 gap-2">{['min', 'max', 'label'].map(field => <Input key={field} label={`${metricLabels[metric]} · ${field === 'min' ? 'Cận dưới' : field === 'max' ? 'Cận trên' : 'Nguồn theo phiếu'}`} type={field === 'label' ? 'text' : 'number'} step="any" value={values[`${metric}.${field}`] ?? ''} onChange={e => setValues({ ...values, [`${metric}.${field}`]: e.target.value })} />)}<label className="text-xs text-slate-400">Phạm vi · {metricLabels[metric]}<select aria-label={`Phạm vi ${metricLabels[metric]}`} className="block mt-1 bg-slate-950 border border-slate-700 rounded-xl p-2 w-full" value={values[`${metric}.scope`]} onChange={e => setValues({ ...values, [`${metric}.scope`]: e.target.value })}><option value="adult">Người lớn</option><option value="individual">Cá nhân theo phiếu</option></select></label></div></div>)}
        </details>
        <Input label="Ghi chú" value={values.notes ?? ''} onChange={e => setValues({ ...values, notes: e.target.value })} />
        <Button type="submit" disabled={busy}>Lưu phiếu đo</Button>
      </form>
    </Modal>
    <Modal isOpen={!!deleting} onClose={() => { if (!busy) setDeleting(null) }} title="Xóa phiếu đo?">
      <p className="text-sm text-slate-300 mb-4">Xóa phiếu ngày {deleting?.date}? Thao tác này chỉ xóa phiếu đã chọn. Có thể xuất bản sao lưu trước tại trang Cài Đặt.</p>
      {error && <p role="alert" className="text-rose-400 mb-3">{error}</p>}<div className="flex gap-3"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Hủy</Button><Button disabled={busy} onClick={async () => { if (!deleting) return; setBusy(true); try { await deleteMeasurement(deleting.id); setDeleting(null); setError('') } catch (err) { setError(String(err)) } finally { setBusy(false) } }}>Xóa phiếu đo</Button></div>
    </Modal>
  </div>
}
