import { useState } from 'react'
import { Edit2, X, Search, RefreshCw } from 'lucide-react'
import useAdminStore from '../store/adminStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2' }

const EditModal = ({ multa, onClose }) => {
  const { actualizarMulta, fetchMultas } = useAdminStore()
  const [form, setForm] = useState({ placa:multa.placa??'', modelo:multa.modelo_detectado??'', color:multa.color_detectado??'', anio:multa.anio_detectado??'' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    const res = await actualizarMulta(multa._id??multa.id, form)
    setSaving(false)
    if (res.ok) { toastSuccess('Multa actualizada'); onClose() }
    else toastError(res.message)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:400 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:18 }}>
          <h3 style={{ fontWeight:700, color:P.dark }}>Editar Datos de Multa</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={17}/></button>
        </div>
        {[['placa','Placa'],['modelo','Modelo'],['color','Color'],['anio','Año']].map(([k,l])=>(
          <div key={k} style={{ marginBottom:12 }}>
            <label className="form-label">{l}</label>
            <input className="form-input" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:k==='placa'?e.target.value.toUpperCase():e.target.value}))}
              style={k==='placa'?{textTransform:'uppercase'}:{}}/>
          </div>
        ))}
        <button onClick={handleSave} disabled={saving} className="btn-success" style={{ width:'100%', padding:'11px', justifyContent:'center', marginTop:4 }}>
          {saving?<span className="spinner" style={{ borderTopColor:P.dark, borderColor:`${P.dark}33`, width:15, height:15 }}/>:'Guardar Cambios'}
        </button>
      </div>
    </div>
  )
}

const MultasTabla = ({ multas, loading, onRefresh, showSearch = false }) => {
  const { fetchMultasByPlaca, fetchMultas } = useAdminStore()
  const [search, setSearch] = useState('')
  const [editMulta, setEditMulta] = useState(null)

  const handleSearch = () => search.trim() ? fetchMultasByPlaca(search.trim().toUpperCase()) : fetchMultas()

  const list = showSearch ? multas : multas

  return (
    <>
      {editMulta && <EditModal multa={editMulta} onClose={()=>setEditMulta(null)}/>}

      <div className="card" style={{ padding:'16px 20px' }}>
        {showSearch && (
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap' }}>
            <div style={{ position:'relative', flex:1, minWidth:160 }}>
              <Search size={13} style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'var(--text-2)' }}/>
              <input value={search} onChange={e=>setSearch(e.target.value.toUpperCase())} onKeyDown={e=>e.key==='Enter'&&handleSearch()}
                placeholder="BUSCAR PLACA..." className="form-input"
                style={{ paddingLeft:28, fontSize:'0.82rem', padding:'8px 12px 8px 28px', textTransform:'uppercase', width:'100%' }}/>
            </div>
            <button onClick={handleSearch} className="btn-outline" style={{ padding:'7px 12px', fontSize:'0.78rem' }}>Buscar</button>
            <button onClick={onRefresh} style={{ display:'flex', alignItems:'center', gap:5, padding:'7px 12px', background:'rgba(70,129,137,0.08)', border:'1.5px solid rgba(70,129,137,0.2)', borderRadius:7, cursor:'pointer', color:P.teal, fontSize:'0.78rem' }}>
              <RefreshCw size={12}/> Refrescar
            </button>
          </div>
        )}

        {loading
          ? <div style={{ textAlign:'center', padding:32 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
          : list.length === 0
            ? <p style={{ textAlign:'center', color:'var(--text-2)', padding:24, fontSize:'0.88rem' }}>Sin infracciones registradas</p>
            : <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Tipo</th>
                      <th>Velocidad</th>
                      <th>Monto</th>
                      <th className="hide-mobile">Modelo</th>
                      <th className="hide-mobile">Color</th>
                      <th>Estado</th>
                      <th className="hide-tablet">Fecha</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m,i) => (
                      <tr key={m._id||i}>
                        <td style={{ fontWeight:700, color:P.teal }}>{m.placa}</td>
                        <td style={{ fontSize:'0.78rem', maxWidth:120, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.tipo_infraccion}</td>
                        <td style={{ color:m.velocidad>80?'#c0392b':'var(--text)', fontWeight:m.velocidad>80?700:400, whiteSpace:'nowrap' }}>{m.velocidad} km/h</td>
                        <td style={{ fontWeight:700, color:'#c9860a', whiteSpace:'nowrap' }}>Q{parseFloat(m.monto_multa||0).toFixed(2)}</td>
                        <td className="hide-mobile" style={{ color:'var(--text-2)', fontSize:'0.8rem' }}>{m.modelo_detectado||'—'}</td>
                        <td className="hide-mobile" style={{ color:'var(--text-2)', fontSize:'0.8rem' }}>{m.color_detectado||'—'}</td>
                        <td><span className={`badge ${m.estado==='PAGADA'?'badge-green':m.estado==='ANULADA'?'badge-gray':'badge-yellow'}`}>{m.estado}</span></td>
                        <td className="hide-tablet" style={{ fontSize:'0.78rem', color:'var(--text-2)' }}>{m.createdAt?new Date(m.createdAt).toLocaleDateString('es-GT'):'—'}</td>
                        <td>
                          <button onClick={()=>setEditMulta(m)} className="btn-outline" style={{ padding:'4px 9px', fontSize:'0.73rem', display:'inline-flex', alignItems:'center', gap:4 }}>
                            <Edit2 size={11}/> Editar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>}
      </div>
    </>
  )
}
export default MultasTabla