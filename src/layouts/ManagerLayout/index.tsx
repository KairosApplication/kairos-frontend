import { Outlet } from 'react-router'
import Sidebar from '../../components/Sidebar'
import './styles.css'

function ManagerLayout() {
  return (
    <div className="manager-layout">
      <Sidebar />
      <div className="manager-layout__content">
        <Outlet />
      </div>
    </div>
  )
}

export default ManagerLayout
