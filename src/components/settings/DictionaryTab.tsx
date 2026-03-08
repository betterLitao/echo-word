import { SectionCard } from '../ui/SectionCard'
import { useSettingsStore } from '../../stores/settingsStore'

export function DictionaryTab() {
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)

  return (
    <SectionCard title="词典管理占位" description="Cycle 01 先保留版本切换入口，真正下载与切换逻辑在 Cycle 06 完成。">
      <div className="flex flex-wrap gap-3 text-sm text-slate-200">
        {[
          { label: '核心版', value: 'core' },
          { label: '精简版', value: 'compact' },
          { label: '完整版', value: 'full' },
        ].map((item) => (
          <button key={item.value} className={settings.dictionary_version === item.value ? 'rounded-full bg-emerald-400/20 px-4 py-2 text-emerald-200' : 'rounded-full border border-white/10 px-4 py-2 text-slate-300'} onClick={() => void updateSetting('dictionary_version', item.value)}>
            {item.label}
          </button>
        ))}
      </div>
    </SectionCard>
  )
}
