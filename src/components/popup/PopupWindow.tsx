import { Copy, Sparkle, X } from '@phosphor-icons/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTauriTranslationEvents } from '../../hooks/useTauriTranslationEvents'
import {
  addFavorite,
  hidePopup,
  isTauriRuntime,
  type TranslationMode,
} from '../../lib/tauri'
import { speakText } from '../../lib/tts'
import { useTranslationStore } from '../../stores/translationStore'
import { StatusPill } from '../ui/StatusPill'
import { ActionBar } from './ActionBar'
import { SentenceResult } from './SentenceResult'
import { WordResult } from './WordResult'

export function PopupWindow() {
  useTauriTranslationEvents()

  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const streaming = useTranslationStore((state) => state.streaming)
  const streamText = useTranslationStore((state) => state.streamText)
  const error = useTranslationStore((state) => state.error)
  const seedDemo = useTranslationStore((state) => state.seedDemo)
  const setMode = useTranslationStore((state) => state.setMode)
  const translateCurrentMode = useTranslationStore((state) => state.translateCurrentMode)

  const [isHovering, setIsHovering] = useState(false)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const popupRef = useRef<HTMLDivElement | null>(null)
  const actionBarRef = useRef<HTMLDivElement | null>(null)

  const actionScope = `${result?.source_text ?? ''}:${streamText}`
  const [favoriteLabelState, setFavoriteLabelState] = useState<{ scope: string; value: string | null }>({
    scope: '',
    value: null,
  })

  const canFavorite = useMemo(() => result?.mode === 'word', [result])
  const favoriteLabel = favoriteLabelState.scope === actionScope && favoriteLabelState.value ? favoriteLabelState.value : '收藏'

  const setFavoriteLabel = useCallback(
    (value: string | null) => setFavoriteLabelState({ scope: actionScope, value }),
    [actionScope],
  )

  // 鼠标移出后 800ms 自动关闭
  useEffect(() => {
    if (!isHovering && result) {
      hideTimerRef.current = setTimeout(() => {
        void hidePopup()
      }, 800)
    } else {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [isHovering, result])

  // 点击弹窗外部立即关闭
  useEffect(() => {
    if (!result) {
      return
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!popupRef.current) {
        return
      }

      // 检查点击是否在弹窗内部
      if (popupRef.current.contains(event.target as Node)) {
        return
      }

      void hidePopup()
    }

    // 延迟添加监听器，避免立即触发
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true)
    }, 100)

    return () => {
      clearTimeout(timer)
      document.removeEventListener('click', handleClickOutside, true)
    }
  }, [result])

  const handleCopy = useCallback(() => {
    if (!result) {
      return
    }

    if (!navigator.clipboard?.writeText) {
      return
    }

    void navigator.clipboard
      .writeText(result.translated_text)
      .then(() => {
        // 复制成功，可以添加提示
      })
      .catch(() => {
        // Copy failed
      })
  }, [result])

  const handleFavorite = useCallback(() => {
    if (!result || result.mode !== 'word') {
      return
    }

    void addFavorite({
      word: result.source_text,
      phonetic: result.word_detail?.phonetic_us ?? result.word_detail?.phonetic_uk ?? null,
      chinese_phonetic: result.word_detail?.chinese_phonetic ?? null,
      translation: result.translated_text,
      source_text: result.source_text,
    })
      .then((notice) => {
        setFavoriteLabel('已收藏')
        if (notice) {
          window.alert(notice)
        }
      })
      .catch(() => {
        // Favorite failed
      })
  }, [result, setFavoriteLabel])

  const handleSpeak = useCallback(() => {
    if (!result) {
      return
    }

    try {
      speakText(result.source_text)
    } catch {
      // Speak failed
    }
  }, [result])

  const handleModeChange = useCallback(
    (nextMode: TranslationMode) => {
      setMode(nextMode)
      void translateCurrentMode(nextMode)
    },
    [setMode, translateCurrentMode],
  )

  useEffect(() => {
    if (!isTauriRuntime()) {
      seedDemo()
    }
  }, [seedDemo])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase()

      if (event.key === 'Escape') {
        event.preventDefault()
        void hidePopup()
        return
      }

      if ((event.ctrlKey || event.metaKey) && normalizedKey === 'c') {
        const selection = window.getSelection()
        if (selection?.toString().trim()) {
          return
        }

        if (result) {
          event.preventDefault()
          handleCopy()
        }
        return
      }

      if (!result) {
        return
      }

      if (event.key === '1') {
        event.preventDefault()
        handleModeChange('word')
        return
      }

      if (event.key === '2') {
        event.preventDefault()
        handleModeChange('sentence')
        return
      }

      if (normalizedKey === 'c') {
        event.preventDefault()
        handleCopy()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCopy, handleModeChange, result])

  return (
    <div
      className="min-h-[100dvh] bg-transparent p-4 text-slate-50"
    >
      <div
        ref={popupRef}
        className="relative mx-auto max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] p-4 shadow-[0_24px_60px_-20px_rgba(2,6,23,0.96)] backdrop-blur-2xl"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="pointer-events-none absolute inset-px rounded-[calc(1rem-1px)] border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />

        {/* 右上角复制和关闭按钮 */}
        <div
          className="absolute right-2 top-2 z-10 flex gap-1 transition-opacity duration-200"
          style={{ opacity: isHovering ? 1 : 0 }}
        >
          <button
            onClick={handleCopy}
            disabled={!result}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition-all hover:bg-white/20 hover:text-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            title="复制"
          >
            <Copy size={14} weight="bold" />
          </button>
          <button
            onClick={() => void hidePopup()}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/10 text-slate-300 transition-all hover:bg-white/20 hover:text-slate-100"
            title="关闭"
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {loading && !streamText ? (
          <div className="relative space-y-2 py-2">
            <div className="h-16 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="h-12 animate-pulse rounded-xl bg-white/[0.04]" />
          </div>
        ) : null}

        {streamText && !result ? (
          <div className="relative space-y-2 rounded-xl border border-white/10 bg-black/20 p-3">
            <StatusPill icon={<Sparkle size={14} weight="duotone" />} label={streaming ? 'Streaming' : 'Stream Ready'} tone="accent" />
            <div className="text-sm leading-6 text-slate-100">
              <p className="whitespace-pre-wrap break-words">{streamText}</p>
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="relative rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm leading-6 text-rose-200">{error}</div>
        ) : null}

        {!loading && !error && result ? (
          <div className="relative">{result.mode === 'word' ? <WordResult data={result} /> : <SentenceResult data={result} />}</div>
        ) : null}

        {!loading && !error && !result && !streamText ? (
          <div className="relative rounded-xl border border-dashed border-white/10 p-4 text-sm leading-6 text-slate-400">等待翻译结果...</div>
        ) : null}

        {result && canFavorite ? (
          <div className="relative mt-2 flex items-center gap-2 border-t border-white/10 pt-2">
            <ActionBar
              containerRef={actionBarRef}
              favoriteLabel={favoriteLabel}
              showFavorite={canFavorite}
              onFavorite={handleFavorite}
              onSpeak={handleSpeak}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
