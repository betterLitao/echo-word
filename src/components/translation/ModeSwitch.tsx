import { motion } from 'framer-motion'
import type { TranslationMode } from '../../lib/tauri'
import { cx } from '../../lib/utils'

interface ModeSwitchProps {
  value: TranslationMode
  onChange: (value: TranslationMode) => void
}

const items: Array<{ label: string; value: TranslationMode }> = [
  { label: '自动', value: 'auto' },
  { label: '单词', value: 'word' },
  { label: '句子', value: 'sentence' },
]

export function ModeSwitch({ onChange, value }: ModeSwitchProps) {
  return (
    <div className="inline-flex rounded-full border border-white/10 bg-black/20 p-1 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            className={cx(
              'relative rounded-full px-4 py-2 text-sm font-medium tracking-[0.01em] transition-colors duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
              active ? 'text-slate-950' : 'text-slate-300 hover:text-white',
            )}
            type="button"
            onClick={() => onChange(item.value)}
          >
            {active ? (
              <motion.span
                layoutId="translation-mode-pill"
                className="absolute inset-0 rounded-full bg-emerald-300 shadow-[0_12px_28px_-16px_rgba(110,231,183,0.7)]"
                transition={{ type: 'spring', stiffness: 100, damping: 20 }}
              />
            ) : null}
            <span className="relative z-10">{item.label}</span>
          </button>
        )
      })}
    </div>
  )
}
