import { WorkoutHistory } from '@/components/WorkoutHistory'
import React from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { useInBodyStore, useWorkoutStore, useQuestStore } from '@/stores'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  TrendingUp,
  Award,
  Shield,
  Star,
  CheckCircle2,
  Lock,
} from 'lucide-react'

export const HistoryAchievementsPage: React.FC = () => {
  const { measurements } = useInBodyStore()
  const { sessions } = useWorkoutStore()
  const { achievements } = useQuestStore()

  // Format InBody historical chart data
  const inBodyChartData = measurements.map((m) => ({
    date: m.date.slice(5),
    weight: m.weightKg,
    smm: m.smmKg,
    pbf: m.pbfPercent,
  }))

  // Format workout volume data
  const volumeChartData = sessions.slice(0, 7).reverse().map((s) => ({
    date: s.date.slice(5),
    name: s.name,
    volume: s.totalVolumeKg,
    duration: s.durationMinutes,
  }))

  const tierColors = {
    bronze: 'bg-amber-900/30 text-amber-500 border-amber-800/60',
    silver: 'bg-slate-700/30 text-slate-300 border-slate-600/60',
    gold: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    mythic: 'bg-purple-500/20 text-purple-300 border-purple-500/40',
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Lịch Sử Tiến Trình & Danh Hiệu RPG
            </h1>
            <Badge variant="cyan" size="sm">
              {achievements.filter((a) => a.unlocked).length} / {achievements.length} Đã Mở Khóa
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Biểu đồ xu hướng thể trạng, bảo tàng kỷ lục cá nhân (PR) và bảng vinh danh chiến tích.
          </p>
        </div>
      </div>

      {/* TRENDS: Recharts Graphs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SMM & Weight Trend Chart */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">
                <TrendingUp className="w-4 h-4 text-teal-400" />
                Tiến Trình Cơ Xương (SMM) & Cân Nặng (kg)
              </CardTitle>
              <div className="flex items-center gap-3 text-[11px]">
                <span className="flex items-center gap-1 text-teal-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-teal-400" /> Cơ SMM
                </span>
                <span className="flex items-center gap-1 text-slate-400">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> Cân Nặng
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="pt-2">{!sessions.length && !measurements.length && <p className="text-xs text-slate-400">Chưa có dữ liệu thực tế để vẽ biểu đồ.</p>}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={inBodyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorSmm" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#14b8a6" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorWeight" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#64748b" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#64748b" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} domain={['dataMin - 2', 'dataMax + 2']} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="smm"
                    name="Cơ Xương (SMM)"
                    stroke="#14b8a6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorSmm)"
                  />
                  <Area
                    type="monotone"
                    dataKey="weight"
                    name="Cân Nặng"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorWeight)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Workout Volume per Session */}
        <Card className="border-slate-800 bg-slate-900/80">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold text-white">
                <Award className="w-4 h-4 text-amber-400" />
                Tổng Khối Lượng Tập Luyện (Volume Surge - kg)
              </CardTitle>
              <Badge variant="gold" size="sm">
                Tăng trưởng lũy tiến
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="pt-2">{!sessions.length && !measurements.length && <p className="text-xs text-slate-400">Chưa có dữ liệu thực tế để vẽ biểu đồ.</p>}
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={volumeChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                  <YAxis stroke="#64748b" fontSize={11} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      borderColor: '#334155',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="volume" name="Volume (kg)" fill="#f59e0b" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <WorkoutHistory />

      {/* ACHIEVEMENTS & TROPHIES GRID */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base text-white">
                <Shield className="w-4 h-4 text-purple-400" />
                Huy Hiệu & Danh Hiệu Chiến Binh RPG
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Các mốc thành tích mở khóa danh hiệu và tiền thưởng
              </p>
            </div>
            <Badge variant="purple" size="sm">
              Thành tích đã lưu
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {achievements.map((ach) => {
              const isUnlocked = ach.unlocked
              const tierBadge = tierColors[ach.tier]

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-2xl border transition-all space-y-3 ${
                    isUnlocked
                      ? 'bg-slate-950/80 border-slate-800 hover:border-teal-500/40'
                      : 'bg-slate-950/40 border-slate-800/50 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${tierBadge}`}
                      >
                        {isUnlocked ? (
                          <Star className="w-5 h-5 fill-current" />
                        ) : (
                          <Lock className="w-4 h-4 text-slate-500" />
                        )}
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">{ach.titleVi}</h4>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${tierBadge.split(' ')[1]}`}>
                          Cấp {ach.tier}
                        </span>
                      </div>
                    </div>

                    {isUnlocked && (
                      <CheckCircle2 className="w-4 h-4 text-teal-400 shrink-0" />
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {ach.descriptionVi}
                  </p>

                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Tiến độ</span>
                      <span className="font-mono">
                        {ach.currentVal} / {ach.maxVal}
                      </span>
                    </div>
                    <Progress
                      value={ach.currentVal}
                      max={ach.maxVal}
                      variant={isUnlocked ? 'emerald' : 'cyan'}
                      size="sm"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-900 text-[10px]">
                    <span className="text-teal-400 font-bold">+{ach.rewardXp} XP</span>
                    <span className="text-amber-400 font-mono font-bold">+{ach.rewardGold} Vàng</span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
