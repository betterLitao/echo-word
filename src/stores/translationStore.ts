import { create } from 'zustand'
import { translateText, type TranslationMode, type TranslationResult } from '../lib/tauri'

// Cycle 02 还没有接入全量触发方式，
// 先保留一份演示数据用于浏览器调试和弹窗布局联调。
const demoWord: TranslationResult = {
  source_text: 'ephemeral',
  translated_text: 'adj. 短暂的；转瞬即逝的',
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
  input: string
  result: TranslationResult | null
  loading: boolean
  error: string | null
  mode: TranslationMode
  setInput: (input: string) => void
  setMode: (mode: TranslationMode) => void
  applyResult: (result: TranslationResult) => void
  translate: (text?: string) => Promise<TranslationResult | null>
  seedDemo: () => void
  clear: () => void
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  input: 'ephemeral',
  result: null,
  loading: false,
  error: null,
  mode: 'word',
  setInput: (input) => set({ input }),
  setMode: (mode) => set({ mode }),
  applyResult: (result) => set({ result, loading: false, error: null }),
  translate: async (text) => {
    const query = (text ?? get().input).trim()
    if (!query) {
      set({ error: '请输入要翻译的英文单词', result: null })
      return null
    }

    set({ loading: true, error: null })

    try {
      const result = await translateText(query, get().mode)
      set({ result, loading: false, error: null, input: query })
      return result
    } catch (error) {
      set({
        loading: false,
        result: null,
        error: error instanceof Error ? error.message : '翻译失败，请稍后重试',
      })
      return null
    }
  },
  seedDemo: () => set({ result: demoWord, loading: false, error: null }),
  clear: () => set({ result: null, loading: false, error: null }),
}))
