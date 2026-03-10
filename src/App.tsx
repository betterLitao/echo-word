import {
  Bug,
  ClockCounterClockwise,
  GearSix,
  HeartStraight,
  Waveform,
} from '@phosphor-icons/react'
import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { InputTranslateDialog } from './components/translation/InputTranslateDialog'
import { BackgroundDecor } from './components/ui/BackgroundDecor'
import { TitleBar } from './components/ui/TitleBar'
import { useTheme } from './hooks/useTheme'
import { isTauriRuntime } from './lib/tauri'
import { DebugPage } from './pages/DebugPage'
import { FavoritesPage } from './pages/FavoritesPage'
import { HistoryPage } from './pages/HistoryPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'
import { useSettingsStore } from './stores/settingsStore'

const isDev = import.meta.env.DEV

const navItems = [
  { to: '/settings', label: '设置', icon: GearSix },
  { to: '/favorites', label: '收藏', icon: HeartStraight },
  { to: '/history', label: '历史', icon: ClockCounterClockwise },
  ...(isDev ? [{ to: '/debug', label: '调试', icon: Bug }] : []),
] as const

function HomeRedirect() {
  const settings = useSettingsStore((state) => state.settings)
  const loading = useSettingsStore((state) => state.loading)
  const loadSettings = useSettingsStore((state) => state.loadSettings)

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

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
      {isTauriRuntime() && !isOnboarding && <TitleBar />}
      {!isOnboarding ? (
        <>
          <div className="relative mx-auto max-w-[1200px] px-3 py-3 sm:px-4 lg:px-6" style={{ paddingTop: isTauriRuntime() ? '2.5rem' : '0.75rem' }}>
            <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)]">
              <aside className="relative overflow-hidden rounded-xl border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.88),rgba(2,6,23,0.72))] p-4 shadow-[0_20px_50px_-20px_rgba(2,6,23,0.92)] backdrop-blur-2xl lg:sticky lg:top-3 lg:h-[calc(100dvh-1.5rem)]">
                <div className="relative flex h-full flex-col">
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-1.5 text-xs font-medium tracking-wide text-slate-200">
                      <Waveform size={14} weight="duotone" />
                      EchoWord
                    </div>
                  </div>

                  <nav className="space-y-1.5">
                    {navItems.map((item) => {
                      const Icon = item.icon
                      return (
                        <NavLink
                          key={item.to}
                          className={({ isActive }) =>
                            isActive
                              ? 'flex items-center gap-2.5 rounded-lg border border-emerald-300/18 bg-emerald-300/10 px-3 py-2.5 text-sm font-medium text-emerald-100'
                              : 'flex items-center gap-2.5 rounded-lg border border-transparent px-3 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:border-white/10 hover:bg-white/[0.05] hover:text-white'
                          }
                          to={item.to}
                        >
                          <Icon size={16} weight="duotone" />
                          <span>{item.label}</span>
                        </NavLink>
                      )
                    })}
                  </nav>

                  <div className="mt-auto pt-4">
                    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                      <p className="text-xs text-slate-500">快捷键</p>
                      <p className="mt-2 text-xs leading-5 text-slate-400">
                        Ctrl+Shift+T 翻译<br/>
                        Ctrl+Shift+I 输入
                      </p>
                    </div>
                  </div>
                </div>
              </aside>

              <main className="relative rounded-xl border border-white/10 bg-slate-950/62 p-4 shadow-[0_20px_50px_-20px_rgba(2,6,23,0.92)] backdrop-blur-2xl md:p-5">
                <Routes>
                  <Route path="/settings/*" element={<SettingsPage />} />
                  <Route path="/favorites" element={<FavoritesPage />} />
                  <Route path="/history" element={<HistoryPage />} />
                  {isDev && <Route path="/debug" element={<DebugPage />} />}
                  <Route path="*" element={<Navigate to="/settings" replace />} />
                </Routes>
              </main>
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
