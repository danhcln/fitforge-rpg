import React from 'react'
import { useUserStore } from '@/stores'
import { Flame, Coins, Gem, Zap, Shield } from 'lucide-react'
import { Progress } from '@/components/ui/Progress'

export const TopBar: React.FC = () => {
  const { user } = useUserStore()

  const xpPercent = Math.round((user.currentXp / user.nextLevelXp) * 100)

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/85 backdrop-blur-xl px-4 py-2.5 transition-all">
      <div className="flex flex-wrap items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Left: Mobile App Brand / Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-md shadow-teal-500/20">
            <Shield className="h-5 w-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm sm:text-base tracking-wider bg-gradient-to-r from-teal-400 via-cyan-300 to-amber-300 bg-clip-text text-transparent">
                FITFORGE RPG
              </span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-950 text-teal-400 border border-teal-800/50">
                LOCAL-FIRST
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              {user.name} • {user.title}
            </p>
          </div>
        </div>

        {/* Center: RPG Level & XP Bar */}
        <div className="flex-1 max-w-xs md:max-w-md hidden md:block">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="font-bold text-teal-400 flex items-center gap-1">
              CẤP {user.level}
            </span>
            <span className="font-mono text-[11px] text-slate-400">
              {user.currentXp.toLocaleString()} / {user.nextLevelXp.toLocaleString()} XP ({xpPercent}%)
            </span>
          </div>
          <Progress value={user.currentXp} max={user.nextLevelXp} variant="cyan" size="sm" />
        </div>

        {/* Right: Currency, Streak, Energy HUD */}
        <div className="flex items-center gap-2 sm:gap-3 text-xs font-semibold">
          {/* Streak Flame */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-orange-950/40 border border-orange-500/30 text-orange-400 shadow-sm"
            title="Chuỗi ngày đã ghi nhận · không bắt buộc tập liên tiếp"
          >
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
            <span>{user.streakDays} Ngày</span>
          </div>

          {/* Energy Bar */}
          <div
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-950/40 border border-blue-500/30 text-blue-400 shadow-sm"
            title="Năng lượng tập luyện"
          >
            <Zap className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
            <span>{user.energy}/{user.maxEnergy}</span>
          </div>

          {/* Gold */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-amber-950/40 border border-amber-500/30 text-amber-400 shadow-sm"
            title="Vàng phần thưởng"
          >
            <Coins className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="font-mono">{user.gold.toLocaleString()}</span>
          </div>

          {/* Gems */}
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-purple-950/40 border border-purple-500/30 text-purple-400 shadow-sm"
            title="Ngọc quý"
          >
            <Gem className="w-3.5 h-3.5 fill-purple-400 text-purple-400" />
            <span className="font-mono">{user.gems}</span>
          </div>
        </div>
      </div>
    </header>
  )
}
