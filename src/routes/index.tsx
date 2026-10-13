import { Navigate, Route, Routes } from 'react-router'
import NotFound from '../pages/NotFound'
import RoutePlaceholder from '../pages/RoutePlaceholder'
import { managerPages } from './managerPages'

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<RoutePlaceholder title="Login" />} />
      {managerPages.map(({ path, title }) => (
        <Route
          key={path}
          path={path}
          element={<RoutePlaceholder title={title} />}
        />
      ))}
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}

export default AppRoutes
