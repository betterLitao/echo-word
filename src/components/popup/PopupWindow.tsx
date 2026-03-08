import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import { addFavorite, hidePopup, isTauriRuntime, type TranslationResult } from '../../lib/tauri'
import { useTranslationStore } from '../../stores/translationStore'
import { ActionBar } from './ActionBar'
import { SentenceResult } from './SentenceResult'
import { WordResult } from './WordResult'

export function PopupWindow() {
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const error = useTranslationStore((state) => state.error)
  const applyResult = useTranslationStore((state) => state.applyResult)
  const seedDemo = useTranslationStore((state) => state.seedDemo)
  const [favoriteLabel, setFavoriteLabel] = useState('收藏')

  useEffect(() => {
    // 在浏览器里继续走演示数据；在 Tauri 中则监听主窗口广播过来的翻译结果。
    if (!isTauriRuntime()) {
      seedDemo()
      return
    }

    let unlisten: (() => void) | undefined
    void listen<TranslationResult>('translation-result', (event) => {
      setFavoriteLabel('收藏')
      applyResult(event.payload)
    }).then((fn) => {
      unlisten = fn
    })

    return () => unlisten?.()
  }, [applyResult, seedDemo])

  useEffect(() => {
    // 先把 Esc 关闭能力接上，后续真正接入 Tauri 弹窗时可直接复用。
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        void hidePopup()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="min-h-screen bg-transparent p-4 text-slate-50">
      <div className="mx-auto max-w-[380px] rounded-[1.75rem] border border-white/10 bg-slate-950/90 p-5 shadow-2xl shadow-black/40 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">Popup</p>
            <h1 className="mt-2 text-lg font-semibold">单词翻译结果</h1>
          </div>
        </div>

        {loading ? <div className="py-10 text-center text-sm text-slate-300">正在翻译…</div> : null}
        {!loading && error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div> : null}
        {!loading && !error && result ? (result.mode === 'word' ? <WordResult data={result} /> : <SentenceResult data={result} />) : null}
        {!loading && !error && !result ? <div className="py-10 text-center text-sm text-slate-400">等待翻译结果…</div> : null}

        <div className="mt-5 border-t border-white/10 pt-4">
          <ActionBar
            favoriteLabel={favoriteLabel}
            showFavorite={result?.mode === 'word'}
            onFavorite={() => {
              if (!result || result.mode !== 'word') {
                return
              }

              void addFavorite({
                word: result.source_text,
                phonetic: result.word_detail?.phonetic_us ?? result.word_detail?.phonetic_uk ?? null,
                chinese_phonetic: result.word_detail?.chinese_phonetic ?? null,
                translation: result.translated_text,
                source_text: result.source_text,
              }).then(() => setFavoriteLabel('已收藏'))
            }}
            onClose={() => void hidePopup()}
          />
        </div>
      </div>
    </div>
  )
}
