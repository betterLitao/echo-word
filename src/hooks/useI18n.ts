import { en } from '../i18n/en'
import { zhCN, type I18nKey } from '../i18n/zh-CN'
import { useSettingsStore } from '../stores/settingsStore'

const dictionaries = {
  en,
  'zh-CN': zhCN,
} as const

export function useI18n() {
  const language = useSettingsStore((state) => state.settings.language)
  const dictionary = dictionaries[language as keyof typeof dictionaries] ?? zhCN

  const t = (key: I18nKey) => dictionary[key] ?? zhCN[key] ?? key

  return {
    language,
    t,
  }
}
