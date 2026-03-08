import type { PropsWithChildren } from 'react'
import { cx } from '../../lib/utils'

interface FieldProps extends PropsWithChildren {
  className?: string
  description?: string
  errorText?: string
  label: string
}

export const fieldControlClassName =
  'w-full rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-100 outline-none transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] placeholder:text-slate-500 focus:border-emerald-300/40 focus:bg-black/28 focus:ring-4 focus:ring-emerald-300/10'

export function Field({ children, className, description, errorText, label }: FieldProps) {
  return (
    <label className={cx('flex flex-col gap-2', className)}>
      <span className="text-sm font-medium text-slate-100">{label}</span>
      {description ? <span className="text-xs leading-6 text-slate-400">{description}</span> : null}
      {children}
      {errorText ? <span className="text-xs text-rose-300">{errorText}</span> : null}
    </label>
  )
}
