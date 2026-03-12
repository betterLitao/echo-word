import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'

export type Theme = 'system' | 'light' | 'dark'
export type TranslationMode = 'auto' | 'word' | 'sentence'
export type ResolvedTranslationMode = Exclude<TranslationMode, 'auto'>

export interface WordDetail {
  phonetic_us?: string | null
  phonetic_uk?: string | null
  chinese_phonetic: string
  pinyin_phonetic: string
  definitions: string[]
  pos?: string | null
}

export interface SentenceAlternative {
  provider: string
  provider_label?: string | null
  translated_text: string
  from_cache?: boolean
  notice?: string | null
}

export interface TranslationResult {
  source_text: string
  translated_text: string
  provider: string
  provider_label?: string | null
  mode: ResolvedTranslationMode
  word_detail?: WordDetail | null
  from_cache?: boolean
  notice?: string | null
  alternatives?: SentenceAlternative[]
}

export interface TranslationStreamEvent {
  source_text: string
  provider: string
  provider_label?: string | null
  delta_text: string
  stream_text: string
  done: boolean
}

export interface FavoriteItem {
  id?: number | null
  word: string
  phonetic?: string | null
  chinese_phonetic?: string | null
  translation: string
  source_text?: string | null
  created_at?: string | null
}

export interface HistoryItem {
  id: number
  source_text: string
  result_text: string
  mode: string
  provider?: string | null
  created_at: string
}

export type HistoryDateRange = 'all' | 'today' | '7d' | '30d'

export interface Settings {
  shortcut_translate: string
  shortcut_input: string
  translation_provider: string
  fallback_chain: string[]
  api_keys: Record<string, string>
  youdao_app_key: string
  youdao_app_secret: string
  tencent_secret_id: string
  tencent_secret_key: string
  baidu_app_id: string
  baidu_secret_key: string
  theme: Theme
  data_dir: string
  privacy_mode: boolean
  auto_start: boolean
  clipboard_listen: boolean
  global_selection_listen: boolean
  auto_update: boolean
  proxy_enabled: boolean
  proxy_url: string
  http_api_port: number
  onboarding_completed: boolean
  dictionary_version: string
  multi_engine_enabled: boolean
  multi_engine_list: string[]
  ollama_endpoint: string
  ollama_model: string
  popup_last_x: number | null
  popup_last_y: number | null
  language: string
}

export const defaultSettings: Settings = {
  shortcut_translate: 'CmdOrCtrl+Shift+T',
  shortcut_input: 'CmdOrCtrl+Shift+I',
  translation_provider: 'ecdict',
  fallback_chain: ['deepl', 'tencent', 'baidu', 'openai', 'ollama'],
  api_keys: {},
  youdao_app_key: '',
  youdao_app_secret: '',
  tencent_secret_id: '',
  tencent_secret_key: '',
  baidu_app_id: '',
  baidu_secret_key: '',
  theme: 'system',
  data_dir: '默认应用目录',
  privacy_mode: false,
  auto_start: false,
  clipboard_listen: false,
  global_selection_listen: false,
  auto_update: true,
  proxy_enabled: false,
  proxy_url: '',
  http_api_port: 16888,
  onboarding_completed: false,
  dictionary_version: 'core',
  multi_engine_enabled: false,
  multi_engine_list: [],
  ollama_endpoint: 'http://localhost:11434/api/generate',
  ollama_model: '',
  popup_last_x: null,
  popup_last_y: null,
  language: 'zh-CN',
}

export type FavoriteExportFormat = 'csv' | 'json' | 'anki'

export function resolveTranslationMode(mode: TranslationMode, text: string): ResolvedTranslationMode {
  if (mode !== 'auto') {
    return mode
  }

  return /\s/.test(text.trim()) ? 'sentence' : 'word'
}

export function getResultProviderLabel(result: Pick<TranslationResult, 'provider' | 'provider_label'>) {
  return result.provider_label ?? result.provider.toUpperCase()
}

export function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

async function safeInvoke<T>(command: string, args?: Record<string, unknown>, fallback?: T): Promise<T> {
  if (!isTauriRuntime()) {
    if (fallback !== undefined) {
      return fallback
    }
    throw new Error(`命令 ${command} 仅可在 Tauri 环境中调用`)
  }

  return invoke<T>(command, args)
}

export function getSettings() {
  return safeInvoke<Settings>('get_settings', undefined, defaultSettings)
}

export async function updateSetting<Key extends keyof Settings>(key: Key, value: Settings[Key]) {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('update_setting', { key, value })
}

export function checkAccessibility() {
  return safeInvoke<boolean>('check_accessibility', undefined, false)
}

export async function openAccessibilitySettings() {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('open_accessibility_settings')
}

export async function showPopup() {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('show_popup')
}

export async function hidePopup() {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('hide_popup')
}

export async function showMainWindow() {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('show_main_window')
}

export async function requestInputTranslate() {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('request_input_translate')
}

export async function requestSelectionTranslate() {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('request_selection_translate')
}

export async function translateText(text: string, mode: TranslationMode = 'auto') {
  if (!isTauriRuntime()) {
    throw new Error('翻译功能仅可在 Tauri 环境中使用')
  }

  return invoke<TranslationResult>('translate', { text, mode })
}

export async function translateAndShowPopup(text: string, mode: TranslationMode = 'auto') {
  if (!isTauriRuntime()) {
    throw new Error('翻译功能仅可在 Tauri 环境中使用')
  }

  return invoke<TranslationResult>('translate_and_show_popup', { text, mode })
}

export async function addFavorite(item: FavoriteItem) {
  if (!isTauriRuntime()) {
    return null
  }

  return invoke<string | null>('add_favorite', { item })
}

export async function removeFavorite(word: string) {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('remove_favorite', { word })
}

export function getFavorites(query = '', page = 1, pageSize = 20) {
  return safeInvoke<FavoriteItem[]>('get_favorites', { query, page, pageSize }, [])
}

export async function exportFavorites(format: FavoriteExportFormat) {
  if (!isTauriRuntime()) {
    return null
  }

  return invoke<string | null>('export_favorites', { format })
}

export async function resetPopupPosition() {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('reset_popup_position')
}

export function getHistory(
  query = '',
  dateRangeOrPage: HistoryDateRange | number = 'all',
  pageOrPageSize = 1,
  maybePageSize = 20,
) {
  const dateRange = typeof dateRangeOrPage === 'string' ? dateRangeOrPage : 'all'
  const page = typeof dateRangeOrPage === 'number' ? dateRangeOrPage : pageOrPageSize
  const pageSize = typeof dateRangeOrPage === 'number' ? pageOrPageSize : maybePageSize

  return safeInvoke<HistoryItem[]>('get_history', { query, dateRange, page, pageSize }, [])
}

// 主窗口与弹窗窗口各自维护状态，这里通过 app 级事件广播翻译结果，
// 保证弹窗可以在独立上下文里拿到最新数据。
export async function pushPopupResult(result: TranslationResult) {
  if (!isTauriRuntime()) {
    return
  }

  await emit('translation-result', result)
  await showPopup()
}

export function speakText(text: string, lang = 'en-US') {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return false
  }

  const content = text.trim()
  if (!content) {
    return false
  }

  const utterance = new SpeechSynthesisUtterance(content)
  utterance.lang = lang
  utterance.rate = 0.95
  utterance.pitch = 1

  window.speechSynthesis.cancel()
  window.speechSynthesis.speak(utterance)
  return true
}
