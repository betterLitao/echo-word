import { ArrowLeft, ArrowRight, CheckCircle, Lightning, Monitor, Translate } from '@phosphor-icons/react'
import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiKeyStep } from '../components/onboarding/ApiKeyStep'
import { PermissionStep } from '../components/onboarding/PermissionStep'
import { ShortcutStep } from '../components/onboarding/ShortcutStep'
import { Stepper } from '../components/onboarding/Stepper'
import { WelcomeStep } from '../components/onboarding/WelcomeStep'
import { BackgroundDecor } from '../components/ui/BackgroundDecor'
import { Button } from '../components/ui/Button'
import { StatusPill } from '../components/ui/StatusPill'
import { useSettingsStore } from '../stores/settingsStore'

const isWindows = navigator.userAgent.includes('Windows')
const steps = isWindows ? ['欢迎', '翻译源', '快捷键', '完成'] : ['欢迎', '权限', '翻译源', '快捷键', '完成']

export function OnboardingPage() {
  const navigate = useNavigate()
  const settings = useSettingsStore((state) => state.settings)
  const updateSetting = useSettingsStore((state) => state.updateSetting)
  const [stepIndex, setStepIndex] = useState(0)
  const [permissionGranted, setPermissionGranted] = useState(false)

  const stepContent = useMemo(() => {
    switch (stepIndex) {
      case 0:
        return <WelcomeStep />
      case 1:
        return isWindows ? <ApiKeyStep /> : <PermissionStep permissionGranted={permissionGranted} onChecked={setPermissionGranted} />
      case 2:
        return isWindows ? <ShortcutStep /> : <ApiKeyStep />
      case 3:
        return isWindows ? (
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/88">完成</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[2.3rem] md:leading-[1.02]">设置完成，开始使用</h2>
            <p className="max-w-[58ch] text-sm leading-8 text-slate-400">现在可以使用快捷键 Ctrl+Shift+T 翻译选中文本，或使用 Ctrl+Shift+I 打开输入翻译窗口。</p>
          </div>
        ) : <ShortcutStep />
      default:
        return (
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/88">完成</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[2.3rem] md:leading-[1.02]">设置完成，开始使用</h2>
            <p className="max-w-[58ch] text-sm leading-8 text-slate-400">现在可以使用快捷键 Ctrl+Shift+T 翻译选中文本，或使用 Ctrl+Shift+I 打开输入翻译窗口。</p>
          </div>
        )
    }
  }, [permissionGranted, stepIndex])

  if (settings.onboarding_completed) {
    return <Navigate to="/settings" replace />
  }

  const isLastStep = stepIndex === steps.length - 1

  return (
    <div className="relative min-h-[100dvh] overflow-hidden px-4 py-4 text-slate-50 sm:px-6 lg:px-8">
      <BackgroundDecor />
      <div className="relative mx-auto grid max-w-[1400px] gap-6 lg:min-h-[calc(100dvh-2rem)] lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,0.95fr)]">
        <section className="flex flex-col justify-between rounded-[2.25rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.9),rgba(2,6,23,0.75))] p-7 shadow-[0_32px_90px_-42px_rgba(2,6,23,0.96)] backdrop-blur-2xl md:p-10">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusPill icon={<Lightning size={14} weight="fill" />} label="Onboarding" tone="accent" />
              <StatusPill icon={<Translate size={14} weight="duotone" />} label="英译中" />
            </div>
            <h1 className=”mt-8 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[0.98]”>
              轻量级划词翻译工具
            </h1>
            <p className=”mt-6 max-w-[62ch] text-base leading-8 text-slate-300”>
              支持离线词典、在线翻译、音标谐音标注、收藏管理和历史记录，让翻译更高效便捷。
            </p>
          </div>

          <div className=”grid gap-4 md:grid-cols-[1.2fr_0.8fr]”>
            <div className=”rounded-[1.75rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]”>
              <p className=”text-xs uppercase tracking-[0.24em] text-slate-500”>核心功能</p>
              <div className=”mt-4 space-y-4 text-sm leading-7 text-slate-300”>
                <div className=”flex items-start gap-3”><CheckCircle size={18} weight=”fill” className=”mt-1 text-emerald-300” /><span>离线词典与在线翻译</span></div>
                <div className=”flex items-start gap-3”><CheckCircle size={18} weight=”fill” className=”mt-1 text-emerald-300” /><span>音标中文谐音标注</span></div>
                <div className=”flex items-start gap-3”><CheckCircle size={18} weight=”fill” className=”mt-1 text-emerald-300” /><span>收藏管理与历史记录</span></div>
              </div>
            </div>
            <div className=”rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]”>
              <p className=”text-xs uppercase tracking-[0.24em] text-slate-500”>版本信息</p>
              <p className=”mt-4 text-2xl font-semibold tracking-tight text-white”>v0.1.0</p>
              <p className=”mt-3 text-sm leading-7 text-slate-400”>基础功能已完成，支持快捷键、弹窗翻译和本地 HTTP API。</p>
            </div>
          </div>
        </section>

        <section className="rounded-[2.25rem] border border-white/10 bg-slate-950/78 p-6 shadow-[0_32px_90px_-42px_rgba(2,6,23,0.96)] backdrop-blur-2xl md:p-8">
          <Stepper currentStep={stepIndex} steps={steps} />
          <div className="mt-8 min-h-[26rem] rounded-[1.9rem] border border-white/10 bg-black/20 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] md:p-7">
            {stepContent}
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <Button icon={<ArrowLeft size={16} weight="bold" />} variant="ghost" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>
              上一步
            </Button>
            <div className="flex flex-wrap gap-3">
              <Button
                icon={<Monitor size={16} weight="duotone" />}
                variant="secondary"
                onClick={() => {
                  void updateSetting('onboarding_completed', true)
                  navigate('/settings', { replace: true })
                }}
              >
                跳过引导
              </Button>
              <Button
                icon={isLastStep ? <CheckCircle size={16} weight="fill" /> : <ArrowRight size={16} weight="bold" />}
                variant="primary"
                onClick={() => {
                  if (isLastStep) {
                    void updateSetting('onboarding_completed', true)
                    navigate('/settings', { replace: true })
                    return
                  }
                  setStepIndex((current) => current + 1)
                }}
              >
                {isLastStep ? '进入应用' : '下一步'}
              </Button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
