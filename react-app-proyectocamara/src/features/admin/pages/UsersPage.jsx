import { useEffect } from 'react'
import useAdminStore from '../store/adminStore'
import UsuariosTabla from '../components/UsuariosTabla'

const UsersPage = () => {
  const { users, loadingUsers, fetchUsers } = useAdminStore()
  useEffect(() => { fetchUsers() }, [])
  return (
    <div className="page-content">
      <p className="page-title">Usuarios Registrados</p>
      <p className="page-subtitle">Administra cuentas y roles de los usuarios</p>
      <UsuariosTabla users={users} loading={loadingUsers}/>
    </div>
  )
}
export default UsersPage