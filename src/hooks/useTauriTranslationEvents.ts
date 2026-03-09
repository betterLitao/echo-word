import { listen } from '@tauri-apps/api/event'
import { useEffect } from 'react'
import { isTauriRuntime, type TranslationResult, type TranslationStreamEvent } from '../lib/tauri'
import { useTranslationStore } from '../stores/translationStore'

export function useTauriTranslationEvents() {
  const applyResult = useTranslationStore((state) => state.applyResult)
  const applyStreamChunk = useTranslationStore((state) => state.applyStreamChunk)
  const applyError = useTranslationStore((state) => state.applyError)

  useEffect(() => {
    if (!isTauriRuntime()) {
      return
    }

    let unlistenStream: (() => void) | undefined
    let unlistenResult: (() => void) | undefined
    let unlistenError: (() => void) | undefined

    void listen<TranslationStreamEvent>('translation-stream', (event) => {
      applyStreamChunk(event.payload)
    }).then((fn) => {
      unlistenStream = fn
    })

    void listen<TranslationResult>('translation-result', (event) => {
      applyResult(event.payload)
    }).then((fn) => {
      unlistenResult = fn
    })

    void listen<{ message: string }>('translation-error', (event) => {
      if (event.payload.message) {
        applyError(event.payload.message)
      }
    }).then((fn) => {
      unlistenError = fn
    })

    return () => {
      unlistenStream?.()
      unlistenResult?.()
      unlistenError?.()
    }
  }, [applyError, applyResult, applyStreamChunk])
}
