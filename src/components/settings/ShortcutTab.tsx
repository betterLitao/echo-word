import { SectionCard } from '../ui/SectionCard'
import { useSettingsStore } from '../../stores/settingsStore'

export function ShortcutTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <SectionCard title="快捷键占位" description="Cycle 01 先完成配置持久化，后续周期再接入全局快捷键注册与冲突检测。">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          翻译快捷键
          <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={settings.shortcut_translate} onChange={(event) => void updateSetting('shortcut_translate', event.target.value)} />
        </label>
        <label className="flex flex-col gap-2 text-sm text-slate-200">
          输入翻译快捷键
          <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={settings.shortcut_input} onChange={(event) => void updateSetting('shortcut_input', event.target.value)} />
        </label>
      </div>
    </SectionCard>
  )
}
