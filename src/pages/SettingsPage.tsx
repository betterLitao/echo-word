import { Database, GearSix, Key, Lightning } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { TranslationWorkbench } from '../components/settings/TranslationWorkbench'
import { DictionaryTab } from '../components/settings/DictionaryTab'
import { GeneralTab } from '../components/settings/GeneralTab'
import { ShortcutTab } from '../components/settings/ShortcutTab'
import { TranslationTab } from '../components/settings/TranslationTab'
import { Button } from '../components/ui/Button'
import { PageHero } from '../components/ui/PageHero'
import { StatusPill } from '../components/ui/StatusPill'

const tabs = [
  { key: 'general', label: '通用', icon: GearSix },
  { key: 'translation', label: '翻译源', icon: Lightning },
  { key: 'shortcut', label: '快捷键', icon: Key },
  { key: 'dictionary', label: '词典', icon: Database },
] as const

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]['key']>('general')

  const content = useMemo(() => {
    switch (activeTab) {
      case 'general':
        return <GeneralTab />
      case 'translation':
        return <TranslationTab />
      case 'shortcut':
        return <ShortcutTab />
      case 'dictionary':
        return <DictionaryTab />
      default:
        return null
    }
  }, [activeTab])

  return (
    <div className="space-y-6">
      <PageHero
        description="设置页被重构成主工作台：上面是当前阶段的调试入口，下面是按能力分组的配置模块。标题左对齐，右侧只保留必要的状态和阶段标签。"
        eyebrow="Settings Center"
        title="配置不是附属页面，而是当前开发阶段的主控面板。"
        meta={
          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            <StatusPill icon={<Lightning size={14} weight="fill" />} label="Cycle 02" tone="accent" />
            <StatusPill icon={<Database size={14} weight="duotone" />} label="SQLite Ready" />
          </div>
        }
      />

      <TranslationWorkbench />

      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => {
          const Icon = tab.icon
          return (
            <Button
              key={tab.key}
              icon={<Icon size={16} weight="duotone" />}
              variant={activeTab === tab.key ? 'primary' : 'secondary'}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </Button>
          )
        })}
      </div>

      {content}
    </div>
  )
}
