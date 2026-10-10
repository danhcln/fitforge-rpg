import React, { useState } from 'react'
import { Outlet, NavLink } from 'react-router-dom'
import { TopBar } from './TopBar'
import { Sidebar } from './Sidebar'
import { MobileNav } from './MobileNav'
import { Modal } from '@/components/ui/Modal'
import { navigationItems } from './navItems'
import { cn } from '@/lib/utils'

export const AppShell: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-[#0b0f19] text-slate-100 bg-grid-pattern">
      {/* Top Bar HUD */}
      <TopBar />

      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <Sidebar
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 md:pb-8 p-4 sm:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav onOpenDrawer={() => setMobileDrawerOpen(true)} />

      {/* Mobile "More" Drawer Modal */}
      <Modal
        isOpen={mobileDrawerOpen}
        onClose={() => setMobileDrawerOpen(false)}
        title="Danh Mục Tính Năng FitForge"
        description="Truy cập nhanh tất cả các phân hệ và cấu hình hệ thống"
      >
        <div className="grid grid-cols-2 gap-2.5 py-2">
          {navigationItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileDrawerOpen(false)}
                className={({ isActive }) =>
                  cn(
                    'flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all',
                    isActive
                      ? 'bg-teal-500/20 border-teal-500/40 text-teal-300 font-bold'
                      : 'bg-slate-800/60 border-slate-700/60 text-slate-300 hover:bg-slate-800'
                  )
                }
              >
                <Icon className="h-6 w-6 mb-1.5" />
                <span className="text-xs">{item.labelVi}</span>
              </NavLink>
            )
          })}
        </div>
      </Modal>
    </div>
  )
}
