import { useState } from 'react'
import { Shield, ChevronDown, Search } from 'lucide-react'
import useAdminStore from '../store/adminStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import useNotifStore, { NOTIF_TYPES } from '../../../shared/store/notifStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2' }

const UsuariosTabla = ({ users, loading }) => {
  const { assignRole, removeRole } = useAdminStore()
  const { add } = useNotifStore()
  const [search, setSearch] = useState('')
  const [actionId, setActionId] = useState(null)

  const filtered = users.filter(u =>
    [u.username, u.email, u.name, u.surname].some(v => v?.toLowerCase().includes(search.toLowerCase()))
  )

  const handleAssign = async (userId, username) => {
    setActionId(userId)
    const res = await assignRole(userId, 'ADMIN_ROLE')
    setActionId(null)
    if (res.ok) {
      toastSuccess('Rol de Admin asignado')
      add(NOTIF_TYPES.SISTEMA, 'Rol actualizado', `${username} ahora es Administrador.`)
    } else toastError(res.message)
  }

  const handleRemove = async (userId, username) => {
    setActionId(userId)
    const res = await removeRole(userId, 'ADMIN_ROLE')
    setActionId(null)
    if (res.ok) {
      toastSuccess('Rol de Admin removido')
      add(NOTIF_TYPES.SISTEMA, 'Rol actualizado', `${username} ya no es Administrador.`)
    } else toastError(res.message)
  }

  return (
    <div className="card" style={{ padding:'16px 20px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14, flexWrap:'wrap', gap:8 }}>
        <h3 style={{ fontWeight:700, fontSize:'0.92rem', color:P.dark }}>Usuarios ({filtered.length})</h3>
        <div style={{ position:'relative' }}>
          <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)' }}/>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar usuario..."
            className="form-input" style={{ paddingLeft:28, width:200, fontSize:'0.82rem', padding:'7px 12px 7px 28px' }}/>
        </div>
      </div>

      {loading
        ? <div style={{ textAlign:'center', padding:32 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
        : <div style={{ overflowX:'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th className="hide-mobile">Email</th>
                  <th>Placa</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((u,i) => {
                  const roles  = u.roles ?? u.UserRoles?.map(ur=>ur.Role?.Name) ?? []
                  const isAdmin = roles.includes('ADMIN_ROLE')
                  const uid    = u.id ?? u.Id
                  const acting = actionId === uid
                  return (
                    <tr key={uid||i}>
                      <td style={{ fontWeight:500 }}>{u.name||''} {u.surname||''}</td>
                      <td style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>{u.username}</td>
                      <td className="hide-mobile" style={{ color:'var(--text-2)', fontSize:'0.78rem' }}>{u.email}</td>
                      <td style={{ fontWeight:600, color:P.teal }}>{u.placa ?? u.UserProfile?.Placa ?? '—'}</td>
                      <td><span className={`badge ${isAdmin?'badge-blue':'badge-green'}`}>{isAdmin?'Admin':'Usuario'}</span></td>
                      <td><span className={`badge ${u.status||u.Status?'badge-green':'badge-gray'}`}>{u.status||u.Status?'Activo':'Inactivo'}</span></td>
                      <td>
                        {!isAdmin
                          ? <button disabled={acting} onClick={()=>handleAssign(uid,u.username)} className="btn-success" style={{ padding:'4px 10px', fontSize:'0.73rem' }}>
                              {acting?<span className="spinner" style={{ borderTopColor:P.dark, borderColor:`${P.dark}33`, width:12, height:12 }}/>:<><Shield size={10}/> Hacer Admin</>}
                            </button>
                          : <button disabled={acting} onClick={()=>handleRemove(uid,u.username)} className="btn-outline" style={{ padding:'4px 10px', fontSize:'0.73rem' }}>
                              {acting?<span className="spinner-dark" style={{ width:12, height:12 }}/>:<><ChevronDown size={10}/> Quitar Admin</>}
                            </button>}
                      </td>
                    </tr>
                  )
                })}
                {filtered.length===0 && <tr><td colSpan={7} style={{ textAlign:'center', padding:24, color:'var(--text-2)' }}>Sin usuarios</td></tr>}
              </tbody>
            </table>
          </div>}
    </div>
  )
}
export default UsuariosTabla