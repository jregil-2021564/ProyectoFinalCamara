import { useState, useEffect } from 'react'
import { Car, Search, AlertTriangle, Plus, X } from 'lucide-react'
import { getVehiculos, registrarVehiculo, getMultasPorPlaca } from '../../profile/api/profileApi'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import useAdminStore from '../store/adminStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD' }

const RegisterVehiculoModal = ({ onClose, onSaved }) => {
  const [form, setForm] = useState({ placa:'', modelo:'', color:'', anio:'' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!form.placa||!form.modelo||!form.color||!form.anio) { toastError('Todos los campos son requeridos'); return }
    setSaving(true)
    try {
      await registrarVehiculo({ ...form, placa: form.placa.toUpperCase() })
      toastSuccess('Vehículo registrado')
      onSaved()
      onClose()
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
            <input className="form-input" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:k==='placa'?e.target.value.toUpperCase():e.target.value}))} placeholder={p}
              style={k==='placa'?{textTransform:'uppercase'}:{}}/>
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="btn-success" style={{ width:'100%', padding:'12px', fontSize:'0.88rem', justifyContent:'center' }}>
          {saving ? <span className="spinner" style={{ borderTopColor:P.dark, borderColor:`${P.dark}33` }}/> : 'Registrar Vehículo'}
        </button>
      </div>
    </div>
  )
}

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
        {loading ? <div style={{ textAlign:'center', padding:32 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
        : multas.length === 0 ? <p style={{ textAlign:'center', color:'var(--text-2)', padding:24, fontSize:'0.88rem' }}>Sin multas para esta placa ✓</p>
        : (
          <div style={{ display:'flex', flexDirection:'column', gap:10, maxHeight:360, overflowY:'auto' }}>
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
          </div>
        )}
      </div>
    </div>
  )
}

const VehiculosPage = () => {
  const [vehiculos, setVehiculos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showRegister, setShowRegister] = useState(false)
  const [multasPlaca, setMultasPlaca] = useState(null)
  const { users } = useAdminStore()

  const load = () => {
    setLoading(true)
    getVehiculos()
      .then(({ data }) => setVehiculos(data.vehiculos ?? data.data ?? []))
      .catch(() => setVehiculos([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = vehiculos.filter(v =>
    v.placa?.toLowerCase().includes(search.toLowerCase()) ||
    v.modelo?.toLowerCase().includes(search.toLowerCase()) ||
    v.color?.toLowerCase().includes(search.toLowerCase())
  )

  // Buscar dueño por placa en lista de usuarios
  const findOwner = (placa) => {
    const u = users.find(u => (u.placa ?? u.UserProfile?.Placa ?? '').toUpperCase() === (placa||'').toUpperCase())
    return u ? `${u.name||''} ${u.surname||''}`.trim() || u.username : '—'
  }

  return (
    <>
      {showRegister && <RegisterVehiculoModal onClose={()=>setShowRegister(false)} onSaved={load}/>}
      {multasPlaca && <MultasDrawer placa={multasPlaca} onClose={()=>setMultasPlaca(null)}/>}

      <div className="page-content">
        <p className="page-title">Vehículos Registrados</p>
        <p className="page-subtitle">Consulta las placas registradas, sus propietarios y multas asociadas</p>

        <div className="card">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 }}>
            <h3 style={{ fontWeight:700, fontSize:'1rem', color:P.dark, display:'flex', alignItems:'center', gap:8 }}>
              <Car size={16} color={P.teal}/> Vehículos ({filtered.length})
            </h3>
            <div style={{ display:'flex', gap:10 }}>
              <div style={{ position:'relative' }}>
                <Search size={14} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)' }}/>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Buscar placa o modelo..."
                  className="form-input" style={{ paddingLeft:30, width:220, fontSize:'0.85rem', padding:'8px 12px 8px 30px' }}/>
              </div>
              <button onClick={()=>setShowRegister(true)} className="btn-success" style={{ padding:'8px 16px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:6 }}>
                <Plus size={14}/> Registrar
              </button>
            </div>
          </div>

          {loading ? <div style={{ textAlign:'center', padding:40 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
          : (
            <div style={{ overflowX:'auto' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    {['Placa','Modelo','Color','Año','Propietario','Multas','Acciones'].map(h=>(
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v,i) => (
                    <tr key={v.id||i}>
                      <td style={{ fontWeight:700, color:P.teal }}>{v.placa}</td>
                      <td>{v.modelo}</td>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:7 }}>
                          <span style={{ width:12, height:12, borderRadius:'50%', background:v.color?.toLowerCase()||'#ccc', border:'1px solid var(--border)', display:'inline-block', flexShrink:0 }}/>
                          {v.color}
                        </div>
                      </td>
                      <td>{v.anio}</td>
                      <td style={{ color:'var(--text-2)', fontSize:'0.82rem' }}>{findOwner(v.placa)}</td>
                      <td>
                        <button onClick={()=>setMultasPlaca(v.placa)}
                          style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', background:`${P.teal}10`, border:`1px solid ${P.teal}25`, borderRadius:6, cursor:'pointer', color:P.teal, fontSize:'0.75rem', fontWeight:600, transition:'all 0.2s' }}
                          onMouseEnter={e=>e.currentTarget.style.background=`${P.teal}22`}
                          onMouseLeave={e=>e.currentTarget.style.background=`${P.teal}10`}>
                          <AlertTriangle size={11}/> Ver multas
                        </button>
                      </td>
                      <td>
                        <button onClick={()=>setMultasPlaca(v.placa)} className="btn-outline" style={{ padding:'5px 10px', fontSize:'0.75rem' }}>
                          Detalle
                        </button>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
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