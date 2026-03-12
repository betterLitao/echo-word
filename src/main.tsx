import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { emit } from '@tauri-apps/api/event'
import App from './App'
import './styles/globals.css'

function MainApp() {
  useEffect(() => {
    // 主窗口加载完成后通知后端关闭闪屏
    const notifySplashscreen = async () => {
      try {
        await emit('main-window-ready')
      } catch (error) {
        console.error('Failed to emit main-window-ready:', error)
      }
    }

    // 延迟一小段时间确保渲染完成
    const timer = setTimeout(notifySplashscreen, 100)
    return () => clearTimeout(timer)
  }, [])

  return <App />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <MainApp />
    </BrowserRouter>
  </React.StrictMode>,
)
