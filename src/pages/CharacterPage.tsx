import React, { useState } from 'react'
import { useCharacterStore, useInBodyStore } from '@/stores'
import { AvatarCanvas, AvatarControls } from '@/components/avatar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { User, Shield, Sparkles, Info, Check } from 'lucide-react'

export const CharacterPage: React.FC = () => {
  const { latestMeasurement } = useInBodyStore()
  const {
    character,
    setMode,
    updateCurrentBody,
    updateGoalBody,
    toggleAura,
    resetToDefault,
  } = useCharacterStore()

  const [activeGearTab, setActiveGearTab] = useState('morph')

  const isGoal = character.mode === 'goal'
  const activeMorph = isGoal ? character.goalBody : character.currentBody
  const updateActiveMorph = isGoal ? updateGoalBody : updateCurrentBody

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Phòng Rèn Nhân Vật 3D (Character Forge)
            </h1>
            <Badge variant={isGoal ? 'gold' : 'cyan'} size="sm">
              {isGoal ? 'Chế độ: Mục Tiêu' : 'Chế độ: Hiện Tại'}
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Không gian thị giác hóa 3D phản ánh thể trạng thực tế và mục tiêu hình thể tương lai của bạn.
          </p>
        </div>

        {/* Current vs Goal Mode Selector */}
        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
          <Button
            size="sm"
            variant={!isGoal ? 'primary' : 'ghost'}
            className="text-xs font-semibold"
            onClick={() => setMode('current')}
          >
            Thể Trạng Hiện Tại
          </Button>
          <Button
            size="sm"
            variant={isGoal ? 'gold' : 'ghost'}
            className="text-xs font-semibold"
            onClick={() => setMode('goal')}
          >
            Mục Tiêu Thể Hình
          </Button>
        </div>
      </div>

      {/* Main Grid: 3D Viewport (7 cols) + Tuning & Equipment (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 3D Viewport (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="p-3 bg-slate-900/90 border-slate-800">
            <AvatarCanvas
              currentMorph={character.currentBody}
              goalMorph={character.goalBody}
              mode={character.mode}
              onModeChange={setMode}
              auraEnabled={character.auraUnlocked}
              height="520px"
            />
          </Card>

          {/* Biometric Comparison Card */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">CƠ XƯƠNG (SMM)</span>
              <div className="text-lg font-black text-teal-400 mt-1">
                {isGoal ? '36.5 kg' : `${latestMeasurement.smmKg} kg`}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {isGoal ? 'Mục tiêu (+1.6kg)' : 'Kết quả InBody'}
              </span>
            </Card>

            <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">TỶ LỆ MỠ (PBF)</span>
              <div className="text-lg font-black text-amber-400 mt-1">
                {isGoal ? '11.0 %' : `${latestMeasurement.pbfPercent} %`}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {isGoal ? 'Mục tiêu (-2.6%)' : 'Mức hiện tại'}
              </span>
            </Card>

            <Card className="p-3 bg-slate-900/60 border-slate-800 text-center">
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">CÂN NẶNG DỰ PHÓNG</span>
              <div className="text-lg font-black text-white mt-1">
                {isGoal ? '74.0 kg' : `${latestMeasurement.weightKg} kg`}
              </div>
              <span className="text-[10px] text-slate-500 block">
                {isGoal ? 'Lean Bulk Target' : 'Thực tế'}
              </span>
            </Card>
          </div>
        </div>

        {/* Right: Controls & Gear Configuration (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <Tabs defaultValue="morph" value={activeGearTab} onValueChange={setActiveGearTab}>
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="morph">Tham Số Morph 3D</TabsTrigger>
              <TabsTrigger value="gear">Trang Bị RPG</TabsTrigger>
            </TabsList>

            <TabsContent value="morph" className="space-y-4">
              <AvatarControls
                morph={activeMorph}
                onChange={updateActiveMorph}
                onReset={resetToDefault}
                auraEnabled={character.auraUnlocked}
                onToggleAura={toggleAura}
                title={
                  isGoal
                    ? 'Morph Mục Tiêu Thể Hình (Goal Mode)'
                    : 'Morph Thể Trạng Hiện Tại (Current Mode)'
                }
              />

              <Card className="p-4 bg-slate-950/60 border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-teal-400 font-semibold">
                  <Info className="w-4 h-4" />
                  Hướng Dẫn Tinh Chỉnh Avatar
                </div>
                <p>
                  Kéo các thanh trượt để thử nghiệm tỷ lệ cơ bắp (Hypertrophy) và lớp mỡ (Fat Layer). Chế độ Mục Tiêu cho phép bạn hình dung thể hình ước tính khi đạt các mốc InBody tiếp theo.
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="gear" className="space-y-4">
              {/* Equipped RPG Gear */}
              <Card className="border-slate-800 bg-slate-900/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">
                    <Shield className="w-4 h-4 text-teal-400" />
                    Trang Bị Hỗ Trợ Đang Mang
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400">Đai Lưng Cương Lực</span>
                      <strong className="text-white font-semibold">{character.equippedGear.liftingBelt}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400">Băng Quấn Cổ Tay</span>
                      <strong className="text-white font-semibold">{character.equippedGear.wristWraps}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400">Băng Đầu Gối</span>
                      <strong className="text-white font-semibold">{character.equippedGear.kneeSleeves}</strong>
                    </div>

                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/70 border border-slate-800">
                      <span className="text-slate-400">Màu Hào Quang Hào Khí</span>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3.5 h-3.5 rounded-full border border-white/20 shadow-sm"
                          style={{ backgroundColor: character.equippedGear.auraColor || '#14b8a6' }}
                        />
                        <strong className="text-teal-300">Teal Titan</strong>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Unlocked Skins */}
              <Card className="border-slate-800 bg-slate-900/80">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-semibold text-white">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Trang Phục / Lớp Nhân Vật (Skin)
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 pt-0">
                  {character.unlockedSkins.map((skin, idx) => (
                    <div
                      key={skin}
                      className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                        idx === 0
                          ? 'bg-teal-950/30 border-teal-500/50 text-white font-semibold'
                          : 'bg-slate-950/50 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-teal-400" />
                        <span>{skin}</span>
                      </div>
                      {idx === 0 ? (
                        <span className="flex items-center gap-1 text-[11px] text-teal-300">
                          <Check className="w-3.5 h-3.5" /> Đang dùng
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-500">Đã mở khóa</span>
                      )}
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
