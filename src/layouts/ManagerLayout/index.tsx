import { Outlet } from 'react-router'
import Header from '../../components/Header'
import Sidebar from '../../components/Sidebar'
import './styles.css'

function ManagerLayout() {
  return (
    <div className="manager-layout">
      <a className="skip-link" href="#main-content" onClick={(event) => {
        const main = document.getElementById('main-content')
        if (main) { event.preventDefault(); main.focus(); main.scrollIntoView({ block: 'start' }) }
      }}>Pular para o conteúdo</a>
      <Sidebar />
      <div className="manager-layout__content">
        <Header />
        <Outlet />
      </div>
    </div>
  )
}

export default ManagerLayout
