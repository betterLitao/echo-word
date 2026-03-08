import { invoke } from '@tauri-apps/api/core'

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

// 浏览器模式下用来兜底，方便先开发前端骨架而不强依赖 Tauri 运行时。
function isTauriRuntime() {
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
