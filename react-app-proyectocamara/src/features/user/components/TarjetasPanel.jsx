import { useState } from 'react'
import { CreditCard, Plus, Trash2, X, CheckCircle, Eye, Wallet, Calendar, User, Hash, TrendingUp } from 'lucide-react'
import useTarjetas from '../hooks/useTarjetas'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD' }
const CARD_COLORS = ['#468189','#3d8b6e','#7c3aed','#c9860a','#c0392b']

/* ── Modal Agregar ───────────────────────────────────────────────── */
const AddModal = ({ onClose, onAdd }) => {
  const [form, setForm] = useState({ numeroTarjeta:'', fechaVencimiento:'', cvv:'', nombreTitular:'', tipoTarjeta:'CREDITO', alias:'' })
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    const { numeroTarjeta, fechaVencimiento, cvv, nombreTitular } = form
    if (!numeroTarjeta||!fechaVencimiento||!cvv||!nombreTitular) { toastError('Completa todos los campos requeridos'); return }
    setSaving(true)
    const res = await onAdd(form)
    setSaving(false)
    if (res.ok) { toastSuccess(res.message || 'Revisa tu correo para verificar la tarjeta'); onClose() }
    else toastError(res.message)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:420 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h3 style={{ fontWeight:700, color:P.dark }}>Agregar Tarjeta</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={18}/></button>
        </div>
        <div style={{ marginBottom:14 }}>
          <label className="form-label">NÚMERO DE TARJETA <span style={{ color:'#c0392b' }}>*</span></label>
          <input className="form-input" value={form.numeroTarjeta} onChange={e=>setForm(f=>({...f,numeroTarjeta:e.target.value}))} placeholder="5500 0000 0000 0004"/>
        </div>
        <div style={{ marginBottom:14 }}>
          <label className="form-label">NOMBRE DEL TITULAR <span style={{ color:'#c0392b' }}>*</span></label>
          <input className="form-input" value={form.nombreTitular} onChange={e=>setForm(f=>({...f,nombreTitular:e.target.value}))} placeholder="Juan Pérez"/>
        </div>
        <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label className="form-label">VENCIMIENTO (MM/AA) <span style={{ color:'#c0392b' }}>*</span></label>
            <input className="form-input" value={form.fechaVencimiento} onChange={e=>setForm(f=>({...f,fechaVencimiento:e.target.value}))} placeholder="12/29"/>
          </div>
          <div>
            <label className="form-label">CVV <span style={{ color:'#c0392b' }}>*</span></label>
            <input className="form-input" type="password" value={form.cvv} onChange={e=>setForm(f=>({...f,cvv:e.target.value}))} placeholder="123"/>
          </div>
        </div>
        <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:14 }}>
          <div>
            <label className="form-label">ALIAS</label>
            <input className="form-input" value={form.alias} onChange={e=>setForm(f=>({...f,alias:e.target.value}))} placeholder="Mi Visa"/>
          </div>
          <div>
            <label className="form-label">TIPO</label>
            <select className="form-input" value={form.tipoTarjeta} onChange={e=>setForm(f=>({...f,tipoTarjeta:e.target.value}))}>
              <option value="CREDITO">Crédito</option>
              <option value="DEBITO">Débito</option>
            </select>
          </div>
        </div>
        <div style={{ background:'#f5faf9', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', marginBottom:16 }}>
          <p style={{ fontSize:'0.75rem', color:'var(--text-2)' }}>📧 Recibirás un código de 6 dígitos en tu correo. Tienes 10 minutos para usarlo.</p>
        </div>
        <button onClick={handleSave} disabled={saving} className="btn-primary">
          {saving ? <span className="spinner"/> : <><Plus size={15}/> Agregar Tarjeta</>}
        </button>
      </div>
    </div>
  )
}

/* ── Modal Verificar ─────────────────────────────────────────────── */
const VerifyModal = ({ onClose, onVerify }) => {
  const [codigo, setCodigo] = useState('')
  const [saving, setSaving] = useState(false)
  const handleVerify = async () => {
    if (!/^\d{6}$/.test(codigo.trim())) { toastError('El código debe ser exactamente 6 dígitos'); return }
    setSaving(true)
    const res = await onVerify(codigo.trim())
    setSaving(false)
    if (res.ok) { toastSuccess('Tarjeta verificada y activada'); onClose() }
    else toastError(res.message)
  }
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:360 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
          <h3 style={{ fontWeight:700, color:P.dark }}>Verificar Tarjeta</h3>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={18}/></button>
        </div>
        <p style={{ fontSize:'0.82rem', color:'var(--text-2)', marginBottom:16, lineHeight:1.6 }}>Ingresa el código de 6 dígitos enviado a tu correo.</p>
        <label className="form-label">CÓDIGO DE VERIFICACIÓN</label>
        <input className="form-input" value={codigo} onChange={e=>setCodigo(e.target.value.replace(/\D/g,'').slice(0,6))}
          placeholder="123456" maxLength={6} style={{ marginBottom:16, letterSpacing:'0.2em', fontSize:'1.2rem', textAlign:'center', fontWeight:700 }}/>
        <button onClick={handleVerify} disabled={saving||codigo.length!==6} className="btn-primary">
          {saving ? <span className="spinner"/> : <><CheckCircle size={15}/> Verificar Código</>}
        </button>
      </div>
    </div>
  )
}

/* ── Modal Detalle Tarjeta ───────────────────────────────────────── */
const DetalleModal = ({ tarjeta, color, onClose, onDelete }) => {
  const [deleting, setDeleting] = useState(false)
  const id = String(tarjeta._id || tarjeta.id || '')

  const handleDelete = async () => {
    if (!window.confirm('¿Eliminar esta tarjeta?')) return
    setDeleting(true)
    const res = await onDelete(id)
    setDeleting(false)
    if (res.ok) { toastSuccess('Tarjeta eliminada'); onClose() }
    else toastError(res.message)
  }

  const rows = [
    { icon:<Hash size={14}/>,       label:'Número',           value: tarjeta.numero || `**** **** **** ${tarjeta.ultimosDigitos}` },
    { icon:<User size={14}/>,       label:'Titular',          value: tarjeta.titular || tarjeta.nombreTitular || '—' },
    { icon:<Calendar size={14}/>,   label:'Vencimiento',      value: tarjeta.vencimiento || tarjeta.fechaVencimiento || '—' },
    { icon:<CreditCard size={14}/>, label:'Tipo',             value: tarjeta.tipo || tarjeta.tipoTarjeta || '—' },
    { icon:<Wallet size={14}/>,     label:'Límite de crédito', value: tarjeta.limiteCredito || '—' },
    { icon:<TrendingUp size={14}/>, label:'Total recargado',  value: tarjeta.totalRecargado || '—' },
    { icon:<Wallet size={14}/>,     label:'Disponible',       value: tarjeta.saldoDisponible || '—', highlight: true },
  ]

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:440 }}>
        {/* Card visual mini */}
        <div style={{ background:`linear-gradient(135deg,${color},${color}cc)`, borderRadius:12, padding:'18px 20px', marginBottom:20, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.07)' }}/>
          <div style={{ position:'absolute', bottom:-30, left:-10, width:140, height:140, borderRadius:'50%', background:'rgba(255,255,255,0.05)' }}/>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:14 }}>
            <div>
              <p style={{ fontSize:'0.7rem', color:'rgba(255,255,255,0.6)', marginBottom:2 }}>{tarjeta.marca || ''} {tarjeta.tipo || tarjeta.tipoTarjeta || ''}</p>
              <p style={{ fontSize:'0.82rem', fontWeight:700, color:'rgba(255,255,255,0.9)', letterSpacing:'0.08em' }}>
                {tarjeta.alias || `${tarjeta.marca} **** ${tarjeta.ultimosDigitos}`}
              </p>
            </div>
            <button onClick={onClose} style={{ background:'rgba(255,255,255,0.15)', border:'none', borderRadius:6, padding:'4px 8px', cursor:'pointer', color:'#fff' }}><X size={14}/></button>
          </div>
          <p style={{ fontFamily:'monospace', fontSize:'1rem', color:'#fff', letterSpacing:'0.15em', marginBottom:10 }}>
            {tarjeta.numero || `**** **** **** ${tarjeta.ultimosDigitos}`}
          </p>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
            <div>
              <p style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.5)', marginBottom:2 }}>TITULAR</p>
              <p style={{ fontSize:'0.8rem', color:'#fff', fontWeight:600 }}>{tarjeta.titular || tarjeta.nombreTitular || '—'}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.5)', marginBottom:2 }}>VENCE</p>
              <p style={{ fontSize:'0.8rem', color:'#fff', fontWeight:600 }}>{tarjeta.vencimiento || tarjeta.fechaVencimiento || '—'}</p>
            </div>
          </div>
        </div>

        {/* Datos */}
        <div style={{ display:'flex', flexDirection:'column', gap:1, marginBottom:18 }}>
          {rows.map(r => (
            <div key={r.label} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 12px', background: r.highlight ? `${P.teal}08` : '#f5faf9', borderRadius:8, marginBottom:4, border: r.highlight ? `1px solid ${P.teal}22` : '1px solid var(--border)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, color:'var(--text-2)' }}>
                {r.icon}
                <span style={{ fontSize:'0.78rem', fontWeight:500 }}>{r.label}</span>
              </div>
              <span style={{ fontSize:'0.88rem', fontWeight: r.highlight ? 700 : 500, color: r.highlight ? P.teal : P.dark }}>
                {r.value}
              </span>
            </div>
          ))}
        </div>

        <button onClick={handleDelete} disabled={deleting} className="btn-danger"
          style={{ width:'100%', padding:'10px', justifyContent:'center', fontSize:'0.85rem' }}>
          {deleting ? <span className="spinner-dark" style={{ width:15, height:15 }}/> : <><Trash2 size={14}/> Eliminar esta tarjeta</>}
        </button>
      </div>
    </div>
  )
}

/* ── Panel principal ─────────────────────────────────────────────── */
const TarjetasPanel = () => {
  const { tarjetas, loading, agregarTarjeta, eliminarTarjeta, verificarTarjeta } = useTarjetas()
  const [showAdd,     setShowAdd]     = useState(false)
  const [showVerify,  setShowVerify]  = useState(false)
  const [detalle,     setDetalle]     = useState(null)
  const [detalleColor,setDetalleColor]= useState('')

  const openDetalle = (t, color) => { setDetalle(t); setDetalleColor(color) }

  return (
    <>
      {showAdd   && <AddModal    onClose={()=>setShowAdd(false)}    onAdd={agregarTarjeta}/>}
      {showVerify&& <VerifyModal onClose={()=>setShowVerify(false)} onVerify={verificarTarjeta}/>}
      {detalle   && <DetalleModal tarjeta={detalle} color={detalleColor} onClose={()=>setDetalle(null)} onDelete={eliminarTarjeta}/>}

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:P.dark, display:'flex', alignItems:'center', gap:8 }}>
            <CreditCard size={16} color={P.teal}/> Mis Tarjetas
            {tarjetas.length > 0 && <span className="badge badge-green">{tarjetas.length} activa{tarjetas.length>1?'s':''}</span>}
          </h3>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setShowVerify(true)} className="btn-outline"
              style={{ padding:'6px 12px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
              <CheckCircle size={13}/> Verificar código
            </button>
            <button onClick={()=>setShowAdd(true)} className="btn-success"
              style={{ padding:'6px 12px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={13}/> Agregar
            </button>
          </div>
        </div>

        {loading
          ? <div style={{ textAlign:'center', padding:32 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
          : tarjetas.length === 0
            ? <div style={{ textAlign:'center', padding:'28px 16px' }}>
                <p style={{ color:'var(--text-2)', fontSize:'0.875rem', marginBottom:8 }}>Sin tarjetas registradas</p>
                <p style={{ color:'var(--text-2)', fontSize:'0.78rem' }}>Agrega una tarjeta y verifica el código que llegará a tu correo.</p>
              </div>
            : <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(220px,1fr))', gap:16 }}>
                {tarjetas.map((t, i) => {
                  const color = CARD_COLORS[i % CARD_COLORS.length]
                  const disp  = t.saldoDisponible || '—'
                  const total = t.limiteCredito   || '—'
                  const usado = t.totalRecargado  || 'Q0.00'
                  // Barra de uso
                  const pct = (() => {
                    const lim = parseFloat(String(total).replace(/[^0-9.]/g,''))
                    const rec = parseFloat(String(usado).replace(/[^0-9.]/g,''))
                    if (!lim) return 0
                    return Math.min(100, Math.round((rec / lim) * 100))
                  })()

                  return (
                    <div key={String(t._id||t.id||i)} style={{ borderRadius:14, overflow:'hidden', boxShadow:'0 4px 16px rgba(3,25,38,0.12)', cursor:'pointer', transition:'transform 0.2s, box-shadow 0.2s' }}
                      onClick={()=>openDetalle(t, color)}
                      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow='0 8px 24px rgba(3,25,38,0.18)' }}
                      onMouseLeave={e=>{ e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow='0 4px 16px rgba(3,25,38,0.12)' }}>

                      {/* Card face */}
                      <div style={{ background:`linear-gradient(135deg,${color},${color}cc)`, padding:'18px 18px 14px', position:'relative', overflow:'hidden' }}>
                        <div style={{ position:'absolute', top:-15, right:-15, width:80, height:80, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }}/>
                        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
                          <CreditCard size={18} color="rgba(255,255,255,0.8)"/>
                          <div style={{ display:'flex', alignItems:'center', gap:5, background:'rgba(255,255,255,0.15)', borderRadius:10, padding:'2px 8px' }}>
                            <Eye size={10} color="rgba(255,255,255,0.7)"/>
                            <span style={{ fontSize:'0.62rem', color:'rgba(255,255,255,0.7)' }}>Ver detalle</span>
                          </div>
                        </div>
                        <p style={{ fontFamily:'monospace', fontSize:'0.95rem', color:'#fff', letterSpacing:'0.12em', marginBottom:10 }}>
                          {t.numero || `**** **** **** ${t.ultimosDigitos || '——'}`}
                        </p>
                        <div style={{ display:'flex', justifyContent:'space-between' }}>
                          <div>
                            <p style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.5)', marginBottom:1 }}>TITULAR</p>
                            <p style={{ fontSize:'0.72rem', color:'#fff', fontWeight:600 }}>{t.titular || t.nombreTitular || '—'}</p>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <p style={{ fontSize:'0.58rem', color:'rgba(255,255,255,0.5)', marginBottom:1 }}>VENCE</p>
                            <p style={{ fontSize:'0.72rem', color:'#fff', fontWeight:600 }}>{t.vencimiento || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Card footer — saldo */}
                      <div style={{ background:'#fff', padding:'12px 16px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                          <div>
                            <p style={{ fontSize:'0.62rem', color:'var(--text-2)', marginBottom:2 }}>DISPONIBLE</p>
                            <p style={{ fontSize:'1rem', fontWeight:800, color:P.teal, fontFamily:'Poppins,sans-serif' }}>{disp}</p>
                          </div>
                          <div style={{ textAlign:'right' }}>
                            <p style={{ fontSize:'0.62rem', color:'var(--text-2)', marginBottom:2 }}>LÍMITE</p>
                            <p style={{ fontSize:'0.82rem', fontWeight:600, color:P.dark }}>{total}</p>
                          </div>
                        </div>
                        {/* Barra de uso */}
                        <div style={{ height:4, background:'#e8f0ee', borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${pct}%`, background:`linear-gradient(90deg,${P.teal},${P.tealMid})`, borderRadius:2, transition:'width 0.5s' }}/>
                        </div>
                        <p style={{ fontSize:'0.62rem', color:'var(--text-2)', marginTop:4 }}>{pct}% utilizado · {t.alias || `${t.marca||''} **** ${t.ultimosDigitos||''}`}</p>
                      </div>
                    </div>
                  )
                })}
              </div>}
      </div>
    </>
  )
}
export default TarjetasPanel