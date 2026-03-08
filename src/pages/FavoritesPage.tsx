import { SectionCard } from '../components/ui/SectionCard'

export function FavoritesPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-300">收藏</p>
        <h2 className="mt-2 text-3xl font-semibold">收藏列表骨架</h2>
      </div>
      <SectionCard title="等待 Cycle 02 / 05" description="本周期先保留页面入口和布局骨架，后续会接入收藏命令、列表查询和搜索能力。">
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-300">
          当前暂无收藏数据。完成单词翻译与收藏命令后，这里将接入数据库查询结果。
        </div>
      </SectionCard>
    </div>
  )
}
