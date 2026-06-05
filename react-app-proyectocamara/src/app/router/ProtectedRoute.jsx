import { Navigate } from 'react-router-dom'
import useAuthStore from '../../features/auth/store/authStore'

const ProtectedRoute = ({ children }) => {
  const { token } = useAuthStore()
  if (!token) return <Navigate to="/auth" replace />
  return children
}

export default ProtectedRoute
