import {
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  HeartStraight,
  MagnifyingGlass,
  Sparkle,
  Trash,
} from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, fieldControlClassName } from '../components/ui/Field'
import { PageHero } from '../components/ui/PageHero'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusPill } from '../components/ui/StatusPill'
import {
  exportFavorites,
  getFavorites,
  removeFavorite,
  type FavoriteExportFormat,
  type FavoriteItem,
} from '../lib/tauri'
import { useTranslationStore } from '../stores/translationStore'

const PAGE_SIZE = 20

export function FavoritesPage() {
  const navigate = useNavigate()
  const primeInput = useTranslationStore((state) => state.primeInput)
  const translate = useTranslationStore((state) => state.translate)
  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [page, setPage] = useState(1)
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)
  const [exportFormat, setExportFormat] = useState<FavoriteExportFormat>('csv')
  const [exporting, setExporting] = useState(false)
  const [exportHint, setExportHint] = useState<string | null>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setDebouncedQuery(query.trim())
    }, 500)

    return () => window.clearTimeout(timer)
  }, [query])

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      setLoading(true)
      const favorites = await getFavorites(debouncedQuery, page, PAGE_SIZE)
      if (cancelled) {
        return
      }

      setItems(favorites)
      setLoading(false)
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [debouncedQuery, page])

  const handleReplay = (item: FavoriteItem) => {
    const source = item.source_text ?? item.word
    primeInput(source, 'word')
    navigate('/settings')
    void translate(source, 'word')
  }

  const handleRemove = async (word: string) => {
    setLoading(true)
    await removeFavorite(word)

    const favorites = await getFavorites(debouncedQuery, page, PAGE_SIZE)
    if (favorites.length === 0 && page > 1) {
      setPage((current) => current - 1)
      setLoading(false)
      return
    }

    setItems(favorites)
    setLoading(false)
  }

  const handleExport = async () => {
    setExporting(true)
    setExportHint(null)

    try {
      const path = await exportFavorites(exportFormat)
      setExportHint(path ? `已导出到 ${path}` : '已取消导出')
    } catch (error) {
      setExportHint(error instanceof Error ? error.message : '导出失败')
    } finally {
      setExporting(false)
    }
  }

  const hasNextPage = items.length === PAGE_SIZE

  return (
    <div className="space-y-6">
      <PageHero
        description="收藏不该只是静态结果堆栈。现在它支持搜索、回放、删除和多格式导出，才算像个能用的工作面板。"
        eyebrow="Favorites"
        title="把真正值得反复看的单词，留在一份可检索、可回放、可导出的清单里。"
        meta={<StatusPill icon={<HeartStraight size={14} weight="fill" />} label={`${items.length} 条结果`} tone="accent" />}
      />

      <SectionCard
        title="离线单词收藏"
        description="支持按单词或中文释义搜索；回放会把单词重新送回翻译工作台。导出支持 CSV / JSON / Anki TSV。"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select className={fieldControlClassName} value={exportFormat} onChange={(event) => setExportFormat(event.target.value as FavoriteExportFormat)}>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
              <option value="anki">Anki TSV</option>
            </select>
            <Button variant="secondary" disabled={exporting} onClick={() => void handleExport()}>
              {exporting ? '导出中...' : '导出'}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <Field label="搜索收藏" description="支持按单词或中文释义模糊搜索，输入停止 500ms 后刷新结果。">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input
                className={`${fieldControlClassName} pl-11`}
                placeholder="例如 ephemeral / 短暂"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setPage(1)
                }}
              />
            </div>
          </Field>

          {exportHint ? (
            <div className="rounded-[1.25rem] border border-white/10 bg-black/20 px-4 py-3 text-sm text-slate-300">{exportHint}</div>
          ) : null}

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
                  前往设置页继续翻译
                </Button>
              }
              description="当前还没有收藏记录。先翻一个单词，再把它留下。"
              icon={<HeartStraight size={22} weight="duotone" />}
              title="收藏列表还是空的"
            />
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="divide-y divide-white/8 rounded-[1.5rem] border border-white/10 bg-black/20">
              {items.map((item) => (
                <article key={`${item.word}-${item.id ?? 'item'}`} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto]">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold tracking-tight text-white">{item.word}</h3>
                      <StatusPill icon={<HeartStraight size={12} weight="fill" />} label="已收藏" tone="accent" />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">
                      {item.phonetic ?? '暂无音标'} · {item.chinese_phonetic ?? '暂无谐音'}
                    </p>
                    <p className="mt-4 text-sm leading-8 text-slate-200">{item.translation}</p>
                  </div>
                  <div className="flex flex-wrap items-start gap-2 md:flex-col md:items-end">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{item.created_at ?? '刚刚保存'}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button icon={<ArrowClockwise size={16} weight="duotone" />} size="sm" variant="secondary" onClick={() => handleReplay(item)}>
                        回放
                      </Button>
                      <Button icon={<Trash size={16} weight="duotone" />} size="sm" variant="ghost" onClick={() => void handleRemove(item.word)}>
                        移除
                      </Button>
                    </div>
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
