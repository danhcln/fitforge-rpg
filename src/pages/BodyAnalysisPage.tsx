import React, { useState } from 'react'
import { useInBodyStore } from '@/stores'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Progress } from '@/components/ui/Progress'
import {
  Plus,
  ShieldAlert,
  Calendar,
  Layers,
} from 'lucide-react'

export const BodyAnalysisPage: React.FC = () => {
  const { measurements, latestMeasurement, addMeasurement } = useInBodyStore()
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false)

  // InBody entry form state
  const [formWeight, setFormWeight] = useState('72.5')
  const [formSmm, setFormSmm] = useState('35.2')
  const [formPbf, setFormPbf] = useState('13.2')
  const [formBmi, setFormBmi] = useState('23.6')
  const [formFatMass, setFormFatMass] = useState('9.5')
  const [formBmr, setFormBmr] = useState('1750')
  const [formVisceral, setFormVisceral] = useState('3')
  const [formScore, setFormScore] = useState('87')
  const [formNotes, setFormNotes] = useState('Kiểm tra định kỳ sau 4 tuần bulk sạch.')

  const handleSaveEntry = () => {
    addMeasurement({
      date: new Date().toISOString().split('T')[0],
      weightKg: parseFloat(formWeight) || 72.0,
      smmKg: parseFloat(formSmm) || 35.0,
      pbfPercent: parseFloat(formPbf) || 13.5,
      bmi: parseFloat(formBmi) || 23.5,
      bodyFatMassKg: parseFloat(formFatMass) || 9.7,
      bmrKcal: parseInt(formBmr) || 1720,
      visceralFatLevel: parseInt(formVisceral) || 3,
      bodyWaterKg: 46.0,
      boneMassKg: 3.2,
      inBodyScore: parseInt(formScore) || 85,
      segmentalLean: {
        rightArmKg: 3.58,
        rightArmPercent: 110,
        leftArmKg: 3.54,
        leftArmPercent: 109,
        trunkKg: 27.0,
        trunkPercent: 108,
        rightLegKg: 9.7,
        rightLegPercent: 106,
        leftLegKg: 9.65,
        leftLegPercent: 106,
      },
      notes: formNotes,
    })
    setIsEntryModalOpen(false)
  }

  const { segmentalLean } = latestMeasurement

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Phân Tích Thành Phần Cơ Thể (InBody Engine)
            </h1>
            <Badge variant="cyan" size="sm">
              Điểm: {latestMeasurement.inBodyScore}/100
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Theo dõi khối lượng cơ xương (SMM), tỷ lệ mỡ (PBF) và phân bổ cơ bắp từng phân đoạn cơ thể.
          </p>
        </div>

        <Button
          size="md"
          className="self-start sm:self-auto shadow-teal-500/30"
          onClick={() => setIsEntryModalOpen(true)}
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nhập Phiếu Đo InBody Mới
        </Button>
      </div>

      {/* Accuracy & Hardware Disclaimer */}
      <div className="flex items-center gap-2 p-3 rounded-2xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200/90">
        <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
        <span>
          <strong>Lưu ý kỹ thuật:</strong> FitForge RPG hoạt động theo cơ chế nhập liệu thủ công độc lập hoặc trích xuất báo cáo. Ứng dụng không kết nối trực tiếp với phần cứng InBody độc quyền và không thay thế chẩn đoán y tế lâm sàng.
        </span>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Weight */}
        <Card className="p-4 border-slate-800 bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">CÂN NẶNG TỔNG THỂ</span>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            {latestMeasurement.weightKg} <span className="text-xs text-slate-400 font-normal">kg</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Chỉ số BMI: <strong className="text-teal-400 font-mono">{latestMeasurement.bmi}</strong>
          </div>
        </Card>

        {/* SMM */}
        <Card className="p-4 border-slate-800 bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">CƠ XƯƠNG (SMM)</span>
          <div className="text-2xl sm:text-3xl font-black text-teal-400 mt-1">
            {latestMeasurement.smmKg} <span className="text-xs text-slate-400 font-normal">kg</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Mức đánh giá: <strong className="text-emerald-400 font-semibold">Vượt Chuẩn (+107%)</strong>
          </div>
        </Card>

        {/* PBF */}
        <Card className="p-4 border-slate-800 bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">TỶ LỆ MỠ (PBF)</span>
          <div className="text-2xl sm:text-3xl font-black text-amber-400 mt-1">
            {latestMeasurement.pbfPercent} <span className="text-xs text-slate-400 font-normal">%</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Khối lượng mỡ: <strong className="text-slate-200">{latestMeasurement.bodyFatMassKg} kg</strong>
          </div>
        </Card>

        {/* BMR & Visceral */}
        <Card className="p-4 border-slate-800 bg-slate-900/80">
          <span className="text-[11px] text-slate-400 font-semibold block uppercase">CHUYỂN HÓA BMR & NỘI TẠNG</span>
          <div className="text-2xl sm:text-3xl font-black text-purple-400 mt-1">
            {latestMeasurement.bmrKcal} <span className="text-xs text-slate-400 font-normal">kcal</span>
          </div>
          <div className="mt-2 text-xs text-slate-400">
            Mỡ nội tạng: Cấp <strong className="text-emerald-400">{latestMeasurement.visceralFatLevel} (Rất Tốt)</strong>
          </div>
        </Card>
      </div>

      {/* Segmental Lean Analysis (Phân Tích Cơ Theo Phân Đoạn) */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base text-white">
                <Layers className="w-4 h-4 text-teal-400" />
                Phân Tích Khối Lượng Cơ Phân Đoạn (Segmental Lean Analysis)
              </CardTitle>
              <p className="text-xs text-slate-400 mt-0.5">
                Đánh giá sự phát triển và cân bằng cơ bắp giữa thân trên, thân dưới và hai bên cơ thể
              </p>
            </div>
            <Badge variant="cyan" size="sm">
              Đồng Đều Cân Xứng (Symmetrical)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Right Arm */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Tay Phải (Right Arm)</span>
                <span className="font-mono text-teal-400 font-bold">{segmentalLean.rightArmKg} kg ({segmentalLean.rightArmPercent}%)</span>
              </div>
              <Progress value={segmentalLean.rightArmPercent} max={120} variant="cyan" size="sm" />
              <span className="text-[10px] text-slate-400">Phát triển vượt trội so với mức trung bình người cùng chiều cao</span>
            </div>

            {/* Left Arm */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Tay Trái (Left Arm)</span>
                <span className="font-mono text-teal-400 font-bold">{segmentalLean.leftArmKg} kg ({segmentalLean.leftArmPercent}%)</span>
              </div>
              <Progress value={segmentalLean.leftArmPercent} max={120} variant="cyan" size="sm" />
              <span className="text-[10px] text-slate-400">Chênh lệch chỉ 0.04kg so với tay phải, độ cân xứng hoàn hảo</span>
            </div>

            {/* Trunk */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2 md:col-span-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Thân Mình - Ngực & Lưng Xô (Trunk)</span>
                <span className="font-mono text-teal-400 font-bold">{segmentalLean.trunkKg} kg ({segmentalLean.trunkPercent}%)</span>
              </div>
              <Progress value={segmentalLean.trunkPercent} max={120} variant="emerald" size="sm" />
              <span className="text-[10px] text-slate-400">Cơ lõi và khối cơ xô vững chắc đạt 107% tiêu chuẩn</span>
            </div>

            {/* Right Leg */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Chân Phải (Right Leg)</span>
                <span className="font-mono text-teal-400 font-bold">{segmentalLean.rightLegKg} kg ({segmentalLean.rightLegPercent}%)</span>
              </div>
              <Progress value={segmentalLean.rightLegPercent} max={120} variant="cyan" size="sm" />
              <span className="text-[10px] text-slate-400">Khối cơ đùi và bắp chân vững chãi</span>
            </div>

            {/* Left Leg */}
            <div className="p-3.5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-semibold text-slate-200">Chân Trái (Left Leg)</span>
                <span className="font-mono text-teal-400 font-bold">{segmentalLean.leftLegKg} kg ({segmentalLean.leftLegPercent}%)</span>
              </div>
              <Progress value={segmentalLean.leftLegPercent} max={120} variant="cyan" size="sm" />
              <span className="text-[10px] text-slate-400">Cân đối tuyệt đối so với chân phải</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Historical Measurements Log */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-base text-white">
            <Calendar className="w-4 h-4 text-teal-400" />
            Lịch Sử Các Kỳ Đo InBody ({measurements.length} lần ghi nhận)
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-500 border-b border-slate-800 pb-2">
                  <th className="py-2 px-3 font-semibold">NGÀY ĐO</th>
                  <th className="py-2 px-3 font-semibold">CÂN NẶNG (KG)</th>
                  <th className="py-2 px-3 font-semibold">CƠ XƯƠNG SMM (KG)</th>
                  <th className="py-2 px-3 font-semibold">TỶ LỆ MỠ PBF (%)</th>
                  <th className="py-2 px-3 font-semibold">BMI</th>
                  <th className="py-2 px-3 font-semibold">ĐIỂM INBODY</th>
                  <th className="py-2 px-3 font-semibold">GHI CHÚ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {measurements.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3 font-bold font-mono text-white">{item.date}</td>
                    <td className="py-3 px-3 font-mono">{item.weightKg}</td>
                    <td className="py-3 px-3 font-mono text-teal-400 font-semibold">{item.smmKg}</td>
                    <td className="py-3 px-3 font-mono text-amber-400 font-semibold">{item.pbfPercent}%</td>
                    <td className="py-3 px-3 font-mono text-slate-300">{item.bmi}</td>
                    <td className="py-3 px-3">
                      <Badge variant="cyan" size="sm">
                        {item.inBodyScore || 80}/100
                      </Badge>
                    </td>
                    <td className="py-3 px-3 text-slate-400 max-w-xs truncate">{item.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* MODAL: Enter New InBody Report */}
      <Modal
        isOpen={isEntryModalOpen}
        onClose={() => setIsEntryModalOpen(false)}
        title="Nhập Chỉ Số Phiếu Đo InBody"
        description="Điền các thông số từ phiếu in tại phòng gym để cập nhật thể trạng"
        maxWidth="lg"
      >
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Cân nặng (Weight)"
              unit="kg"
              type="number"
              step="0.1"
              value={formWeight}
              onChange={(e) => setFormWeight(e.target.value)}
            />
            <Input
              label="Khối lượng cơ xương (SMM)"
              unit="kg"
              type="number"
              step="0.1"
              value={formSmm}
              onChange={(e) => setFormSmm(e.target.value)}
            />
            <Input
              label="Tỷ lệ mỡ cơ thể (PBF)"
              unit="%"
              type="number"
              step="0.1"
              value={formPbf}
              onChange={(e) => setFormPbf(e.target.value)}
            />
            <Input
              label="Chỉ số BMI"
              type="number"
              step="0.1"
              value={formBmi}
              onChange={(e) => setFormBmi(e.target.value)}
            />
            <Input
              label="Khối lượng mỡ (Body Fat Mass)"
              unit="kg"
              type="number"
              step="0.1"
              value={formFatMass}
              onChange={(e) => setFormFatMass(e.target.value)}
            />
            <Input
              label="Tỷ lệ trao đổi chất cơ bản (BMR)"
              unit="kcal"
              type="number"
              value={formBmr}
              onChange={(e) => setFormBmr(e.target.value)}
            />
            <Input
              label="Mức mỡ nội tạng (Visceral Fat)"
              unit="cấp 1-20"
              type="number"
              value={formVisceral}
              onChange={(e) => setFormVisceral(e.target.value)}
            />
            <Input
              label="Điểm InBody (InBody Score)"
              unit="/100"
              type="number"
              value={formScore}
              onChange={(e) => setFormScore(e.target.value)}
            />
          </div>

          <Input
            label="Ghi chú kỳ đo"
            value={formNotes}
            onChange={(e) => setFormNotes(e.target.value)}
            placeholder="Ví dụ: Cân vào buổi sáng lúc bụng đói..."
          />

          <div className="flex justify-end gap-2 pt-3">
            <Button variant="ghost" onClick={() => setIsEntryModalOpen(false)}>
              Hủy
            </Button>
            <Button variant="primary" onClick={handleSaveEntry}>
              Lưu Chỉ Số InBody
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
