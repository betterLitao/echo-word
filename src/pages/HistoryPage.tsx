import {
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  ClockCounterClockwise,
  MagnifyingGlass,
  Sparkle,
  Translate,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, fieldControlClassName } from '../components/ui/Field'
import { PageHero } from '../components/ui/PageHero'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusPill } from '../components/ui/StatusPill'
import { getHistory, getResultProviderLabel, type TranslationMode, type HistoryItem } from '../lib/tauri'
import { useTranslationStore } from '../stores/translationStore'

const PAGE_SIZE = 20

export function HistoryPage() {
  const navigate = useNavigate()
  const primeInput = useTranslationStore((state) => state.primeInput)
  const translate = useTranslationStore((state) => state.translate)
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      const history = await getHistory(query, page, PAGE_SIZE)
      setItems(history)
      setLoading(false)
    }

    void load()
  }, [page, query])

  const handleReplay = (item: HistoryItem) => {
    const requestedMode = (item.mode === 'word' || item.mode === 'sentence' ? item.mode : 'auto') as TranslationMode
    primeInput(item.source_text, requestedMode)
    navigate('/settings')
    void translate(item.source_text, requestedMode)
  }

  const hasNextPage = items.length === PAGE_SIZE

  return (
    <div className="space-y-6">
      <PageHero
        description="历史记录现在会沉淀所有真实翻译结果，并支持搜索与回放，不再停留在 Cycle 01 的占位态。"
        eyebrow="History"
        title="把已经看过的内容重新拉回工作台，而不是只把它们留在数据库里。"
        meta={<StatusPill icon={<ClockCounterClockwise size={14} weight="duotone" />} label={`${items.length} 条结果`} tone="accent" />}
      />

      <SectionCard title="翻译历史" description="可按原文或译文搜索；回放会重新触发当前版本的翻译链路，因此能同步看到缓存、降级和多引擎状态。">
        <div className="space-y-5">
          <Field label="检索历史" description="支持按原文或译文模糊搜索。">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input
                className={`${fieldControlClassName} pl-11`}
                placeholder="例如 focus / 缓存"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          </Field>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.04]" />
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.04]" />
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <EmptyState
              action={<Button icon={<Sparkle size={16} weight="duotone" />} variant="secondary" onClick={() => navigate('/settings')}>前往设置页开始翻译</Button>}
              description="当前还没有历史记录。你可以先在设置页触发一次真实翻译，历史会自动写入并支持后续回放。"
              icon={<ClockCounterClockwise size={22} weight="duotone" />}
              title="历史尚未开始积累"
            />
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="divide-y divide-white/8 rounded-[1.5rem] border border-white/10 bg-black/20">
              {items.map((item) => (
                <article key={item.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill icon={<Translate size={12} weight="duotone" />} label={item.mode === 'word' ? '单词模式' : '句子模式'} tone="accent" />
                      {item.provider ? <StatusPill label={getResultProviderLabel({ provider: item.provider, provider_label: null })} /> : null}
                    </div>
                    <p className="mt-4 text-sm leading-7 text-slate-400">{item.source_text}</p>
                    <p className="mt-4 text-sm leading-8 text-slate-100">{item.result_text}</p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2 md:flex-col md:items-end">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.created_at}</p>
                    <Button icon={<ArrowClockwise size={16} weight="duotone" />} size="sm" variant="secondary" onClick={() => handleReplay(item)}>回放</Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm text-slate-400">第 {page} 页 · 每页 {PAGE_SIZE} 条</p>
              <div className="flex gap-2">
                <Button icon={<CaretLeft size={14} weight="bold" />} size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>上一页</Button>
                <Button icon={<CaretRight size={14} weight="bold" />} size="sm" variant="ghost" disabled={!hasNextPage} onClick={() => setPage((current) => current + 1)}>下一页</Button>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
