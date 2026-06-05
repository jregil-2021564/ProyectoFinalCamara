import { useState } from 'react'
import { Routes, Route } from 'react-router-dom'
import { AdminSidebar } from '../../shared/components/layout/Sidebar'
import Navbar from '../../shared/components/layout/Navbar'
import AdminHomePage from '../../features/admin/pages/AdminHomePage'
import UsersPage from '../../features/admin/pages/UsersPage'
import MultasAdminPage from '../../features/admin/pages/MultasAdminPage'
import CamaraPage from '../../features/admin/pages/CamaraPage'
import VehiculosPage from '../../features/admin/pages/VehiculosPage'
import ProfilePage from '../../features/profile/pages/ProfilePage'

const AdminDashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="dash-layout">
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Sidebar with open class */}
      <div className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <AdminSidebar onClose={() => setSidebarOpen(false)}/>
      </div>

      <div className="main-content">
        <Navbar title="Panel de Administración" onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}/>
        <Routes>
          <Route path="dashboard"   element={<AdminHomePage/>}/>
          <Route path="users"       element={<UsersPage/>}/>
          <Route path="multas"      element={<MultasAdminPage/>}/>
          <Route path="infractions" element={<MultasAdminPage/>}/>
          <Route path="traffic"     element={<MultasAdminPage/>}/>
          <Route path="cameras"     element={<CamaraPage/>}/>
          <Route path="vehiculos"   element={<VehiculosPage/>}/>
          <Route path="profile"     element={<ProfilePage/>}/>
          <Route path="*"           element={<AdminHomePage/>}/>
        </Routes>
      </div>
    </div>
  )
}
export default AdminDashboard