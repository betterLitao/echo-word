import { Keyboard, Lightning } from '@phosphor-icons/react'
import { StatusPill } from '../ui/StatusPill'
import { useSettingsStore } from '../../stores/settingsStore'

export function ShortcutStep() {
  const settings = useSettingsStore((state) => state.settings)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[2.1rem]">快捷键预览</h2>
        <p className="mt-4 max-w-[58ch] text-sm leading-8 text-slate-400">当前版本已经支持系统快捷键注册；即使在浏览器调试模式下，也会自动降级为应用内快捷键，保证操作路径与正式桌面版一致。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill icon={<Keyboard size={14} weight="duotone" />} label="系统快捷键已接入" tone="accent" />
      </div>

      <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">翻译快捷键</p>
          <div className="mt-4 flex items-center justify-between gap-4">
            <p className="text-lg font-semibold text-white">{settings.shortcut_translate}</p>
            <Lightning size={18} weight="duotone" className="text-emerald-200" />
          </div>
        </div>
        <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">输入翻译快捷键</p>
          <p className="mt-4 text-lg font-semibold text-white">{settings.shortcut_input}</p>
        </div>
      </div>
    </div>
  )
}
