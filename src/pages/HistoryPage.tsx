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
import { getHistory, getResultProviderLabel, type HistoryDateRange, type HistoryItem, type TranslationMode } from '../lib/tauri'
import { useTranslationStore } from '../stores/translationStore'

const PAGE_SIZE = 20

const DATE_RANGE_OPTIONS: Array<{ label: string; value: HistoryDateRange }> = [
  { label: '今天', value: 'today' },
  { label: '最近 7 天', value: '7d' },
  { label: '最近 30 天', value: '30d' },
  { label: '全部', value: 'all' },
]

export function HistoryPage() {
  const navigate = useNavigate()
  const primeInput = useTranslationStore((state) => state.primeInput)
  const translate = useTranslationStore((state) => state.translate)
  const [query, setQuery] = useState('')
  const [dateRange, setDateRange] = useState<HistoryDateRange>('all')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<HistoryItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const history = await getHistory(query.trim(), dateRange, page, PAGE_SIZE)
      if (cancelled) {
        return
      }

      setItems(history)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [dateRange, page, query])

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
        description="历史记录现在不仅能回看，还能按关键词和时间窗口快速收窄范围。"
        eyebrow="History"
        title="把已经翻过的内容拉回工作台，而不是让它死在数据库里。"
        meta={<StatusPill icon={<ClockCounterClockwise size={14} weight="duotone" />} label={`${items.length} 条结果`} tone="accent" />}
      />

      <SectionCard title="翻译历史" description="支持按原文、译文和时间范围筛选；回放会重新触发当前版本的翻译链路。">
        <div className="space-y-5">
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,26rem)]">
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

            <Field label="时间范围" description="按最近时段快速收窄历史记录。">
              <div className="flex flex-wrap gap-2 rounded-[1.35rem] border border-white/10 bg-black/20 p-2">
                {DATE_RANGE_OPTIONS.map((option) => {
                  const active = option.value === dateRange

                  return (
                    <button
                      key={option.value}
                      className={
                        active
                          ? 'transform-gpu rounded-full border border-emerald-300/25 bg-emerald-300/12 px-4 py-2 text-xs font-medium text-emerald-100 shadow-[0_16px_32px_-22px_rgba(110,231,183,0.65)] transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]'
                          : 'transform-gpu rounded-full border border-white/8 bg-white/[0.03] px-4 py-2 text-xs font-medium text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/16 hover:bg-white/[0.08] hover:text-white'
                      }
                      type="button"
                      onClick={() => {
                        setDateRange(option.value)
                        setPage(1)
                      }}
                    >
                      {option.label}
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>

          {loading ? (
            <div className="grid gap-3">
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.04]" />
              <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.04]" />
            </div>
          ) : null}

          {!loading && items.length === 0 ? (
            <EmptyState
              action={
                <Button icon={<Sparkle size={16} weight="duotone" />} variant="secondary" onClick={() => navigate('/settings')}>
                  前往设置页开始翻译
                </Button>
              }
              description="当前筛选条件下没有历史记录。先触发一次真实翻译，再回来回放。"
              icon={<ClockCounterClockwise size={22} weight="duotone" />}
              title="没有命中历史记录"
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
                    <Button icon={<ArrowClockwise size={16} weight="duotone" />} size="sm" variant="secondary" onClick={() => handleReplay(item)}>
                      回放
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-3">
              <p className="text-sm text-slate-400">
                第 {page} 页 · 每页 {PAGE_SIZE} 条
              </p>
              <div className="flex gap-2">
                <Button icon={<CaretLeft size={14} weight="bold" />} size="sm" variant="ghost" disabled={page === 1} onClick={() => setPage((current) => Math.max(1, current - 1))}>
                  上一页
                </Button>
                <Button icon={<CaretRight size={14} weight="bold" />} size="sm" variant="ghost" disabled={!hasNextPage} onClick={() => setPage((current) => current + 1)}>
                  下一页
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
