import { Navigate } from 'react-router-dom'
import useAuthStore from '../../features/auth/store/authStore'

const RoleGuard = ({ children, allowedRoles }) => {
  const { user } = useAuthStore()
  // El backend devuelve user.role (string), no roles (array)
  const userRole = user?.role || ''
  const hasRole = allowedRoles.includes(userRole)
  if (!hasRole) return <Navigate to="/unauthorized" replace />
  return children
}

export default RoleGuard
