import { useEffect } from 'react'
import { NavLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { FavoritesPage } from './pages/FavoritesPage'
import { HistoryPage } from './pages/HistoryPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { SettingsPage } from './pages/SettingsPage'
import { useTheme } from './hooks/useTheme'
import { useSettingsStore } from './stores/settingsStore'

function HomeRedirect() {
  const settings = useSettingsStore((state) => state.settings)
  const loading = useSettingsStore((state) => state.loading)

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-slate-200">正在加载设置…</div>
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
    return <div className="flex min-h-screen items-center justify-center text-slate-200">正在初始化 EchoWord…</div>
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {!isOnboarding ? (
        <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-6 lg:flex-row lg:gap-6">
          <aside className="mb-6 w-full rounded-3xl border border-white/10 bg-white/5 p-5 lg:mb-0 lg:w-72">
            <div>
              <p className="text-sm font-medium text-emerald-300">EchoWord</p>
              <h1 className="mt-2 text-2xl font-semibold">Cycle 01 工程骨架</h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                当前主窗口已具备设置、引导、收藏和历史的基础入口，后续周期将逐步填充翻译能力。
              </p>
            </div>
            <nav className="mt-6 flex flex-col gap-2 text-sm">
              <NavLink className={({ isActive }) => isActive ? 'rounded-2xl bg-emerald-400/20 px-4 py-3 text-emerald-200' : 'rounded-2xl px-4 py-3 text-slate-300 hover:bg-white/5'} to="/settings">设置</NavLink>
              <NavLink className={({ isActive }) => isActive ? 'rounded-2xl bg-emerald-400/20 px-4 py-3 text-emerald-200' : 'rounded-2xl px-4 py-3 text-slate-300 hover:bg-white/5'} to="/favorites">收藏</NavLink>
              <NavLink className={({ isActive }) => isActive ? 'rounded-2xl bg-emerald-400/20 px-4 py-3 text-emerald-200' : 'rounded-2xl px-4 py-3 text-slate-300 hover:bg-white/5'} to="/history">历史</NavLink>
            </nav>
          </aside>
          <main className="flex-1 rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
            <Routes>
              <Route path="/settings/*" element={<SettingsPage />} />
              <Route path="/favorites" element={<FavoritesPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="*" element={<Navigate to="/settings" replace />} />
            </Routes>
          </main>
        </div>
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
