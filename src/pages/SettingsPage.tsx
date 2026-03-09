import { Database, GearSix, Key, Lightning, Translate } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { DictionaryTab } from '../components/settings/DictionaryTab'
import { GeneralTab } from '../components/settings/GeneralTab'
import { ShortcutTab } from '../components/settings/ShortcutTab'
import { TranslationTab } from '../components/settings/TranslationTab'
import { TranslationWorkbench } from '../components/settings/TranslationWorkbench'
import { Button } from '../components/ui/Button'
import { PageHero } from '../components/ui/PageHero'
import { StatusPill } from '../components/ui/StatusPill'
import { useI18n } from '../hooks/useI18n'

type SettingsTabKey = 'general' | 'translation' | 'shortcut' | 'dictionary'

export function SettingsPage() {
  const { t } = useI18n()
  const [activeTab, setActiveTab] = useState<SettingsTabKey>('general')

  const tabs = useMemo(
    () => [
      { key: 'general' as const, label: t('settings.tab.general'), icon: GearSix },
      { key: 'translation' as const, label: t('settings.tab.translation'), icon: Lightning },
      { key: 'shortcut' as const, label: t('settings.tab.shortcut'), icon: Key },
      { key: 'dictionary' as const, label: t('settings.tab.dictionary'), icon: Database },
    ],
    [t],
  )

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
        description={t('settings.page.description')}
        eyebrow={t('settings.page.eyebrow')}
        title={t('settings.page.title')}
        meta={
          <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
            <StatusPill icon={<Lightning size={14} weight="fill" />} label={t('settings.meta.cycle')} tone="accent" />
            <StatusPill icon={<Translate size={14} weight="duotone" />} label={t('settings.meta.sentence')} />
            <StatusPill icon={<Key size={14} weight="duotone" />} label={t('settings.meta.shortcut')} />
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
