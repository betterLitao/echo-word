import {
  ClockCounterClockwise,
  GearSix,
  GridFour,
  HeartStraight,
  Lightning,
  Waveform,
} from '@phosphor-icons/react'
import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { InputTranslateDialog } from './components/translation/InputTranslateDialog'
import { BackgroundDecor } from './components/ui/BackgroundDecor'
import { StatusPill } from './components/ui/StatusPill'
import { useTheme } from './hooks/useTheme'
import { FavoritesPage } from './pages/FavoritesPage'
import { HistoryPage } from './pages/HistoryPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'
import { useSettingsStore } from './stores/settingsStore'

const navItems = [
  { to: '/settings', label: '设置', icon: GearSix },
  { to: '/favorites', label: '收藏', icon: HeartStraight },
  { to: '/history', label: '历史', icon: ClockCounterClockwise },
] as const

function HomeRedirect() {
  const settings = useSettingsStore((state) => state.settings)
  const loading = useSettingsStore((state) => state.loading)

  if (loading) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 text-slate-100">
        <BackgroundDecor />
        <div className="relative flex w-full max-w-xl flex-col gap-5 rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_32px_80px_-32px_rgba(2,6,23,0.92)] backdrop-blur-2xl">
          <div className="h-4 w-24 animate-pulse rounded-full bg-white/10" />
          <div className="h-16 animate-pulse rounded-[1.5rem] bg-white/[0.06]" />
          <div className="h-28 animate-pulse rounded-[1.5rem] bg-white/[0.04]" />
        </div>
      </div>
    )
  }

  return <Navigate to={settings.onboarding_completed ? '/settings' : '/onboarding'} replace />
}

function AppFrame() {
  const location = useLocation()
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  const loading = useSettingsStore((state) => state.loading)
  useTheme()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  const isOnboarding = location.pathname.startsWith('/onboarding')

  if (loading && !isOnboarding) {
    return (
      <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 text-slate-100">
        <BackgroundDecor />
        <div className="relative flex w-full max-w-2xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-slate-950/70 p-8 shadow-[0_32px_80px_-32px_rgba(2,6,23,0.92)] backdrop-blur-2xl">
          <div className="h-4 w-20 animate-pulse rounded-full bg-white/10" />
          <div className="h-20 animate-pulse rounded-[1.5rem] bg-white/[0.06]" />
          <div className="grid gap-4 md:grid-cols-[1.2fr_0.8fr]">
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-white/[0.05]" />
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-white/[0.04]" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-[100dvh] overflow-hidden text-slate-50">
      <BackgroundDecor />
      {!isOnboarding ? (
        <>
          <div className="relative mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.72))] p-6 shadow-[0_32px_80px_-42px_rgba(2,6,23,0.92)] backdrop-blur-2xl lg:sticky lg:top-6 lg:h-[calc(100dvh-3rem)]">
                <div className="relative flex h-full flex-col">
                  <div>
                    <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/[0.06] px-3 py-2 text-xs uppercase tracking-[0.24em] text-slate-200">
                      <Waveform size={16} weight="duotone" />
                      EchoWord
                    </div>
                    <h1 className="mt-6 text-[2.15rem] font-semibold tracking-tight text-white md:text-[2.5rem] md:leading-[1.02]">
                      左侧做导航，右侧收纳翻译、设置和系统入口。
                    </h1>
                    <p className="mt-4 max-w-[28ch] text-sm leading-7 text-slate-400">
                      现在已经不止是离线单词面板：句子翻译、快捷键、历史列表、输入弹层和 HTTP 入口都共享同一条翻译主链路。
                    </p>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-2">
                    <StatusPill icon={<Lightning size={14} weight="fill" />} label="Cycle 06" tone="accent" />
                    <StatusPill icon={<GridFour size={14} weight="duotone" />} label="多链路联动" />
                  </div>

                  <nav className="mt-8 space-y-2">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          className={({ isActive }) =>
                            isActive
                              ? 'flex items-center justify-between rounded-[1.4rem] border border-emerald-300/18 bg-emerald-300/10 px-4 py-4 text-sm text-emerald-100 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]'
                              : 'flex items-center justify-between rounded-[1.4rem] border border-transparent px-4 py-4 text-sm text-slate-300 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                          }
                          to={item.to}
                        >
                          <span className="flex items-center gap-3">
                            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/20 text-slate-100">
                              <Icon size={18} weight="duotone" />
                            </span>
                            <span>{item.label}</span>
                          </span>
                          <span className="text-xs uppercase tracking-[0.24em] text-slate-500">0{navItems.indexOf(item) + 1}</span>
                        </NavLink>
                      )
                    })}
                  </nav>

                  <div className="mt-auto rounded-[1.6rem] border border-white/10 bg-black/20 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-500">工作流</p>
                    <p className="mt-3 text-sm leading-7 text-slate-300">
                      当前已串起单词、句子、快捷键、输入弹层、收藏与历史。后续新增 Provider 或系统能力时，会继续复用这套主链路。
                    </p>
                  </div>
                </div>
              </aside>

              <div className="space-y-6">
                <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_300px]">
                  <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(15,23,42,0.68))] p-6 shadow-[0_32px_80px_-42px_rgba(2,6,23,0.88)] backdrop-blur-2xl md:p-7">
                    <p className="text-xs uppercase tracking-[0.28em] text-emerald-300/86">Workbench</p>
                    <h2 className="mt-4 max-w-4xl text-3xl font-semibold tracking-tight text-white md:text-[2.7rem] md:leading-[1.02]">
                      让翻译主链路先稳定，再把触发方式、对照视图和历史沉淀逐步叠上去。
                    </h2>
                    <p className="mt-4 max-w-[62ch] text-sm leading-7 text-slate-400">
                      页面结构保持左偏与不对称留白，重点内容集中在主舞台区域；信息密度控制在日常应用级别，而不是堆满指标卡片。
                    </p>
                  </section>

                  <section className="rounded-[2rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-500">状态</p>
                    <div className="mt-4 space-y-3">
                      <StatusPill icon={<Lightning size={14} weight="fill" />} label="句子翻译可用" tone="accent" />
                      <StatusPill icon={<HeartStraight size={14} weight="duotone" />} label="收藏与历史已接库" />
                      <StatusPill icon={<ClockCounterClockwise size={14} weight="duotone" />} label="输入弹层与快捷键已接线" />
                    </div>
                  </section>
                </div>

                <main className="relative rounded-[2rem] border border-white/10 bg-slate-950/62 p-4 shadow-[0_32px_80px_-42px_rgba(2,6,23,0.92)] backdrop-blur-2xl md:p-6">
                  <Routes>
                    <Route path="/settings/*" element={<SettingsPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="*" element={<Navigate to="/settings" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </div>
          <InputTranslateDialog />
        </>
      ) : (
        <Routes>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="*" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      )}
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/*" element={<AppFrame />} />
    </Routes>
  )
}
