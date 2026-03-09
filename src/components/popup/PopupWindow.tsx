import { Sparkle, Translate } from '@phosphor-icons/react'
import { listen } from '@tauri-apps/api/event'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addFavorite,
  getResultProviderLabel,
  hidePopup,
  isTauriRuntime,
  type TranslationMode,
  type TranslationResult,
} from '../../lib/tauri'
import { speakText } from '../../lib/tts'
import { useTranslationStore } from '../../stores/translationStore'
import { ModeSwitch } from '../translation/ModeSwitch'
import { StatusPill } from '../ui/StatusPill'
import { ActionBar } from './ActionBar'
import { SentenceResult } from './SentenceResult'
import { WordResult } from './WordResult'

export function PopupWindow() {
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const error = useTranslationStore((state) => state.error)
  const mode = useTranslationStore((state) => state.mode)
  const resolvedMode = useTranslationStore((state) => state.resolvedMode)
  const statusNote = useTranslationStore((state) => state.statusNote)
  const applyResult = useTranslationStore((state) => state.applyResult)
  const seedDemo = useTranslationStore((state) => state.seedDemo)
  const clear = useTranslationStore((state) => state.clear)
  const setMode = useTranslationStore((state) => state.setMode)
  const translateCurrentMode = useTranslationStore((state) => state.translateCurrentMode)
  const [favoriteLabel, setFavoriteLabel] = useState('收藏')
  const [eventError, setEventError] = useState<string | null>(null)
  const [copyLabel, setCopyLabel] = useState('复制')
  const [actionHint, setActionHint] = useState<string | null>(null)
  const actionBarRef = useRef<HTMLDivElement | null>(null)

  const canFavorite = useMemo(() => result?.mode === 'word', [result])
  const displayError = error ?? eventError

  const getActionButtons = useCallback(() => {
    if (!actionBarRef.current) {
      return []
    }

    return Array.from(actionBarRef.current.querySelectorAll<HTMLButtonElement>('[data-popup-action]:not(:disabled)'))
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
      setActionHint('当前环境不支持复制')
      return
    }

    void navigator.clipboard
      .writeText(result.translated_text)
      .then(() => {
        setCopyLabel('已复制')
        setActionHint('译文已复制到剪贴板')
      })
      .catch((copyError) => {
        setActionHint(copyError instanceof Error ? copyError.message : '复制失败')
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
      .then(() => {
        setFavoriteLabel('已收藏')
        setActionHint('已加入收藏列表')
      })
      .catch((favoriteError) => {
        setActionHint(favoriteError instanceof Error ? favoriteError.message : '收藏失败')
      })
  }, [result])

  const handleSpeak = useCallback(() => {
    if (!result) {
      return
    }

    try {
      speakText(result.source_text)
      setActionHint('正在朗读原文')
    } catch (speakerError) {
      setActionHint(speakerError instanceof Error ? speakerError.message : '朗读失败')
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
      return
    }

    let unlistenResult: (() => void) | undefined
    let unlistenError: (() => void) | undefined

    void listen<TranslationResult>('translation-result', (event) => {
      setFavoriteLabel('收藏')
      setCopyLabel('复制')
      setEventError(null)
      setActionHint(null)
      applyResult(event.payload)
    }).then((fn) => {
      unlistenResult = fn
    })

    void listen<{ message: string }>('translation-error', (event) => {
      if (event.payload.message) {
        clear()
        setActionHint(null)
        setEventError(event.payload.message)
      }
    }).then((fn) => {
      unlistenError = fn
    })

    return () => {
      unlistenResult?.()
      unlistenError?.()
    }
  }, [applyResult, clear, seedDemo])

  useEffect(() => {
    if (loading || displayError || !result) {
      return
    }

    const timer = window.setTimeout(() => {
      focusActionAt(0)
    }, 0)

    return () => window.clearTimeout(timer)
  }, [canFavorite, displayError, focusActionAt, loading, result])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const normalizedKey = event.key.toLowerCase()

      if (event.key === 'Escape') {
        event.preventDefault()
        void hidePopup()
        return
      }

      if ((event.ctrlKey || event.metaKey) && normalizedKey === 'c') {
        if (result) {
          event.preventDefault()
          handleCopy()
        }
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
  }, [canFavorite, focusNextAction, getActionButtons, handleCopy, handleFavorite, handleModeChange, handleSpeak, result])

  return (
    <div
      className="min-h-[100dvh] bg-transparent p-4 text-slate-50"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          void hidePopup()
        }
      }}
    >
      <div className="relative mx-auto max-w-[400px] overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.82))] p-5 shadow-[0_32px_90px_-40px_rgba(2,6,23,0.96)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-px rounded-[1.9rem] border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />

        <div className="relative mb-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300/88">Popup</p>
            <h1 className="mt-3 text-xl font-semibold tracking-tight text-white">
              {result?.mode === 'sentence' ? '句子翻译结果' : '单词翻译结果'}
            </h1>
          </div>
          <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-emerald-200">
            <Sparkle size={18} weight="duotone" />
          </div>
        </div>

        <div className="relative mb-4 flex flex-wrap items-center justify-between gap-3">
          <ModeSwitch value={mode} onChange={handleModeChange} />
          {resolvedMode ? <StatusPill icon={<Translate size={14} weight="duotone" />} label={`当前 ${resolvedMode}`} tone="accent" /> : null}
        </div>

        {loading ? (
          <div className="relative space-y-3 py-2">
            <div className="h-24 animate-pulse rounded-[1.4rem] bg-white/[0.05]" />
            <div className="h-20 animate-pulse rounded-[1.4rem] bg-white/[0.04]" />
          </div>
        ) : null}

        {!loading && displayError ? (
          <div className="relative rounded-[1.5rem] border border-rose-400/20 bg-rose-400/10 p-4 text-sm leading-7 text-rose-200">{displayError}</div>
        ) : null}

        {!loading && !displayError && result ? (
          <div className="relative">{result.mode === 'word' ? <WordResult data={result} /> : <SentenceResult data={result} />}</div>
        ) : null}

        {!loading && !displayError && !result ? (
          <div className="relative rounded-[1.5rem] border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-400">等待翻译结果...</div>
        ) : null}

        {result && (statusNote || actionHint) ? (
          <div className="relative mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-slate-400">
            {getResultProviderLabel(result)} · {actionHint ?? statusNote}
          </div>
        ) : null}

        <div className="relative mt-5 border-t border-white/10 pt-4">
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
      </div>
    </div>
  )
}
