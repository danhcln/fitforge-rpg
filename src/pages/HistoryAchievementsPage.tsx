import { BodyHistoryCharts } from '@/components/BodyComposition'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import React from 'react'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import { useWorkoutStore, useQuestStore } from '@/stores'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
  Award,
  Shield,
  Star,
  CheckCircle2,
  Lock,
} from 'lucide-react'

export const HistoryAchievementsPage: React.FC = () => {
  const { sessions } = useWorkoutStore()
  const { achievements } = useQuestStore()

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
      <div className="grid grid-cols-1 gap-6">
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

          <CardContent className="pt-2">{!sessions.length && <p className="text-xs text-slate-400">Chưa có dữ liệu thực tế để vẽ biểu đồ.</p>}
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

      <BodyHistoryCharts />
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
