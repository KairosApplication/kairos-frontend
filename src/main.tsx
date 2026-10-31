import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import AppRouter from './routes/AppRouter'
import './index.css'
import App from './App.tsx'
import AuthProvider from './contexts/AuthProvider'
import ThemeProvider from './contexts/ThemeProvider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AppRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </AppRouter>
    </ThemeProvider>
  </StrictMode>,
)
