import { useMemo } from 'react'
import { addFavorite, pushPopupResult } from '../../lib/tauri'
import { useTranslationStore } from '../../stores/translationStore'
import { SectionCard } from '../ui/SectionCard'

export function TranslationWorkbench() {
  const input = useTranslationStore((state) => state.input)
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const error = useTranslationStore((state) => state.error)
  const setInput = useTranslationStore((state) => state.setInput)
  const translate = useTranslationStore((state) => state.translate)

  const favoritePayload = useMemo(() => {
    if (!result || result.mode !== 'word') {
      return null
    }

    return {
      word: result.source_text,
      phonetic: result.word_detail?.phonetic_us ?? result.word_detail?.phonetic_uk ?? null,
      chinese_phonetic: result.word_detail?.chinese_phonetic ?? null,
      translation: result.translated_text,
      source_text: result.source_text,
    }
  }, [result])

  return (
    <SectionCard title="单词翻译调试台" description="在全局快捷键和输入翻译完成前，先通过这个开发入口验证离线词典、音标谐音和收藏落库链路。">
      <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row">
          <input className="flex-1 rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100" placeholder="输入英文单词，例如 ephemeral" value={input} onChange={(event) => setInput(event.target.value)} />
          <button className="rounded-2xl bg-emerald-400 px-5 py-3 text-sm font-medium text-slate-950" disabled={loading} onClick={() => void translate()}>
            {loading ? '翻译中…' : '开始翻译'}
          </button>
        </div>

        {error ? <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">{error}</div> : null}

        {result ? (
          <div className="space-y-4 rounded-3xl border border-white/10 bg-black/20 p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">{result.provider}</p>
                <h3 className="mt-2 text-2xl font-semibold text-white">{result.source_text}</h3>
                <p className="mt-3 text-sm text-slate-200">{result.translated_text}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10" onClick={() => void pushPopupResult(result)}>
                  发送到弹窗
                </button>
                <button className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/10 disabled:opacity-50" disabled={!favoritePayload} onClick={() => favoritePayload ? void addFavorite(favoritePayload) : undefined}>
                  一键收藏
                </button>
              </div>
            </div>
            {result.word_detail ? (
              <div className="grid gap-3 text-sm text-slate-300 md:grid-cols-2">
                <div className="rounded-2xl border border-white/10 p-4">音标：{result.word_detail.phonetic_us ?? '—'}</div>
                <div className="rounded-2xl border border-white/10 p-4">谐音：{result.word_detail.chinese_phonetic}</div>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </SectionCard>
  )
}
