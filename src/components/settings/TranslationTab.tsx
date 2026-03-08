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
      <SectionCard title="翻译源设置" description="句子翻译链路已接通：主翻译源会优先执行，失败后按降级链继续尝试；多引擎模式下最多保留 3 个结果。">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Field label="默认翻译源" description="单词模式继续使用 ECDICT；句子模式会优先使用这里的在线 Provider。">
            <select className={fieldControlClassName} value={settings.translation_provider} onChange={(event) => void updateSetting('translation_provider', event.target.value)}>
              <option value="ecdict">ECDICT（离线）</option>
              <option value="deepl">DeepL</option>
              <option value="tencent">腾讯翻译</option>
              <option value="baidu">百度翻译</option>
            </select>
          </Field>

          <Field label="降级链" description="使用右箭头分隔，运行时会按顺序尝试备用 Provider。">
            <input className={fieldControlClassName} value={settings.fallback_chain.join(' → ')} onChange={(event) => void updateSetting('fallback_chain', event.target.value.split('→').map((item) => item.trim()).filter(Boolean))} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="API Key 与多引擎" description="API Key 会先经过本地轻量加密再落库；多引擎模式用于对照句子译文，但会限制最多 3 个结果。">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Field label="DeepL Key" description="当前句子翻译的首选在线 Provider。">
            <div className="relative">
              <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input className={`${fieldControlClassName} pl-11`} placeholder="输入 DeepL API Key" value={settings.api_keys.deepl ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, deepl: event.target.value })} />
            </div>
          </Field>
          <Field label="腾讯 Key" description="备用在线 Provider。">
            <div className="relative">
              <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input className={`${fieldControlClassName} pl-11`} placeholder="输入腾讯翻译 Key" value={settings.api_keys.tencent ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, tencent: event.target.value })} />
            </div>
          </Field>
          <Field label="百度 Key" description="第三顺位 Provider。">
            <div className="relative">
              <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input className={`${fieldControlClassName} pl-11`} placeholder="输入百度翻译 Key" value={settings.api_keys.baidu ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, baidu: event.target.value })} />
            </div>
          </Field>
          <Field label="多引擎列表" description="使用逗号分隔 Provider，例如 deepl,tencent,baidu。">
            <input className={fieldControlClassName} placeholder="deepl,tencent" value={settings.multi_engine_list.join(', ')} onChange={(event) => void updateSetting('multi_engine_list', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} />
          </Field>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <StatusPill icon={<Lightning size={14} weight="duotone" />} label="句子翻译链路已接通" tone="accent" />
          <StatusPill icon={<Translate size={14} weight="duotone" />} label={`多引擎 ${settings.multi_engine_enabled ? '开启' : '关闭'}`} tone={settings.multi_engine_enabled ? 'accent' : 'muted'} />
          <StatusPill icon={<Translate size={14} weight="duotone" />} label="API Key 本地轻量加密" />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <label className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-200">
            <input className="accent-emerald-300" type="checkbox" checked={settings.multi_engine_enabled} onChange={(event) => void updateSetting('multi_engine_enabled', event.target.checked)} />
            开启多引擎对照
          </label>
        </div>
      </SectionCard>
    </div>
  )
}
