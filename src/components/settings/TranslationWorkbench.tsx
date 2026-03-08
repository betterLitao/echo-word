import { Copy, HeartStraight, Sparkle, Translate } from '@phosphor-icons/react'
import { useMemo } from 'react'
import { addFavorite, pushPopupResult } from '../../lib/tauri'
import { useTranslationStore } from '../../stores/translationStore'
import { Button } from '../ui/Button'
import { EmptyState } from '../ui/EmptyState'
import { Field, fieldControlClassName } from '../ui/Field'
import { SectionCard } from '../ui/SectionCard'
import { StatusPill } from '../ui/StatusPill'

export function TranslationWorkbench() {
  const input = useTranslationStore((state) => state.input)
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const error = useTranslationStore((state) => state.error)
  const setInput = useTranslationStore((state) => state.setInput)
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
    <SectionCard title="单词翻译调试台" description="在全局快捷键和输入翻译完成前，先通过这个入口验证离线词典、音标谐音、弹窗同步和收藏落库链路。">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <div className="space-y-5">
          <Field label="输入英文单词" description="建议先用内置词典中的 ephemeral、think、cache、translate、window 验证当前效果。" errorText={error ?? undefined}>
            <input className={fieldControlClassName} placeholder="例如 ephemeral" value={input} onChange={(event) => setInput(event.target.value)} />
          </Field>

          <div className="flex flex-wrap gap-3">
            <Button icon={<Translate size={16} weight="duotone" />} variant="primary" disabled={loading} onClick={() => void translate()}>
              {loading ? '翻译中…' : '开始翻译'}
            </Button>
            <Button icon={<Copy size={16} weight="duotone" />} variant="secondary" disabled={!result} onClick={() => result ? void navigator.clipboard.writeText(result.translated_text) : undefined}>
              复制结果
            </Button>
          </div>

          {!result && !loading ? (
            <EmptyState
              description="先输入一个英文单词，然后在当前页面直接验证词典查询、谐音渲染与收藏链路。"
              icon={<Sparkle size={22} weight="duotone" />}
              title="等待一次真实翻译"
            />
          ) : null}

          {result ? (
            <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex flex-wrap gap-2">
                    <StatusPill icon={<Translate size={14} weight="duotone" />} label={result.provider} tone="accent" />
                    <StatusPill icon={<Sparkle size={14} weight="duotone" />} label={result.mode === 'word' ? '单词模式' : '句子模式'} />
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
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">当前结果拆解</p>
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
          ) : (
            <div className="mt-5 rounded-[1.35rem] border border-dashed border-white/10 p-5 text-sm leading-7 text-slate-400">
              翻译完成后，这里会把音标、谐音和释义拆分单独展示出来，方便你判断是否符合预期。
            </div>
          )}
        </div>
      </div>
    </SectionCard>
  )
}
