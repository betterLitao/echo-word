import { Translate } from '@phosphor-icons/react'
import type { TranslationResult } from '../../lib/tauri'
import { StatusPill } from '../ui/StatusPill'

interface SentenceResultProps {
  data: TranslationResult
}

export function SentenceResult({ data }: SentenceResultProps) {
  return (
    <div className="space-y-4">
      <div>
        <StatusPill icon={<Translate size={14} weight="duotone" />} label={data.provider} tone="accent" />
        <p className="mt-4 rounded-[1.35rem] border border-white/10 bg-black/20 p-4 text-sm leading-7 text-slate-300">{data.source_text}</p>
      </div>
      <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-100">
        {data.translated_text}
      </div>
    </div>
  )
}
