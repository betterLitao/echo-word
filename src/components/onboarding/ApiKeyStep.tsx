import { Key, Lightning } from '@phosphor-icons/react'
import { Field, fieldControlClassName } from '../ui/Field'
import { StatusPill } from '../ui/StatusPill'
import { useSettingsStore } from '../../stores/settingsStore'

export function ApiKeyStep() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[2.1rem]">翻译源预配置</h2>
        <p className="mt-4 max-w-[58ch] text-sm leading-8 text-slate-400">当前仅用于验证设置持久化与页面样式，真实在线 Provider 会在后续周期正式接入。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill icon={<Lightning size={14} weight="duotone" />} label="DeepL 准备中" tone="accent" />
      </div>

      <Field label="DeepL API Key" description="先保存到本地设置中，后续周期会接入加密存储。">
        <div className="relative">
          <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
          <input className={`${fieldControlClassName} pl-11`} placeholder="输入你的 API Key" value={settings.api_keys.deepl ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, deepl: event.target.value })} />
        </div>
      </Field>
    </div>
  )
}
