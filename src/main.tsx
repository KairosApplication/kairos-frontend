import { lazy, StrictMode, Suspense } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router'
import './index.css'
import App from './App.tsx'
import AuthProvider from './contexts/AuthProvider'

const ComponentPreview = import.meta.env.DEV ? lazy(() => import('./pages/ComponentPreview')) : null

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {ComponentPreview && window.location.pathname === '/componentes' ? (
      <Suspense fallback={<p role="status">Carregando demonstração…</p>}><ComponentPreview /></Suspense>
    ) : (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    )}
  </StrictMode>,
)
