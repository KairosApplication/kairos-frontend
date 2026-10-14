import { Navigate, Route, Routes } from 'react-router'
import ManagerLayout from '../layouts/ManagerLayout'
import ManagerPlaceholder from '../pages/ManagerPlaceholder'
import NotFound from '../pages/NotFound'
import RoutePlaceholder from '../pages/RoutePlaceholder'
import { managerPages } from './managerPages'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<RoutePlaceholder title="Login" />} />
      <Route element={<ManagerLayout />}>
        {managerPages.map(({ path, title, description }) => (
          <Route
            key={path}
            path={path}
            element={<ManagerPlaceholder title={title} description={description} />}
          />
        ))}
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
