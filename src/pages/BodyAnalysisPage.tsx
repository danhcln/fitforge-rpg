import { useState } from 'react'
import { useInBodyStore } from '@/stores'
import { Card, CardHeader, CardTitle, CardContent, Input, Button, Modal } from '@/components/ui'
import type { BodyMeasurement } from '@/types'
import { localDate } from '@/services/workout/calculations'
const fields = {
  weightKg: 'Cân nặng (kg)', smmKg: 'Cơ xương SMM (kg)', pbfPercent: 'Tỷ lệ mỡ (%)', bmi: 'BMI',
  bodyFatMassKg: 'Khối lượng mỡ (kg)', bmrKcal: 'BMR (kcal)', visceralFatLevel: 'Mức mỡ nội tạng',
  bodyWaterKg: 'Nước cơ thể (kg)', boneMassKg: 'Khoáng chất xương (kg)',
}
const segmentFields = { rightArmKg: 'Tay phải (kg)', rightArmPercent: 'Tay phải (%)', leftArmKg: 'Tay trái (kg)', leftArmPercent: 'Tay trái (%)',
  trunkKg: 'Thân (kg)', trunkPercent: 'Thân (%)', rightLegKg: 'Chân phải (kg)', rightLegPercent: 'Chân phải (%)', leftLegKg: 'Chân trái (kg)', leftLegPercent: 'Chân trái (%)' }
export function BodyAnalysisPage() {
  const { measurements, latestMeasurement, addMeasurement } = useInBodyStore()
  const [open, setOpen] = useState(false)
  const [values, setValues] = useState<Record<string, string>>({ date: localDate() })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const save = async () => {
    setBusy(true)
    try {
      const numbers = Object.fromEntries(Object.keys(fields).map(k => [k, values[k]?.trim() ? Number(values[k]) : NaN]))
      const segments = Object.fromEntries(Object.keys(segmentFields).map(k => [k, values[k]?.trim() ? Number(values[k]) : NaN]))
      await addMeasurement({ ...numbers, date: values.date, segmentalLean: segments, notes: values.notes ?? '',
        ...(values.inBodyScore ? { inBodyScore: Number(values.inBodyScore) } : {}) } as unknown as Omit<BodyMeasurement, 'id'>)
      setOpen(false); setError('')
    } catch (err) { setError(String(err)) } finally { setBusy(false) }
  }
  return <div className="space-y-6 animate-in fade-in-50 duration-200">
    <div className="flex flex-wrap justify-between gap-4 pb-2 border-b border-slate-800"><div><h1 className="text-2xl sm:text-3xl font-extrabold text-white">Chỉ Số InBody & Phân Tích Thể Trạng</h1>
      <p className="text-sm text-slate-400 mt-1">Lưu phiếu đo thực tế trên thiết bị. Avatar được tinh chỉnh thủ công trong giai đoạn này.</p></div><Button onClick={() => setOpen(true)}>Thêm phiếu đo</Button></div>
    {!latestMeasurement ? <Card className="p-6 text-slate-400">Chưa có phiếu đo thực tế. Nhập số liệu từ phiếu của bạn.</Card> : <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Object.entries(fields).map(([key, label]) => <Card key={key} className="p-4 bg-slate-900/60"><p className="text-xs text-slate-400">{label}</p><p className="text-2xl font-black text-teal-400">{latestMeasurement[key as keyof typeof fields]}</p></Card>)}</div>
      <Card><CardHeader><CardTitle>Phân đoạn cơ · {latestMeasurement.date}</CardTitle></CardHeader><CardContent className="grid sm:grid-cols-2 gap-3">
        {Object.entries(segmentFields).map(([key, label]) => <p key={key} className="text-sm text-slate-300">{label}: {latestMeasurement.segmentalLean[key as keyof typeof segmentFields]}</p>)}
      </CardContent></Card></>}
    <Card><CardHeader><CardTitle>Lịch sử phiếu đo</CardTitle></CardHeader><CardContent>{measurements.map(m => <p key={m.id} className="text-sm text-slate-300 py-2">{m.date} · {m.weightKg} kg · SMM {m.smmKg} kg · PBF {m.pbfPercent}%</p>)}</CardContent></Card>
    <Modal isOpen={open} onClose={() => { if (!busy) setOpen(false) }} title="Nhập phiếu đo thực tế" maxWidth="xl">
      <div className="max-h-[65vh] overflow-y-auto space-y-4 pr-2">
        {error && <p role="alert" className="text-rose-400">{error}</p>}
        <Input label="Ngày đo" type="date" value={values.date} onChange={e => setValues({ ...values, date: e.target.value })} />
        <div className="grid grid-cols-2 gap-3">{Object.entries({ ...fields, ...segmentFields, inBodyScore: 'Điểm InBody (tùy chọn)' }).map(([key, label]) => <Input key={key} label={label} type="number" min="0" step="any" value={values[key] ?? ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />)}</div>
        <Input label="Ghi chú" value={values.notes ?? ''} onChange={e => setValues({ ...values, notes: e.target.value })} />
        <Button onClick={save} disabled={busy}>Lưu phiếu đo</Button>
      </div>
    </Modal>
  </div>
}
