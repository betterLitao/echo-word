import type { TranslationResult } from '../../lib/tauri'

interface WordResultProps {
  data: TranslationResult
}

export function WordResult({ data }: WordResultProps) {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">{data.source_text}</h2>
            <p className="mt-1 text-sm text-emerald-300">{data.provider.toUpperCase()} · 单词模式</p>
          </div>
        </div>
        <div className="mt-4 space-y-2 text-sm text-slate-200">
          <p>美式：{data.word_detail?.phonetic_us ?? '—'}</p>
          <p>英式：{data.word_detail?.phonetic_uk ?? '—'}</p>
          <p>谐音：{data.word_detail?.chinese_phonetic ?? '—'}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-200">
        <p>{data.translated_text}</p>
        {data.word_detail?.definitions?.length ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-slate-300">
            {data.word_detail.definitions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>
    </div>
  )
}
