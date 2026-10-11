import React, { useEffect, useState } from 'react'
import { useWorkoutStore } from '@/stores'
import { WorkoutHistory } from '@/components/WorkoutHistory'
import type { MuscleGroup, Exercise } from '@/types'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import {
  Dumbbell,
  Plus,
  Play,
  CheckCircle2,
  Clock,
  Flame,
  Search,
  Info,
} from 'lucide-react'

const muscleGroups: ('Tất cả' | MuscleGroup)[] = [
  'Tất cả',
  'Ngực',
  'Lưng',
  'Chân',
  'Vai',
  'Tay',
  'Bụng',
  'Toàn thân',
]

export const WorkoutPage: React.FC = () => {
  const {
    exercises,
    activeSession,
    startSession,
    addExerciseToSession,
    addSetToExercise,
    toggleSetCompleted,
    finishSession,
    cancelSession,
    updateSet, deleteSet, removeExercise, updateSession, error, pendingWrites,
  } = useWorkoutStore()

  const [selectedMuscle, setSelectedMuscle] = useState<'Tất cả' | MuscleGroup>('Tất cả')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedExerciseForModal, setSelectedExerciseForModal] = useState<Exercise | null>(null)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)
  const [newSessionName, setNewSessionName] = useState('Buổi Tập Nâng Cao (Push Focus)')
  const [newSessionSplit, setNewSessionSplit] = useState('Ngực - Vai - Tay sau')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (useWorkoutStore.getState().pendingWrites > 0 || useWorkoutStore.getState().error) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [])

  const filteredExercises = exercises.filter((ex) => {
    const matchesMuscle = selectedMuscle === 'Tất cả' || ex.muscleGroup === selectedMuscle
    const matchesSearch =
      ex.nameVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ex.nameEn.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesMuscle && matchesSearch
  })

  const handleStartWorkout = () => {
    startSession(newSessionName, newSessionSplit)
    if (useWorkoutStore.getState().activeSession) setIsStartModalOpen(false)
  }

  const handleFinish = async () => {
    setSaving(true)
    try {
      const finished = await finishSession()
      if (finished) setMessage(`Đã lưu buổi tập: ${finished.totalVolumeKg.toLocaleString()} kg volume · ${finished.xpEarned} XP`)
    } catch (err) { setMessage(String(err)) }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {(error || message) && <p role="status" className="p-3 rounded-xl border border-teal-500/40 text-teal-200">{error || message}</p>}
      {/* Top Banner / Workout Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Khu Vực Tập Luyện (Iron Gym)
            </h1>
            {activeSession && (
              <Badge variant="cyan" size="sm" className="animate-pulse">
                Đang tập luyện
              </Badge>
            )}
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Ghi nhận từng hiệp tập, trọng lượng và số lần lặp thực tế để tích lũy EXP và tăng cơ bắp.
          </p>
        </div>

        {!activeSession ? (
          <Button
            size="lg"
            className="shadow-teal-500/30 self-start sm:self-auto"
            onClick={() => setIsStartModalOpen(true)}
          >
            <Play className="w-4 h-4 mr-1.5 fill-current" />
            Bắt Đầu Buổi Tập Mới
          </Button>
        ) : (
          <div className="flex items-center gap-2">
            <Button
              size="md"
              variant="outline"
              className="text-rose-400 border-rose-500/40 hover:bg-rose-950/30"
              disabled={saving}
              onClick={() => setConfirmCancel(true)}
            >
              Hủy
            </Button>
            <Button
              size="md"
              variant="primary"
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold"
              onClick={handleFinish}
              disabled={saving}
            >
              <CheckCircle2 className="w-4 h-4 mr-1.5" />
              Hoàn Thành Buổi Tập
            </Button>
          </div>
        )}
      </div>

      {/* ACTIVE WORKOUT LOGGING SESSION */}
      {activeSession && (
        <Card className="border-teal-500/40 bg-slate-900/90 shadow-2xl forge-border-glow">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-2">
            <div>
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <CardTitle className="text-lg text-white font-bold">
                  {activeSession.name}
                </CardTitle>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Phân bổ: <span className="text-teal-300 font-semibold">{activeSession.splitType}</span>
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="flex items-center gap-1 text-slate-400">
                <Clock className="w-4 h-4 text-teal-400" />
                <span>Thời gian đang tính</span>
              </div>
              <Badge variant="cyan" size="sm">
                {activeSession.exercises.length} Bài Tập
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6 pt-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <Input label="Tên buổi tập" value={activeSession.name} onChange={e => updateSession({ name: e.target.value })} />
              <Input label="Ngày tập" type="date" value={activeSession.date} onChange={e => updateSession({ date: e.target.value })} />
              <Input label="Nhóm cơ" value={activeSession.splitType} onChange={e => updateSession({ splitType: e.target.value })} />
              <Input label="Ghi chú" value={activeSession.notes ?? ''} onChange={e => updateSession({ notes: e.target.value })} />
              {activeSession.editOf && <Input label="Thời lượng (phút)" type="number" min="0" value={activeSession.durationMinutes} onChange={e => updateSession({ durationMinutes: Number(e.target.value) })} />}
            </div>
            <p role="status" className="text-xs text-slate-400">{pendingWrites ? 'Đang lưu bản nháp…' : error ? 'Bản nháp chưa lưu. Kiểm tra dữ liệu nhập.' : 'Bản nháp đã lưu trên thiết bị.'} Volume chỉ tính hiệp hoàn thành.</p>
            {activeSession.exercises.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl bg-slate-950/50">
                <Dumbbell className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                <h4 className="text-sm font-semibold text-slate-300">Buổi tập chưa có bài tập nào</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Chọn các bài tập từ thư viện bên dưới và bấm nút "Thêm vào buổi tập" để bắt đầu ghi lại các hiệp.
                </p>
              </div>
            ) : (
              activeSession.exercises.map((item) => (
                <div
                  key={item.exerciseId}
                  className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-sm text-teal-300">{item.exerciseName}</h4>
                      <span className="text-[11px] text-slate-400">Nhóm cơ: {item.muscleGroup}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-slate-700"
                      onClick={() => addSetToExercise(item.exerciseId, item.sets.at(-1)?.weightKg ?? 0, item.sets.at(-1)?.reps ?? 1)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm Hiệp
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => removeExercise(item.exerciseId)}>Xóa bài</Button>
                  </div>

                  {/* Sets Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="text-slate-500 border-b border-slate-800 pb-2">
                          <th className="py-1 px-2 font-semibold">HIỆP</th>
                          <th className="py-1 px-2 font-semibold">TRỌNG LƯỢNG (KG)</th>
                          <th className="py-1 px-2 font-semibold">SỐ LẦN (REPS)</th>
                          <th className="py-1 px-2 font-semibold text-center">TRẠNG THÁI</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60">
                        {item.sets.map((set) => (
                          <tr
                            key={set.id}
                            className={`transition-colors ${
                              set.completed ? 'bg-teal-950/20 text-teal-200' : 'text-slate-300'
                            }`}
                          >
                            <td className="py-2.5 px-2 font-bold font-mono">#{set.setNumber}</td>
                            <td className="py-2.5 px-2">
                              <input aria-label={`${item.exerciseName} hiệp ${set.setNumber} kg`} className="w-24 bg-slate-900 border border-slate-700 rounded-lg p-2" type="number" min="0" max="2000" step="0.5" value={Number.isNaN(set.weightKg) ? '' : set.weightKg} onChange={e => updateSet(item.exerciseId, set.id, { weightKg: e.target.value === '' ? NaN : Number(e.target.value) })} />
                            </td>
                            <td className="py-2.5 px-2">
                              <input aria-label={`${item.exerciseName} hiệp ${set.setNumber} reps`} className="w-20 bg-slate-900 border border-slate-700 rounded-lg p-2" type="number" min="1" max="1000" step="1" value={Number.isNaN(set.reps) ? '' : set.reps} onChange={e => updateSet(item.exerciseId, set.id, { reps: e.target.value === '' ? NaN : Number(e.target.value) })} />
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => toggleSetCompleted(item.exerciseId, set.id)}
                                className={`inline-flex items-center justify-center p-1.5 rounded-lg border transition-all cursor-pointer ${
                                  set.completed
                                    ? 'bg-teal-500 text-slate-950 border-teal-400 font-bold'
                                    : 'border-slate-700 hover:border-teal-500 text-slate-400'
                                }`}
                                title={set.completed ? 'Đã hoàn thành' : 'Đánh dấu hoàn thành'}
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <Button size="sm" variant="ghost" onClick={() => deleteSet(item.exerciseId, set.id)}>Xóa</Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}

      {/* EXERCISE LIBRARY */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="space-y-4 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base text-white">
              <Dumbbell className="w-4 h-4 text-teal-400" />
              Thư Viện Bài Tập Chuẩn ({filteredExercises.length} bài)
            </CardTitle>

            {/* Search Input */}
            <div className="w-full sm:w-64">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Tìm tên bài tập..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-400"
                />
              </div>
            </div>
          </div>

          {/* Muscle Group Filter Chips */}
          <div className="flex flex-wrap gap-1.5">
            {muscleGroups.map((group) => (
              <button
                key={group}
                type="button"
                onClick={() => setSelectedMuscle(group)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  selectedMuscle === group
                    ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40 font-semibold'
                    : 'bg-slate-950/50 text-slate-400 border border-slate-800 hover:text-slate-200'
                }`}
              >
                {group}
              </button>
            ))}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExercises.map((exercise) => (
              <div
                key={exercise.id}
                className="flex flex-col justify-between p-3.5 rounded-2xl border border-slate-800/80 bg-slate-950/60 hover:border-slate-700 transition-all space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-bold text-xs text-white line-clamp-1">
                      {exercise.nameVi}
                    </h4>
                    <Badge variant="cyan" size="sm">
                      {exercise.muscleGroup}
                    </Badge>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    {exercise.nameEn}
                  </p>
                  <div className="mt-2 text-[10px] text-slate-500 flex items-center gap-2">
                    <span>Thiết bị: <strong className="text-slate-300">{exercise.equipment}</strong></span>
                    <span>•</span>
                    <span>Nghỉ: <strong className="text-slate-300">{exercise.defaultRestSeconds}s</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-slate-900">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs text-slate-400 hover:text-white px-2"
                    onClick={() => setSelectedExerciseForModal(exercise)}
                  >
                    <Info className="w-3.5 h-3.5 mr-1" /> Chi tiết
                  </Button>

                  {activeSession && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs border-teal-500/40 text-teal-300 hover:bg-teal-950/30 flex-1"
                      onClick={() => addExerciseToSession(exercise)}
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" /> Thêm vào buổi tập
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <WorkoutHistory />
      <Modal isOpen={confirmCancel} onClose={() => setConfirmCancel(false)} title="Hủy bản nháp?">
        <p className="text-sm text-slate-300">Bản nháp sẽ bị xóa. Buổi tập gốc đã lưu được giữ nguyên khi hủy chỉnh sửa.</p>
        <div className="flex gap-2 mt-4"><Button variant="outline" onClick={() => setConfirmCancel(false)}>Tiếp tục tập</Button>
          <Button onClick={async () => { try { await cancelSession(); setConfirmCancel(false) } catch (err) { setMessage(String(err)) } }}>Hủy bản nháp</Button></div>
      </Modal>

      {/* MODAL: Start New Workout */}
      <Modal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        title="Khởi Động Buổi Luyện Tập Mới"
        description="Chọn tên phân bổ và bắt đầu chu kỳ tập luyện"
      >
        <div className="space-y-4 py-2">
          <Input
            label="Tên Buổi Tập"
            value={newSessionName}
            onChange={(e) => setNewSessionName(e.target.value)}
          />
          <Input
            label="Phân Bổ Nhóm Cơ (Split Focus)"
            value={newSessionSplit}
            onChange={(e) => setNewSessionSplit(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setIsStartModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleStartWorkout}>
              Bắt Đầu Ngay
            </Button>
          </div>
        </div>
      </Modal>

      {/* MODAL: Exercise Details */}
      {selectedExerciseForModal && (
        <Modal
          isOpen={!!selectedExerciseForModal}
          onClose={() => setSelectedExerciseForModal(null)}
          title={selectedExerciseForModal.nameVi}
          description={selectedExerciseForModal.nameEn}
        >
          <div className="space-y-4 py-2 text-xs">
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-400">Nhóm cơ chính:</span>
                <strong className="text-teal-400 font-semibold">{selectedExerciseForModal.muscleGroup}</strong>
              </div>
              {selectedExerciseForModal.secondaryMuscles && (
                <div className="flex justify-between">
                  <span className="text-slate-400">Nhóm cơ phụ:</span>
                  <span className="text-slate-200">{selectedExerciseForModal.secondaryMuscles.join(', ')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-400">Dụng cụ:</span>
                <span className="text-slate-200">{selectedExerciseForModal.equipment}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Thời gian nghỉ khuyến nghị:</span>
                <span className="text-slate-200">{selectedExerciseForModal.defaultRestSeconds} giây</span>
              </div>
            </div>

            {selectedExerciseForModal.instructionsVi && (
              <div>
                <h4 className="font-bold text-white mb-1">Kỹ thuật & Lưu ý thực hiện:</h4>
                <p className="text-slate-300 leading-relaxed bg-slate-950/50 p-3 rounded-xl border border-slate-800">
                  {selectedExerciseForModal.instructionsVi}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setSelectedExerciseForModal(null)}>
                Đóng
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
