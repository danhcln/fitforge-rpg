import React, { createContext, useContext, useState } from 'react'
import { cn } from '@/lib/utils'

interface TabsContextType {
  activeTab: string
  setActiveTab: (id: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

export interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (val: string) => void
  children: React.ReactNode
  className?: string
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  const [internalTab, setInternalTab] = useState(defaultValue)
  const currentTab = value !== undefined ? value : internalTab

  const handleTabChange = (id: string) => {
    if (value === undefined) setInternalTab(id)
    onValueChange?.(id)
  }

  return (
    <TabsContext.Provider value={{ activeTab: currentTab, setActiveTab: handleTabChange }}>
      <div className={cn('w-full', className)}>{children}</div>
    </TabsContext.Provider>
  )
}

export interface TabsListProps extends React.HTMLAttributes<HTMLDivElement> {}

export const TabsList: React.FC<TabsListProps> = ({ className, children, ...props }) => (
  <div
    className={cn(
      'inline-flex items-center gap-1.5 rounded-xl bg-slate-900/90 p-1 border border-slate-800 text-slate-400',
      className
    )}
    {...props}
  >
    {children}
  </div>
)

export interface TabsTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string
}

export const TabsTrigger: React.FC<TabsTriggerProps> = ({
  value,
  className,
  children,
  ...props
}) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsTrigger must be used within Tabs')

  const isActive = context.activeTab === value

  return (
    <button
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3.5 py-1.5 text-xs font-medium transition-all duration-150 focus:outline-none cursor-pointer',
        isActive
          ? 'bg-teal-500/20 text-teal-300 font-semibold shadow-sm border border-teal-500/30'
          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60',
        className
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
}

export const TabsContent: React.FC<TabsContentProps> = ({
  value,
  className,
  children,
  ...props
}) => {
  const context = useContext(TabsContext)
  if (!context) throw new Error('TabsContent must be used within Tabs')

  if (context.activeTab !== value) return null

  return (
    <div className={cn('mt-4 animate-in fade-in-50 duration-200', className)} {...props}>
      {children}
    </div>
  )
}
