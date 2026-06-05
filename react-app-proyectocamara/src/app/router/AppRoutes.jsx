import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import ProtectedRoute from './ProtectedRoute'
import RoleGuard from './RoleGuard'
import AuthPage from '../../features/auth/pages/AuthPage'
import VerifyEmailPage from '../../features/auth/pages/VerifyEmailPage'
import UnauthorizedPage from '../../features/auth/pages/UnauthorizedPage'

const AdminDashboard = lazy(()=>import('../layouts/AdminDashboard'))
const UserDashboard  = lazy(()=>import('../layouts/UserDashboard'))

const Loader = () => (
  <div style={{minHeight:'100vh',background:'#020c0a',display:'flex',alignItems:'center',justifyContent:'center'}}>
    <span style={{width:32,height:32,border:'2px solid rgba(0,255,136,0.2)',borderTopColor:'#00ff88',borderRadius:'50%',display:'inline-block',animation:'spin 0.8s linear infinite'}}/>
  </div>
)

const AppRoutes = () => (
  <Routes>
    <Route path="/auth" element={<AuthPage/>}/>
    <Route path="/verify-email" element={<VerifyEmailPage/>}/>
    <Route path="/unauthorized" element={<UnauthorizedPage/>}/>

    <Route path="/admin/*" element={
      <ProtectedRoute>
        <RoleGuard allowedRoles={['ADMIN_ROLE']}>
          <Suspense fallback={<Loader/>}><AdminDashboard/></Suspense>
        </RoleGuard>
      </ProtectedRoute>
    }/>

    <Route path="/dashboard/*" element={
      <ProtectedRoute>
        <Suspense fallback={<Loader/>}><UserDashboard/></Suspense>
      </ProtectedRoute>
    }/>

    <Route path="*" element={<Navigate to="/auth" replace/>}/>
  </Routes>
)
export default AppRoutes
