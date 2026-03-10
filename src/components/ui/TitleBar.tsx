import { Minus, X } from '@phosphor-icons/react'
import { getCurrentWindow } from '@tauri-apps/api/window'

export function TitleBar() {
  const appWindow = getCurrentWindow()

  const handleMinimize = () => {
    void appWindow.minimize()
  }

  const handleClose = () => {
    void appWindow.hide()
  }

  return (
    <div
      data-tauri-drag-region
      className="fixed left-0 right-0 top-0 z-50 flex h-8 select-none items-center justify-between bg-slate-950/80 backdrop-blur-xl"
    >
      <div data-tauri-drag-region className="flex-1 pl-3 text-xs font-medium text-slate-400">
        EchoWord
      </div>
      <div className="flex">
        <button
          onClick={handleMinimize}
          className="flex h-8 w-10 items-center justify-center text-slate-400 transition-colors hover:bg-white/5 hover:text-slate-200"
        >
          <Minus size={14} weight="bold" />
        </button>
        <button
          onClick={handleClose}
          className="flex h-8 w-10 items-center justify-center text-slate-400 transition-colors hover:bg-red-500/90 hover:text-white"
        >
          <X size={14} weight="bold" />
        </button>
      </div>
    </div>
  )
}
