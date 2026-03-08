import { Waveform } from '@phosphor-icons/react'
import type { TranslationResult } from '../../lib/tauri'
import { StatusPill } from '../ui/StatusPill'

interface WordResultProps {
  data: TranslationResult
}

export function WordResult({ data }: WordResultProps) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusPill icon={<Waveform size={14} weight="duotone" />} label={data.provider.toUpperCase()} tone="accent" />
              <StatusPill label="单词模式" />
            </div>
            <h2 className="mt-4 text-[2rem] font-semibold tracking-tight text-white">{data.source_text}</h2>
          </div>
        </div>
        <div className="mt-5 grid gap-3 text-sm text-slate-200">
          <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">美式音标</p>
            <p className="mt-3 text-lg text-white">{data.word_detail?.phonetic_us ?? '—'}</p>
          </div>
          <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">中文谐音</p>
            <p className="mt-3 text-base leading-7 text-white">{data.word_detail?.chinese_phonetic ?? '—'}</p>
          </div>
        </div>
      </div>
      <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] p-4 text-sm leading-7 text-slate-200">
        <p>{data.translated_text}</p>
        {data.word_detail?.definitions?.length ? (
          <div className="mt-4 divide-y divide-white/8 rounded-[1rem] border border-white/8 bg-black/20">
            {data.word_detail.definitions.map((item) => (
              <div key={item} className="px-4 py-3 text-slate-300">{item}</div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
