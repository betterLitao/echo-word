import { Keyboard, Lightning, TextT } from '@phosphor-icons/react'
import { requestInputTranslate, requestSelectionTranslate } from '../../lib/tauri'
import { shortcutsConflict } from '../../lib/utils'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../ui/Button'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

export function ShortcutTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)
  const hasConflict = shortcutsConflict(settings.shortcut_translate, settings.shortcut_input)
  const conflictMessage = hasConflict ? '两个快捷键当前冲突，建议使用不同组合。' : undefined

  return (
    <SectionCard title="快捷键配置" description="保存后会立即刷新系统注册，便于直接验证全局翻译和输入弹层链路。">
      <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Field label="翻译快捷键" description="读取剪贴板并直接触发弹窗翻译。" errorText={conflictMessage}>
          <input className={fieldControlClassName} value={settings.shortcut_translate} onChange={(event) => void updateSetting('shortcut_translate', event.target.value)} />
        </Field>
        <Field label="输入翻译快捷键" description="唤出输入翻译弹层。" errorText={conflictMessage}>
          <input className={fieldControlClassName} value={settings.shortcut_input} onChange={(event) => void updateSetting('shortcut_input', event.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button icon={<Lightning size={16} weight="duotone" />} variant="secondary" disabled={hasConflict} onClick={() => void requestSelectionTranslate()}>
          测试划词翻译入口
        </Button>
        <Button icon={<TextT size={16} weight="duotone" />} variant="secondary" disabled={hasConflict} onClick={() => void requestInputTranslate()}>
          测试输入翻译入口
        </Button>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <StatusPill icon={<Keyboard size={14} weight="duotone" />} label="系统级注册已接入" tone="accent" />
        {hasConflict ? <StatusPill icon={<Keyboard size={14} weight="duotone" />} label="检测到快捷键冲突" tone="muted" /> : null}
      </div>
    </SectionCard>
  )
}
