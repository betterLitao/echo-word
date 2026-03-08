import { SectionCard } from '../ui/SectionCard'
import { useSettingsStore } from '../../stores/settingsStore'

export function GeneralTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <div className="space-y-4">
      <SectionCard title="通用设置" description="Cycle 01 先打通最小设置闭环，保证 Tauri 与前端状态保持同步。">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            主题
            <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={settings.theme} onChange={(event) => void updateSetting('theme', event.target.value as typeof settings.theme)}>
              <option value="system">跟随系统</option>
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            数据目录
            <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" readOnly value={settings.data_dir} />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="系统状态" description="这些开关在本周期主要用于验证设置读写、状态恢复和 UI 结构。">
        <div className="grid gap-3 text-sm text-slate-200 md:grid-cols-3">
          <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10" onClick={() => void updateSetting('clipboard_listen', !settings.clipboard_listen)}>
            剪贴板监听：{settings.clipboard_listen ? '开启' : '关闭'}
          </button>
          <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10" onClick={() => void updateSetting('auto_update', !settings.auto_update)}>
            自动更新：{settings.auto_update ? '开启' : '关闭'}
          </button>
          <button className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left hover:bg-white/10" onClick={() => void updateSetting('privacy_mode', !settings.privacy_mode)}>
            隐私模式：{settings.privacy_mode ? '开启' : '关闭'}
          </button>
        </div>
      </SectionCard>
    </div>
  )
}
