import { create } from 'zustand'
import {
  resolveTranslationMode,
  translateText,
  type ResolvedTranslationMode,
  type TranslationMode,
  type TranslationResult,
} from '../lib/tauri'

// Cycle 03 开始前端已经需要同时承接单词和句子两条链路，
// 所以 store 不再只保存“结果”，还要保存“请求模式 / 实际模式 / 状态提示”。
interface TranslationState {
  input: string
  result: TranslationResult | null
  loading: boolean
  error: string | null
  mode: TranslationMode
  resolvedMode: ResolvedTranslationMode | null
  providerHint: string | null
  statusNote: string | null
  setInput: (input: string) => void
  setMode: (mode: TranslationMode) => void
  applyResult: (result: TranslationResult, requestedMode?: TranslationMode) => void
  translate: (text?: string, requestedMode?: TranslationMode) => Promise<TranslationResult | null>
  translateCurrentMode: (mode: TranslationMode) => Promise<TranslationResult | null>
  seedDemo: () => void
  clear: () => void
}

function buildEmptyInputMessage(mode: TranslationMode) {
  return mode === 'word' ? '请输入要翻译的英文单词' : '请输入要翻译的文本'
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  input: 'This feature keeps your focus inside the editor.',
  result: null,
  loading: false,
  error: null,
  mode: 'auto',
  resolvedMode: null,
  providerHint: null,
  statusNote: '自动模式会根据输入内容在单词与句子之间切换。',
  setInput: (input) => set({ input }),
  setMode: (mode) => {
    const input = get().input
    set({
      mode,
      resolvedMode: resolveTranslationMode(mode, input),
      statusNote: mode === 'auto' ? '自动模式会根据空格数量判断是单词还是句子。' : null,
    })
  },
  applyResult: (result, requestedMode) => {
    const nextMode = requestedMode ?? get().mode
    set({
      result,
      input: result.source_text,
      loading: false,
      error: null,
      mode: nextMode,
      resolvedMode: result.mode,
      providerHint: result.provider_label ?? result.provider.toUpperCase(),
      statusNote: result.notice ?? (result.from_cache ? '结果来自缓存。' : null),
    })
  },
  translate: async (text, requestedMode) => {
    const nextMode = requestedMode ?? get().mode
    const query = (text ?? get().input).trim()

    if (!query) {
      set({ error: buildEmptyInputMessage(nextMode), result: null })
      return null
    }

    // 手动模式优先于自动模式，保证用户主动切换后得到可预期结果。
    set({
      loading: true,
      error: null,
      mode: nextMode,
      resolvedMode: resolveTranslationMode(nextMode, query),
      providerHint: null,
      statusNote: nextMode === 'sentence' ? '正在请求句子翻译…' : '正在请求单词翻译…',
    })

    try {
      const result = await translateText(query, nextMode)
      get().applyResult(result, nextMode)
      return result
    } catch (error) {
      set({
        loading: false,
        result: null,
        providerHint: null,
        statusNote: null,
        error: error instanceof Error ? error.message : '翻译失败，请稍后重试',
      })
      return null
    }
  },
  translateCurrentMode: async (mode) => get().translate(get().input, mode),
  seedDemo: () => {
    void get().translate(get().input, 'auto')
  },
  clear: () => set({ result: null, loading: false, error: null, providerHint: null, statusNote: null, resolvedMode: null }),
}))
