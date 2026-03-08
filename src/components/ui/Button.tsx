import { animate, motion, type HTMLMotionProps, useMotionValue, useTransform } from 'framer-motion'
import type { ReactNode } from 'react'
import { cx } from '../../lib/utils'

type ButtonVariant = 'primary' | 'secondary' | 'ghost'
type ButtonSize = 'sm' | 'md' | 'lg'

interface ButtonProps extends HTMLMotionProps<'button'> {
  children?: ReactNode
  icon?: ReactNode
  variant?: ButtonVariant
  size?: ButtonSize
}

const variantClassName: Record<ButtonVariant, string> = {
  primary:
    'bg-emerald-300 text-slate-950 shadow-[0_18px_40px_-18px_rgba(110,231,183,0.55)] hover:bg-emerald-200',
  secondary:
    'border border-white/12 bg-white/8 text-white hover:border-white/20 hover:bg-white/12',
  ghost:
    'border border-transparent bg-transparent text-slate-300 hover:border-white/10 hover:bg-white/6 hover:text-white',
}

const sizeClassName: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-sm',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-base',
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

export function Button({
  children,
  className,
  icon,
  onPointerLeave,
  onPointerMove,
  size = 'md',
  type = 'button',
  variant = 'secondary',
  ...props
}: ButtonProps) {
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const rotate = useTransform(x, [-8, 8], [-1.5, 1.5])

  return (
    <motion.button
      className={cx(
        'group inline-flex transform-gpu items-center justify-center gap-2 rounded-full font-medium tracking-[0.01em]',
        'transition-[background-color,border-color,color,box-shadow] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
        'active:scale-[0.98] active:translate-y-px disabled:pointer-events-none disabled:opacity-50',
        variantClassName[variant],
        sizeClassName[size],
        className,
      )}
      style={{ x, y, rotate }}
      transition={{ type: 'spring', stiffness: 100, damping: 20 }}
      type={type}
      whileTap={{ scale: 0.98, y: 1 }}
      onPointerMove={(event) => {
        // 磁吸位移只走 MotionValue，不进入 React render，避免高频 hover 导致重渲染抖动。
        const rect = event.currentTarget.getBoundingClientRect()
        const offsetX = ((event.clientX - rect.left) / rect.width - 0.5) * 18
        const offsetY = ((event.clientY - rect.top) / rect.height - 0.5) * 14
        x.set(clamp(offsetX, -6, 6))
        y.set(clamp(offsetY, -4, 4))
        onPointerMove?.(event)
      }}
      onPointerLeave={(event) => {
        animate(x, 0, { type: 'spring', stiffness: 100, damping: 20 })
        animate(y, 0, { type: 'spring', stiffness: 100, damping: 20 })
        onPointerLeave?.(event)
      }}
      {...props}
    >
      {icon ? <span className="text-[1.05em] text-current/80">{icon}</span> : null}
      <span>{children}</span>
    </motion.button>
  )
}
