import { Outlet } from 'react-router'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import './styles.css'

function ManagerLayout() {
  return (
    <div className="manager-layout">
      <Sidebar />
      <div className="manager-layout__content">
        <Header />
        <Outlet />
      </div>
    </div>
  )
}

export default ManagerLayout
