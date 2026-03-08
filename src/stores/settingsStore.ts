import { create } from 'zustand'
import { defaultSettings, getSettings, type Settings, updateSetting } from '../lib/tauri'

interface SettingsState {
  settings: Settings
  loading: boolean
  loadSettings: () => Promise<void>
  updateSetting: <Key extends keyof Settings>(key: Key, value: Settings[Key]) => Promise<void>
}

export const useSettingsStore = create<SettingsState>((set) => ({
  // 设置是主窗口、引导页和后续翻译链路的公共基础状态，
  // 这里统一负责“读取 + 持久化 + 本地同步更新”。
  settings: defaultSettings,
  loading: true,
  loadSettings: async () => {
    const settings = await getSettings()
    set({ settings, loading: false })
  },
  updateSetting: async (key, value) => {
    await updateSetting(key, value)
    set((state) => ({
      settings: {
        ...state.settings,
        [key]: value,
      },
    }))
  },
}))
