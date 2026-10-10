import React, { useState } from 'react'
import { db } from '@/services/db'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
  Settings,
  Database,
  Download,
  RotateCcw,
  ShieldCheck,
  HardDrive,
  Cpu,
  Check,
} from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [exporting, setExporting] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const handleExportData = async () => {
    try {
      setExporting(true)
      const data = await db.exportFullBackup()
      const jsonString = JSON.stringify(data, null, 2)
      const blob = new Blob([jsonString], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `FitForgeRPG_Backup_${new Date().toISOString().split('T')[0]}.json`
      a.click()
      URL.revokeObjectURL(url)
      setMessage('✅ Xuất file sao lưu JSON thành công!')
      setTimeout(() => setMessage(null), 3500)
    } catch {
      setMessage('❌ Đã xảy ra lỗi khi trích xuất dữ liệu.')
    } finally {
      setExporting(false)
    }
  }

  const handleResetData = async () => {
    const confirmReset = window.confirm(
      'Bạn có chắc chắn muốn khôi phục dữ liệu về trạng thái mẫu ban đầu? Toàn bộ thay đổi chưa lưu sẽ được làm mới.'
    )
    if (!confirmReset) return

    try {
      setResetting(true)
      await db.resetToDemoState()
      setMessage('✅ Đã khôi phục dữ liệu mẫu thành công! Đang tải lại ứng dụng...')
      setTimeout(() => {
        window.location.reload()
      }, 1200)
    } catch {
      setMessage('❌ Đã xảy ra lỗi khi làm mới dữ liệu.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in-50 duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Cài Đặt & Quản Lý Dữ Liệu Cục Bộ (Local Storage)
            </h1>
            <Badge variant="emerald" size="sm">
              <ShieldCheck className="w-3 h-3" />
              100% Cục Bộ
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            FitForge RPG lưu trữ trực tiếp trên trình duyệt của bạn (Dexie IndexedDB), không truyền dữ liệu ra máy chủ đám mây bên ngoài.
          </p>
        </div>
      </div>

      {message && (
        <div className="p-3.5 rounded-2xl bg-teal-950/60 border border-teal-500/50 text-teal-200 text-xs flex items-center gap-2 animate-in fade-in-50">
          <Check className="w-4 h-4 text-teal-400 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      {/* Storage & Local-First Engine Status */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-3 border-b border-slate-800">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base text-white">
              <Database className="w-4 h-4 text-teal-400" />
              Trạng Thái Cơ Sở Dữ Liệu IndexedDB (Dexie Engine)
            </CardTitle>
            <Badge variant="cyan" size="sm">
              Sẵn Sàng (Active)
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">CÔNG NGHỆ LƯU TRỮ</span>
              <strong className="text-white mt-0.5 block">IndexedDB API</strong>
              <span className="text-[10px] text-teal-400">Dexie.js v4</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">TÊN CƠ SỞ DỮ LIỆU</span>
              <strong className="text-white mt-0.5 block font-mono">FitForgeRPG_DB</strong>
              <span className="text-[10px] text-slate-400">Phiên bản schema 1</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">ĐỒNG BỘ ĐÁM MÂY</span>
              <strong className="text-emerald-400 mt-0.5 block">Tắt (Offline-Only)</strong>
              <span className="text-[10px] text-slate-400">Bảo mật tuyệt đối</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">KHÔNG GIAN LƯU TRỮ</span>
              <strong className="text-white mt-0.5 block">&lt; 5 MB</strong>
              <span className="text-[10px] text-slate-400">Tối ưu dung lượng</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup, Export & Portability Controls */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-base text-white">
            <HardDrive className="w-4 h-4 text-teal-400" />
            Sao Lưu, Xuất Khẩu & Khôi Phục Dữ Liệu
          </CardTitle>
          <p className="text-xs text-slate-400">
            Dễ dàng trích xuất file JSON lưu trữ về máy tính cá nhân hoặc khôi phục dữ liệu mẫu kiểm thử
          </p>
        </CardHeader>

        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Export JSON */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs text-white flex items-center gap-1.5">
                  <Download className="w-4 h-4 text-teal-400" />
                  Xuất Toàn Bộ Dữ Liệu Ra File JSON (Export Backup)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tải về bản sao lưu đầy đủ gồm toàn bộ bài tập, buổi tập, lịch sử đo InBody, mục tiêu và danh hiệu RPG.
                </p>
              </div>

              <Button
                variant="primary"
                size="sm"
                onClick={handleExportData}
                disabled={exporting}
                className="w-full sm:w-auto self-start"
              >
                {exporting ? 'Đang trích xuất...' : 'Tải Xuống File JSON (.json)'}
              </Button>
            </div>

            {/* Reset Demo Data */}
            <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-800 flex flex-col justify-between space-y-3">
              <div>
                <h4 className="font-bold text-xs text-rose-300 flex items-center gap-1.5">
                  <RotateCcw className="w-4 h-4 text-rose-400" />
                  Khôi Phục Dữ Liệu Mẫu (Reset Demo Seed)
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  Khôi phục các bản ghi mẫu ban đầu (UserProfile Lv14, 4 kỳ đo InBody, bài tập chuẩn và lịch sử).
                </p>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="border-rose-500/40 text-rose-300 hover:bg-rose-950/30 w-full sm:w-auto self-start"
                onClick={handleResetData}
                disabled={resetting}
              >
                {resetting ? 'Đang làm mới...' : 'Khôi Phục Trạng Thái Mẫu'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* App Preferences */}
      <Card className="border-slate-800 bg-slate-900/80">
        <CardHeader className="pb-3 border-b border-slate-800">
          <CardTitle className="text-base text-white">
            <Settings className="w-4 h-4 text-teal-400" />
            Tùy Chọn Ứng Dụng (Preferences)
          </CardTitle>
        </CardHeader>

        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <strong className="text-white block">Ngôn ngữ hiển thị UI</strong>
              <span className="text-slate-400 text-[11px]">Tiếng Việt (Giao diện người dùng)</span>
            </div>
            <Badge variant="cyan" size="sm">
              Tiếng Việt
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <strong className="text-white block">Đơn vị đo lường trọng lượng</strong>
              <span className="text-slate-400 text-[11px]">Hệ mét chuẩn quốc tế (Kilogram - kg)</span>
            </div>
            <Badge variant="cyan" size="sm">
              Kilogram (kg)
            </Badge>
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
            <div>
              <strong className="text-white block">Chủ đề giao diện (Theme)</strong>
              <span className="text-slate-400 text-[11px]">Dark-mode thể hình Cyberpunk / RPG Forge</span>
            </div>
            <Badge variant="gold" size="sm">
              Dark RPG
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Developer Handoff Card */}
      <div className="p-4 rounded-2xl bg-teal-950/20 border border-teal-500/30 text-xs text-slate-300 space-y-1.5">
        <div className="flex items-center gap-2 font-bold text-teal-300">
          <Cpu className="w-4 h-4 text-teal-400" />
          Tài Liệu Bàn Giao Kỹ Thuật (OpenAI Codex Handoff)
        </div>
        <p className="text-[11px] text-slate-400">
          Kiến trúc frontend, schema cơ sở dữ liệu Dexie và điểm kết nối state đã được hoàn thiện. Vui lòng tham khảo các tài liệu hướng dẫn chuyên sâu tại thư mục <code className="text-teal-300 bg-slate-950 px-1.5 py-0.5 rounded">docs/ARCHITECTURE.md</code> và <code className="text-teal-300 bg-slate-950 px-1.5 py-0.5 rounded">docs/HANDOFF_TO_CODEX.md</code>.
        </p>
      </div>
    </div>
  )
}
