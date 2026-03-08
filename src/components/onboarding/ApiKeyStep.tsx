import { useSettingsStore } from '../../stores/settingsStore'

export function ApiKeyStep() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">翻译源预配置</h2>
      <p className="text-sm leading-7 text-slate-300">当前仅用于验证设置持久化，真实翻译 API 接入将在 `Cycle 03` 完成。</p>
      <label className="flex max-w-xl flex-col gap-2 text-sm text-slate-200">
        DeepL API Key
        <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={settings.api_keys.deepl ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, deepl: event.target.value })} />
      </label>
    </div>
  )
}
