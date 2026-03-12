import { Translate } from '@phosphor-icons/react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

interface SelectionFloatingButtonProps {
  onTranslate: (text: string) => void
}

interface Position {
  x: number
  y: number
}

export function SelectionFloatingButton({ onTranslate }: SelectionFloatingButtonProps) {
  const [selectedText, setSelectedText] = useState('')
  const [position, setPosition] = useState<Position | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    let hideTimer: NodeJS.Timeout | null = null

    const handleMouseUp = (e: MouseEvent) => {
      // 延迟获取选中文本，确保选区已完成
      setTimeout(() => {
        const selection = window.getSelection()
        const text = selection?.toString().trim() || ''

        // 清除之前的定时器
        if (hideTimer) {
          clearTimeout(hideTimer)
          hideTimer = null
        }

        // 判断是否显示图标
        if (text.length >= 2 && /[a-zA-Z]/.test(text)) {
          try {
            const range = selection?.getRangeAt(0)
            const rect = range?.getBoundingClientRect()

            if (rect && rect.width > 0 && rect.height > 0) {
              // 图标显示在选区右上角，使用视口坐标（不加滚动偏移）
              setPosition({
                x: rect.right + 8,
                y: rect.top - 8,
              })
              setSelectedText(text)
              setVisible(true)

              // 3 秒后自动隐藏
              hideTimer = setTimeout(() => {
                setVisible(false)
              }, 3000)
            }
          } catch (error) {
            // 选区可能无效，忽略错误
            console.debug('Selection error:', error)
          }
        } else {
          setVisible(false)
        }
      }, 10)
    }

    const handleMouseDown = () => {
      // 点击其他地方时隐藏
      setVisible(false)
    }

    document.addEventListener('mouseup', handleMouseUp)
    document.addEventListener('mousedown', handleMouseDown)

    return () => {
      document.removeEventListener('mouseup', handleMouseUp)
      document.removeEventListener('mousedown', handleMouseDown)
      if (hideTimer) {
        clearTimeout(hideTimer)
      }
    }
  }, [])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    onTranslate(selectedText)
    setVisible(false)
  }

  return createPortal(
    <AnimatePresence>
      {visible && position && (
        <motion.button
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={handleClick}
          className="fixed z-[99999] flex h-9 w-9 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/95 text-slate-950 shadow-[0_8px_24px_-8px_rgba(110,231,183,0.6)] backdrop-blur-sm transition-all hover:scale-110 hover:bg-emerald-300 hover:shadow-[0_12px_32px_-8px_rgba(110,231,183,0.8)]"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
          }}
        >
          <Translate size={18} weight="bold" />
        </motion.button>
      )}
    </AnimatePresence>,
    document.body
  )
}
