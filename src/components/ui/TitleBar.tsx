import { Minus, X } from '@phosphor-icons/react'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function TitleBar() {
  const appWindow = getCurrentWindow()

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await appWindow.minimize()
  }

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation()
    await appWindow.hide()
  }

  const handleDragStart = async (e: React.MouseEvent) => {
    // 只在左键按下时触发拖拽
    if (e.button === 0) {
      await appWindow.startDragging()
    }
  }

  return (
    <div
      className="fixed left-0 right-0 top-0 z-50 flex h-8 select-none items-center justify-between bg-slate-950/80 backdrop-blur-xl"
      onMouseDown={handleDragStart}
    >
      <div className="flex-1 pl-3 text-xs font-medium text-slate-400">
        EchoWord
      </div>
      <div className="flex shrink-0">
        <button
          type="button"
          onClick={handleMinimize}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex h-8 w-10 items-center justify-center text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <Minus size={14} weight="bold" />
        </button>
        <button
          type="button"
          onClick={handleClose}
          onMouseDown={(e) => e.stopPropagation()}
          className="flex h-8 w-10 items-center justify-center text-slate-400 transition-colors hover:bg-red-500/90 hover:text-white"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}
