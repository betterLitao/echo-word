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

const steps = ['欢迎', '权限', '翻译源', '快捷键', '完成']

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
        return <PermissionStep permissionGranted={permissionGranted} onChecked={setPermissionGranted} />
      case 2:
        return <ApiKeyStep />
      case 3:
        return <ShortcutStep />
      default:
        return (
          <div className="space-y-5">
            <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/88">Ready</p>
            <h2 className="text-3xl font-semibold tracking-tight text-white md:text-[2.3rem] md:leading-[1.02]">基础引导已完成，接下来进入主工作台。</h2>
            <p className="max-w-[58ch] text-sm leading-8 text-slate-400">现在你已经具备离线单词翻译、句子翻译、收藏、历史回放、系统快捷键与本地 HTTP API 的完整基础能力。后续可继续按需开启剪贴板监听和多引擎对照。</p>
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
            <h1 className="mt-8 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl md:leading-[0.98]">
              先把关键入口整理清楚，再让翻译体验自然地接管日常工作流。
            </h1>
            <p className="mt-6 max-w-[62ch] text-base leading-8 text-slate-300">
              这份引导页不走居中大按钮套路，而是用左右分区来承接“产品说明”和“操作步骤”。左侧解释为什么存在，右侧负责动作推进。
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">你会获得</p>
              <div className="mt-4 space-y-4 text-sm leading-7 text-slate-300">
                <div className="flex items-start gap-3"><CheckCircle size={18} weight="fill" className="mt-1 text-emerald-300" /><span>更干净的权限与首次启动流程</span></div>
                <div className="flex items-start gap-3"><CheckCircle size={18} weight="fill" className="mt-1 text-emerald-300" /><span>离线单词、句子翻译、收藏与历史回放闭环</span></div>
                <div className="flex items-start gap-3"><CheckCircle size={18} weight="fill" className="mt-1 text-emerald-300" /><span>系统快捷键、本地 HTTP API 与剪贴板监听入口</span></div>
              </div>
            </div>
            <div className="rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">当前阶段</p>
              <p className="mt-4 text-2xl font-semibold tracking-tight text-white">Cycle 05</p>
              <p className="mt-3 text-sm leading-7 text-slate-400">P0 主链路已收口，P1 高频体验正在补齐到“长期可开着用”的状态。</p>
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
