import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { cx } from '../../lib/utils'

interface StatusPillProps {
  icon?: ReactNode
  label: string
  tone?: 'default' | 'accent' | 'muted'
}

const toneClassName = {
  default: 'border-white/10 bg-white/[0.06] text-slate-200',
  accent: 'border-emerald-300/18 bg-emerald-300/10 text-emerald-100',
  muted: 'border-slate-700/80 bg-slate-900/70 text-slate-300',
}

export function StatusPill({ icon, label, tone = 'default' }: StatusPillProps) {
  return (
    <motion.div
      animate={{ opacity: [0.88, 1, 0.88] }}
      className={cx(
        'inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-medium tracking-[0.14em] uppercase',
        toneClassName[tone],
      )}
      transition={{ duration: 3.4, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
    >
      {icon ? <span className="text-[1.05em]">{icon}</span> : null}
      <span>{label}</span>
    </motion.div>
  )
}
