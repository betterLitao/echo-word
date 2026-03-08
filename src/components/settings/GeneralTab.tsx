import { Globe, Moon, Sun } from '@phosphor-icons/react'
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
      <SectionCard title="通用设置" description="主题和数据目录属于跨页面共享状态，先在这里统一管理。">
        <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
          <Field label="主题" description="支持系统、深色和浅色三种模式。">
            <select className={fieldControlClassName} value={settings.theme} onChange={(event) => void updateSetting('theme', event.target.value as typeof settings.theme)}>
              <option value="system">跟随系统</option>
              <option value="dark">深色</option>
              <option value="light">浅色</option>
            </select>
          </Field>
          <Field label="数据目录" description="当前先显示默认应用目录，目录切换能力在后续周期补齐。">
            <input className={fieldControlClassName} readOnly value={settings.data_dir} />
          </Field>
        </div>
      </SectionCard>

      <SectionCard title="当前状态" description="这组三态按钮承担配置读写与即时反馈验证。">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusPill icon={<Globe size={14} weight="duotone" />} label={`剪贴板监听 ${settings.clipboard_listen ? '开启' : '关闭'}`} tone={settings.clipboard_listen ? 'accent' : 'muted'} />
            <StatusPill icon={<Sun size={14} weight="duotone" />} label={`自动更新 ${settings.auto_update ? '开启' : '关闭'}`} tone={settings.auto_update ? 'accent' : 'muted'} />
            <StatusPill icon={<Moon size={14} weight="duotone" />} label={`隐私模式 ${settings.privacy_mode ? '开启' : '关闭'}`} tone={settings.privacy_mode ? 'accent' : 'muted'} />
          </div>
          <div className="grid gap-3">
            <Button variant="secondary" onClick={() => void updateSetting('clipboard_listen', !settings.clipboard_listen)}>切换剪贴板监听</Button>
            <Button variant="secondary" onClick={() => void updateSetting('auto_update', !settings.auto_update)}>切换自动更新</Button>
            <Button variant="secondary" onClick={() => void updateSetting('privacy_mode', !settings.privacy_mode)}>切换隐私模式</Button>
          </div>
        </div>
      </SectionCard>
    </div>
  )
}
