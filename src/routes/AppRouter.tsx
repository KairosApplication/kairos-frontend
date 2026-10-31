import type { ReactNode } from 'react'
import { BrowserRouter, HashRouter } from 'react-router'

export default function AppRouter({ children }: { children: ReactNode }) {
  const Router = import.meta.env.MODE === 'pages' ? HashRouter : BrowserRouter
  return <Router>{children}</Router>
}
