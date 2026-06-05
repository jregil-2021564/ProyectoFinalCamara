import { useEffect } from 'react'
import useAdminStore from '../store/adminStore'
const useUsers = () => {
  const { users, loadingUsers, fetchUsers, assignRole, removeRole } = useAdminStore()
  useEffect(() => { if(users.length===0) fetchUsers() }, [])
  return { users, loading:loadingUsers, fetchUsers, assignRole, removeRole }
}
export default useUsers