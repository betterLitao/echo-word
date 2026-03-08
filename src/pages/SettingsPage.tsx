import { Database, GearSix, Key, Lightning, Translate } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { DictionaryTab } from '../components/settings/DictionaryTab'
import { GeneralTab } from '../components/settings/GeneralTab'
import { ShortcutTab } from '../components/settings/ShortcutTab'
import { TranslationTab } from '../components/settings/TranslationTab'
import { TranslationWorkbench } from '../components/settings/TranslationWorkbench'
import { InputTranslateDialog } from '../components/translation/InputTranslateDialog'
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
        description="设置页现在同时承担输入翻译工作台的职责：除了配置项，还能直接验证自动模式、句子翻译、多引擎对照和 Provider / 缓存提示。"
        eyebrow="Settings Center"
        title="把输入翻译、配置与系统状态放进同一个工作台，而不是拆成互相割裂的页面。"
        meta={
          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            <StatusPill icon={<Lightning size={14} weight="fill" />} label="Cycle 06 Runtime" tone="accent" />
            <StatusPill icon={<Translate size={14} weight="duotone" />} label="Sentence & Compare Ready" />
          </div>
        }
      />

      <TranslationWorkbench />
      <InputTranslateDialog />

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
