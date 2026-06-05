import { useState, useEffect } from 'react'
import { Car, Search, AlertTriangle, Plus, X, Trash2 } from 'lucide-react'
import { getVehiculos, registrarVehiculo, getMultasPorPlaca } from '../../profile/api/profileApi'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import useAdminStore from '../store/adminStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB' }

/* ── Modal Registrar ─────────────────────────────────────────────── */
const RegisterVehiculoModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ placa:'', modelo:'', color:'', anio:'' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.placa||!form.modelo||!form.color||!form.anio) { toastError('Todos los campos son requeridos'); return }
    setSaving(true)
    try {
      await registrarVehiculo({ ...form, placa: form.placa.toUpperCase() })
      toastSuccess('Vehículo registrado')
      onSaved(); onClose()
    } catch (err) {
      toastError(err.response?.data?.message || 'Error al registrar')
    }
    setSaving(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:420 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontWeight:700, color:P.dark }}>Registrar Vehículo</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={18}/></button>
        </div>
        {[['placa','Placa','P-123ABC'],['modelo','Modelo','Chevrolet Spark'],['color','Color','Azul'],['anio','Año','2020']].map(([k,l,p])=>(
          <div key={k} style={{ marginBottom:14 }}>
            <label className="form-label">{l}</label>
            <input className="form-input" value={form[k]}
              onChange={e=>setForm(f=>({...f,[k]:k==='placa'?e.target.value.toUpperCase():e.target.value}))}
              placeholder={p} style={k==='placa'?{textTransform:'uppercase'}:{}}/>
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="btn-success" style={{ width:'100%', padding:'12px', justifyContent:'center' }}>
          {saving ? <span className="spinner" style={{ borderTopColor:P.dark, borderColor:`${P.dark}33` }}/> : 'Registrar Vehículo'}
        </button>
      </div>
    </div>
  )
}

/* ── Modal Multas por Placa ──────────────────────────────────────── */
const MultasDrawer = ({ placa, onClose }) => {
  const [multas, setMultas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getMultasPorPlaca(placa)
      .then(({ data }) => setMultas(data.multas ?? []))
      .catch(() => setMultas([]))
      .finally(() => setLoading(false))
  }, [placa])

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:560 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={16} color="#c9860a"/>
            <h3 style={{ fontWeight:700, color:P.dark }}>Multas — <span style={{ color:P.teal }}>{placa}</span></h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={18}/></button>
        </div>
        {loading
          ? <div style={{ textAlign:'center', padding:32 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
          : multas.length === 0
            ? <p style={{ textAlign:'center', color:'var(--text-2)', padding:24, fontSize:'0.88rem' }}>Sin multas para esta placa ✓</p>
            : <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:360, overflowY:'auto' }}>
                {multas.map((m,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f5faf9', border:'1px solid var(--border)', borderRadius:9 }}>
                    <div>
                      <p style={{ fontSize:'0.82rem', fontWeight:600, color:P.dark }}>{m.tipo_infraccion}</p>
                      <p style={{ fontSize:'0.72rem', color:'var(--text-2)', marginTop:2 }}>{m.velocidad} km/h · {new Date(m.createdAt).toLocaleDateString('es-GT')}</p>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:'0.88rem', fontWeight:700, color:'#c9860a' }}>Q{parseFloat(m.monto_multa||0).toFixed(2)}</p>
                      <span className={`badge ${m.estado==='PAGADA'?'badge-green':'badge-yellow'}`} style={{ fontSize:'0.68rem' }}>{m.estado}</span>
                    </div>
                  </div>
                ))}
              </div>}
      </div>
    </div>
  )
}

/* ── Modal Confirmar Eliminar ────────────────────────────────────── */
const ConfirmDeleteModal = ({ vehiculo, onClose, onConfirm }) => {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    setDeleting(true)
    await onConfirm(vehiculo.id)
    setDeleting(false)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:380 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontWeight:700, color:P.dark }}>Eliminar Vehículo</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={18}/></button>
        </div>

        <div style={{ padding:'14px 16px', background:'#fde8e8', border:'1px solid rgba(192,57,43,0.2)', borderRadius:10, marginBottom:20 }}>
          <p style={{ fontSize:'0.88rem', color:'#c0392b', fontWeight:600, marginBottom:6 }}>
            ¿Eliminar el vehículo <strong>{vehiculo.placa}</strong>?
          </p>
          <p style={{ fontSize:'0.8rem', color:'#c0392b', opacity:0.8 }}>
            {vehiculo.modelo} · {vehiculo.color} · {vehiculo.anio}
          </p>
          <p style={{ fontSize:'0.75rem', color:'#c0392b', marginTop:8, opacity:0.7 }}>
            Esta acción no se puede deshacer.
          </p>
        </div>

        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} className="btn-outline"
            style={{ flex:1, padding:'11px', justifyContent:'center', borderColor:'var(--text-2)', color:'var(--text-2)' }}>
            Cancelar
          </button>
          <button onClick={handleDelete} disabled={deleting} className="btn-danger"
            style={{ flex:1, padding:'11px', justifyContent:'center', display:'flex', alignItems:'center', gap:6, border:'none', background:'#c0392b', color:'#fff', borderRadius:8, cursor:'pointer', fontWeight:600, fontSize:'0.88rem' }}>
            {deleting
              ? <span className="spinner" style={{ borderTopColor:'#fff', borderColor:'rgba(255,255,255,0.3)', width:15, height:15 }}/>
              : <><Trash2 size={14}/> Eliminar</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Página Principal ────────────────────────────────────────────── */
const VehiculosPage = () => {
  const [vehiculos,    setVehiculos]    = useState([])
  const [loading,      setLoading]      = useState(true)
  const [search,       setSearch]       = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [multasPlaca,  setMultasPlaca]  = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const { users } = useAdminStore()

  const load = () => {
    setLoading(true)
    getVehiculos()
      .then(({ data }) => setVehiculos(data.vehiculos ?? data.data ?? []))
      .catch(() => setVehiculos([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleDelete = async (id) => {
    try {
      // Llamada al endpoint DELETE /trafico/vehiculos/:id
      const { default: axios } = await import('axios')
      const token = localStorage.getItem('token')
      await axios.delete(
        `${import.meta.env.VITE_TRAFICO_URL || 'http://localhost:3006/api/v1'}/trafico/vehiculos/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      toastSuccess('Vehículo eliminado correctamente')
      setDeleteTarget(null)
      load()
    } catch (err) {
      toastError(err.response?.data?.message || 'Error al eliminar vehículo')
    }
  }

  const filtered = vehiculos.filter(v =>
    v.placa?.toLowerCase().includes(search.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    v.color?.toLowerCase().includes(search.toLowerCase())
  )

  const findOwner = (placa) => {
    const u = users.find(u => (u.placa ?? u.UserProfile?.Placa ?? '').toUpperCase() === (placa||'').toUpperCase())
    return u ? `${u.name||''} ${u.surname||''}`.trim() || u.username : '—'
  }

  return (
    <>
      {showRegister  && <RegisterVehiculoModal onClose={()=>setShowRegister(false)} onSaved={load}/>}
      {multasPlaca   && <MultasDrawer placa={multasPlaca} onClose={()=>setMultasPlaca(null)}/>}
      {deleteTarget  && <ConfirmDeleteModal vehiculo={deleteTarget} onClose={()=>setDeleteTarget(null)} onConfirm={handleDelete}/>}

      <div className="page-content">
        <p className="page-title">Vehículos Registrados</p>
        <p className="page-subtitle">Consulta placas, propietarios y multas asociadas</p>

        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <h3 style={{ fontWeight:700, fontSize:'1rem', color:P.dark, display:'flex', alignItems:'center', gap:8 }}>
              <Car size={16} color={P.teal}/> Vehículos ({filtered.length})
            </h3>
            <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
              <div style={{ position:'relative' }}>
                <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)' }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar placa o modelo..."
                  className="form-input" style={{ paddingLeft:30, width:210, fontSize:'0.85rem', padding:'8px 12px 8px 30px' }}/>
              </div>
              <button onClick={()=>setShowRegister(true)} className="btn-success" style={{ padding:'8px 16px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:5 }}>
                <Plus size={14}/> Registrar
              </button>
            </div>
          </div>

          {loading
            ? <div style={{ textAlign:'center', padding:40 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
            : (
              <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Modelo</th>
                      <th className="hide-mobile">Color</th>
                      <th className="hide-mobile">Año</th>
                      <th className="hide-tablet">Propietario</th>
                      <th>Multas</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((v,i) => (
                      <tr key={v.id||i}>
                        <td style={{ fontWeight:700, color:P.teal }}>{v.placa}</td>
                        <td>{v.modelo}</td>
                        <td className="hide-mobile">
                          <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                            <span style={{ width:11, height:11, borderRadius:'50%', background:v.color?.toLowerCase()||'#ccc', border:'1px solid var(--border)', display:'inline-block', flexShrink:0 }}/>
                            {v.color}
                          </div>
                        </td>
                        <td className="hide-mobile">{v.anio}</td>
                        <td className="hide-tablet" style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>{findOwner(v.placa)}</td>
                        <td>
                          <button onClick={()=>setMultasPlaca(v.placa)}
                            style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', background:`${P.teal}10`, border:`1px solid ${P.teal}25`, borderRadius:6, cursor:'pointer', color:P.teal, fontSize:'0.75rem', fontWeight:600, transition:'all 0.2s' }}
                            onMouseEnter={e=>e.currentTarget.style.background=`${P.teal}22`}
                            onMouseLeave={e=>e.currentTarget.style.background=`${P.teal}10`}>
                            <AlertTriangle size={11}/> Ver multas
                          </button>
                        </td>
                        <td>
                          <div style={{ display:'flex', gap:6 }}>
                            <button onClick={()=>setMultasPlaca(v.placa)} className="btn-outline"
                              style={{ padding:'4px 10px', fontSize:'0.75rem' }}>
                              Detalle
                            </button>
                            <button onClick={()=>setDeleteTarget(v)}
                              style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', background:'rgba(192,57,43,0.08)', border:'1px solid rgba(192,57,43,0.25)', borderRadius:6, cursor:'pointer', color:'#c0392b', fontSize:'0.75rem', fontWeight:500, transition:'all 0.2s' }}
                              onMouseEnter={e=>e.currentTarget.style.background='rgba(192,57,43,0.16)'}
                              onMouseLeave={e=>e.currentTarget.style.background='rgba(192,57,43,0.08)'}>
                              <Trash2 size={11}/> Eliminar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filtered.length===0 && (
                      <tr><td colSpan={7} style={{ textAlign:'center', padding:32, color:'var(--text-2)' }}>Sin vehículos registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      </div>
    </>
  )
}
export default VehiculosPage