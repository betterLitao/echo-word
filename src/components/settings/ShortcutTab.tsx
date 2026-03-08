import { Keyboard } from '@phosphor-icons/react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

export function ShortcutTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <SectionCard title="快捷键配置" description="表单布局采用标签在上、输入在下的规则，为后续冲突提示和错误文案留足空间。">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Field label="翻译快捷键" description="后续会用于划词翻译与剪贴板翻译入口。">
          <input className={fieldControlClassName} value={settings.shortcut_translate} onChange={(event) => void updateSetting('shortcut_translate', event.target.value)} />
        </Field>
        <Field label="输入翻译快捷键" description="后续会直接拉起输入框。">
          <input className={fieldControlClassName} value={settings.shortcut_input} onChange={(event) => void updateSetting('shortcut_input', event.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <StatusPill icon={<Keyboard size={14} weight="duotone" />} label="系统级注册待接入" tone="muted" />
      </div>
    </SectionCard>
  )
}
