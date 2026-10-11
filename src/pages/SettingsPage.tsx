import React, { useState } from 'react'
import { db } from '@/services/db'
import { useUserStore } from '@/stores'
import { Input } from '@/components/ui'
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
  Check,
} from 'lucide-react'

export const SettingsPage: React.FC = () => {
  const [exporting, setExporting] = useState(false)
  const [restoring, setRestoring] = useState(false)
  const { user, updateProfile } = useUserStore()
  const [profileName, setProfileName] = useState<string | null>(null)
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
              <span className="text-[10px] text-slate-400">Phiên bản schema 3</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">ĐỒNG BỘ ĐÁM MÂY</span>
              <strong className="text-emerald-400 mt-0.5 block">Tắt (Offline-Only)</strong>
              <span className="text-[10px] text-slate-400">Dữ liệu trên thiết bị</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-semibold">KHÔNG GIAN LƯU TRỮ</span>
              <strong className="text-white mt-0.5 block">Tùy dữ liệu</strong>
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
            Sao lưu toàn bộ dữ liệu. Khôi phục chỉ thêm ID mới, giữ nguyên bản ghi hiện có khi trùng ID.
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
                  Nhập File Sao Lưu JSON
                </h4>
                <p className="text-[11px] text-slate-400 mt-1">
                  File được kiểm tra cấu trúc và tham chiếu trước khi nhập trong một giao dịch. Dữ liệu mẫu được giữ riêng khỏi tiến trình thực tế.
                </p>
              </div>

              <input aria-label="Nhập sao lưu JSON" type="file" accept=".json,application/json" disabled={restoring} className="text-xs text-slate-300" onChange={async e => {
                const file = e.target.files?.[0]
                if (!file) return
                setRestoring(true)
                try {
                  if (file.size > 20 * 1024 * 1024) throw new Error('File vượt quá 20 MB.')
                  const count = await db.importBackup(JSON.parse(await file.text()) as unknown)
                  setMessage(`Đã nhập ${count} bản ghi mới. Bản ghi trùng ID được giữ nguyên.`)
                } catch (err) { setMessage(`Không thể khôi phục: ${String(err)}`) }
                finally { setRestoring(false); e.target.value = '' }
              }} />
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

      <Card><CardHeader><CardTitle>Hồ sơ cá nhân</CardTitle></CardHeader><CardContent className="space-y-3">
        <Input label="Tên chiến binh" value={profileName ?? user.name} onChange={e => setProfileName(e.target.value)} />
        <Button onClick={async () => { try { await updateProfile({ name: (profileName ?? user.name).trim() }); setProfileName(null); setMessage('Đã lưu hồ sơ.') } catch (err) { setMessage(String(err)) } }}>Lưu hồ sơ</Button>
      </CardContent></Card>
    </div>
  )
}
