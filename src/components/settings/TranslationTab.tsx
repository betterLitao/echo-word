import { SectionCard } from '../ui/SectionCard'
import { useSettingsStore } from '../../stores/settingsStore'

export function TranslationTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <div className="space-y-4">
      <SectionCard title="翻译源设置" description="Cycle 01 先提供配置壳层；真实 Provider 接入会在后续周期实现。">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            默认翻译源
            <select className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={settings.translation_provider} onChange={(event) => void updateSetting('translation_provider', event.target.value)}>
              <option value="ecdict">ECDICT（离线）</option>
              <option value="deepl">DeepL</option>
              <option value="tencent">腾讯翻译</option>
              <option value="baidu">百度翻译</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            降级链
            <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" value={settings.fallback_chain.join(' → ')} onChange={(event) => void updateSetting('fallback_chain', event.target.value.split('→').map((item) => item.trim()).filter(Boolean))} />
          </label>
        </div>
      </SectionCard>

      <SectionCard title="API Key" description="本周期先落存储通道，后续会切换为加密存储和多 Provider 表单。">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            DeepL Key
            <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Cycle 03 接入" value={settings.api_keys.deepl ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, deepl: event.target.value })} />
          </label>
          <label className="flex flex-col gap-2 text-sm text-slate-200">
            腾讯 Key
            <input className="rounded-2xl border border-white/10 bg-slate-950 px-4 py-3" placeholder="Cycle 03 接入" value={settings.api_keys.tencent ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, tencent: event.target.value })} />
          </label>
        </div>
      </SectionCard>
    </div>
  )
}
