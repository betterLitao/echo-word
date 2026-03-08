import type { ReactNode } from 'react'

interface EmptyStateProps {
  action?: ReactNode
  description: string
  icon: ReactNode
  title: string
}

export function EmptyState({ action, description, icon, title }: EmptyStateProps) {
  return (
    <div className="rounded-[1.75rem] border border-dashed border-white/10 bg-white/[0.03] p-7 text-left">
      <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/6 text-emerald-200">
        {icon}
      </div>
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mt-3 max-w-[52ch] text-sm leading-7 text-slate-400">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}
