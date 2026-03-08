import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { PopupWindow } from './components/popup/PopupWindow'
import { useTheme } from './hooks/useTheme'
import { useSettingsStore } from './stores/settingsStore'
import './styles/globals.css'

export function PopupApp() {
  const loadSettings = useSettingsStore((state) => state.loadSettings)
  useTheme()

  useEffect(() => {
    void loadSettings()
  }, [loadSettings])

  return <PopupWindow />
}

ReactDOM.createRoot(document.getElementById('popup-root')!).render(
  <React.StrictMode>
    <PopupApp />
  </React.StrictMode>,
)
