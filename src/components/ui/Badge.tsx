import React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'cyan' | 'gold' | 'purple' | 'danger' | 'outline' | 'emerald'
  size?: 'sm' | 'md'
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-slate-800 text-slate-300 border-slate-700',
    cyan: 'bg-teal-950/70 text-teal-300 border-teal-500/40',
    gold: 'bg-amber-950/70 text-amber-300 border-amber-500/40',
    purple: 'bg-purple-950/70 text-purple-300 border-purple-500/40',
    emerald: 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40',
    danger: 'bg-rose-950/70 text-rose-300 border-rose-500/40',
    outline: 'bg-transparent text-slate-300 border-slate-700',
  }

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}
