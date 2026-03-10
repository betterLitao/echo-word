import { Sparkle } from '@phosphor-icons/react'
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

  const actionScope = `${result?.source_text ?? ''}:${streamText}`
  const [favoriteLabelState, setFavoriteLabelState] = useState<{ scope: string; value: string | null }>({
    scope: '',
    value: null,
  })
  const [copyLabelState, setCopyLabelState] = useState<{ scope: string; value: string | null }>({
    scope: '',
    value: null,
  })
  const [isHovering, setIsHovering] = useState(false)
  const [opacity, setOpacity] = useState(1)
  const hideTimerRef = useRef<NodeJS.Timeout | null>(null)
  const actionBarRef = useRef<HTMLDivElement | null>(null)

  // 弹窗淡出逻辑
  useEffect(() => {
    if (!isHovering && result) {
      // 鼠标移出后延迟 2 秒开始淡出
      hideTimerRef.current = setTimeout(() => {
        setOpacity(0)
        // 淡出动画完成后隐藏弹窗
        setTimeout(() => {
          void hidePopup()
        }, 300)
      }, 2000)
    } else {
      // 鼠标移回或无结果时，取消淡出并恢复显示
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
        hideTimerRef.current = null
      }
      setOpacity(1)
    }

    return () => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current)
      }
    }
  }, [isHovering, result])

  const canFavorite = useMemo(() => result?.mode === 'word', [result])
  const favoriteLabel = favoriteLabelState.scope === actionScope && favoriteLabelState.value ? favoriteLabelState.value : '收藏'
  const copyLabel = copyLabelState.scope === actionScope && copyLabelState.value ? copyLabelState.value : '复制'

  const setFavoriteLabel = useCallback(
    (value: string | null) => setFavoriteLabelState({ scope: actionScope, value }),
    [actionScope],
  )
  const setCopyLabel = useCallback(
    (value: string | null) => setCopyLabelState({ scope: actionScope, value }),
    [actionScope],
  )
  const isEditableTarget = useCallback((target: EventTarget | null) => {
    if (!(target instanceof HTMLElement)) {
      return false
    }

    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  }, [])
  const hasUserSelection = useCallback(() => {
    const selection = window.getSelection()
    return Boolean(selection?.toString().trim())
  }, [])

  const getActionButtons = useCallback(() => {
    if (!actionBarRef.current) {
      return []
    }

    return Array.from(
      actionBarRef.current.querySelectorAll<HTMLButtonElement>('[data-popup-action]:not(:disabled)'),
    )
  }, [])

  const focusActionAt = useCallback(
    (index: number) => {
      const buttons = getActionButtons()
      if (buttons.length === 0) {
        return
      }

      const normalizedIndex = ((index % buttons.length) + buttons.length) % buttons.length
      buttons[normalizedIndex]?.focus()
    },
    [getActionButtons],
  )

  const focusNextAction = useCallback(
    (direction: 1 | -1) => {
      const buttons = getActionButtons()
      if (buttons.length === 0) {
        return
      }

      const currentIndex = buttons.findIndex((button) => button === document.activeElement)
      const nextIndex = currentIndex === -1 ? (direction === 1 ? 0 : buttons.length - 1) : currentIndex + direction
      focusActionAt(nextIndex)
    },
    [focusActionAt, getActionButtons],
  )

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
        setCopyLabel('已复制')
      })
      .catch(() => {
        // Copy failed
      })
  }, [result, setCopyLabel])

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
    if (loading || error || !result) {
      return
    }

    const timer = window.setTimeout(() => {
      focusActionAt(0)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [error, focusActionAt, loading, result])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase()

      if (event.key === 'Escape') {
        event.preventDefault()
        void hidePopup()
        return
      }

      if ((event.ctrlKey || event.metaKey) && normalizedKey === 'c') {
        if (hasUserSelection()) {
          return
        }

        if (result) {
          event.preventDefault()
          handleCopy()
        }
        return
      }

      if (isEditableTarget(event.target)) {
        return
      }

      if (event.key === 'Tab') {
        const buttons = getActionButtons()
        if (buttons.length > 0) {
          event.preventDefault()
          focusNextAction(event.shiftKey ? -1 : 1)
        }
        return
      }

      if (event.key === 'Enter') {
        const buttons = getActionButtons()
        const activeButton = buttons.find((button) => button === document.activeElement)
        if (activeButton) {
          event.preventDefault()
          activeButton.click()
          return
        }
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
        return
      }

      if (normalizedKey === 'f' && canFavorite) {
        event.preventDefault()
        handleFavorite()
        return
      }

      if (normalizedKey === 'r') {
        event.preventDefault()
        handleSpeak()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [canFavorite, focusNextAction, getActionButtons, handleCopy, handleFavorite, handleModeChange, handleSpeak, hasUserSelection, isEditableTarget, result])

  return (
    <div
      className="min-h-[100dvh] bg-transparent p-4 text-slate-50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          void hidePopup()
        }
      }}
    >
      <div
        className="relative mx-auto max-w-[360px] overflow-hidden rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.95),rgba(2,6,23,0.9))] p-4 shadow-[0_24px_60px_-20px_rgba(2,6,23,0.96)] backdrop-blur-2xl transition-opacity duration-300"
        style={{ opacity }}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div className="pointer-events-none absolute inset-px rounded-[calc(1rem-1px)] border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />

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
          <div className="relative mt-3 flex items-center gap-2 border-t border-white/10 pt-3">
            <ActionBar
              containerRef={actionBarRef}
              copyDisabled={!result}
              copyLabel={copyLabel}
              favoriteLabel={favoriteLabel}
              showFavorite={canFavorite}
              onCopy={handleCopy}
              onFavorite={handleFavorite}
              onSpeak={handleSpeak}
              onClose={() => void hidePopup()}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}
