import { motion } from 'framer-motion'

export function BackgroundDecor() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {/* 装饰层固定在视口上，只做 transform/opacity 动画，避免随滚动产生持续重绘。 */}
      <motion.div
        animate={{ opacity: [0.22, 0.34, 0.2], scale: [1, 1.12, 0.96, 1], x: [0, 48, -36, 0], y: [0, -40, 26, 0] }}
        className="absolute left-[-14rem] top-[-10rem] h-[30rem] w-[30rem] rounded-full bg-emerald-300/16 blur-[110px]"
        transition={{ duration: 18, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        animate={{ opacity: [0.12, 0.18, 0.1], scale: [1, 1.08, 1], x: [0, -34, 22, 0], y: [0, 34, -18, 0] }}
        className="absolute right-[-10rem] top-[10rem] h-[26rem] w-[26rem] rounded-full bg-cyan-300/10 blur-[120px]"
        transition={{ duration: 21, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />
      <motion.div
        animate={{ opacity: [0.08, 0.16, 0.08], x: [0, 24, -24, 0], y: [0, -18, 24, 0] }}
        className="absolute bottom-[-12rem] left-[24%] h-[24rem] w-[24rem] rounded-full bg-emerald-100/6 blur-[120px]"
        transition={{ duration: 24, ease: 'easeInOut', repeat: Number.POSITIVE_INFINITY }}
      />
    </div>
  )
}
