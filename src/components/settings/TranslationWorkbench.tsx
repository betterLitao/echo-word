import {
  Copy,
  HeartStraight,
  Sparkle,
  Translate,
  Waveform,
} from '@phosphor-icons/react'
import { useMemo } from 'react'
import { addFavorite, getResultProviderLabel, pushPopupResult } from '../../lib/tauri'
import { useTranslationStore } from '../../stores/translationStore'
import { ModeSwitch } from '../translation/ModeSwitch'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

const sentenceExamples = [
  'This feature keeps your focus inside the editor.',
  'The cache should prevent duplicate requests.',
  'We need a smoother input translation workflow.',
]

export function TranslationWorkbench() {
  const input = useTranslationStore((state) => state.input)
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const error = useTranslationStore((state) => state.error)
  const mode = useTranslationStore((state) => state.mode)
  const resolvedMode = useTranslationStore((state) => state.resolvedMode)
  const providerHint = useTranslationStore((state) => state.providerHint)
  const statusNote = useTranslationStore((state) => state.statusNote)
  const setInput = useTranslationStore((state) => state.setInput)
  const setMode = useTranslationStore((state) => state.setMode)
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
    <SectionCard title="输入翻译工作台" description="Cycle 03 前端先补齐输入翻译工作流：允许同一个面板在单词、句子与自动模式之间切换，并展示 provider、缓存与模式解析提示。">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ModeSwitch value={mode} onChange={setMode} />
            <div className="flex flex-wrap gap-2">
              <StatusPill icon={<Translate size={14} weight="duotone" />} label={`请求模式 ${mode}`} tone="accent" />
              {resolvedMode ? <StatusPill icon={<Waveform size={14} weight="duotone" />} label={`实际模式 ${resolvedMode}`} /> : null}
            </div>
          </div>

          <Field
            label="输入英文文本"
            description="单个单词适合离线词典；包含空格的句子更适合在线翻译。自动模式会根据输入内容自动切换。"
            errorText={error ?? undefined}
          >
            <textarea
              className={`${fieldControlClassName} min-h-36 resize-none`}
              placeholder="输入英文单词或完整句子，例如 This feature keeps your focus inside the editor."
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </Field>

          <div className="flex flex-wrap gap-2">
            {sentenceExamples.map((example) => (
              <button
                key={example}
                className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/20 hover:bg-white/[0.06] hover:text-white"
                type="button"
                onClick={() => setInput(example)}
              >
                {example}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-3">
            <Button icon={<Translate size={16} weight="duotone" />} variant="primary" disabled={loading} onClick={() => void translate()}>
              {loading ? '翻译中…' : '开始翻译'}
            </Button>
            <Button icon={<Copy size={16} weight="duotone" />} variant="secondary" disabled={!result} onClick={() => result ? void navigator.clipboard.writeText(result.translated_text) : undefined}>
              复制结果
            </Button>
          </div>

          {statusNote || providerHint ? (
            <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
              {providerHint ? <span className="mr-2 text-slate-100">{providerHint}</span> : null}
              {statusNote}
            </div>
          ) : null}

          {!result && !loading ? (
            <EmptyState
              description="你可以输入单个单词测试离线词典，也可以直接输入完整句子验证句子翻译布局和状态流。"
              icon={<Sparkle size={22} weight="duotone" />}
              title="等待一次真实翻译"
            />
          ) : null}

          {result ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill icon={<Translate size={14} weight="duotone" />} label={getResultProviderLabel(result)} tone="accent" />
                    <StatusPill icon={<Sparkle size={14} weight="duotone" />} label={result.mode === 'word' ? '单词模式' : '句子模式'} />
                    {result.from_cache ? <StatusPill icon={<Copy size={14} weight="duotone" />} label="缓存命中" /> : null}
                  </div>
                  <h3 className="mt-4 text-3xl font-semibold tracking-tight text-white">{result.source_text}</h3>
                  <p className="mt-4 text-sm leading-8 text-slate-200">{result.translated_text}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button icon={<Translate size={16} weight="duotone" />} variant="secondary" onClick={() => void pushPopupResult(result)}>
                    发送到弹窗
                  </Button>
                  <Button icon={<HeartStraight size={16} weight="duotone" />} variant="secondary" disabled={!favoritePayload} onClick={() => favoritePayload ? void addFavorite(favoritePayload) : undefined}>
                    一键收藏
                  </Button>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.75rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.78),rgba(15,23,42,0.5))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">结果拆解</p>
          {result?.word_detail ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">音标</p>
                <p className="mt-3 text-lg font-medium text-white">{result.word_detail.phonetic_us ?? '—'}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">中文谐音</p>
                <p className="mt-3 text-lg font-medium text-white">{result.word_detail.chinese_phonetic}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">释义拆分</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {result.word_detail.definitions.map((item) => (
                    <span key={item} className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-xs text-slate-200">{item}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : result ? (
            <div className="mt-5 space-y-4">
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">译文来源</p>
                <p className="mt-3 text-base font-medium text-white">{getResultProviderLabel(result)}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">状态提示</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{result.notice ?? '当前结果没有额外提示。'}</p>
              </div>
              <div className="rounded-[1.35rem] border border-white/10 bg-black/20 p-4">
                <p className="text-xs uppercase tracking-[0.22em] text-slate-500">缓存状态</p>
                <p className="mt-3 text-sm leading-7 text-slate-300">{result.from_cache ? '当前结果命中了缓存。' : '当前结果来自实时翻译流程。'}</p>
              </div>
            </div>
          ) : (
            <div className="mt-5 rounded-[1.35rem] border border-dashed border-white/10 p-5 text-sm leading-7 text-slate-400">
              翻译完成后，这里会自动切换为单词明细或句子状态面板，帮助你判断模式解析、provider 选择和缓存提示是否符合预期。
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
