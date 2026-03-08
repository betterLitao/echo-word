import { SectionCard } from '../components/ui/SectionCard'

export function HistoryPage() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-emerald-300">历史记录</p>
        <h2 className="mt-2 text-3xl font-semibold">历史页面骨架</h2>
      </div>
      <SectionCard title="等待 Cycle 05" description="历史记录属于体验增强功能，本周期先完成路由、布局和占位，保证页面入口稳定。">
        <div className="rounded-2xl border border-dashed border-white/10 p-6 text-sm leading-7 text-slate-300">
          后续会在这里展示翻译历史、筛选与分页能力。
        </div>
      </SectionCard>
    </div>
  )
}
