import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { UserSidebar } from '../../shared/components/layout/Sidebar'
import Navbar from '../../shared/components/layout/Navbar'
import { UserHomePage, CuentaPage, SaldoPage, TarjetasPage, RecargasPage, MultasPage } from '../../features/user/pages/userPages'
import ProfilePage from '../../features/profile/pages/ProfilePage'

const UserDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dash-layout">
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <UserSidebar onClose={() => setSidebarOpen(false)}/>
      </div>
      <div className="main-content">
        <Navbar title="Portal de Usuario" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}/>
        <Routes>
          <Route index             element={<UserHomePage/>}/>
          <Route path="cuenta"     element={<CuentaPage/>}/>
          <Route path="saldo"      element={<SaldoPage/>}/>
          <Route path="tarjetas"   element={<TarjetasPage/>}/>
          <Route path="recargas"   element={<RecargasPage/>}/>
          <Route path="multas"     element={<MultasPage/>}/>
          <Route path="pagar-multa" element={<MultasPage/>}/>
          <Route path="profile"    element={<ProfilePage/>}/>
          <Route path="*"          element={<UserHomePage/>}/>
        </Routes>
      </div>
    </div>
  )
}
export default UserDashboard