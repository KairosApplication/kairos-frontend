import { Navigate, Route, Routes } from 'react-router'
import type { ComponentType } from 'react'
import ManagerLayout from '../layouts/ManagerLayout'
import ManagerPlaceholder from '../pages/ManagerPlaceholder'
import Dashboard from '../pages/Dashboard'
import StoreMap from '../pages/StoreMap'
import Shelves from '../pages/Shelves'
import Products from '../pages/Products'
import LoginRoute from './LoginRoute'
import ProtectedRoute from './ProtectedRoute'
import NotFound from '../pages/NotFound'
import { managerPages } from './managerPages'

const implementedPages: Partial<Record<string, ComponentType>> = {
  '/dashboard': Dashboard,
  '/mapa': StoreMap,
  '/gondolas': Shelves,
  '/produtos': Products,
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ManagerLayout />}>
          {managerPages.map(({ path, title, description }) => {
            const Page = implementedPages[path]
            return <Route
              key={path}
              path={path}
              element={Page ? <Page /> : <ManagerPlaceholder title={title} description={description} />}
            />
          })}
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
