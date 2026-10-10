import React, { useState } from 'react'
import { mockGoal, mockTrainingSplit } from '@/mock'
import { useInBodyStore } from '@/stores'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Modal } from '@/components/ui/Modal'
import { Input } from '@/components/ui/Input'
import {
  Target,
  Utensils,
  Calendar,
  Clock,
  Edit3,
} from 'lucide-react'

export const GoalsPlanningPage: React.FC = () => {
  const { latestMeasurement } = useInBodyStore()
  const [goal, setGoal] = useState(mockGoal)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)

  // Edit form state
  const [editTargetWeight, setEditTargetWeight] = useState(goal.targetWeightKg.toString())
  const [editTargetSmm, setEditTargetSmm] = useState(goal.targetSmmKg.toString())
  const [editTargetPbf, setEditTargetPbf] = useState(goal.targetPbfPercent.toString())
  const [editTargetCalo, setEditTargetCalo] = useState(goal.targetCaloDaily.toString())
  const [editTargetProtein, setEditTargetProtein] = useState(goal.targetProteinDailyGrams.toString())

  const handleSaveGoal = () => {
    setGoal({
      ...goal,
      targetWeightKg: parseFloat(editTargetWeight) || goal.targetWeightKg,
      targetSmmKg: parseFloat(editTargetSmm) || goal.targetSmmKg,
      targetPbfPercent: parseFloat(editTargetPbf) || goal.targetPbfPercent,
      targetCaloDaily: parseInt(editTargetCalo) || goal.targetCaloDaily,
      targetProteinDailyGrams: parseInt(editTargetProtein) || goal.targetProteinDailyGrams,
    })
    setIsEditModalOpen(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Mục Tiêu & Kế Hoạch (Questline & Blueprint)
            </h1>
            <Badge variant="gold" size="sm">
              Tiến Độ: {goal.progressPercent}%
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Chiến lược tăng cơ giảm mỡ (Lean Recomposition), chế độ dinh dưỡng macros và lịch chia nhóm cơ tuần.
          </p>
        </div>

        <Button
          size="md"
          variant="outline"
          className="self-start sm:self-auto border-teal-500/40 text-teal-300"
          onClick={() => setIsEditModalOpen(true)}
        >
          <Edit3 className="w-4 h-4 mr-1.5" />
          Điều Chỉnh Mục Tiêu
        </Button>
      </div>

      {/* Hero Goal Card */}
      <Card className="border-teal-500/40 bg-gradient-to-r from-slate-900 via-slate-900 to-teal-950/30 shadow-xl forge-border-glow">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-teal-400" />
              <CardTitle className="text-lg text-white font-bold">{goal.title}</CardTitle>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Thời hạn dự kiến hoàn thành: <strong className="text-teal-300">{goal.deadline}</strong>
            </p>
          </div>
          <Badge variant="cyan" size="md">
            Mục tiêu: 5 buổi tập / tuần
          </Badge>
        </CardHeader>

        <CardContent className="space-y-4 pt-1">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-300 font-medium">
              <span>Mức độ hoàn thành chiến dịch</span>
              <span className="font-mono text-teal-400 font-bold">{goal.progressPercent}%</span>
            </div>
            <Progress value={goal.progressPercent} variant="cyan" size="lg" />
          </div>

          {/* 3 Metric Target Comparisons */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
            {/* Weight Target */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">CÂN NẶNG MỤC TIÊU</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white">{latestMeasurement.weightKg} kg</span>
                <span className="text-xs text-slate-500">→</span>
                <span className="text-xl font-black text-teal-400">{goal.targetWeightKg} kg</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Chênh lệch: <strong className="text-emerald-400">+{goal.targetWeightKg - latestMeasurement.weightKg} kg (Lean Mass)</strong>
              </p>
            </div>

            {/* SMM Target */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">CƠ XƯƠNG (SMM)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white">{latestMeasurement.smmKg} kg</span>
                <span className="text-xs text-slate-500">→</span>
                <span className="text-xl font-black text-teal-400">{goal.targetSmmKg} kg</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Mục tiêu tăng thêm: <strong className="text-teal-300">+{(goal.targetSmmKg - latestMeasurement.smmKg).toFixed(1)} kg</strong>
              </p>
            </div>

            {/* PBF Target */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">TỶ LỆ MỠ (PBF)</span>
              <div className="flex items-baseline gap-2">
                <span className="text-xl font-black text-white">{latestMeasurement.pbfPercent}%</span>
                <span className="text-xs text-slate-500">→</span>
                <span className="text-xl font-black text-amber-400">{goal.targetPbfPercent}%</span>
              </div>
              <p className="text-[10px] text-slate-400">
                Mục tiêu siết mỡ: <strong className="text-amber-300">-{(latestMeasurement.pbfPercent - goal.targetPbfPercent).toFixed(1)}%</strong>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grid: Nutrition Layout (Left) vs Training Split (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Nutrition Layout (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-3 border-b border-slate-800">
              <CardTitle className="text-base text-white">
                <Utensils className="w-4 h-4 text-amber-400" />
                Mục Tiêu Dinh Dưỡng Hàng Ngày (Macros)
              </CardTitle>
              <p className="text-xs text-slate-400">
                Tổng năng lượng tiêu chuẩn: <strong className="text-amber-400 font-mono text-sm">{goal.targetCaloDaily} kcal/ngày</strong>
              </p>
            </CardHeader>

            <CardContent className="space-y-4 pt-4">
              {/* Protein */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-teal-300">Chất Đạm (Protein)</span>
                  <span className="font-mono text-white font-bold">{goal.targetProteinDailyGrams}g (25%)</span>
                </div>
                <Progress value={85} variant="cyan" size="sm" />
                <span className="text-[10px] text-slate-400">Tương đương ~2.4g/kg trọng lượng cơ thể hỗ trợ tái tạo cơ bắp</span>
              </div>

              {/* Carbohydrate */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-amber-300">Tinh Bột (Carbohydrate)</span>
                  <span className="font-mono text-white font-bold">{goal.targetCarbDailyGrams}g (50%)</span>
                </div>
                <Progress value={70} variant="gold" size="sm" />
                <span className="text-[10px] text-slate-400">Nguồn năng lượng chính nạp đầy Glycogen trước và sau buổi tập nặng</span>
              </div>

              {/* Fat */}
              <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-purple-300">Chất Béo Tốt (Fat)</span>
                  <span className="font-mono text-white font-bold">{goal.targetFatDailyGrams}g (25%)</span>
                </div>
                <Progress value={60} variant="purple" size="sm" />
                <span className="text-[10px] text-slate-400">Duy trì nồng độ Testosterone tự nhiên và chức năng khớp</span>
              </div>

              {/* Water */}
              <div className="p-3 rounded-2xl bg-blue-950/20 border border-blue-500/30 flex items-center justify-between text-xs">
                <div>
                  <strong className="text-blue-300 block">Mục Tiêu Nước Uống</strong>
                  <span className="text-slate-400 text-[10px]">Tối thiểu 3.0 - 3.5 Lít mỗi ngày</span>
                </div>
                <Badge variant="cyan" size="sm">
                  3.5 Lít / Ngày
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Weekly Training Split (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border-slate-800 bg-slate-900/80">
            <CardHeader className="pb-3 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base text-white">
                    <Calendar className="w-4 h-4 text-teal-400" />
                    Lịch Phân Bổ Tập Luyện Tuần (5-Day Split)
                  </CardTitle>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Cấu trúc phân bổ bài bản tối ưu hóa tổng khối lượng và thời gian phục hồi
                  </p>
                </div>
                <Badge variant="cyan" size="sm">
                  Chu Kỳ 7 Ngày
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-2.5 pt-3">
              {mockTrainingSplit.map((split) => (
                <div
                  key={split.id}
                  className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-2xl border transition-all ${
                    split.isRestDay
                      ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                      : 'bg-slate-950/80 border-slate-800 hover:border-teal-500/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${
                        split.isRestDay
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-teal-950 text-teal-400 border border-teal-500/30'
                      }`}
                    >
                      T{split.dayIndex === 7 ? 'CN' : split.dayIndex + 1}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white">
                          {split.splitTitleVi}
                        </span>
                        {split.isRestDay && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                            Nghỉ hồi phục
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {split.focusMuscleGroups.length > 0
                          ? `Trọng tâm: ${split.focusMuscleGroups.join(', ')}`
                          : 'Nghỉ ngơi, ngủ đủ giấc và nạp đủ dinh dưỡng'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span className="text-xs font-mono text-slate-300">
                      {split.estimatedMinutes > 0 ? `${split.estimatedMinutes} phút` : 'Thả lỏng'}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MODAL: Edit Goal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Điều Chỉnh Mục Tiêu Hình Thể & Dinh Dưỡng"
        description="Cập nhật các mốc đích để hệ thống tính toán lại lộ trình RPG"
      >
        <div className="space-y-4 py-2">
          <Input
            label="Cân nặng mục tiêu"
            unit="kg"
            type="number"
            value={editTargetWeight}
            onChange={(e) => setEditTargetWeight(e.target.value)}
          />
          <Input
            label="Khối lượng cơ xương mục tiêu (SMM)"
            unit="kg"
            type="number"
            value={editTargetSmm}
            onChange={(e) => setEditTargetSmm(e.target.value)}
          />
          <Input
            label="Tỷ lệ mỡ mục tiêu (PBF)"
            unit="%"
            type="number"
            value={editTargetPbf}
            onChange={(e) => setEditTargetPbf(e.target.value)}
          />
          <Input
            label="Calo hàng ngày (Target Kcal)"
            unit="kcal"
            type="number"
            value={editTargetCalo}
            onChange={(e) => setEditTargetCalo(e.target.value)}
          />
          <Input
            label="Chất đạm hàng ngày (Target Protein)"
            unit="grams"
            type="number"
            value={editTargetProtein}
            onChange={(e) => setEditTargetProtein(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setIsEditModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveGoal}>
              Lưu Mục Tiêu
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
