import { Key, Lightning, Translate } from '@phosphor-icons/react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

export function TranslationTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <div className="space-y-6">
      <SectionCard title="翻译源设置" description="当前阶段以离线词典为主，在线 Provider 作为后续句子翻译能力的预留入口。">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Field label="默认翻译源" description="单词模式默认使用 ECDICT，句子模式将在后续接入在线链路。">
            <select className={fieldControlClassName} value={settings.translation_provider} onChange={(event) => void updateSetting('translation_provider', event.target.value)}>
              <option value="ecdict">ECDICT（离线）</option>
              <option value="deepl">DeepL</option>
              <option value="tencent">腾讯翻译</option>
              <option value="baidu">百度翻译</option>
            </select>
          </Field>

          <Field label="降级链" description="用右箭头串起来，后续真正请求在线 Provider 时会按顺序降级。">
            <input className={fieldControlClassName} value={settings.fallback_chain.join(' → ')} onChange={(event) => void updateSetting('fallback_chain', event.target.value.split('→').map((item) => item.trim()).filter(Boolean))} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="API Key" description="输入框与标签样式统一走同一套 Field 组件，后续直接扩展到更多 Provider。">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Field label="DeepL Key" description="预留在线句子翻译所需密钥。">
            <div className="relative">
              <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input className={`${fieldControlClassName} pl-11`} placeholder="Cycle 03 接入" value={settings.api_keys.deepl ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, deepl: event.target.value })} />
            </div>
          </Field>
          <Field label="腾讯 Key" description="预留备用 Provider 使用。">
            <div className="relative">
              <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input className={`${fieldControlClassName} pl-11`} placeholder="Cycle 03 接入" value={settings.api_keys.tencent ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, tencent: event.target.value })} />
            </div>
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusPill icon={<Lightning size={14} weight="duotone" />} label="在线 Provider 待接入" tone="muted" />
          <StatusPill icon={<Translate size={14} weight="duotone" />} label="离线词典已生效" tone="accent" />
        </div>
      </SectionCard>
    </div>
  )
}
