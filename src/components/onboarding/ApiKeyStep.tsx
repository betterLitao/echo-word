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
        <p className="mt-4 max-w-[58ch] text-sm leading-8 text-slate-400">句子翻译链路已经接好，这里填写的 Key 会以非明文形式存到本地设置，并直接用于后续在线 Provider。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill icon={<Lightning size={14} weight="duotone" />} label="DeepL / 腾讯 / 百度" tone="accent" />
      </div>

      <Field label="DeepL API Key" description="保存后即可参与句子翻译与降级链。">
        <div className="relative">
          <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
          <input className={`${fieldControlClassName} pl-11`} placeholder="输入你的 API Key" value={settings.api_keys.deepl ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, deepl: event.target.value })} />
        </div>
      </Field>
    </div>
  )
}
