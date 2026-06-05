import { useState } from 'react'
import { X, AlertTriangle, Car } from 'lucide-react'
import useAdminStore from '../store/adminStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import useNotifStore, { NOTIF_TYPES } from '../../../shared/store/notifStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2' }

const RegistrarInfraccionModal = ({ users, onClose, onSaved }) => {
  const { registrarInfraccion } = useAdminStore()
  const { add } = useNotifStore()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    placa:       '',
    velocidad:   '',
    paso_rojo:   false,
    modelo_ia:   '',
    color_ia:    '',
    anio_ia:     '',
  })

  // Auto-fill placa desde usuario seleccionado
  const [selectedUser, setSelectedUser] = useState('')
  const handleUserSelect = (e) => {
    const uid = e.target.value
    setSelectedUser(uid)
    const u = users.find(u => (u.id||u.Id) === uid)
    const placa = u?.placa ?? u?.UserProfile?.Placa ?? ''
    setForm(f => ({ ...f, placa: placa.toUpperCase() }))
  }

  const set = (k,v) => setForm(f => ({ ...f, [k]: v }))

  const handleSave = async () => {
    if (!form.placa) { toastError('La placa es requerida'); return }
    if (!form.velocidad && !form.paso_rojo) { toastError('Ingresa velocidad o marca paso en rojo'); return }

    setSaving(true)
    const payload = {
      placa:     form.placa.toUpperCase(),
      velocidad: parseFloat(form.velocidad) || 0,
      paso_rojo: form.paso_rojo,
      modelo_ia: form.modelo_ia || undefined,
      color_ia:  form.color_ia  || undefined,
      anio_ia:   form.anio_ia   || undefined,
    }
    const res = await registrarInfraccion(payload)
    setSaving(false)

    if (res.ok) {
      const monto = res.reporte?.monto_multa || ''
      toastSuccess(`Infracción registrada — ${monto}`)
      add(NOTIF_TYPES.MULTA, 'Nueva infracción registrada', `Placa ${payload.placa} · ${res.reporte?.tipo_infraccion || ''} · ${monto}`)
      onSaved()
      onClose()
    } else {
      toastError(res.message)
    }
  }

  // Calcular monto estimado en tiempo real
  const estimado = (() => {
    let m = 0
    if (form.paso_rojo) m += 1500
    const v = parseFloat(form.velocidad) || 0
    if (v > 60) m += (v - 60) * 20
    return m
  })()

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:480 }}>
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'rgba(201,134,10,0.12)', border:'1px solid rgba(201,134,10,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <AlertTriangle size={16} color="#c9860a"/>
            </div>
            <div>
              <h3 style={{ fontWeight:700, color:P.dark, fontSize:'1rem' }}>Registrar Infracción</h3>
              <p style={{ fontSize:'0.72rem', color:'var(--text-2)' }}>El sistema calculará el monto automáticamente</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)', padding:4 }}><X size={18}/></button>
        </div>

        {/* Seleccionar usuario (opcional) */}
        <div style={{ marginBottom:14 }}>
          <label className="form-label">USUARIO (opcional — auto-rellena placa)</label>
          <select className="form-input" value={selectedUser} onChange={handleUserSelect}>
            <option value="">— Selecciona un usuario registrado —</option>
            {users.map(u => (
              <option key={u.id||u.Id} value={u.id||u.Id}>
                {u.name||''} {u.surname||''} ({u.username}) — {u.placa ?? u.UserProfile?.Placa ?? 'sin placa'}
              </option>
            ))}
          </select>
        </div>

        {/* Placa */}
        <div style={{ marginBottom:14 }}>
          <label className="form-label">PLACA DEL VEHÍCULO *</label>
          <input className="form-input" value={form.placa} onChange={e=>set('placa',e.target.value.toUpperCase())}
            placeholder="P-123ABC" style={{ textTransform:'uppercase', letterSpacing:'0.05em' }}/>
        </div>

        {/* Velocidad + paso rojo */}
        <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label className="form-label">VELOCIDAD (km/h)</label>
            <input type="number" className="form-input" value={form.velocidad} onChange={e=>set('velocidad',e.target.value)}
              placeholder="ej. 95" min="0" max="300"/>
            {parseFloat(form.velocidad)>60 && (
              <p style={{ fontSize:'0.68rem', color:'#c0392b', marginTop:3 }}>⚠ Exceso: +{(parseFloat(form.velocidad)-60).toFixed(0)} km/h sobre límite</p>
            )}
          </div>
          <div style={{ display:'flex', flexDirection:'column', justifyContent:'center' }}>
            <label className="form-label">PASO EN ROJO</label>
            <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer', marginTop:4 }}>
              <input type="checkbox" checked={form.paso_rojo} onChange={e=>set('paso_rojo',e.target.checked)}
                style={{ width:16, height:16, accentColor:P.teal, cursor:'pointer' }}/>
              <span style={{ fontSize:'0.85rem', color:'var(--text)' }}>Sí, pasó semáforo en rojo</span>
            </label>
          </div>
        </div>

        {/* Datos vehículo (opcionales) */}
        <p style={{ fontSize:'0.72rem', fontWeight:600, color:'var(--text-2)', letterSpacing:'0.06em', marginBottom:10 }}>DATOS DEL VEHÍCULO (opcionales)</p>
        <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
          {[['modelo_ia','Modelo','Chevrolet Spark'],['color_ia','Color','Azul'],['anio_ia','Año','2020']].map(([k,l,p])=>(
            <div key={k}>
              <label className="form-label" style={{ fontSize:'0.68rem' }}>{l}</label>
              <input className="form-input" value={form[k]} onChange={e=>set(k,e.target.value)} placeholder={p} style={{ fontSize:'0.82rem' }}/>
            </div>
          ))}
        </div>

        {/* Monto estimado */}
        <div style={{ padding:'12px 14px', background: estimado>0 ? 'rgba(201,134,10,0.08)' : '#f5faf9', border:`1px solid ${estimado>0?'rgba(201,134,10,0.25)':'var(--border)'}`, borderRadius:8, marginBottom:18 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:'0.78rem', color:'var(--text-2)', fontWeight:500 }}>Monto estimado de la multa:</span>
            <span style={{ fontSize:'1.1rem', fontWeight:800, color: estimado>0?'#c9860a':P.teal, fontFamily:'Poppins,sans-serif' }}>
              {estimado>0 ? `Q${estimado.toFixed(2)}` : 'Q0.00'}
            </span>
          </div>
          {estimado>0 && (
            <p style={{ fontSize:'0.68rem', color:'var(--text-2)', marginTop:4 }}>
              {form.paso_rojo && '+ Q1,500 paso en rojo '}
              {parseFloat(form.velocidad)>60 && `+ Q${((parseFloat(form.velocidad)-60)*20).toFixed(0)} exceso velocidad`}
            </p>
          )}
        </div>

        {/* Botones */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} className="btn-outline" style={{ flex:1, padding:'11px', justifyContent:'center', borderColor:'var(--text-2)', color:'var(--text-2)' }}>
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving||(!form.placa||(estimado===0&&!form.paso_rojo))} className="btn-success" style={{ flex:2, padding:'11px', justifyContent:'center', fontSize:'0.88rem' }}>
            {saving
              ? <span className="spinner" style={{ borderTopColor:P.dark, borderColor:`${P.dark}33`, width:16, height:16 }}/>
              : <><AlertTriangle size={14}/> Registrar Infracción</>}
          </button>
        </div>
      </div>
    </div>
  )
}
export default RegistrarInfraccionModal