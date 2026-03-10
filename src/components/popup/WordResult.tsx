import { Copy, Waveform } from '@phosphor-icons/react'
import { getResultProviderLabel, type TranslationResult } from '../../lib/tauri'
import { StatusPill } from '../ui/StatusPill'

interface WordResultProps {
  data: TranslationResult
}

export function WordResult({ data }: WordResultProps) {
  const mainDefinitions = data.word_detail?.definitions?.slice(0, 3) ?? []

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">{data.source_text}</h2>
        <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
          {data.word_detail?.phonetic_us ? (
            <span className="text-emerald-300">{data.word_detail.phonetic_us}</span>
          ) : null}
          {data.word_detail?.chinese_phonetic ? (
            <span>· {data.word_detail.chinese_phonetic}</span>
          ) : null}
        </div>
      </div>

      <div className="space-y-1.5 text-sm leading-6 text-slate-200">
        {mainDefinitions.length > 0 ? (
          mainDefinitions.map((item, index) => (
            <div key={index} className="flex gap-2">
              <span className="text-slate-500">{index + 1}.</span>
              <span>{item}</span>
            </div>
          ))
        ) : (
          <p>{data.translated_text}</p>
        )}
      </div>
    </div>
  )
}
