import type { TranslationResult } from '../../lib/tauri'

interface SentenceResultProps {
  data: TranslationResult
}

export function SentenceResult({ data }: SentenceResultProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-emerald-300">{data.provider}</p>
        <p className="mt-3 text-sm leading-7 text-slate-300">{data.source_text}</p>
      </div>
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-100">
        {data.translated_text}
      </div>
    </div>
  )
}
