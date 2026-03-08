import { invoke } from '@tauri-apps/api/core'
import { emit } from '@tauri-apps/api/event'

export type Theme = 'system' | 'light' | 'dark'
export type TranslationMode = 'auto' | 'word' | 'sentence'

export interface WordDetail {
  phonetic_us?: string | null
  phonetic_uk?: string | null
  chinese_phonetic: string
  definitions: string[]
  pos?: string | null
}

export interface TranslationResult {
  source_text: string
  translated_text: string
  provider: string
  mode: Exclude<TranslationMode, 'auto'>
  word_detail?: WordDetail | null
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

export interface Settings {
  shortcut_translate: string
  shortcut_input: string
  translation_provider: string
  fallback_chain: string[]
  api_keys: Record<string, string>
  theme: Theme
  data_dir: string
  privacy_mode: boolean
  clipboard_listen: boolean
  auto_update: boolean
  proxy: string
  http_api_port: number
  onboarding_completed: boolean
  dictionary_version: string
  multi_engine_enabled: boolean
  multi_engine_list: string[]
}

export const defaultSettings: Settings = {
  shortcut_translate: 'CmdOrCtrl+Shift+T',
  shortcut_input: 'CmdOrCtrl+Shift+I',
  translation_provider: 'ecdict',
  fallback_chain: ['deepl', 'tencent', 'baidu'],
  api_keys: {},
  theme: 'system',
  data_dir: '默认应用目录',
  privacy_mode: false,
  clipboard_listen: false,
  auto_update: true,
  proxy: '',
  http_api_port: 16888,
  onboarding_completed: false,
  dictionary_version: 'core',
  multi_engine_enabled: false,
  multi_engine_list: [],
}

const demoDictionary: Record<string, TranslationResult> = {
  ephemeral: {
    source_text: 'ephemeral',
    translated_text: 'adj. 短暂的；转瞬即逝的',
    provider: 'ecdict',
    mode: 'word',
    word_detail: {
      phonetic_us: '/ɪˈfemərəl/',
      phonetic_uk: '/ɪˈfemərəl/',
      chinese_phonetic: '一 · 飞 · 摸 · 若 · 了',
      definitions: ['adj. 短暂的', 'adj. 转瞬即逝的'],
      pos: 'adj.',
    },
  },
  think: {
    source_text: 'think',
    translated_text: 'v. 想；思考；认为',
    provider: 'ecdict',
    mode: 'word',
    word_detail: {
      phonetic_us: '/θɪŋk/',
      phonetic_uk: '/θɪŋk/',
      chinese_phonetic: '[θ咬舌送气] · 一 · 嗯 · 克',
      definitions: ['v. 想', 'v. 思考', 'v. 认为'],
      pos: 'v.',
    },
  },
}

// 浏览器模式下用来兜底，方便先开发前端骨架而不强依赖 Tauri 运行时。
export function isTauriRuntime() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window
}

// 对所有 IPC 调用做一层统一封装：
// 1. 在 Tauri 中走真实命令；
// 2. 在纯前端调试时回落到默认值，保证页面可独立联调。
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

export async function translateText(text: string, mode: TranslationMode = 'auto') {
  const normalized = text.trim().toLowerCase()
  if (!isTauriRuntime()) {
    const result = demoDictionary[normalized]
    if (result) {
      return {
        ...result,
        source_text: text.trim(),
      }
    }
    throw new Error('浏览器调试模式仅内置了 ephemeral / think 两个示例词')
  }

  return invoke<TranslationResult>('translate', { text, mode })
}

export async function addFavorite(item: FavoriteItem) {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('add_favorite', { item })
}

export async function removeFavorite(word: string) {
  if (!isTauriRuntime()) {
    return
  }

  await invoke('remove_favorite', { word })
}

export function getFavorites(query = '') {
  return safeInvoke<FavoriteItem[]>('get_favorites', { query }, [])
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
