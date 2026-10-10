import React from 'react'
import { NavLink } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { navigationItems } from './navItems'
export type { NavItem } from './navItems'

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, onToggleCollapse }) => {
  return (
    <aside
      className={cn(
        'hidden md:flex flex-col border-r border-slate-800/80 bg-slate-950/70 backdrop-blur-md transition-all duration-300 z-30 shrink-0',
        collapsed ? 'w-18' : 'w-64'
      )}
    >
      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 space-y-1.5 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group select-none',
                  isActive
                    ? 'bg-teal-500/15 text-teal-300 border border-teal-500/30 font-semibold shadow-sm shadow-teal-500/10'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                )
              }
              title={collapsed ? item.labelVi : undefined}
            >
              <Icon className="h-5 w-5 shrink-0 transition-transform group-hover:scale-110" />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between overflow-hidden">
                  <span className="truncate">{item.labelVi}</span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-teal-400 border border-teal-500/30">
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          )
        })}
      </div>

      {/* Footer / Collapse Toggle */}
      <div className="p-3 border-t border-slate-800/80">
        <button
          type="button"
          onClick={onToggleCollapse}
          className="flex w-full items-center justify-center gap-2 rounded-xl py-2 px-3 text-xs font-semibold text-slate-400 hover:bg-slate-800/60 hover:text-slate-100 transition-colors"
          title={collapsed ? 'Mở rộng menu' : 'Thu gọn menu'}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Thu gọn thanh bên</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
