import { useLiveQuery } from 'dexie-react-hooks'
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip } from 'recharts'
import { db } from '@/services/db'
import { useInBodyStore, useCharacterStore } from '@/stores'
import type { BodyMeasurement, BodyMetric } from '@/types/inbody'
import type { Goal } from '@/types/goal'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui'
import { available, bodyMetrics, classifyMetric, compareMeasurements, composition, metricValue, units } from '@/services/bodyComposition/calculations'
import { goalMeasurement } from '@/services/bodyComposition/BodyCompositionToAvatar'
import { metricLabels, formatBodyValue } from '@/services/bodyComposition/presentation'
export function BodyOverview({ measurement, previous }: { measurement?: BodyMeasurement | null; previous?: BodyMeasurement | null }) {
  if (!measurement) return <Card className="p-6 text-sm text-slate-400">Chưa có phiếu đo thực tế. Nhập số liệu từ phiếu của bạn tại trang InBody.</Card>
  const changes = compareMeasurements(measurement, previous)
  const derived = composition(measurement)
  return <div className="space-y-3"><p className="text-sm text-slate-400">Phiếu mới nhất · {measurement.date}{previous && ` · So với ${previous.date}`}</p>
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">{bodyMetrics.map(metric => {
      const value = metricValue(measurement, metric)
      const classification = classifyMetric(metric, value, measurement.references?.[metric], measurement.ageYears)
      const statusLabels = { low: 'Thấp', normal: 'Trong khoảng', high: 'Cao', unclassified: 'Chưa phân loại' }
      const change = changes[metric]
      return <Card key={metric} className="p-4 bg-slate-900/60"><p className="text-xs text-slate-400">{metricLabels[metric]} · {units[metric]}</p>
        <p className="text-2xl font-black text-teal-400">{formatBodyValue(value)}</p><p className="text-[11px] text-slate-400">{metric === 'bmi' ? 'Tính từ chiều cao và cân nặng' : 'Số liệu trên phiếu'}</p>
        <p className="text-xs text-slate-300 mt-2">Δ {available(change) ? `${change > 0 ? '+' : ''}${formatBodyValue(change)} ${metric === 'pbfPercent' ? 'điểm %' : units[metric]}` : 'Chưa so sánh được'}</p>
        <p className="text-xs text-amber-300 mt-2">{statusLabels[classification.status]}</p><p className="text-[10px] text-slate-500 mt-1">{classification.explanation}</p>
      </Card>
    })}</div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">{[
      ['Chiều cao · phiếu (cm)', measurement.heightCm], ['BMI · phiếu (kg/m²)', measurement.bmi],
      ['Mỡ tính từ PBF (kg)', derived.calculatedFatMass], [`Khối lượng không mỡ · tính từ ${derived.fatFreeMassBasis === 'device' ? 'mỡ trên phiếu' : 'mỡ tính toán'} (kg)`, derived.fatFreeMass],
      ['BMR · phiếu (kcal)', measurement.bmrKcal], ['Mức mỡ nội tạng · phiếu', measurement.visceralFatLevel],
      ['Nước cơ thể · phiếu (kg)', measurement.bodyWaterKg], ['Khoáng xương · phiếu (kg)', measurement.boneMassKg],
    ].map(([label, value]) => <Card key={String(label)} className="p-3"><p className="text-xs text-slate-400">{label}</p><p className="font-bold text-white">{formatBodyValue(value as number | null | undefined)}</p></Card>)}</div>
    <p className="text-xs text-slate-500">Phân loại chỉ đối chiếu khoảng được nhập từ phiếu, không phải chẩn đoán. Level RPG thể hiện tiến trình trò chơi.</p>
  </div>
}
export function BodyHistoryCharts() {
  const { measurements } = useInBodyStore()
  const charts: BodyMetric[] = ['weightKg', 'smmKg', 'pbfPercent', 'bmi']
  if (!measurements.length) return <Card className="p-6 text-sm text-slate-400">Chưa có lịch sử thể trạng để vẽ biểu đồ.</Card>
  return <div className="grid md:grid-cols-2 gap-4">{charts.map(metric => {
    const data = measurements.map(m => ({ date: m.date, value: metricValue(m, metric) }))
    return <Card key={metric}><CardHeader><CardTitle>{metricLabels[metric]} · {units[metric]}</CardTitle></CardHeader><CardContent>
      {!data.some(row => available(row.value)) ? <p className="text-sm text-slate-400">Chưa có số liệu cho chỉ số này.</p> : <div className="h-52" aria-label={`Biểu đồ ${metricLabels[metric]}`}><ResponsiveContainer width="100%" height="100%"><LineChart data={data} margin={{ left: 0, right: 12 }}>
        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" /><XAxis dataKey="date" stroke="#64748b" fontSize={10} /><YAxis stroke="#64748b" fontSize={10} domain={['auto', 'auto']} />
        <Tooltip formatter={value => [formatBodyValue(Number(value)), units[metric]]} contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: 12 }} />
        <Line type="linear" dataKey="value" name={metricLabels[metric]} stroke="#14b8a6" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
      </LineChart></ResponsiveContainer></div>}
      <p className="text-[11px] text-slate-500 mt-2">{metric === 'bmi' ? 'BMI tính từ chiều cao; phiếu cũ thiếu chiều cao tạo khoảng trống.' : 'Số liệu thực tế trên phiếu; giá trị thiếu tạo khoảng trống.'}</p>
    </CardContent></Card>
  })}</div>
}
export function TargetComparison({ goal, current }: { goal: Goal; current: BodyMeasurement | null }) {
  const target = goalMeasurement(goal, current)
  return <div className="overflow-x-auto"><table className="w-full text-sm text-left"><thead className="text-slate-400"><tr><th className="py-2">Chỉ số</th><th>Hiện tại</th><th>Mục tiêu</th><th>Còn chênh lệch</th></tr></thead><tbody>{bodyMetrics.map(metric => {
    const a = metricValue(current, metric), b = metricValue(target, metric)
    return <tr key={metric} className="border-t border-slate-800 text-slate-300"><td className="py-2">{metricLabels[metric]} ({units[metric]})</td><td>{formatBodyValue(a)}</td><td>{formatBodyValue(b)}</td><td>{available(a) && available(b) ? formatBodyValue(b - a) : 'Chưa có'}</td></tr>
  })}</tbody></table><p className="text-xs text-slate-500 mt-2">Mục tiêu do bạn nhập, không phải dự đoán. BMI mục tiêu tính với chiều cao hiện tại; mỡ mục tiêu tính từ cân nặng × PBF mục tiêu.</p></div>
}
export function BodyTargets() {
  const { latestMeasurement } = useInBodyStore()
  const { selectedGoalId, selectBodyGoal } = useCharacterStore()
  const goals = useLiveQuery(() => db.goals.toArray(), [])?.filter(g => g.source !== 'demo' && !g.isCompleted).sort((a, b) => a.deadline.localeCompare(b.deadline) || a.id.localeCompare(b.id)) ?? []
  const selected = goals.find(g => g.id === selectedGoalId) ?? goals[0]
  return <Card><CardHeader><CardTitle>Hiện tại & mục tiêu cá nhân</CardTitle></CardHeader><CardContent>
    {!selected ? <p className="text-sm text-slate-400">Chưa có mục tiêu đang thực hiện. Thêm mục tiêu tại trang Mục Tiêu.</p> : <>
      <select aria-label="Chọn mục tiêu thể trạng" className="mb-3 bg-slate-950 border border-slate-700 rounded-xl p-2 text-sm text-slate-200 max-w-full" value={selected.id} onChange={e => selectBodyGoal(e.target.value)}>{goals.map(goal => <option key={goal.id} value={goal.id}>{goal.title}</option>)}</select>
      <TargetComparison goal={selected} current={latestMeasurement} />
    </>}
  </CardContent></Card>
}
