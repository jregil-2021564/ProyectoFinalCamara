import { useState } from 'react'
import { Shield, Search, ChevronDown } from 'lucide-react'
import useUsers from '../hooks/useUsers'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const UsersTable = () => {
  const { users, loading, assignRole, removeRole } = useUsers()
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState(null)

  const filtered = users.filter(u =>
    [u.username, u.email, u.name, u.surname].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAssign = async (userId, roleName) => {
    setActionId(userId)
    const res = await assignRole(userId, roleName)
    setActionId(null)
    res.ok ? toastSuccess('Rol asignado') : toastError(res.message)
  }

  const handleRemove = async (userId, roleName) => {
    setActionId(userId)
    const res = await removeRole(userId, roleName)
    setActionId(null)
    res.ok ? toastSuccess('Rol removido') : toastError(res.message)
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>Usuarios Registrados</h3>
        <div style={{ position: 'relative' }}>
          <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuario..."
            className="form-input" style={{ paddingLeft: 32, width: 220, fontSize: '0.85rem', padding: '8px 12px 8px 32px' }} />
        </div>
      </div>

      {loading
        ? <div style={{ textAlign: 'center', padding: 40 }}><span className="spinner-dark" style={{ margin: '0 auto' }} /></div>
        : <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {['Nombre', 'Usuario', 'Email', 'Placa', 'Rol', 'Estado', 'Acciones'].map(h => <th key={h}>{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u, i) => {
                  const roles = u.roles ?? u.UserRoles?.map(ur => ur.Role?.Name) ?? []
                  const isAdmin = roles.includes('ADMIN_ROLE')
                  const isActing = actionId === (u.id ?? u.Id)
                  return (
                    <tr key={u.id ?? u.Id ?? i}>
                      <td style={{ fontWeight: 500 }}>{u.name} {u.surname}</td>
                      <td style={{ color: '#6b7280' }}>{u.username}</td>
                      <td style={{ color: '#6b7280', fontSize: '0.8rem' }}>{u.email}</td>
                      <td><span style={{ fontWeight: 600, color: '#1a56db' }}>{u.placa ?? u.UserProfile?.Placa ?? '—'}</span></td>
                      <td>
                        <span className={`badge ${isAdmin ? 'badge-blue' : 'badge-green'}`}>
                          {isAdmin ? 'Admin' : 'Usuario'}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${u.status || u.Status ? 'badge-green' : 'badge-gray'}`}>
                          {u.status || u.Status ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td>
                        {!isAdmin
                          ? <button disabled={isActing} onClick={() => handleAssign(u.id ?? u.Id, 'ADMIN_ROLE')} className="btn-success" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                              <Shield size={11}/> Hacer Admin
                            </button>
                          : <button disabled={isActing} onClick={() => handleRemove(u.id ?? u.Id, 'ADMIN_ROLE')} className="btn-outline" style={{ fontSize: '0.75rem', padding: '5px 10px' }}>
                              <ChevronDown size={11}/> Quitar Admin
                            </button>}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: 32 }}>No se encontraron usuarios</td></tr>
                )}
              </tbody>
            </table>
          </div>}
    </div>
  )
}
export default UsersTable
