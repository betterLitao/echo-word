import { motion } from 'framer-motion'
import { cx } from '../../lib/utils'

interface StepperProps {
  steps: string[]
  currentStep: number
}

export function Stepper({ steps, currentStep }: StepperProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
      {steps.map((step, index) => {
        const active = index === currentStep
        const completed = index < currentStep
        return (
          <motion.div
            key={step}
            animate={{ opacity: active ? 1 : completed ? 0.92 : 0.72, y: active ? -2 : 0 }}
            className={cx(
              'rounded-[1.3rem] border px-4 py-4 text-sm transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              active
                ? 'border-emerald-300/20 bg-emerald-300/10 text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                : completed
                  ? 'border-white/10 bg-white/[0.05] text-slate-200'
                  : 'border-white/8 bg-black/20 text-slate-500',
            )}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-medium tracking-[0.02em]">{step}</span>
              <span className="text-xs uppercase tracking-[0.22em]">0{index + 1}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}
