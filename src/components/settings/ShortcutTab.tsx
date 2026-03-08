import { Keyboard, Lightning, WarningCircle } from '@phosphor-icons/react'
import { isTauriRuntime, requestInputTranslate, requestSelectionTranslate } from '../../lib/tauri'
import { normalizeShortcut, shortcutsConflict } from '../../lib/utils'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../ui/Button'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

export function ShortcutTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)
  const hasConflict = shortcutsConflict(settings.shortcut_translate, settings.shortcut_input)

  return (
    <SectionCard title="快捷键配置" description="快捷键现在不仅能持久化，还会在 Tauri 运行时注册为系统级入口；浏览器模式则自动降级为应用内快捷键演示。">
      <div className="space-y-6">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr]">
          <Field label="翻译快捷键" description="默认读取剪贴板并直接弹出翻译窗口。" errorText={hasConflict ? '当前与输入翻译快捷键冲突，请调整其中一个。' : undefined}>
            <input className={fieldControlClassName} value={settings.shortcut_translate} onChange={(event) => void updateSetting('shortcut_translate', event.target.value)} />
          </Field>
          <Field label="输入翻译快捷键" description="默认聚焦到设置页的输入工作台。" errorText={hasConflict ? '当前与选择翻译快捷键冲突，请调整其中一个。' : undefined}>
            <input className={fieldControlClassName} value={settings.shortcut_input} onChange={(event) => void updateSetting('shortcut_input', event.target.value)} />
          </Field>
        </div>

        <div className="flex flex-wrap gap-2">
          <StatusPill icon={<Keyboard size={14} weight="duotone" />} label={isTauriRuntime() ? '系统快捷键已接入' : '浏览器调试模式'} tone={isTauriRuntime() ? 'accent' : 'muted'} />
          <StatusPill icon={<Lightning size={14} weight="duotone" />} label={`翻译 ${normalizeShortcut(settings.shortcut_translate) || '未设置'}`} />
          <StatusPill icon={<Lightning size={14} weight="duotone" />} label={`输入 ${normalizeShortcut(settings.shortcut_input) || '未设置'}`} />
          {hasConflict ? <StatusPill icon={<WarningCircle size={14} weight="fill" />} label="快捷键冲突" tone="muted" /> : null}
        </div>

        <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5">
          <p className="text-sm leading-7 text-slate-300">
            修改保存后，Rust 侧会即时刷新系统快捷键注册；在纯前端调试模式下，则使用应用内键盘监听保持同样的交互路径。
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button icon={<Lightning size={16} weight="duotone" />} variant="secondary" disabled={hasConflict} onClick={() => void requestSelectionTranslate()}>
              手动触发选择翻译
            </Button>
            <Button icon={<Keyboard size={16} weight="duotone" />} variant="secondary" disabled={hasConflict} onClick={() => void requestInputTranslate()}>
              手动触发输入翻译
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
