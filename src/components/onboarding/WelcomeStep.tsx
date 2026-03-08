import { Browsers, Translate, Waveform } from '@phosphor-icons/react'
import { StatusPill } from '../ui/StatusPill'

export function WelcomeStep() {
  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/86">Welcome</p>
        <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-[2.3rem] md:leading-[1.04]">
          一款把划词翻译、音标和中文谐音压缩进同一个弹窗里的工具。
        </h2>
        <p className="mt-4 max-w-[56ch] text-sm leading-8 text-slate-400">
          这里先建立产品认知与视觉节奏：信息保持左对齐，关键优势拆成可扫描的模块，而不是用一块居中的大口号直接填满页面。
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill icon={<Translate size={14} weight="duotone" />} label="离线单词优先" tone="accent" />
        <StatusPill icon={<Waveform size={14} weight="duotone" />} label="音标谐音" />
        <StatusPill icon={<Browsers size={14} weight="duotone" />} label="多窗口" />
      </div>
    </div>
  )
}
