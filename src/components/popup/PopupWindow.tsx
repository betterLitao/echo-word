import { useEffect } from 'react'
import { hidePopup } from '../../lib/tauri'
import { useTranslationDemo } from '../../hooks/useTranslation'
import { useTranslationStore } from '../../stores/translationStore'
import { ActionBar } from './ActionBar'
import { SentenceResult } from './SentenceResult'
import { WordResult } from './WordResult'

export function PopupWindow() {
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const error = useTranslationStore((state) => state.error)
  useTranslationDemo()

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
            <h1 className="mt-2 text-lg font-semibold">Cycle 01 弹窗骨架</h1>
          </div>
        </div>

        {loading ? <div className="py-10 text-center text-sm text-slate-300">正在翻译…</div> : null}
        {!loading && error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div> : null}
        {!loading && !error && result ? (result.mode === 'word' ? <WordResult data={result} /> : <SentenceResult data={result} />) : null}
        {!loading && !error && !result ? <div className="py-10 text-center text-sm text-slate-400">等待翻译结果…</div> : null}

        <div className="mt-5 border-t border-white/10 pt-4">
          <ActionBar onClose={() => void hidePopup()} />
        </div>
      </div>
    </div>
  )
}
