import { create } from 'zustand'
import type { TranslationMode, TranslationResult } from '../lib/tauri'

// Cycle 01 还没有接入真实翻译后端，
// 先保留一份演示数据用于弹窗布局和交互联调。
const demoWord: TranslationResult = {
  source_text: 'ephemeral',
  translated_text: '短暂的；转瞬即逝的',
  provider: 'ecdict',
  mode: 'word',
  word_detail: {
    phonetic_us: '/ɪˈfemərəl/',
    phonetic_uk: '/ɪˈfemərəl/',
    chinese_phonetic: '一 · 飞 · 摸 · 若 · 了',
    definitions: ['adj. 短暂的', 'adj. 朝生暮死的'],
    pos: 'adj.',
  },
}

interface TranslationState {
  result: TranslationResult | null
  loading: boolean
  error: string | null
  mode: TranslationMode
  setMode: (mode: TranslationMode) => void
  seedDemo: () => void
  clear: () => void
}

export const useTranslationStore = create<TranslationState>((set) => ({
  result: null,
  loading: false,
  error: null,
  mode: 'auto',
  setMode: (mode) => set({ mode }),
  seedDemo: () => set({ result: demoWord }),
  clear: () => set({ result: null, loading: false, error: null }),
}))
