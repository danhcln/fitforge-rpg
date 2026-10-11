import { useState } from 'react'
import { useWorkoutStore } from '@/stores'
import { db } from '@/services/db'
import { trainingVolume, estimatedOneRepMax } from '@/services/workout/calculations'
import { Card, CardHeader, CardTitle, CardContent, Button, Modal } from '@/components/ui'
import type { WorkoutSession } from '@/types'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'

const labels = { weight: 'Trọng lượng tối đa', reps: 'Số lần tại trọng lượng', volume: 'Volume / buổi', estimated1RM: '1RM ước tính (Epley)' }
export function PersonalRecords() {
  const { personalRecords } = useWorkoutStore()
  return <Card><CardHeader><CardTitle>Kỷ lục cá nhân</CardTitle></CardHeader><CardContent>
    <p className="text-xs text-slate-400 mb-3">1RM là ước tính, dùng Epley cho 1–10 lần. Volume gồm tất cả hiệp hoàn thành, kể cả khởi động.</p>
    {!personalRecords.length && <p className="text-slate-400">Chưa có kỷ lục từ buổi tập thực tế.</p>}
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{personalRecords.map(pr => <div key={pr.id} className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
      <p className="text-teal-300 font-bold text-sm">{pr.exerciseName}</p>
      <p className="text-xs text-slate-400">{pr.kind && labels[pr.kind]}</p>
      <p className="text-amber-400 font-mono font-bold">{Number(pr.value?.toFixed(2))} {pr.kind === 'reps' ? `lần tại ${pr.weightKg} kg` : 'kg'}</p>
      <p className="text-xs text-slate-500">{pr.achievedDate}</p>
    </div>)}</div>
  </CardContent></Card>
}
export function WorkoutHistory() {
  const { sessions, editSession, activeSession } = useWorkoutStore()
  const [message, setMessage] = useState('')
  const [deleting, setDeleting] = useState<WorkoutSession | null>(null)
  const [busy, setBusy] = useState(false)
  return <div className="space-y-6">
    <Card><CardHeader><CardTitle>Lịch sử buổi tập ({sessions.length})</CardTitle></CardHeader><CardContent className="space-y-3">
      {message && <p role="alert" className="text-rose-300">{message}</p>}
      {!sessions.length && <p className="text-slate-400">Chưa có buổi tập đã lưu. Bắt đầu tập để ghi nhận tiến trình.</p>}
      {sessions.map(session => <details key={session.id} className="rounded-xl border border-slate-800 bg-slate-950/50 p-3">
        <summary className="cursor-pointer text-teal-300 font-bold">{session.date} · {session.name} · {session.totalVolumeKg.toLocaleString()} kg</summary>
        <p className="text-xs text-slate-400 my-2">{session.splitType} · {session.durationMinutes} phút · {session.notes}</p>
        {session.exercises.map(ex => <div key={ex.exerciseId} className="my-3 text-sm"><p className="text-white">{ex.exerciseName}</p>
          {ex.sets.map(s => <p key={s.id} className="text-slate-400 text-xs">Hiệp {s.setNumber}: {s.weightKg} kg × {s.reps} lần · {s.completed ? 'Hoàn thành' : 'Chưa hoàn thành'}</p>)}</div>)}
        <div className="flex gap-2"><Button size="sm" disabled={!!activeSession} onClick={() => editSession(session)}>Chỉnh sửa</Button>
          <Button size="sm" variant="outline" disabled={!!activeSession} onClick={() => setDeleting(session)}>Xóa buổi tập</Button></div>
      </details>)}
    </CardContent></Card>
    <ExerciseProgress />
    <PersonalRecords />
    <Modal isOpen={!!deleting} onClose={() => { if (!busy) setDeleting(null) }} title="Xác nhận xóa buổi tập">
      <p className="text-slate-300 text-sm">Xóa “{deleting?.name}”? Kỷ lục, XP và chuỗi ngày sẽ được tính lại. Xuất sao lưu trước nếu bạn muốn giữ bản ghi.</p>
      <div className="flex gap-3 mt-4"><Button variant="outline" disabled={busy} onClick={() => setDeleting(null)}>Giữ buổi tập</Button>
        <Button disabled={busy} onClick={async () => {
          if (!deleting) return
          setBusy(true)
          try { await db.deleteWorkout(deleting.id); setDeleting(null) }
          catch (err) { setMessage(String(err)); setDeleting(null) }
          finally { setBusy(false) }
        }}>Xác nhận xóa</Button></div>
    </Modal>
  </div>
}

export function ExerciseProgress() {
  const { sessions, exercises } = useWorkoutStore()
  const [selectedId, setSelectedId] = useState('')
  const exerciseId = selectedId || exercises[0]?.id
  const history = [...sessions].reverse().flatMap(session => {
    const ex = session.exercises.find(ex => ex.exerciseId === exerciseId)
    if (!ex) return []
    const completed = ex.sets.filter(s => s.completed)
    return [{ id: session.id, date: session.date, volume: trainingVolume(ex.sets), weight: Math.max(0, ...completed.map(s => s.weightKg)),
      estimate: Math.max(0, ...completed.map(s => estimatedOneRepMax(s.weightKg, s.reps) ?? 0)) || null, sets: completed }]
  })
  return <Card><CardHeader><CardTitle>Tiến trình từng bài tập</CardTitle></CardHeader><CardContent>
      <select aria-label="Chọn bài tập xem lịch sử" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2 text-slate-200 mb-4" value={exerciseId ?? ''} onChange={e => setSelectedId(e.target.value)}>
        {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.nameVi}</option>)}
      </select>
      {!history.length ? <p className="text-slate-400">Chưa có dữ liệu cho bài tập này.</p> : <>
        <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}>
          <CartesianGrid stroke="#1e293b" /><XAxis dataKey="date" stroke="#94a3b8" /><YAxis stroke="#94a3b8" /><Tooltip contentStyle={{ background: '#0f172a', borderColor: '#334155' }} />
          <Line dataKey="weight" name="Tạ tối đa (kg)" stroke="#14b8a6" /><Line dataKey="estimate" name="1RM ước tính (kg)" stroke="#f59e0b" />
        </LineChart></ResponsiveContainer></div>
        {history.map(row => <p key={row.id} className="text-xs text-slate-400 mt-2">{row.date}: {row.sets.map(s => `${s.weightKg} kg × ${s.reps}`).join(' · ')} | Volume: {row.volume.toLocaleString()} kg</p>)}
      </>}
    </CardContent></Card>
}
