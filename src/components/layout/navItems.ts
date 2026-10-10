import React from 'react'
import {
  LayoutDashboard,
  User,
  Dumbbell,
  Activity,
  Target,
  Trophy,
  Settings,
} from 'lucide-react'

export interface NavItem {
  to: string
  labelVi: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
}

export const navigationItems: NavItem[] = [
  { to: '/', labelVi: 'Tổng quan', icon: LayoutDashboard },
  { to: '/character', labelVi: 'Nhân vật 3D', icon: User, badge: '3D' },
  { to: '/workout', labelVi: 'Luyện tập', icon: Dumbbell, badge: 'Active' },
  { to: '/body-analysis', labelVi: 'Chỉ số InBody', icon: Activity },
  { to: '/goals', labelVi: 'Mục tiêu & Kế hoạch', icon: Target },
  { to: '/history', labelVi: 'Lịch sử & Danh hiệu', icon: Trophy },
  { to: '/settings', labelVi: 'Cài đặt & Dữ liệu', icon: Settings },
]
