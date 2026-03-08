import { checkAccessibility, openAccessibilitySettings } from '../../lib/tauri'

interface PermissionStepProps {
  permissionGranted: boolean
  onChecked: (value: boolean) => void
}

export function PermissionStep({ permissionGranted, onChecked }: PermissionStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-semibold text-white">系统权限</h2>
      <p className="text-sm leading-7 text-slate-300">为支持“选中即翻译”，后续需要读取系统辅助功能权限。本周期已先打通检测和跳转接口。</p>
      <div className="flex flex-wrap gap-3">
        <button className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-slate-950" onClick={() => void checkAccessibility().then(onChecked)}>
          检测权限状态
        </button>
        <button className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200" onClick={() => void openAccessibilitySettings()}>
          打开系统设置
        </button>
      </div>
      <p className="text-sm text-slate-400">当前状态：{permissionGranted ? '已授权' : '未授权或当前环境不支持'}</p>
    </div>
  )
}
