import { Copy, HeartStraight, SpeakerHigh, Sparkle, Translate, Waveform } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { useTauriTranslationEvents } from '../../hooks/useTauriTranslationEvents'
import { addFavorite, getResultProviderLabel, pushPopupResult } from '../../lib/tauri'
import { speakText } from '../../lib/tts'
import { useTranslationStore } from '../../stores/translationStore'
import { ModeSwitch } from '../translation/ModeSwitch'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'
import { SentenceResult } from '../popup/SentenceResult'
import { WordResult } from '../popup/WordResult'

const sentenceExamples = [
  'This feature keeps your focus inside the editor.',
  'The cache should prevent duplicate requests.',
  'We need a smoother input translation workflow.',
  'getUserDisplayName',
]

export function TranslationWorkbench() {
  useTauriTranslationEvents()

  const input = useTranslationStore((state) => state.input)
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const streaming = useTranslationStore((state) => state.streaming)
  const streamText = useTranslationStore((state) => state.streamText)
  const error = useTranslationStore((state) => state.error)
  const mode = useTranslationStore((state) => state.mode)
  const resolvedMode = useTranslationStore((state) => state.resolvedMode)
  const providerHint = useTranslationStore((state) => state.providerHint)
  const statusNote = useTranslationStore((state) => state.statusNote)
  const setInput = useTranslationStore((state) => state.setInput)
  const setMode = useTranslationStore((state) => state.setMode)
  const translate = useTranslationStore((state) => state.translate)
  const actionScope = `${result?.source_text ?? ''}:${streamText}`
  const [copyLabelState, setCopyLabelState] = useState<{ scope: string; value: string | null }>({
    scope: '',
    value: null,
  })
  const [favoriteLabelState, setFavoriteLabelState] = useState<{ scope: string; value: string | null }>({
    scope: '',
    value: null,
  })
  const copyLabel = copyLabelState.scope === actionScope && copyLabelState.value ? copyLabelState.value : '复制结果'
  const favoriteLabel =
    favoriteLabelState.scope === actionScope && favoriteLabelState.value
      ? favoriteLabelState.value
      : '收藏单词'

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
    <SectionCard
      title="输入翻译工作台"
      description="这里直接验证单词、句子、流式输出、多引擎对照和 popup 联动。"
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.05fr)_minmax(340px,0.95fr)]">
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ModeSwitch value={mode} onChange={setMode} />
            <div className="flex flex-wrap gap-2">
              <StatusPill icon={<Translate size={14} weight="duotone" />} label={`请求模式 ${mode}`} tone="accent" />
              {resolvedMode ? <StatusPill icon={<Waveform size={14} weight="duotone" />} label={`实际模式 ${resolvedMode}`} /> : null}
              {streaming ? <StatusPill icon={<Sparkle size={14} weight="duotone" />} label="Streaming" tone="accent" /> : null}
            </div>
          </div>

          <Field
            label="输入英文文本"
            description="自动模式会在单词、句子和开发者命名拆词之间自动切换。"
            errorText={error ?? undefined}
          >
            <textarea
              className={`${fieldControlClassName} min-h-36 resize-none`}
              placeholder="输入英文单词、句子或变量名，例如 getUserDisplayName"
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
              {loading ? '翻译中...' : '开始翻译'}
            </Button>
            <Button
              icon={<Copy size={16} weight="duotone" />}
              variant="secondary"
              disabled={!result}
              className="min-w-[100px]"
              onClick={() =>
                result
                  ? void navigator.clipboard
                      .writeText(result.translated_text)
                      .then(() => setCopyLabelState({ scope: actionScope, value: '已复制' }))
                  : undefined
              }
            >
              {copyLabel}
            </Button>
            <Button
              icon={<Sparkle size={16} weight="duotone" />}
              variant="secondary"
              disabled={!result}
              onClick={() => (result ? void pushPopupResult(result) : undefined)}
            >
              发送到弹窗
            </Button>
            <Button
              icon={<SpeakerHigh size={16} weight="duotone" />}
              variant="ghost"
              disabled={!result}
              onClick={() => (result ? speakText(result.source_text) : undefined)}
            >
              朗读原文
            </Button>
            {favoritePayload ? (
              <Button
                icon={<HeartStraight size={16} weight="duotone" />}
                variant="ghost"
                className="min-w-[100px]"
                onClick={() =>
                  void addFavorite(favoritePayload).then((notice) => {
                    setFavoriteLabelState({ scope: actionScope, value: '已收藏' })
                    if (notice) {
                      window.alert(notice)
                    }
                  })
                }
              >
                {favoriteLabel}
              </Button>
            ) : null}
          </div>

          {statusNote || providerHint ? (
            <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-3 text-sm leading-7 text-slate-300">
              {providerHint ? <span className="mr-2 text-slate-100">{providerHint}</span> : null}
              {statusNote}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
          {!result && !loading && !streamText ? (
            <EmptyState
              description="先输入一个单词或句子，再观察离线词典、在线 fallback 和 SSE 流式输出。"
              icon={<Sparkle size={22} weight="duotone" />}
              title="等待一次真实翻译"
            />
          ) : null}

          {streamText && !result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {providerHint ? <StatusPill icon={<Translate size={14} weight="duotone" />} label={providerHint} tone="accent" /> : null}
                <StatusPill icon={<Sparkle size={14} weight="duotone" />} label={streaming ? 'Streaming' : 'Stream Ready'} />
              </div>
              <div className="rounded-[1.4rem] border border-white/10 bg-slate-950/60 p-4 text-sm leading-8 text-slate-100">
                <p className="whitespace-pre-wrap break-words">{streamText}</p>
              </div>
            </div>
          ) : null}

          {result ? (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <StatusPill icon={<Translate size={14} weight="duotone" />} label={getResultProviderLabel(result)} tone="accent" />
                {result.alternatives?.length ? <StatusPill icon={<Sparkle size={14} weight="duotone" />} label={`多引擎 ${result.alternatives.length + 1}`} /> : null}
              </div>
              {result.mode === 'word' ? <WordResult data={result} /> : <SentenceResult data={result} />}
            </div>
          ) : null}
        </div>
      </div>
    </SectionCard>
  )
}
