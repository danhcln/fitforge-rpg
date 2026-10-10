import React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number // 0 to 100
  max?: number
  variant?: 'cyan' | 'gold' | 'purple' | 'emerald' | 'rose'
  size?: 'sm' | 'md' | 'lg'
  showLabel?: boolean
  label?: string
  valueLabel?: string
}

export const Progress: React.FC<ProgressProps> = ({
  className,
  value,
  max = 100,
  variant = 'cyan',
  size = 'md',
  showLabel = false,
  label,
  valueLabel,
  ...props
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100))

  const variantGradients = {
    cyan: 'from-teal-500 to-cyan-400 shadow-teal-500/20',
    gold: 'from-amber-500 to-yellow-400 shadow-amber-500/20',
    purple: 'from-purple-600 to-fuchsia-500 shadow-purple-500/20',
    emerald: 'from-emerald-500 to-teal-400 shadow-emerald-500/20',
    rose: 'from-rose-500 to-pink-500 shadow-rose-500/20',
  }

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  }

  return (
    <div className={cn('w-full space-y-1', className)} {...props}>
      {showLabel && (
        <div className="flex justify-between text-xs font-medium text-slate-300">
          <span>{label}</span>
          <span className="font-mono text-slate-400">
            {valueLabel || `${Math.round(percentage)}%`}
          </span>
        </div>
      )}
      <div className={cn('w-full overflow-hidden rounded-full bg-slate-800/90 p-0.5 border border-slate-700/50', sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r shadow-md transition-all duration-300 ease-out',
            variantGradients[variant]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
