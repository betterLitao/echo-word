import { useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { ApiKeyStep } from '../components/onboarding/ApiKeyStep'
import { PermissionStep } from '../components/onboarding/PermissionStep'
import { ShortcutStep } from '../components/onboarding/ShortcutStep'
import { Stepper } from '../components/onboarding/Stepper'
import { WelcomeStep } from '../components/onboarding/WelcomeStep'
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
          <div className="space-y-4">
            <h2 className="text-3xl font-semibold text-white">准备完成</h2>
            <p className="max-w-3xl text-sm leading-7 text-slate-300">Cycle 01 到这里完成的是窗口、设置、数据库和引导骨架。接下来会继续开发翻译主链路。</p>
          </div>
        )
    }
  }, [permissionGranted, stepIndex])

  // 引导完成后直接跳过，避免每次启动都重新进入 onboarding。
  if (settings.onboarding_completed) {
    return <Navigate to="/settings" replace />
  }

  const isLastStep = stepIndex === steps.length - 1

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.12),_transparent_45%),_#020617] px-6 py-10 text-slate-50">
      <div className="w-full max-w-5xl rounded-[2rem] border border-white/10 bg-slate-950/85 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <Stepper currentStep={stepIndex} steps={steps} />
        <div className="mt-10 min-h-72">{stepContent}</div>
        <div className="mt-10 flex flex-wrap justify-between gap-3">
          <button className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200 disabled:opacity-50" disabled={stepIndex === 0} onClick={() => setStepIndex((current) => Math.max(0, current - 1))}>
            上一步
          </button>
          <div className="flex gap-3">
            <button className="rounded-full border border-white/10 px-5 py-3 text-sm text-slate-200" onClick={() => {
              // 跳过引导本质上也是一次显式完成，先写入状态，再回到主设置页。
              void updateSetting('onboarding_completed', true)
              navigate('/settings', { replace: true })
            }}>
              跳过引导
            </button>
            <button className="rounded-full bg-emerald-400 px-5 py-3 text-sm font-medium text-slate-950" onClick={() => {
              if (isLastStep) {
                // 最后一步与“跳过引导”共用同一份完成逻辑，保证状态一致。
                void updateSetting('onboarding_completed', true)
                navigate('/settings', { replace: true })
                return
              }
              setStepIndex((current) => current + 1)
            }}>
              {isLastStep ? '进入应用' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
