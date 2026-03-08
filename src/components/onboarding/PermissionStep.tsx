import { Lightning, Monitor } from '@phosphor-icons/react'
import { Button } from '../ui/Button'
import { StatusPill } from '../ui/StatusPill'
import { checkAccessibility, openAccessibilitySettings } from '../../lib/tauri'

interface PermissionStepProps {
  permissionGranted: boolean
  onChecked: (value: boolean) => void
}

export function PermissionStep({ permissionGranted, onChecked }: PermissionStepProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[2.1rem]">系统权限</h2>
        <p className="mt-4 max-w-[58ch] text-sm leading-8 text-slate-400">为支持“选中即翻译”，后续需要读取系统辅助功能权限。本周期先打通检测与跳转通路，让引导流程完整可演示。</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <StatusPill icon={<Lightning size={14} weight="fill" />} label={permissionGranted ? '已授权' : '待授权'} tone={permissionGranted ? 'accent' : 'muted'} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Button icon={<Lightning size={16} weight="duotone" />} variant="primary" onClick={() => void checkAccessibility().then(onChecked)}>
          检测权限状态
        </Button>
        <Button icon={<Monitor size={16} weight="duotone" />} variant="secondary" onClick={() => void openAccessibilitySettings()}>
          打开系统设置
        </Button>
      </div>

      <div className="rounded-[1.5rem] border border-white/10 bg-black/20 p-5 text-sm leading-7 text-slate-400">
        当前状态：{permissionGranted ? '系统已返回授权状态，可以继续后续接入自动划词能力。' : '尚未授权，当前环境也可能暂不支持直接检测。'}
      </div>
    </div>
  )
}
