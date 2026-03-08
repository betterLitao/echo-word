import { useSettingsStore } from '../../stores/settingsStore'

export function ShortcutStep() {
  const settings = useSettingsStore((state) => state.settings)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">快捷键预览</h2>
      <p className="text-sm leading-7 text-slate-300">本周期先配置展示与持久化，后续会在 Rust 侧完成系统级注册。</p>
      <div className="grid max-w-2xl gap-3 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p className="text-slate-400">翻译快捷键</p>
          <p className="mt-2 font-medium">{settings.shortcut_translate}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
          <p className="text-slate-400">输入翻译快捷键</p>
          <p className="mt-2 font-medium">{settings.shortcut_input}</p>
        </div>
      </div>
    </div>
  )
}
