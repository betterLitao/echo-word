import { create } from 'zustand'
import {
  resolveTranslationMode,
  translateText,
  type ResolvedTranslationMode,
  type TranslationMode,
  type TranslationResult,
  type TranslationStreamEvent,
} from '../lib/tauri'

interface TranslationState {
  input: string
  result: TranslationResult | null
  loading: boolean
  streaming: boolean
  streamText: string
  error: string | null
  mode: TranslationMode
  resolvedMode: ResolvedTranslationMode | null
  providerHint: string | null
  statusNote: string | null
  focusNonce: number
  setInput: (input: string) => void
  setMode: (mode: TranslationMode) => void
  requestFocus: () => void
  primeInput: (input: string, mode?: TranslationMode) => void
  applyResult: (result: TranslationResult, requestedMode?: TranslationMode) => void
  applyStreamChunk: (event: TranslationStreamEvent) => void
  applyError: (message: string) => void
  translate: (text?: string, requestedMode?: TranslationMode) => Promise<TranslationResult | null>
  translateCurrentMode: (mode: TranslationMode) => Promise<TranslationResult | null>
  clear: () => void
}

function buildEmptyInputMessage(mode: TranslationMode) {
  return mode === 'word' ? '请输入要翻译的英文单词' : '请输入要翻译的文本'
}

function buildAutoModeNote(mode: TranslationMode) {
  return mode === 'auto' ? '自动模式会根据输入内容判断单词或句子。' : null
}

function providerHintFromEvent(event: TranslationStreamEvent) {
  if (!event.provider || event.provider === 'pending') {
    return null
  }

  return event.provider_label ?? event.provider.toUpperCase()
}

export const useTranslationStore = create<TranslationState>((set, get) => ({
  input: 'This feature keeps your focus inside the editor.',
  result: null,
  loading: false,
  streaming: false,
  streamText: '',
  error: null,
  mode: 'auto',
  resolvedMode: null,
  providerHint: null,
  statusNote: '自动模式会根据输入内容在单词与句子之间切换。',
  focusNonce: 0,
  setInput: (input) => set({ input }),
  setMode: (mode) => {
    const input = get().input
    set({
      mode,
      resolvedMode: resolveTranslationMode(mode, input),
      statusNote: buildAutoModeNote(mode),
    })
  },
  requestFocus: () => set((state) => ({ focusNonce: state.focusNonce + 1 })),
  primeInput: (input, requestedMode) => {
    const nextMode = requestedMode ?? get().mode
    set((state) => ({
      input,
      mode: nextMode,
      result: null,
      loading: false,
      streaming: false,
      streamText: '',
      error: null,
      providerHint: null,
      resolvedMode: resolveTranslationMode(nextMode, input),
      statusNote: buildAutoModeNote(nextMode),
      focusNonce: state.focusNonce + 1,
    }))
  },
  applyResult: (result, requestedMode) => {
    const nextMode = requestedMode ?? get().mode
    set({
      result,
      input: result.source_text,
      loading: false,
      streaming: false,
      streamText: '',
      error: null,
      mode: nextMode,
      resolvedMode: result.mode,
      providerHint: result.provider_label ?? result.provider.toUpperCase(),
      statusNote: result.notice ?? (result.from_cache ? '结果来自缓存。' : null),
    })
  },
  applyStreamChunk: (event) => {
    const streamText = event.stream_text ?? ''
    const hasContent = streamText.trim().length > 0
    const isPending = event.provider === 'pending'

    set((state) => ({
      input: event.source_text || state.input,
      result: null,
      loading: !event.done,
      streaming: !event.done && !isPending,
      streamText,
      error: null,
      mode: state.mode === 'word' ? 'sentence' : state.mode,
      resolvedMode: 'sentence',
      providerHint: providerHintFromEvent(event) ?? state.providerHint,
      statusNote: event.done
        ? state.statusNote
        : hasContent
          ? '正在接收流式翻译结果...'
          : '正在准备翻译请求...',
    }))
  },
  applyError: (message) => {
    set({
      loading: false,
      streaming: false,
      streamText: '',
      result: null,
      providerHint: null,
      statusNote: null,
      error: message,
    })
  },
  translate: async (text, requestedMode) => {
    const nextMode = requestedMode ?? get().mode
    const query = (text ?? get().input).trim()

    if (!query) {
      set({ error: buildEmptyInputMessage(nextMode), result: null })
      return null
    }

    set({
      input: query,
      result: null,
      loading: true,
      streaming: false,
      streamText: '',
      error: null,
      mode: nextMode,
      resolvedMode: resolveTranslationMode(nextMode, query),
      providerHint: null,
      statusNote: nextMode === 'sentence' ? '正在请求句子翻译...' : '正在请求单词翻译...',
    })

    try {
      const result = await translateText(query, nextMode)
      get().applyResult(result, nextMode)
      return result
    } catch (error) {
      get().applyError(error instanceof Error ? error.message : '翻译失败，请稍后重试')
      return null
    }
  },
  translateCurrentMode: async (mode) => get().translate(get().input, mode),
  clear: () =>
    set({
      result: null,
      loading: false,
      streaming: false,
      streamText: '',
      error: null,
      providerHint: null,
      statusNote: null,
      resolvedMode: null,
    }),
}))
