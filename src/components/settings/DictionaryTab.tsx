import { Database } from '@phosphor-icons/react'
import { useSettingsStore } from '../../stores/settingsStore'
import { Button } from '../ui/Button'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

export function DictionaryTab() {
  const settings = useSettingsStore((state) => state.settings)

  return (
    <SectionCard title="词典管理" description="词典下载与切换将在后续版本接入，当前只展示已保存的版本状态。">
      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-wrap gap-3">
          {[
            { label: '核心版', value: 'core' },
            { label: '精简版', value: 'compact' },
            { label: '完整版', value: 'full' },
          ].map((item) => (
            <Button key={item.value} disabled variant={settings.dictionary_version === item.value ? 'primary' : 'secondary'}>
              {item.label}
            </Button>
          ))}
        </div>

        <div className="rounded-[1.6rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">当前版本</p>
          <p className="mt-4 text-2xl font-semibold tracking-tight text-white">{settings.dictionary_version}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill icon={<Database size={14} weight="duotone" />} label="词典下载 / 切换 即将支持" tone="muted" />
          </div>
        </div>
      </div>
    </SectionCard>
  )
}
