import { Copy, Translate } from '@phosphor-icons/react'
import { getResultProviderLabel, type TranslationResult } from '../../lib/tauri'
import { StatusPill } from '../ui/StatusPill'

interface SentenceResultProps {
  data: TranslationResult
}

export function SentenceResult({ data }: SentenceResultProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <StatusPill icon={<Translate size={14} weight="duotone" />} label={getResultProviderLabel(data)} tone="accent" />
        <StatusPill label="句子模式" />
        {data.from_cache ? <StatusPill icon={<Copy size={14} weight="duotone" />} label="缓存命中" /> : null}
      </div>

      <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">原文</p>
        <p className="mt-3 text-sm leading-8 text-slate-300">{data.source_text}</p>
      </div>

      <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4">
        <p className="text-xs uppercase tracking-[0.24em] text-slate-500">译文</p>
        <p className="mt-3 text-sm leading-8 text-slate-100">{data.translated_text}</p>
      </div>

      {data.notice ? (
        <div className="rounded-[1.2rem] border border-white/10 bg-black/20 px-4 py-3 text-xs leading-6 text-slate-400">
          {data.notice}
        </div>
      ) : null}
    </div>
  )
}
