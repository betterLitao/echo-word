import { type TranslationResult } from '../../lib/tauri'

interface SentenceResultProps {
  data: TranslationResult
}

export function SentenceResult({ data }: SentenceResultProps) {
  return (
    <div className="space-y-3">
      <div className="text-sm leading-7 text-slate-300">
        <p className="text-xs text-slate-500">原文</p>
        <p className="mt-1">{data.source_text}</p>
      </div>

      <div className="text-sm leading-7 text-white">
        <p className="text-xs text-slate-500">译文</p>
        <p className="mt-1">{data.translated_text}</p>
      </div>
    </div>
  )
}
