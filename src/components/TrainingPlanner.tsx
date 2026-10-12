import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/services/db'
import { useUserStore, useWorkoutStore } from '@/stores'
import type { PlannedDay, SplitKind, TrainingPlan } from '@/types'
import { createWeek, dayStatus, overloadSuggestion, plannedDraft, splitLabels } from '@/services/planning/calculations'
import { shiftDate, weekStart } from '@/services/rpg/calculations'
import { localDate } from '@/services/workout/calculations'
import { Card, CardHeader, CardTitle, CardContent, Button, Input, Badge } from '@/components/ui'

export function TrainingPlanner() {
  const { user } = useUserStore(), { exercises, sessions, activeSession, startPlannedSession } = useWorkoutStore()
  const navigate = useNavigate()
  const [week, setWeek] = useState(weekStart(localDate())), [split, setSplit] = useState<SplitKind>('full-body')
  const [draft, setDraft] = useState<TrainingPlan | null>(null), [error, setError] = useState(''), [busy, setBusy] = useState(false), [selectedDay, setSelectedDay] = useState(0)
  const saved = useLiveQuery(() => db.trainingPlans.get(`plan:${user.id}:${week}`), [user.id, week])
  const plan = draft ?? saved
  const day = plan?.days[selectedDay]
  const updateDay = (updates: Partial<PlannedDay>) => { if (plan) setDraft({ ...plan, days: plan.days.map((d, i) => i === selectedDay ? { ...d, ...updates } : d) }) }
  const save = async () => { if (!plan) return; setBusy(true); setError(''); try { await db.savePlan(plan); setDraft(null) } catch (e) { setError(String(e)) } finally { setBusy(false) } }
  return <Card><CardHeader><CardTitle>Lịch tập hàng tuần</CardTitle></CardHeader><CardContent className="space-y-4">
    <p className="text-sm text-slate-400">Lên lịch theo thời gian và mức thoải mái của bạn. Ngày nghỉ được giữ riêng. Chỉ buổi tập thực tế đã lưu mới tính hoàn thành.</p>
    {error && <p role="alert" className="text-rose-400">{error}</p>}
    <div className="flex flex-wrap items-end gap-2"><Input label="Tuần bắt đầu" type="date" value={week} onChange={e => { if (e.target.value) { setWeek(weekStart(e.target.value)); setDraft(null); setSelectedDay(0) } }} /><Button size="sm" variant="outline" disabled={busy} onClick={() => { setWeek(shiftDate(week, -7)); setDraft(null) }}>Tuần trước</Button><Button size="sm" variant="outline" disabled={busy} onClick={() => { setWeek(shiftDate(week, 7)); setDraft(null) }}>Tuần sau</Button></div>
    <div className="flex flex-wrap gap-2 items-center"><select aria-label="Kiểu lịch tập" value={split} onChange={e => setSplit(e.target.value as SplitKind)} className="p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200">{Object.entries(splitLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select><Button variant="outline" disabled={busy} onClick={() => { setDraft(createWeek(user.id, week, split)); setSelectedDay(0); setError('') }}>Soạn lịch từ mẫu</Button>{plan && <Button disabled={busy || !draft} onClick={save}>Lưu lịch tuần</Button>}{draft && <Button disabled={busy} variant="ghost" onClick={() => setDraft(null)}>Bỏ thay đổi</Button>}</div>
    {draft && <p className="text-xs text-amber-300">Bản soạn chưa lưu. Kiểm tra ngày, bài tập và tải trước khi lưu thay thế lịch của tuần này.</p>}
    {!plan && <p className="text-slate-400 text-sm">Chưa có lịch cho tuần này. Chọn mẫu để soạn, sau đó tự chọn bài tập.</p>}
    {plan && <><div className="grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-7 gap-2">{plan.days.map((d, i) => <button key={d.date} type="button" onClick={() => setSelectedDay(i)} className={`p-3 text-left rounded-xl border ${i === selectedDay ? 'border-teal-500 bg-teal-950/30' : 'border-slate-800 bg-slate-950/60'}`}><p className="text-xs text-slate-400">{['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'Chủ nhật'][i]} · {d.date.slice(5)}</p><p className="text-sm text-white mt-1">{d.title}</p><p className="text-xs text-teal-300 mt-1">{{ rest: 'Nghỉ', scheduled: 'Đã lên lịch', completed: 'Hoàn thành' }[dayStatus(d, sessions)]}</p></button>)}</div>
      {day && <div className="border border-slate-800 rounded-xl p-4 space-y-3">
        <Badge>{day.date} · {splitLabels[plan.split]}</Badge><Input label="Tên ngày tập" value={day.title} onChange={e => updateDay({ title: e.target.value })} />
        <label className="text-sm text-slate-300 flex gap-2"><input type="checkbox" checked={day.isRestDay} onChange={e => updateDay({ isRestDay: e.target.checked, exercises: [], completedSessionId: null })} />Ngày nghỉ / phục hồi</label>
        {day.isRestDay ? <p className="text-sm text-slate-400">Không có bài tập hay tải bắt buộc. Nghỉ ngơi theo nhu cầu.</p> : <>
          <select aria-label="Thêm bài vào lịch" value="" onChange={e => { if (e.target.value && !day.exercises.some(ex => ex.exerciseId === e.target.value)) updateDay({ exercises: [...day.exercises, { exerciseId: e.target.value, sets: 3, reps: 8, weightKg: 0 }] }) }} className="block w-full p-2 rounded-xl bg-slate-950 border border-slate-700 text-slate-200"><option value="">Chọn bài tập...</option>{exercises.map(e => <option key={e.id} value={e.id}>{e.muscleGroup} · {e.nameVi}</option>)}</select>
          {day.exercises.map((ex, i) => { const suggestion = overloadSuggestion(ex.exerciseId, sessions); const change = (values: Partial<typeof ex>) => updateDay({ exercises: day.exercises.map((row, index) => index === i ? { ...row, ...values } : row) }); return <div key={ex.exerciseId} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2"><strong className="text-sm text-white">{exercises.find(e => e.id === ex.exerciseId)?.nameVi ?? ex.exerciseId}</strong><div className="grid grid-cols-3 gap-2"><Input id={`plan-sets-${i}`} label="Hiệp" type="number" min="1" max="10" value={ex.sets} onChange={e => change({ sets: Number(e.target.value) })} /><Input id={`plan-reps-${i}`} label="Số lần" type="number" min="1" max="50" value={ex.reps} onChange={e => change({ reps: Number(e.target.value) })} /><Input id={`plan-weight-${i}`} label="Tạ (kg)" type="number" min="0" max="500" step="0.5" value={ex.weightKg} onChange={e => change({ weightKg: Number(e.target.value) })} /></div>{suggestion && <div className="space-y-2"><p className="text-xs text-slate-400">Gợi ý tùy chọn: {suggestion.explanation} {suggestion.weightKg} kg × {suggestion.reps} lần.</p><Button size="sm" variant="outline" onClick={() => change({ reps: suggestion.reps, weightKg: suggestion.weightKg })}>Đồng ý dùng gợi ý trong bản soạn</Button></div>}<Button size="sm" variant="ghost" onClick={() => updateDay({ exercises: day.exercises.filter((_, index) => i !== index) })}>Bỏ bài khỏi lịch</Button></div> })}
          <label className="text-xs text-slate-400 block">Liên kết buổi tập thực tế<select aria-label="Buổi hoàn thành cho ngày này" className="block w-full p-2 mt-1 rounded-xl bg-slate-950 border border-slate-700" value={day.completedSessionId ?? ''} onChange={e => updateDay({ completedSessionId: e.target.value || null })}><option value="">Chưa liên kết</option>{sessions.filter(s => s.date === day.date).map(s => <option key={s.id} value={s.id}>{s.name} · {s.id.slice(0, 6)}</option>)}</select></label>
          <Button size="sm" disabled={busy || !!activeSession || !!draft || !day.exercises.length || day.date > localDate() || dayStatus(day, sessions) === 'completed'} onClick={() => { try { startPlannedSession(plannedDraft(plan, selectedDay, exercises)); navigate('/workout') } catch (e) { setError(String(e)) } }}>Mở buổi tập từ lịch đã lưu</Button>
          <p className="text-xs text-slate-400">Buổi mở từ lịch sẽ tự liên kết khi lưu đúng ngày; có thể chọn liên kết thủ công cho buổi đã tập. Ngày đã hoàn thành không mở lại từ lịch.</p>
          {activeSession && <p className="text-xs text-amber-300">Lưu hoặc hủy bản nháp hiện tại trước khi mở lịch.</p>}
        </>}
      </div>}
    </>}
  </CardContent></Card>
}
