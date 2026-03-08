import { Key, Lightning, Stack, Translate } from '@phosphor-icons/react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../ui/Button'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

const engineOptions = [
  { key: 'deepl', label: 'DeepL' },
  { key: 'tencent', label: '腾讯翻译' },
  { key: 'baidu', label: '百度翻译' },
  { key: 'openai', label: 'OpenAI' },
] as const

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
              {engineOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label}</option>
              ))}
            </select>
          </Field>

          <Field label="降级链" description="使用右箭头分隔，运行时会按顺序尝试备用 Provider。">
            <input className={fieldControlClassName} value={settings.fallback_chain.join(' → ')} onChange={(event) => void updateSetting('fallback_chain', event.target.value.split('→').map((item) => item.trim()).filter(Boolean))} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="API Key 与代理" description="API Key 会先经过本地轻量加密再落库；代理会透传给在线请求链路。">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          {engineOptions.map((option) => (
            <Field key={option.key} label={`${option.label} Key`} description={`用于 ${option.label} 在线翻译。`}>
              <div className="relative">
                <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
                <input className={`${fieldControlClassName} pl-11`} placeholder={`输入 ${option.label} API Key`} value={settings.api_keys[option.key] ?? ''} onChange={(event) => void updateSetting('api_keys', { ...settings.api_keys, [option.key]: event.target.value })} />
              </div>
            </Field>
          ))}
          <Field label="网络代理" description="支持 HTTP / HTTPS / SOCKS 代理地址。">
            <input className={fieldControlClassName} placeholder="例如 http://127.0.0.1:7890" value={settings.proxy} onChange={(event) => void updateSetting('proxy', event.target.value)} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="多引擎对照" description="最多同时展示 3 个句子引擎，便于在同一个弹窗里横向比较。">
        <div className="space-y-5">
          <div className="flex flex-wrap gap-3">
            <Button variant={settings.multi_engine_enabled ? 'primary' : 'secondary'} onClick={() => void updateSetting('multi_engine_enabled', !settings.multi_engine_enabled)}>
              {settings.multi_engine_enabled ? '关闭多引擎对照' : '开启多引擎对照'}
            </Button>
          </div>
          <div className="flex flex-wrap gap-3">
            {engineOptions.map((option) => {
              const active = settings.multi_engine_list.includes(option.key)
              return (
                <Button
                  key={option.key}
                  variant={active ? 'primary' : 'secondary'}
                  onClick={() => {
                    const next = active
                      ? settings.multi_engine_list.filter((item) => item !== option.key)
                      : [...settings.multi_engine_list, option.key].slice(0, 3)
                    void updateSetting('multi_engine_list', next)
                  }}
                >
                  {option.label}
                </Button>
              )
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusPill icon={<Stack size={14} weight="duotone" />} label={settings.multi_engine_enabled ? '多引擎已启用' : '单引擎模式'} tone={settings.multi_engine_enabled ? 'accent' : 'muted'} />
            <StatusPill icon={<Translate size={14} weight="duotone" />} label={`已选择 ${settings.multi_engine_list.length || 0} 个对照引擎`} />
            <StatusPill icon={<Lightning size={14} weight="duotone" />} label="API Key 本地轻量加密" />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
