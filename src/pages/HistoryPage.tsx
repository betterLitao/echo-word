import { ClockCounterClockwise, Lightning } from '@phosphor-icons/react'
import { EmptyState } from '../components/ui/EmptyState'
import { PageHero } from '../components/ui/PageHero'
import { SectionCard } from '../components/ui/SectionCard'
import { StatusPill } from '../components/ui/StatusPill'

export function HistoryPage() {
  return (
    <div className="space-y-6">
      <PageHero
        description="历史记录还未正式接入，但页面风格先与主工作台保持一致：轻玻璃容器、分层信息和偏左的内容重心。"
        eyebrow="History"
        title="未来的翻译轨迹，会在这里沉淀成可回看的工作上下文。"
        meta={<StatusPill icon={<Lightning size={14} weight="duotone" />} label="Cycle 05" tone="muted" />}
      />

      <SectionCard title="历史记录模块" description="当前作为占位页存在，后续会接入筛选、分页和结果回放能力。">
        <EmptyState
          description="完成句子翻译、快捷键和剪贴板监听后，历史记录会成为用户回看上下文的重要入口。"
          icon={<ClockCounterClockwise size={22} weight="duotone" />}
          title="历史尚未开始积累"
        />
      </SectionCard>
    </div>
  )
}
