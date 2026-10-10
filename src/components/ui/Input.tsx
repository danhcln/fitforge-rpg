import React from 'react'
import { cn } from '@/lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  helperText?: string
  error?: string
  unit?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = 'text', label, helperText, error, unit, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-medium text-slate-300">
            {label}
          </label>
        )}
        <div className="relative rounded-xl">
          <input
            id={inputId}
            type={type}
            ref={ref}
            className={cn(
              'w-full rounded-xl border border-slate-700/80 bg-slate-900/90 px-3.5 py-2.5 text-sm text-slate-100 placeholder-slate-500 shadow-inner transition-colors focus:border-teal-400 focus:outline-none focus:ring-1 focus:ring-teal-400 disabled:opacity-50',
              unit && 'pr-12',
              error && 'border-rose-500 focus:border-rose-500 focus:ring-rose-500',
              className
            )}
            {...props}
          />
          {unit && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3.5">
              <span className="text-xs font-semibold text-slate-400">{unit}</span>
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'
