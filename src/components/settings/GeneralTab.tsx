import { Globe, Moon, Sun, Waveform } from '@phosphor-icons/react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../ui/Button'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

export function GeneralTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1.08fr)_minmax(320px,0.92fr)]">
      <SectionCard title="通用设置" description="主题、代理和本地 HTTP API 属于跨页面共享配置。">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <Field label="主题" description="支持 system / dark / light 三种模式。">
            <select className={fieldControlClassName} value={settings.theme} onChange={(event) => void updateSetting('theme', event.target.value as typeof settings.theme)}>
              <option value="system">跟随系统</option>
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </Field>
          <Field label="数据目录" description="当前版本仍使用默认应用目录。">
            <input className={fieldControlClassName} disabled readOnly value={settings.data_dir} />
          </Field>
          <Field label="HTTP API 端口" description="仅监听 127.0.0.1，供 Alfred / Raycast / 脚本调用。">
            <input className={fieldControlClassName} type="number" min={1} max={65535} value={settings.http_api_port} onChange={(event) => void updateSetting('http_api_port', Number(event.target.value || 16888))} />
          </Field>
          <Field label="网络代理" description="统一作用于所有 reqwest 请求，支持 HTTP / HTTPS / SOCKS。">
            <div className="space-y-3">
              <Button variant={settings.proxy_enabled ? 'primary' : 'secondary'} onClick={() => void updateSetting('proxy_enabled', !settings.proxy_enabled)}>
                {settings.proxy_enabled ? '关闭代理' : '开启代理'}
              </Button>
              <input
                className={fieldControlClassName}
                disabled={!settings.proxy_enabled}
                placeholder="例如 http://127.0.0.1:7890"
                value={settings.proxy_url}
                onChange={(event) => void updateSetting('proxy_url', event.target.value)}
              />
            </div>
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="当前状态" description="这些开关会直接联动后端行为。">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill icon={<Globe size={14} weight="duotone" />} label={`剪贴板监听 ${settings.clipboard_listen ? '开启' : '关闭'}`} tone={settings.clipboard_listen ? 'accent' : 'muted'} />
            <StatusPill icon={<Sun size={14} weight="duotone" />} label="自动更新 即将支持" tone="muted" />
            <StatusPill icon={<Moon size={14} weight="duotone" />} label={`隐私模式 ${settings.privacy_mode ? '开启' : '关闭'}`} tone={settings.privacy_mode ? 'accent' : 'muted'} />
            <StatusPill icon={<Waveform size={14} weight="duotone" />} label={`端口 ${settings.http_api_port}`} />
            <StatusPill icon={<Globe size={14} weight="duotone" />} label={settings.proxy_enabled ? '代理已启用' : '代理已关闭'} tone={settings.proxy_enabled ? 'accent' : 'muted'} />
          </div>
          <div className="grid gap-3">
            <Button variant="secondary" onClick={() => void updateSetting('clipboard_listen', !settings.clipboard_listen)}>
              {settings.clipboard_listen ? '关闭剪贴板监听' : '开启剪贴板监听'}
            </Button>
            <Button variant="secondary" disabled>
              自动更新即将支持
            </Button>
            <Button variant="secondary" onClick={() => void updateSetting('privacy_mode', !settings.privacy_mode)}>
              {settings.privacy_mode ? '关闭隐私模式' : '开启隐私模式'}
            </Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
