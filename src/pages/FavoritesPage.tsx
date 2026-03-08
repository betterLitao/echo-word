import { useEffect, useState } from 'react'
import { getFavorites, type FavoriteItem } from '../lib/tauri'
import { SectionCard } from '../components/ui/SectionCard'

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
      <div>
        <p className="text-sm font-medium text-emerald-300">收藏</p>
        <h2 className="mt-2 text-3xl font-semibold">收藏列表</h2>
      </div>
      <SectionCard title="离线单词收藏" description="当前支持最小查询能力，后续 Cycle 05 会继续补搜索体验、分页和批量管理。">
        <div className="space-y-4">
          <input className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-slate-100" placeholder="搜索单词或释义" value={query} onChange={(event) => setQuery(event.target.value)} />

          {loading ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm text-slate-400">正在读取收藏…</div> : null}
          {!loading && items.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-300">当前暂无收藏数据。你可以先在设置页的“单词翻译调试台”翻译一个单词，再发送到弹窗或直接收藏。</div> : null}
          {!loading && items.length > 0 ? (
            <div className="space-y-3">
              {items.map((item) => (
                <div key={`${item.word}-${item.id ?? 'item'}`} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{item.word}</h3>
                      <p className="mt-2 text-sm text-slate-300">{item.phonetic ?? '暂无音标'} · {item.chinese_phonetic ?? '暂无谐音'}</p>
                      <p className="mt-3 text-sm leading-7 text-slate-200">{item.translation}</p>
                    </div>
                    <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">{item.created_at ?? '已保存'}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </SectionCard>
    </div>
  )
}
