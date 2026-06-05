import { useState } from 'react'
import { Activity, Plus, X, CheckCircle, CreditCard, Wallet, ArrowRight } from 'lucide-react'
import useRecargas from '../hooks/useRecargas'
import useTarjetas from '../hooks/useTarjetas'
import useUserStore from '../store/userStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import useNotifStore, { NOTIF_TYPES } from '../../../shared/store/notifStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB' }
const CARD_COLORS = ['#468189','#3d8b6e','#7c3aed','#c9860a','#c0392b']

const RecargarModal = ({ tarjetas, saldoActual, onClose, onRecargar }) => {
  const [tarjetaId,   setTarjetaId]   = useState(tarjetas[0] ? String(tarjetas[0]._id||tarjetas[0].id||'') : '')
  const [monto,       setMonto]       = useState('')
  const [saving,      setSaving]      = useState(false)

  const tarjetaSel = tarjetas.find(t => String(t._id||t.id||'') === tarjetaId)
  const montoNum   = parseFloat(monto) || 0
  const nuevoSaldo = saldoActual + montoNum

  const handleRecargar = async () => {
    if (!tarjetaId) { toastError('Selecciona una tarjeta'); return }
    if (!montoNum || montoNum < 10)  { toastError('El monto mínimo es Q10.00'); return }
    if (montoNum > 5000)             { toastError('El monto máximo es Q5,000.00'); return }
    setSaving(true)
    const res = await onRecargar(tarjetaId, montoNum)
    setSaving(false)
    if (res.ok) { toastSuccess(res.message || 'Recarga exitosa'); onClose() }
    else toastError(res.message)
  }

  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:420 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:`${P.teal}12`, border:`1px solid ${P.teal}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
              <Wallet size={16} color={P.teal}/>
            </div>
            <h3 style={{ fontWeight:700, color:P.dark, fontSize:'1rem' }}>Nueva Recarga</h3>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={18}/></button>
        </div>

        {/* Saldo actual */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', alignItems:'center', gap:10, marginBottom:18, padding:'14px 16px', background:`${P.teal}08`, border:`1px solid ${P.teal}22`, borderRadius:10 }}>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:'0.68rem', color:'var(--text-2)', marginBottom:3 }}>SALDO ACTUAL</p>
            <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'1.1rem', color:P.dark }}>Q{saldoActual.toFixed(2)}</p>
          </div>
          <ArrowRight size={18} color={P.tealMid}/>
          <div style={{ textAlign:'center' }}>
            <p style={{ fontSize:'0.68rem', color:'var(--text-2)', marginBottom:3 }}>SALDO DESPUÉS</p>
            <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'1.1rem', color: montoNum>0 ? '#3d8b6e' : P.dark }}>
              Q{nuevoSaldo.toFixed(2)}
            </p>
          </div>
        </div>

        {/* Seleccionar tarjeta */}
        <div style={{ marginBottom:14 }}>
          <label className="form-label">TARJETA A USAR</label>
          {tarjetas.length === 0
            ? <div style={{ padding:'12px', background:'#fde8e8', border:'1px solid rgba(192,57,43,0.2)', borderRadius:8 }}>
                <p style={{ fontSize:'0.82rem', color:'#c0392b' }}>No tienes tarjetas verificadas. Agrega y verifica una primero.</p>
              </div>
            : <>
                <select className="form-input" value={tarjetaId} onChange={e=>setTarjetaId(e.target.value)}>
                  {tarjetas.map((t,i) => {
                    const id = String(t._id||t.id||'')
                    return (
                      <option key={id} value={id}>
                        {t.alias || `${t.marca} **** ${t.ultimosDigitos}`} — Disponible: {t.saldoDisponible || '—'}
                      </option>
                    )
                  })}
                </select>

                {/* Detalle tarjeta seleccionada */}
                {tarjetaSel && (
                  <div style={{ marginTop:10, display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {[
                      { label:'Tarjeta',    value: tarjetaSel.numero || `**** ${tarjetaSel.ultimosDigitos}` },
                      { label:'Titular',    value: tarjetaSel.titular || tarjetaSel.nombreTitular || '—' },
                      { label:'Disponible', value: tarjetaSel.saldoDisponible || '—', color:P.teal },
                      { label:'Límite',     value: tarjetaSel.limiteCredito || '—' },
                    ].map(f => (
                      <div key={f.label} style={{ padding:'8px 10px', background:'#f5faf9', borderRadius:7, border:'1px solid var(--border)' }}>
                        <p style={{ fontSize:'0.62rem', color:'var(--text-2)', marginBottom:2 }}>{f.label}</p>
                        <p style={{ fontSize:'0.8rem', fontWeight:600, color: f.color || P.dark }}>{f.value}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>}
        </div>

        {/* Monto */}
        <div style={{ marginBottom:18 }}>
          <label className="form-label">MONTO A RECARGAR (Q)</label>
          <input className="form-input" type="number"
            value={monto} onChange={e=>setMonto(e.target.value)}
            placeholder="500.00" min="10" max="5000" step="0.01"
            style={{ fontSize:'1.1rem', fontWeight:600, textAlign:'center' }}/>
          <p style={{ fontSize:'0.7rem', color:'var(--text-2)', marginTop:4 }}>Mínimo Q10.00 · Máximo Q5,000.00 por recarga</p>
        </div>

        <button onClick={handleRecargar} disabled={saving||!tarjetaId||!monto||tarjetas.length===0} className="btn-primary">
          {saving ? <span className="spinner"/> : <><Plus size={15}/> Recargar Q{montoNum>0?montoNum.toFixed(2):'0.00'}</>}
        </button>
      </div>
    </div>
  )
}

const RecargasPanel = () => {
  const { recargas, loading, agregarRecarga } = useRecargas()
  const { tarjetas }                          = useTarjetas()
  const { saldo }                             = useUserStore()
  const { add }                               = useNotifStore()
  const [showModal, setShowModal]             = useState(false)

  const saldoNum = saldo?.saldoNumerico ?? parseFloat(saldo?.saldoActual?.replace('Q','') ?? 0)

  const handleRecargar = async (tarjetaId, monto) => {
    const res = await agregarRecarga(tarjetaId, monto)
    if (res.ok) add(NOTIF_TYPES.RECARGA, 'Recarga exitosa', res.message || `Se recargaron Q${monto} a tu cuenta.`)
    return res
  }

  return (
    <>
      {showModal && <RecargarModal tarjetas={tarjetas} saldoActual={saldoNum} onClose={()=>setShowModal(false)} onRecargar={handleRecargar}/>}

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:P.dark, display:'flex', alignItems:'center', gap:8 }}>
            <Activity size={16} color={P.teal}/> Historial de Recargas
          </h3>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {/* Saldo rápido */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'5px 12px', background:`${P.teal}0a`, border:`1px solid ${P.teal}22`, borderRadius:20 }}>
              <Wallet size={12} color={P.teal}/>
              <span style={{ fontSize:'0.78rem', fontWeight:700, color:P.teal }}>Q{saldoNum.toFixed(2)}</span>
            </div>
            <button onClick={()=>setShowModal(true)} className="btn-success"
              style={{ padding:'7px 14px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:4 }}>
              <Plus size={13}/> Nueva Recarga
            </button>
          </div>
        </div>

        {loading
          ? <div style={{ textAlign:'center', padding:32 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
          : recargas.length === 0
            ? <p style={{ textAlign:'center', color:'var(--text-2)', padding:24, fontSize:'0.875rem' }}>Sin recargas registradas</p>
            : <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {recargas.map((r, i) => (
                  <div key={r.id||r._id||i}
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 14px', background:'#f5faf9', border:'1px solid var(--border)', borderRadius:9 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:36, height:36, borderRadius:'50%', background:'#d1f0e8', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                        <CheckCircle size={16} color="#3d8b6e"/>
                      </div>
                      <div>
                        <p style={{ fontWeight:700, color:P.dark, fontSize:'0.92rem' }}>{r.monto}</p>
                        <p style={{ fontSize:'0.75rem', color:'var(--text-2)' }}>{r.tarjeta || '—'}</p>
                        {r.referencia && <p style={{ fontSize:'0.65rem', color:`${P.tealLight}99`, marginTop:1 }}>Ref: {r.referencia?.slice(0,16)}…</p>}
                      </div>
                    </div>
                    <div style={{ textAlign:'right' }}>
                      <p style={{ fontSize:'0.75rem', color:'var(--text-2)', marginBottom:3 }}>
                        {r.fecha ? new Date(r.fecha).toLocaleDateString('es-GT') : '—'}
                      </p>
                      <span className={`badge ${r.estado==='APROBADA'?'badge-green':'badge-yellow'}`} style={{ fontSize:'0.68rem' }}>
                        {r.estado || 'Exitosa'}
                      </span>
                      {r.saldoNuevo && <p style={{ fontSize:'0.65rem', color:P.teal, marginTop:3 }}>Saldo: {r.saldoNuevo}</p>}
                    </div>
                  </div>
                ))}
              </div>}
      </div>
    </>
  )
}
export default RecargasPanel