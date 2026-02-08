import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthContext.jsx'
import { PortfolioProvider } from './context/PortfolioContext.jsx'
import { AppStatusProvider } from './context/AppStatusContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <AppStatusProvider>
          <NotificationProvider>
            <PortfolioProvider>
              <App />
            </PortfolioProvider>
          </NotificationProvider>
        </AppStatusProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
