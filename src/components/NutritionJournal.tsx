import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { useUserStore } from '@/stores'
import type { NutritionEntry, NutritionSettings } from '@/types'
import { defaultNutritionSettings, energyAllowed, nutritionSummary } from '@/services/planning/calculations'
import { shiftDate, weekStart } from '@/services/rpg/calculations'
import { localDate } from '@/services/workout/calculations'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal } from '@/components/ui'

const meals = { breakfast: 'Bữa sáng', lunch: 'Bữa trưa', dinner: 'Bữa tối', snack: 'Bữa phụ', hydration: 'Nước uống' }
const nutrients = { proteinGrams: 'Protein đã ăn (g)', carbGrams: 'Carbohydrate đã ăn (g)', fatGrams: 'Chất béo đã ăn (g)', energyKcal: 'Năng lượng ghi từ nhãn (kcal)' }
export function NutritionJournal() {
  const { user } = useUserStore()
  const data = useLiveQuery(async () => ({ rows: await db.nutritionEntries.where('userId').equals(user.id).toArray(), settings: await db.nutritionSettings.get(`nutrition:${user.id}`) }), [user.id])
  const settings = data?.settings ?? defaultNutritionSettings(user.id), rows = data?.rows ?? []
  const [date, setDate] = useState(localDate()), [editing, setEditing] = useState<NutritionEntry | null>(null), [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [settingsDraft, setSettingsDraft] = useState<NutritionSettings | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false)
  const prefs = settingsDraft ?? settings, adult = prefs.ageYears !== null && prefs.ageYears >= 18, showEnergy = energyAllowed(settings)
  const dailyRows = rows.filter(r => r.date === date), start = weekStart(date), daily = nutritionSummary(dailyRows), weekly = nutritionSummary(rows.filter(r => r.date >= start && r.date <= shiftDate(start, 6)))
  const open = (entry?: NutritionEntry) => { setError(''); setEditing(entry ?? { id: crypto.randomUUID(), userId: user.id, date, meal: 'breakfast', name: '', portion: '', proteinGrams: null, carbGrams: null, fatGrams: null, energyKcal: null, waterMl: 0 }) }
  const run = async (action: () => Promise<void>) => { setBusy(true); setError(''); try { await action() } catch (e) { setError(String(e)) } finally { setBusy(false) } }
  return <Card><CardHeader><CardTitle>Nhật ký dinh dưỡng & nước uống</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-slate-400">Ghi những gì bạn đã ăn, không phải mục tiêu giới hạn. Khẩu phần và dưỡng chất nhập từ nhãn hoặc nguồn bạn chọn; không tự suy ra calo hay nhu cầu cơ thể.</p>
    {error && <p role="alert" className="text-rose-400">{error}</p>}
    <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 space-y-3">
      <Input label="Tuổi của bạn (tùy chọn)" type="number" min="1" max="120" step="1" value={prefs.ageYears ?? ''} onChange={e => { const ageYears = e.target.value ? Number(e.target.value) : null; setSettingsDraft({ ...prefs, ageYears, energyEnabled: ageYears !== null && ageYears >= 18 && prefs.energyEnabled }) }} />
      <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" disabled={!adult} checked={prefs.energyEnabled} onChange={e => setSettingsDraft({ ...prefs, energyEnabled: e.target.checked })} />Ghi năng lượng tùy chọn (chỉ từ 18 tuổi)</label>
      <label className="flex items-center gap-2 text-sm text-slate-300"><input type="checkbox" checked={prefs.hydrationReminder} onChange={e => setSettingsDraft({ ...prefs, hydrationReminder: e.target.checked })} />Hiện lời nhắc nước uống trong ứng dụng</label>
      <Button size="sm" disabled={busy || !settingsDraft} onClick={() => run(async () => { await db.saveNutritionSettings(prefs); setSettingsDraft(null) })}>Lưu tùy chọn dinh dưỡng</Button>
      {(settings.ageYears === null || settings.ageYears < 18) && <p className="text-xs text-teal-200">Với người dưới 18 tuổi hoặc chưa xác nhận tuổi: tập trung bữa ăn đa dạng và đủ chất. Không tạo mục tiêu giảm cân, thiếu hụt calo hay macro hạn chế.</p>}
      <p className="text-xs text-slate-400">Đa dạng rau, trái cây, ngũ cốc, thực phẩm đạm và sữa hoặc lựa chọn phù hợp. Ăn đều, dành thời gian nghỉ, và trao đổi với người chăm sóc / chuyên gia khi cần hỗ trợ cá nhân. <a className="text-teal-300 underline" href="https://www.cdc.gov/healthy-weight-growth/tips-parents-caregivers/index.html" target="_blank" rel="noreferrer">Nguồn giáo dục: CDC</a></p>
      {settings.hydrationReminder && <p className="text-xs text-cyan-300">Nhắc nhẹ: giữ nước uống bên cạnh và uống phù hợp nhu cầu. Không có chỉ tiêu nước bắt buộc hay phần thưởng cho uống nhiều.</p>}
    </div>
    <div className="flex flex-wrap gap-3 items-end"><Input label="Ngày nhật ký" type="date" value={date} onChange={e => { if (e.target.value) setDate(e.target.value) }} /><Button onClick={() => open()}>Ghi bữa ăn / nước</Button></div>
    <div className="grid sm:grid-cols-2 gap-3">{[[`Ngày ${date}`, daily], [`Tuần ${start} — ${shiftDate(start, 6)}`, weekly]].map(([label, summary]) => { const s = summary as typeof daily; return <div key={String(label)} className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-sm space-y-2"><p className="text-white font-semibold">{String(label)}</p><p className="text-teal-300">{s.foods} món · P {s.proteinGrams.toFixed(1)} g · C {s.carbGrams.toFixed(1)} g · F {s.fatGrams.toFixed(1)} g</p><p className="text-cyan-300">Nước đã ghi: {s.waterMl} ml</p>{showEnergy && <p className="text-slate-300">{s.energyKcal.toFixed(0)} kcal từ {s.energyEntries} món có ghi nhãn</p>}<p className="text-xs text-slate-500">Tổng phần đã ghi, không đại diện toàn bộ khẩu phần. {s.incompleteFoods} món thiếu ít nhất một giá trị macro.</p></div> })}</div>
    {!dailyRows.length && <p className="text-slate-400 text-sm">Chưa có món hoặc nước uống cho ngày này.</p>}
    {dailyRows.map(row => <div key={row.id} className="p-3 rounded-xl border border-slate-800 bg-slate-950/60 space-y-2"><p className="text-sm font-semibold text-white">{meals[row.meal]} · {row.name}</p><p className="text-xs text-slate-400">{row.portion} · P {row.proteinGrams ?? '—'} g / C {row.carbGrams ?? '—'} g / F {row.fatGrams ?? '—'} g · {row.waterMl} ml{showEnergy && row.energyKcal !== null ? ` · ${row.energyKcal} kcal` : ''}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={busy} onClick={() => open(row)}>Sửa món</Button><Button size="sm" variant="ghost" disabled={busy} onClick={() => setConfirmDelete(row.id)}>Xóa món</Button></div></div>)}
    <Modal isOpen={!!editing} onClose={() => { if (!busy) setEditing(null) }} title="Ghi khẩu phần đã ăn / uống" maxWidth="xl">
      {editing && <form className="space-y-3 max-h-[65vh] overflow-y-auto" onSubmit={e => { e.preventDefault(); run(async () => { await db.saveNutrition(editing); setEditing(null) }) }}>
        {error && <p role="alert" className="text-rose-400">{error}</p>}
        <Input label="Ngày của bữa ăn" required type="date" value={editing.date} onChange={e => setEditing({ ...editing, date: e.target.value })} />
        <select aria-label="Bữa ăn" className="block w-full bg-slate-950 p-2 rounded-xl border border-slate-700 text-slate-300" value={editing.meal} onChange={e => setEditing({ ...editing, meal: e.target.value as NutritionEntry['meal'], ...(e.target.value === 'hydration' ? { proteinGrams: null, carbGrams: null, fatGrams: null, energyKcal: null } : {}) })}>{Object.entries(meals).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>
        <Input label="Tên món / đồ uống" required value={editing.name} onChange={e => setEditing({ ...editing, name: e.target.value })} /><Input label="Khẩu phần (mô tả)" required value={editing.portion} onChange={e => setEditing({ ...editing, portion: e.target.value })} />
        {editing.meal !== 'hydration' && <div className="grid grid-cols-2 gap-3">{Object.entries(nutrients).filter(([key]) => key !== 'energyKcal' || showEnergy).map(([key, label]) => <Input key={key} label={label} type="number" min="0" step="any" value={editing[key as keyof typeof nutrients] ?? ''} helperText="Tùy chọn; bỏ trống khi chưa biết." onChange={e => setEditing({ ...editing, [key]: e.target.value === '' ? null : Number(e.target.value) })} />)}</div>}
        <Input label="Nước uống đã ghi (ml)" type="number" min="0" max="10000" step="any" value={editing.waterMl} onChange={e => setEditing({ ...editing, waterMl: Number(e.target.value) })} />
        <Button type="submit" disabled={busy}>Lưu khẩu phần</Button>
      </form>}
    </Modal>
    <Modal isOpen={!!confirmDelete} onClose={() => { if (!busy) setConfirmDelete(null) }} title="Xóa khẩu phần?"><p className="text-slate-300 text-sm mb-4">Món này sẽ bị xóa khỏi nhật ký. Không thay đổi XP hoặc số đo.</p><Button variant="danger" disabled={busy} onClick={() => run(async () => { if (confirmDelete) await db.deletePlanningEntry('nutritionEntries', confirmDelete); setConfirmDelete(null) })}>Xác nhận xóa khẩu phần</Button></Modal>
  </CardContent></Card>
}
