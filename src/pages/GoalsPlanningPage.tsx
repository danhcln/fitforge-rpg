import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import type { Goal } from '@/types'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Modal, Badge } from '@/components/ui'
import { localDate } from '@/services/workout/calculations'
import { useInBodyStore } from '@/stores'
import { TargetComparison } from '@/components/BodyComposition'
import { formatBodyValue } from '@/services/bodyComposition/presentation'
import { TrainingPlanner } from '@/components/TrainingPlanner'
import { NutritionJournal } from '@/components/NutritionJournal'
import { QuestPanel } from '@/components/RpgProgression'
import { useUserStore } from '@/stores'
const labels = { targetWeightKg: 'Cân nặng (kg)', targetSmmKg: 'Cơ xương (kg)', targetPbfPercent: 'Tỷ lệ mỡ (%)',
  targetCaloDaily: 'Calo mỗi ngày', targetProteinDailyGrams: 'Protein (g)', targetCarbDailyGrams: 'Carb (g)', targetFatDailyGrams: 'Chất béo (g)', targetWeeklyWorkouts: 'Buổi tập mỗi tuần' }
export function GoalsPlanningPage() {
  const { latestMeasurement } = useInBodyStore()
  const { user } = useUserStore()
  const preferences = useLiveQuery(() => db.nutritionSettings.get(`nutrition:${user.id}`), [user.id])
  const adult = preferences?.ageYears !== null && preferences?.ageYears !== undefined && preferences.ageYears >= 18
  const visibleLabels = Object.fromEntries(Object.entries(labels).filter(([key]) => adult || key === 'targetWeeklyWorkouts'))
  const [section, setSection] = useState('training')
  const goals = useLiveQuery(() => db.goals.toArray(), [])?.filter(g => g.source !== 'demo') ?? []
  const [editing, setEditing] = useState<Goal | null>(null)
  const [values, setValues] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const open = (goal?: Goal) => {
    const entry: Goal = goal ?? { id: crypto.randomUUID(), title: '', category: 'habit', currentWeightKg: 0, currentSmmKg: 0, currentPbfPercent: 0,
      targetWeightKg: 0, targetSmmKg: 0, targetPbfPercent: 0, targetCaloDaily: 0, targetProteinDailyGrams: 0, targetCarbDailyGrams: 0, targetFatDailyGrams: 0,
      targetWeeklyWorkouts: 0, deadline: localDate(), progressPercent: 0, isCompleted: false }
    setEditing(entry); setValues(Object.fromEntries(Object.entries(entry).map(([k, v]) => [k, String(v)]))); setError('')
  }
  return <div className="space-y-6 animate-in fade-in-50 duration-200">
    <div className="flex justify-between flex-wrap gap-4 pb-2 border-b border-slate-800"><div><h1 className="text-2xl sm:text-3xl font-extrabold text-white">Mục Tiêu & Kế Hoạch</h1><p className="text-sm text-slate-400 mt-1">Lịch tập, bữa ăn đã ghi và nhịp phục hồi cá nhân.</p></div>{section === 'goals' && <Button onClick={() => open()}>Thêm mục tiêu</Button>}</div>
    <div className="flex flex-wrap gap-2">{[['training', 'Lịch tập'], ['nutrition', 'Dinh dưỡng'], ['quests', 'Nhiệm vụ'], ['goals', 'Mục tiêu cá nhân']].map(([key, label]) => <Button key={key} variant={section === key ? 'primary' : 'outline'} aria-pressed={section === key} onClick={() => setSection(key)}>{label}</Button>)}</div>
    <div hidden={section !== 'training'}><TrainingPlanner /></div><div hidden={section !== 'nutrition'}><NutritionJournal /></div><div hidden={section !== 'quests'}><QuestPanel /></div>
    <div hidden={section !== 'goals'} className="space-y-4">
    {!adult && <p className="text-sm text-teal-200">Tập trung thói quen tập luyện và nghỉ ngơi. Không tạo kế hoạch tối ưu hình thể hay mục tiêu calo/macro hạn chế cho người dưới 18 tuổi hoặc chưa xác nhận tuổi.</p>}
    {!goals.length && <Card className="p-6 text-slate-400">Chưa có mục tiêu cá nhân.</Card>}
    {goals.map(goal => <Card key={goal.id}><CardHeader className="flex justify-between"><CardTitle>{goal.title}</CardTitle><Badge>{goal.deadline}</Badge></CardHeader><CardContent>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">{Object.entries(visibleLabels).map(([key, label]) => <div key={key} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800"><p className="text-xs text-slate-400">{label}</p><p className="text-xl text-teal-400 font-bold">{goal[key as keyof typeof labels] > 0 ? formatBodyValue(goal[key as keyof typeof labels]) : 'Chưa đặt'}</p></div>)}</div>
      <Button variant="outline" onClick={() => open(goal)}>Chỉnh sửa mục tiêu</Button>
      {adult && <TargetComparison goal={goal} current={latestMeasurement} />}
    </CardContent></Card>)}
    <Modal isOpen={!!editing} onClose={() => { if (!busy) setEditing(null) }} title="Mục tiêu cá nhân" maxWidth="xl"><div className="space-y-3 max-h-[65vh] overflow-y-auto">
      {error && <p role="alert" className="text-rose-400">{error}</p>}
      <Input label="Tên mục tiêu" value={values.title ?? ''} onChange={e => setValues({ ...values, title: e.target.value })} />
      <select aria-label="Loại mục tiêu" className="bg-slate-950 p-2 rounded-xl text-slate-200" value={values.category} onChange={e => setValues({ ...values, category: e.target.value })}>
        <option value="habit">Thói quen</option><option value="strength">Sức mạnh</option>{adult && <><option value="muscle_gain">Tăng cơ</option><option value="fat_loss">Giảm mỡ</option></>}
      </select>
      <div className="grid grid-cols-2 gap-3">{Object.entries(visibleLabels).map(([key, label]) => <Input key={key} label={label} type="number" min="0" step="any" value={values[key] ?? ''} onChange={e => setValues({ ...values, [key]: e.target.value })} />)}</div>
      <Input label="Hạn mục tiêu" type="date" value={values.deadline ?? ''} onInput={e => setValues({ ...values, deadline: e.currentTarget.value })} onChange={e => setValues({ ...values, deadline: e.target.value })} />
      <Button disabled={busy} onClick={async () => {
        if (!editing) return
        setBusy(true)
        try { await db.putEntity('goals', { ...editing, title: values.title, category: values.category, deadline: values.deadline,
          ...Object.fromEntries(Object.keys(labels).map(k => [k, values[k]?.trim() ? Number(values[k]) : NaN])) }); setEditing(null) }
        catch (err) { setError(String(err)) } finally { setBusy(false) }
      }}>Lưu mục tiêu</Button>
    </div></Modal></div>
  </div>
}
