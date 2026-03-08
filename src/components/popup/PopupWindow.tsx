import { Sparkle, Translate } from '@phosphor-icons/react'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import {
  addFavorite,
  getResultProviderLabel,
  hidePopup,
  isTauriRuntime,
  type TranslationMode,
  type TranslationResult,
} from '../../lib/tauri'
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
  const setMode = useTranslationStore((state) => state.setMode)
  const translateCurrentMode = useTranslationStore((state) => state.translateCurrentMode)
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

  const handleModeChange = (nextMode: TranslationMode) => {
    setMode(nextMode)

    // 弹窗切换模式时直接拿当前输入再次触发翻译，
    // 这样“手动切换单词/句子”在主窗口和弹窗里保持一致。
    void translateCurrentMode(nextMode)
  }

  return (
    <div className="min-h-[100dvh] bg-transparent p-4 text-slate-50">
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
        {!loading && error ? <div className="relative rounded-[1.5rem] border border-rose-400/20 bg-rose-400/10 p-4 text-sm leading-7 text-rose-200">{error}</div> : null}
        {!loading && !error && result ? <div className="relative">{result.mode === 'word' ? <WordResult data={result} /> : <SentenceResult data={result} />}</div> : null}
        {!loading && !error && !result ? <div className="relative rounded-[1.5rem] border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-400">等待翻译结果…</div> : null}

        {result && statusNote ? (
          <div className="relative mt-4 rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-slate-400">
            {getResultProviderLabel(result)} · {statusNote}
          </div>
        ) : null}

        <div className="relative mt-5 border-t border-white/10 pt-4">
          <ActionBar
            copyDisabled={!result}
            favoriteLabel={favoriteLabel}
            showFavorite={result?.mode === 'word'}
            onCopy={() => result ? void navigator.clipboard.writeText(result.translated_text) : undefined}
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
