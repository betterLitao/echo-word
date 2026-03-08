import type { PropsWithChildren, ReactNode } from 'react'
import { cx } from '../../lib/utils'

interface SectionCardProps extends PropsWithChildren {
  action?: ReactNode
  className?: string
  contentClassName?: string
  description?: string
  title: string
}

export function SectionCard({ action, children, className, contentClassName, description, title }: SectionCardProps) {
  return (
    <section className={cx(
      'rounded-[1.85rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.86),rgba(15,23,42,0.62))] px-5 py-5 shadow-[0_24px_60px_-32px_rgba(15,23,42,0.9)] shadow-slate-950/80 backdrop-blur-2xl md:px-6',
      'before:pointer-events-none before:absolute before:inset-px before:rounded-[1.75rem] before:border before:border-white/5 before:content-[""] before:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]',
      'relative overflow-hidden',
      className,
    )}>
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-white md:text-xl">{title}</h2>
          {description ? <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-400">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className={cx('relative mt-5', contentClassName)}>{children}</div>
    </section>
  )
}
