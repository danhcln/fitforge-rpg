import React from 'react'
import { cn } from '@/lib/utils'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  glow?: 'none' | 'cyan' | 'gold' | 'purple'
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, glow = 'none', children, ...props }, ref) => {
    const glowClasses = {
      none: '',
      cyan: 'forge-glow-cyan border-teal-500/40',
      gold: 'forge-glow-gold border-amber-500/40',
      purple: 'forge-glow-purple border-purple-500/40',
    }

    return (
      <div
        ref={ref}
        className={cn(
          'rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md p-5 text-slate-100 shadow-xl transition-all duration-200',
          glowClasses[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Card.displayName = 'Card'

export const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex flex-col space-y-1.5 pb-4', className)} {...props} />
  )
)
CardHeader.displayName = 'CardHeader'

export const CardTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-lg font-semibold tracking-tight text-white flex items-center gap-2', className)}
      {...props}
    />
  )
)
CardTitle.displayName = 'CardTitle'

export const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-xs text-slate-400', className)} {...props} />
  )
)
CardDescription.displayName = 'CardDescription'

export const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn('pt-0', className)} {...props} />
)
CardContent.displayName = 'CardContent'

export const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('flex items-center pt-4 border-t border-slate-800/60 mt-4', className)} {...props} />
  )
)
CardFooter.displayName = 'CardFooter'
