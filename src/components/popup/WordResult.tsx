import { useState } from 'react'
import { type TranslationResult } from '../../lib/tauri'

interface WordResultProps {
  data: TranslationResult
}

export function WordResult({ data }: WordResultProps) {
  const mainDefinitions = data.word_detail?.definitions?.slice(0, 3) ?? []
  const [showPinyin, setShowPinyin] = useState(false)

  const chinesePhonetic = data.word_detail?.chinese_phonetic
  const pinyinPhonetic = data.word_detail?.pinyin_phonetic

  // 优先显示中文谐音,如果用户切换到拼音模式且拼音存在则显示拼音
  const phoneticDisplay = showPinyin && pinyinPhonetic ? pinyinPhonetic : chinesePhonetic
  const canToggle = !!(chinesePhonetic && pinyinPhonetic)

  return (
    <div className="space-y-3">
      <div>
        <h2 className="text-2xl font-semibold tracking-tight text-white">{data.source_text}</h2>
        <div className="mt-2 flex items-center gap-3 text-sm text-slate-400">
          {data.word_detail?.phonetic_us ? (
            <span className="text-emerald-300">{data.word_detail.phonetic_us}</span>
          ) : null}
          {chinesePhonetic ? (
            <>
              <span>·</span>
              {canToggle ? (
                <button
                  onClick={() => setShowPinyin(!showPinyin)}
                  className="cursor-pointer text-slate-300 underline decoration-dotted transition-colors hover:text-emerald-300"
                  title={showPinyin ? '切换到中文谐音' : '切换到拼音'}
                >
                  {phoneticDisplay}
                </button>
              ) : (
                <span className="text-slate-300">{phoneticDisplay}</span>
              )}
            </>
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
