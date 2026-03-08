import React from 'react'
import ReactDOM from 'react-dom/client'
import { PopupWindow } from './components/popup/PopupWindow'
import './styles/globals.css'

ReactDOM.createRoot(document.getElementById('popup-root')!).render(
  <React.StrictMode>
    <PopupWindow />
  </React.StrictMode>,
)
