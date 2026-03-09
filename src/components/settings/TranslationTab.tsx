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

function CredentialInput(props: {
  label: string
  description: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}) {
  const { label, description, placeholder, value, onChange } = props

  return (
    <Field label={label} description={description}>
      <div className="relative">
        <Key className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
        <input className={`${fieldControlClassName} pl-11`} placeholder={placeholder} value={value} onChange={(event) => onChange(event.target.value)} />
      </div>
    </Field>
  )
}

export function TranslationTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <div className="space-y-6">
      <SectionCard title="翻译源设置" description="句子翻译会优先走主引擎，失败后按降级链继续尝试。单词优先 ECDICT，未命中时回退有道。">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Field label="默认翻译源" description="句子模式优先使用这里选中的在线 Provider。">
            <select className={fieldControlClassName} value={settings.translation_provider} onChange={(event) => void updateSetting('translation_provider', event.target.value)}>
              <option value="ecdict">ECDICT（离线）</option>
              {engineOptions.map((option) => (
                <option key={option.key} value={option.key}>
                  {option.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="降级链" description="使用 `->` 分隔，运行时会按顺序尝试备用 Provider。">
            <input
              className={fieldControlClassName}
              value={settings.fallback_chain.join(' -> ')}
              onChange={(event) =>
                void updateSetting(
                  'fallback_chain',
                  event.target.value
                    .split('->')
                    .map((item) => item.trim())
                    .filter(Boolean),
                )
              }
            />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="Provider 凭证" description="DeepL / OpenAI 继续走 `api_keys`，腾讯、百度、有道改成正式字段，不再混装。">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <CredentialInput
            label="DeepL API Key"
            description="句子主翻译源之一。"
            placeholder="输入 DeepL API Key"
            value={settings.api_keys.deepl ?? ''}
            onChange={(value) => void updateSetting('api_keys', { ...settings.api_keys, deepl: value })}
          />
          <CredentialInput
            label="OpenAI API Key"
            description="支持 SSE 流式输出。"
            placeholder="输入 OpenAI API Key"
            value={settings.api_keys.openai ?? ''}
            onChange={(value) => void updateSetting('api_keys', { ...settings.api_keys, openai: value })}
          />
          <CredentialInput
            label="有道 App Key"
            description="ECDICT 查不到单词时在线回退。"
            placeholder="输入 Youdao App Key"
            value={settings.youdao_app_key}
            onChange={(value) => void updateSetting('youdao_app_key', value)}
          />
          <CredentialInput
            label="有道 App Secret"
            description="用于有道 v3 签名。"
            placeholder="输入 Youdao App Secret"
            value={settings.youdao_app_secret}
            onChange={(value) => void updateSetting('youdao_app_secret', value)}
          />
          <CredentialInput
            label="腾讯 Secret ID"
            description="用于 TC3-HMAC-SHA256 签名。"
            placeholder="输入 Tencent Secret ID"
            value={settings.tencent_secret_id}
            onChange={(value) => void updateSetting('tencent_secret_id', value)}
          />
          <CredentialInput
            label="腾讯 Secret Key"
            description="用于 TC3-HMAC-SHA256 签名。"
            placeholder="输入 Tencent Secret Key"
            value={settings.tencent_secret_key}
            onChange={(value) => void updateSetting('tencent_secret_key', value)}
          />
          <CredentialInput
            label="百度 App ID"
            description="用于百度翻译正式请求。"
            placeholder="输入 Baidu App ID"
            value={settings.baidu_app_id}
            onChange={(value) => void updateSetting('baidu_app_id', value)}
          />
          <CredentialInput
            label="百度 Secret Key"
            description="用于 MD5(appid+q+salt+key) 签名。"
            placeholder="输入 Baidu Secret Key"
            value={settings.baidu_secret_key}
            onChange={(value) => void updateSetting('baidu_secret_key', value)}
          />
        </div>
      </SectionCard>

      <SectionCard title="多引擎对照" description="最多同时展示 3 个句子引擎，方便横向比较。">
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
            <StatusPill icon={<Lightning size={14} weight="duotone" />} label="OpenAI 支持流式输出" />
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
