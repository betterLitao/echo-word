import { useMemo, useState } from 'react'
import { DictionaryTab } from '../components/settings/DictionaryTab'
import { GeneralTab } from '../components/settings/GeneralTab'
import { ShortcutTab } from '../components/settings/ShortcutTab'
import { TranslationTab } from '../components/settings/TranslationTab'

const tabs = [
  { key: 'general', label: '通用' },
  { key: 'translation', label: '翻译源' },
  { key: 'shortcut', label: '快捷键' },
  { key: 'dictionary', label: '词典' },
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
      <div>
        <p className="text-sm font-medium text-emerald-300">设置中心</p>
        <h2 className="mt-2 text-3xl font-semibold">主窗口基础路由已就绪</h2>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">当前重点是先把设置、引导、窗口控制和数据库初始化串起来，为后续翻译闭环提供稳定基础设施。</p>
      </div>
      <div className="flex flex-wrap gap-3">
        {tabs.map((tab) => (
          <button key={tab.key} className={activeTab === tab.key ? 'rounded-full bg-emerald-400/20 px-4 py-2 text-sm text-emerald-200' : 'rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300'} onClick={() => setActiveTab(tab.key)}>
            {tab.label}
          </button>
        ))}
      </div>
      {content}
    </div>
  )
}
