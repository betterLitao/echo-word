import { HeartStraight, MagnifyingGlass, Sparkle } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { Field, fieldControlClassName } from '../components/ui/Field'
import { PageHero } from '../components/ui/PageHero'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusPill } from '../components/ui/StatusPill'
import { getFavorites, type FavoriteItem } from '../lib/tauri'

export function FavoritesPage() {
  const [query, setQuery] = useState('')
  const [items, setItems] = useState<FavoriteItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 收藏页在 Cycle 02 先提供最小读取能力，方便验证“弹窗收藏 -> 数据库存储 -> 列表展示”是否闭环。
    const load = async () => {
      setLoading(true)
      const favorites = await getFavorites(query)
      setItems(favorites)
      setLoading(false)
    }

    void load()
  }, [query])

  return (
    <div className="space-y-6">
      <PageHero
        description="收藏页延续同一套设计语言：标题不居中，内容采用纵向节奏和列表分隔，而不是机械的等宽卡片阵列。"
        eyebrow="Favorites"
        title="把真正值得反复看的单词，留在一个更安静的列表里。"
        meta={<StatusPill icon={<HeartStraight size={14} weight="fill" />} label={`${items.length} 条收藏`} tone="accent" />}
      />

      <SectionCard title="离线单词收藏" description="搜索先走词面和释义字段，便于快速回看你已保存的单词与谐音。">
        <div className="space-y-5">
          <Field label="检索收藏" description="支持按单词或中文释义模糊搜索。">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} weight="duotone" />
              <input className={`${fieldControlClassName} pl-11`} placeholder="例如 ephemeral / 短暂" value={query} onChange={(event) => setQuery(event.target.value)} />
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
              action={<Button icon={<Sparkle size={16} weight="duotone" />} variant="secondary">前往设置页继续调试</Button>}
              description="当前还没有收藏记录。你可以先在设置页的“单词翻译调试台”翻译一个单词，再发送到弹窗或直接收藏。"
              icon={<HeartStraight size={22} weight="duotone" />}
              title="收藏列表还没有内容"
            />
          ) : null}

          {!loading && items.length > 0 ? (
            <div className="divide-y divide-white/8 rounded-[1.5rem] border border-white/10 bg-black/20">
              {items.map((item, index) => (
                <article key={`${item.word}-${item.id ?? 'item'}`} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1fr)_auto]" style={{ animationDelay: `${index * 90}ms` }}>
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="text-xl font-semibold tracking-tight text-white">{item.word}</h3>
                      <StatusPill icon={<HeartStraight size={12} weight="fill" />} label="已收藏" tone="accent" />
                    </div>
                    <p className="mt-3 text-sm leading-7 text-slate-400">{item.phonetic ?? '暂无音标'} · {item.chinese_phonetic ?? '暂无谐音'}</p>
                    <p className="mt-4 text-sm leading-8 text-slate-200">{item.translation}</p>
                  </div>
                  <div className="md:text-right">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Created</p>
                    <p className="mt-2 text-sm text-slate-300">{item.created_at ?? '刚刚保存'}</p>
                  </div>
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
