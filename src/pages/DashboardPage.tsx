import React from 'react'
import { Link } from 'react-router-dom'
import { useUserStore, useQuestStore, useWorkoutStore, useCharacterStore } from '@/stores'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { AvatarCanvas } from '@/components/avatar'
import { PersonalRecords, ExerciseProgress } from '@/components/WorkoutHistory'
import { BodyOverview } from '@/components/BodyComposition'
import { useInBodyStore } from '@/stores'
import {
  Dumbbell,
  ChevronRight,
  CheckCircle2,
  Gift,
  ArrowUpRight,
} from 'lucide-react'

export const DashboardPage: React.FC = () => {
  const { user } = useUserStore()

  const { quests } = useQuestStore()
  const { sessions } = useWorkoutStore()
  const { character, setMode } = useCharacterStore()

  const latestSession = sessions[0]
  const { latestMeasurement, measurements } = useInBodyStore()

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-900/90 to-teal-950/40 p-6 md:p-8 shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Badge variant="cyan" size="sm">
                CHIẾN BINH LEVEL {user.level}
              </Badge>
              <Badge variant="gold" size="sm">
                CHUỖI {user.streakDays} NGÀY LIÊN TIẾP 🔥
              </Badge>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Chào mừng trở lại, <span className="text-teal-400">{user.name}</span>!
            </h1>
            <p className="text-sm text-slate-300 max-w-xl">
              Ghi lại buổi tập thực tế để tăng kinh nghiệm RPG. Avatar được tinh chỉnh thủ công trong phòng nhân vật.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Link to="/workout">
              <Button size="lg" className="shadow-teal-500/30">
                <Dumbbell className="w-5 h-5 mr-1" />
                Vào Phòng Tập Ngay
              </Button>
            </Link>
            <Link to="/character">
              <Button size="lg" variant="outline">
                Xem Nhân Vật 3D
                <ArrowUpRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          ['Buổi tập hoàn thành', sessions.length],
          ['Tổng volume (kg)', sessions.reduce((n, s) => n + s.totalVolumeKg, 0).toLocaleString()],
          ['Hiệp hoàn thành', sessions.reduce((n, s) => n + s.exercises.reduce((a, ex) => a + ex.sets.filter(row => row.completed).length, 0), 0)],
          ['Thời gian tập (phút)', sessions.reduce((n, s) => n + s.durationMinutes, 0)],
        ].map(([label, value]) => <Card key={label} className="p-4 border-slate-800/80 bg-slate-900/60 hover:border-teal-500/40 transition-colors">
          <p className="text-xs text-slate-400 mb-2">{label}</p><p className="text-2xl sm:text-3xl font-black text-teal-400">{value}</p>
        </Card>)}
      </div>
      {!sessions.length && <p className="text-slate-400 text-sm">Chưa có tiến trình thực tế. Lưu buổi tập đầu tiên để bắt đầu.</p>}
      <BodyOverview measurement={latestMeasurement} previous={measurements.at(-2)} />
      {/* Main Content Split: 3D Preview (Left) vs Quests & Recent Workouts (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 3D Avatar Mini Viewport Card (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="p-4 bg-slate-900/80 border-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-white">Hình Chiếu Nhân Vật 3D</span>
                <Badge variant={character.mode === 'goal' ? 'gold' : 'cyan'} size="sm">
                  {character.mode === 'goal' ? 'Mục Tiêu' : 'Hiện Tại'}
                </Badge>
              </div>
              <Link to="/character" className="text-xs text-teal-400 hover:text-teal-300 font-semibold flex items-center">
                Mở rộng <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="mt-3">
              <AvatarCanvas
                currentMorph={character.currentBody}
                goalMorph={character.goalBody}
                mode={character.mode}
                onModeChange={setMode}
                height="380px"
              />
            </div>

            <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>Hệ Nhân Vật: <strong className="text-slate-200">{user.avatarClass}</strong></span>
              <span>Đai Lưng: <strong className="text-teal-400">{character.equippedGear.liftingBelt}</strong></span>
            </div>
          </Card>
        </div>

        {/* Quests and Recent Sessions (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Daily & Weekly RPG Quests */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base text-teal-300">
                  <Gift className="w-4 h-4 text-teal-400" />
                  Nhiệm Vụ Rèn Luyện & Thưởng RPG
                </CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">
                  Hoàn thành mục tiêu thực tế để nhận điểm kinh nghiệm (XP) và Vàng
                </p>
              </div>
              <Badge variant="cyan" size="sm">
                {quests.filter((q) => q.isCompleted && !q.isClaimed).length} Sẵn Sàng Nhận
              </Badge>
            </CardHeader>

            <CardContent className="space-y-3 pt-1">{!quests.length && <p className="text-slate-400 text-xs">Nhiệm vụ RPG sẽ được mở rộng ở giai đoạn tiếp theo.</p>}
              {quests.slice(0, 4).map((quest) => {
                const canClaim = quest.isCompleted && !quest.isClaimed
                const isClaimed = quest.isClaimed

                return (
                  <div
                    key={quest.id}
                    className={`flex items-center justify-between gap-3 p-3 rounded-xl border transition-all ${
                      isClaimed
                        ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                        : canClaim
                        ? 'bg-teal-950/20 border-teal-500/40 forge-border-glow'
                        : 'bg-slate-950/60 border-slate-800'
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-white truncate">
                          {quest.titleVi}
                        </span>
                        <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                          {quest.frequency === 'daily' ? 'Hàng Ngày' : 'Hàng Tuần'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mb-1.5">
                        {quest.descriptionVi}
                      </p>

                      <div className="flex items-center gap-3">
                        <div className="flex-1 max-w-[180px]">
                          <Progress
                            value={quest.currentProgress}
                            max={quest.targetProgress}
                            variant={quest.isCompleted ? 'emerald' : 'cyan'}
                            size="sm"
                          />
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">
                          {quest.currentProgress.toLocaleString()} / {quest.targetProgress.toLocaleString()} {quest.unitVi}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-right hidden sm:block">
                        <div className="text-[11px] font-bold text-teal-400">+{quest.rewardXp} XP</div>
                        <div className="text-[10px] font-mono text-amber-400">+{quest.rewardGold} Vàng</div>
                      </div>

                      {isClaimed ? (
                        <div className="flex items-center gap-1 text-xs text-slate-500 px-2.5 py-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Đã nhận</span>
                        </div>
                      ) : canClaim ? (
                        <Button
                          size="sm"
                          variant="gold"
                          className="h-8 text-xs font-bold"
                          disabled
                        >
                          Giai đoạn RPG tiếp theo
                        </Button>
                      ) : (
                        <Badge variant="outline" size="sm">
                          Đang làm
                        </Badge>
                      )}
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Recent Workout Session Highlight */}
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base text-white">
                <Dumbbell className="w-4 h-4 text-teal-400" />
                Buổi Tập Gần Nhất
              </CardTitle>
              <Link to="/history" className="text-xs text-teal-400 hover:text-teal-300 font-semibold">
                Xem toàn bộ lịch sử
              </Link>
            </CardHeader>

            <CardContent className="pt-1">
              {latestSession ? (
                <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-sm text-white">{latestSession.name}</h4>
                      <p className="text-xs text-slate-400">
                        {latestSession.date} • {latestSession.splitType} • {latestSession.durationMinutes} phút
                      </p>
                    </div>
                    <Badge variant="cyan" size="md">
                      +{latestSession.xpEarned} XP
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 py-2 border-y border-slate-800/80 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">TỔNG VOLUME</span>
                      <strong className="text-sm font-bold text-white">
                        {latestSession.totalVolumeKg.toLocaleString()} kg
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">BÀI TẬP</span>
                      <strong className="text-sm font-bold text-white">
                        {latestSession.exercises.length} bài
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">TỔNG SỐ HIỆP</span>
                      <strong className="text-sm font-bold text-white">
                        {latestSession.exercises.reduce((acc, e) => acc + e.sets.length, 0)} hiệp
                      </strong>
                    </div>
                  </div>

                  {latestSession.notes && (
                    <p className="text-xs text-slate-300 italic">
                      "{latestSession.notes}"
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400">Chưa có buổi tập nào được ghi lại.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <ExerciseProgress />
      <PersonalRecords />
    </div>
  )
}
