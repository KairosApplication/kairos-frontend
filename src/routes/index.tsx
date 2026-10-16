import { Navigate, Route, Routes } from 'react-router'
import ManagerLayout from '../layouts/ManagerLayout'
import ManagerPlaceholder from '../pages/ManagerPlaceholder'
import Dashboard from '../pages/Dashboard'
import StoreMap from '../pages/StoreMap'
import LoginRoute from './LoginRoute'
import ProtectedRoute from './ProtectedRoute'
import NotFound from '../pages/NotFound'
import { managerPages } from './managerPages'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<LoginRoute />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<ManagerLayout />}>
          {managerPages.map(({ path, title, description }) => (
            <Route
              key={path}
              path={path}
              element={path === '/dashboard' ? <Dashboard /> : path === '/mapa' ? <StoreMap /> : <ManagerPlaceholder title={title} description={description} />}
            />
          ))}
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
