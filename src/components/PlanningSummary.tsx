import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { db } from '@/services/db'
import { useUserStore, useWorkoutStore } from '@/stores'
import { localDate } from '@/services/workout/calculations'
import { weekStart, shiftDate } from '@/services/rpg/calculations'
import { dayStatus, nutritionSummary } from '@/services/planning/calculations'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
export function PlanningSummary() {
  const { user } = useUserStore(), { sessions } = useWorkoutStore(), today = localDate(), start = weekStart(today)
  const data = useLiveQuery(async () => ({ plan: await db.trainingPlans.get(`plan:${user.id}:${start}`), rows: await db.nutritionEntries.where('userId').equals(user.id).toArray() }), [user.id, start])
  const week = nutritionSummary((data?.rows ?? []).filter(r => r.date >= start && r.date <= shiftDate(start, 6)))
  const day = data?.plan?.days.find(d => d.date === today)
  return <Card><CardHeader><CardTitle>Kế hoạch & nhật ký tuần này</CardTitle></CardHeader><CardContent className="space-y-2 text-sm text-slate-300">
    <p>{day ? `${today}: ${day.title} · ${dayStatus(day, sessions) === 'completed' ? 'Hoàn thành' : day.isRestDay ? 'Ngày nghỉ' : 'Đã lên lịch'}` : 'Chưa lưu kế hoạch cho tuần này.'}</p>
    {data?.plan && <p>{data.plan.days.filter(d => dayStatus(d, sessions) === 'completed').length} / {data.plan.days.filter(d => !d.isRestDay).length} ngày tập đã liên kết buổi thực tế.</p>}
    <p>{week.foods ? `Nhật ký tuần: ${week.foods} món · P ${week.proteinGrams.toFixed(1)} g / C ${week.carbGrams.toFixed(1)} g / F ${week.fatGrams.toFixed(1)} g · Nước đã ghi ${week.waterMl} ml.` : 'Chưa có khẩu phần được ghi trong tuần.'}</p>
    <p className="text-xs text-slate-500">Chỉ tính dữ liệu đã ghi, không phải yêu cầu dinh dưỡng hoặc mục tiêu hạn chế.</p>
    <Link className="text-teal-300 underline" to="/goals">Mở lịch tập và nhật ký dinh dưỡng</Link>
  </CardContent></Card>
}
