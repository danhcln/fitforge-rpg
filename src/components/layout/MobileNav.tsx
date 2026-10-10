import React from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, User, Dumbbell, Activity, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'

export const MobileNav: React.FC<{ onOpenDrawer: () => void }> = ({ onOpenDrawer }) => {
  const primaryMobileItems = [
    { to: '/', labelVi: 'Tổng quan', icon: LayoutDashboard },
    { to: '/character', labelVi: 'Nhân vật', icon: User },
    { to: '/workout', labelVi: 'Tập luyện', icon: Dumbbell },
    { to: '/body-analysis', labelVi: 'InBody', icon: Activity },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800/90 backdrop-blur-xl px-2 py-1.5 safe-area-pb">
      <div className="flex items-center justify-around">
        {primaryMobileItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium transition-all select-none',
                  isActive ? 'text-teal-400 font-bold' : 'text-slate-400 hover:text-slate-200'
                )
              }
            >
              <Icon className="h-5 w-5 mb-0.5" />
              <span>{item.labelVi}</span>
            </NavLink>
          )
        })}

        {/* More Drawer Trigger */}
        <button
          type="button"
          onClick={onOpenDrawer}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-[10px] font-medium text-slate-400 hover:text-slate-200 select-none cursor-pointer"
        >
          <MoreHorizontal className="h-5 w-5 mb-0.5" />
          <span>Thêm</span>
        </button>
      </div>
    </nav>
  )
}
