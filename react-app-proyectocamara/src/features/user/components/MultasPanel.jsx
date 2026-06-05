import { useState } from 'react'
import { AlertTriangle, CreditCard, X, Wallet, CheckCircle, ArrowRight } from 'lucide-react'
import useUserStore from '../store/userStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import useNotifStore, { NOTIF_TYPES } from '../../../shared/store/notifStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB' }

/* ── Modal de pago ────────────────────────────────────────────────── */
const PagarModal = ({ multa, tarjetasParaPagar, saldoNum, onClose, onPagarTarjeta, onPagarSaldo }) => {
  const [metodo,    setMetodo]    = useState('saldo')   // 'saldo' | 'tarjeta'
  const [tarjetaId, setTarjetaId] = useState(
    tarjetasParaPagar.find(t => t.alcanzaParaPagar)?.tarjetaId || ''
  )
  const [paying, setPaying] = useState(false)
  const [recibo, setRecibo] = useState(null)

  const monto      = parseFloat(String(multa.montoMulta || multa.monto_multa || multa.monto || 0).replace('Q','').replace(',',''))
  const montoStr   = `Q${monto.toFixed(2)}`
  const tieneSaldo = saldoNum >= monto
  const tarjetaSel = tarjetasParaPagar.find(t => t.tarjetaId === tarjetaId)

  const handlePagar = async () => {
    setPaying(true)
    let res
    if (metodo === 'saldo') {
      res = await onPagarSaldo(multa.id || multa._id)
    } else {
      if (!tarjetaId) { toastError('Selecciona una tarjeta'); setPaying(false); return }
      res = await onPagarTarjeta(multa.id || multa._id, tarjetaId)
    }
    setPaying(false)
    if (res.ok) {
      toastSuccess('Multa pagada exitosamente')
      setRecibo(res.recibo)
    } else {
      toastError(res.message)
    }
  }

  // ── Vista recibo ──────────────────────────────────────────────
  if (recibo) return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:400 }}>
        <div style={{ textAlign:'center', padding:'8px 0 20px' }}>
          <div style={{ width:60, height:60, borderRadius:'50%', background:'#d1f0e8', border:'2px solid #3d8b6e', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 14px' }}>
            <CheckCircle size={28} color="#3d8b6e"/>
          </div>
          <h3 style={{ fontWeight:700, color:P.dark, fontSize:'1.1rem', marginBottom:4 }}>¡Pago Exitoso!</h3>
          <p style={{ fontSize:'0.8rem', color:'var(--text-2)' }}>Tu multa ha sido pagada correctamente</p>
        </div>

        <div style={{ background:'#f5faf9', border:'1px solid var(--border)', borderRadius:10, padding:'14px 16px', marginBottom:20 }}>
          {[
            { label:'Placa',          value: recibo?.placa || multa.placa },
            { label:'Monto pagado',   value: recibo?.monto || montoStr,       color:'#3d8b6e' },
            { label:'Método',         value: metodo==='saldo' ? 'Saldo de cuenta' : `Tarjeta ${tarjetaSel?.tarjeta||''}` },
            { label:'Saldo anterior', value: recibo?.saldoAnterior || '—' },
            { label:'Saldo actual',   value: recibo?.saldoActual   || '—',    color:P.teal },
            { label:'Fecha de pago',  value: recibo?.fechaDePago   || new Date().toLocaleString('es-GT') },
          ].map(f => (
            <div key={f.label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid #e8f0ee' }}>
              <span style={{ fontSize:'0.78rem', color:'var(--text-2)' }}>{f.label}</span>
              <span style={{ fontSize:'0.82rem', fontWeight:600, color: f.color || P.dark }}>{f.value}</span>
            </div>
          ))}
        </div>

        <button onClick={onClose} className="btn-primary">Cerrar</button>
      </div>
    </div>
  )

  // ── Vista pago ────────────────────────────────────────────────
  return (
    <div className="modal-overlay">
      <div className="modal-box" style={{ maxWidth:440 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:34, height:34, borderRadius:8, background:'rgba(201,134,10,0.12)', border:'1px solid rgba(201,134,10,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <AlertTriangle size={16} color="#c9860a"/>
            </div>
            <div>
              <h3 style={{ fontWeight:700, color:P.dark, fontSize:'1rem' }}>Pagar Multa</h3>
              <p style={{ fontSize:'0.7rem', color:'var(--text-2)' }}>Elige cómo quieres pagar</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={18}/></button>
        </div>

        {/* Detalle multa */}
        <div style={{ background:'#fef3c7', border:'1px solid #fde68a', borderRadius:10, padding:'12px 16px', marginBottom:18 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <p style={{ fontSize:'0.7rem', color:'#92400e', marginBottom:2 }}>Monto a pagar</p>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'1.5rem', color:'#92400e', lineHeight:1 }}>{montoStr}</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <p style={{ fontSize:'0.7rem', color:'#b45309', marginBottom:2 }}>Placa</p>
              <p style={{ fontWeight:700, color:'#92400e', fontSize:'0.95rem' }}>{multa.placa}</p>
              <p style={{ fontSize:'0.68rem', color:'#b45309', marginTop:2 }}>{multa.tipoInfraccion || multa.tipo_infraccion || ''}</p>
            </div>
          </div>
        </div>

        {/* Selector de método */}
        <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-2)', letterSpacing:'0.06em', marginBottom:10 }}>MÉTODO DE PAGO</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:18 }}>

          {/* Opción: Saldo de cuenta */}
          <button onClick={()=>setMetodo('saldo')}
            style={{ padding:'14px 12px', borderRadius:10, border:`2px solid ${metodo==='saldo'?P.teal:'var(--border)'}`, background: metodo==='saldo'?`${P.teal}08`:'#fff', cursor:'pointer', textAlign:'left', transition:'all 0.2s', position:'relative' }}>
            {metodo==='saldo' && <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', background:P.teal, display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle size={10} color="#fff"/></div>}
            <Wallet size={20} color={metodo==='saldo'?P.teal:'var(--text-2)'} style={{ marginBottom:8 }}/>
            <p style={{ fontSize:'0.82rem', fontWeight:700, color: metodo==='saldo'?P.dark:'var(--text-2)', marginBottom:2 }}>Saldo de cuenta</p>
            <p style={{ fontSize:'0.75rem', fontWeight:700, color: tieneSaldo?(metodo==='saldo'?'#3d8b6e':'var(--text-2)'):'#c0392b' }}>
              Q{saldoNum.toFixed(2)} disponible
            </p>
            {!tieneSaldo && <p style={{ fontSize:'0.65rem', color:'#c0392b', marginTop:2 }}>Saldo insuficiente</p>}
          </button>

          {/* Opción: Tarjeta */}
          <button onClick={()=>setMetodo('tarjeta')}
            style={{ padding:'14px 12px', borderRadius:10, border:`2px solid ${metodo==='tarjeta'?P.teal:'var(--border)'}`, background: metodo==='tarjeta'?`${P.teal}08`:'#fff', cursor:'pointer', textAlign:'left', transition:'all 0.2s', position:'relative' }}>
            {metodo==='tarjeta' && <div style={{ position:'absolute', top:8, right:8, width:16, height:16, borderRadius:'50%', background:P.teal, display:'flex', alignItems:'center', justifyContent:'center' }}><CheckCircle size={10} color="#fff"/></div>}
            <CreditCard size={20} color={metodo==='tarjeta'?P.teal:'var(--text-2)'} style={{ marginBottom:8 }}/>
            <p style={{ fontSize:'0.82rem', fontWeight:700, color: metodo==='tarjeta'?P.dark:'var(--text-2)', marginBottom:2 }}>Tarjeta de crédito</p>
            <p style={{ fontSize:'0.75rem', color:'var(--text-2)' }}>
              {tarjetasParaPagar.filter(t=>t.alcanzaParaPagar).length} tarjeta{tarjetasParaPagar.filter(t=>t.alcanzaParaPagar).length!==1?'s':''} disponible{tarjetasParaPagar.filter(t=>t.alcanzaParaPagar).length!==1?'s':''}
            </p>
          </button>
        </div>

        {/* Detalle según método */}
        {metodo === 'saldo' && (
          <div style={{ padding:'12px 14px', background:`${P.teal}06`, border:`1px solid ${P.teal}22`, borderRadius:9, marginBottom:18 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
              <span style={{ fontSize:'0.78rem', color:'var(--text-2)' }}>Saldo actual</span>
              <span style={{ fontWeight:700, color:P.dark }}>Q{saldoNum.toFixed(2)}</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
              <span style={{ fontSize:'0.78rem', color:'var(--text-2)', flex:1 }}>Pago de multa</span>
              <span style={{ fontWeight:700, color:'#c0392b' }}>- {montoStr}</span>
            </div>
            <div style={{ height:1, background:'var(--border)', margin:'6px 0' }}/>
            <div style={{ display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontSize:'0.82rem', fontWeight:700, color:P.dark }}>Saldo después del pago</span>
              <span style={{ fontWeight:800, color: tieneSaldo?'#3d8b6e':'#c0392b', fontFamily:'Poppins,sans-serif' }}>
                Q{Math.max(0, saldoNum - monto).toFixed(2)}
              </span>
            </div>
            {!tieneSaldo && (
              <p style={{ fontSize:'0.72rem', color:'#c0392b', marginTop:6 }}>
                ⚠ Saldo insuficiente. Te faltan Q{(monto - saldoNum).toFixed(2)}. Recarga tu cuenta primero.
              </p>
            )}
          </div>
        )}

        {metodo === 'tarjeta' && (
          <div style={{ marginBottom:18 }}>
            {tarjetasParaPagar.length === 0
              ? <div style={{ padding:'12px', background:'#fde8e8', border:'1px solid rgba(192,57,43,0.2)', borderRadius:8 }}>
                  <p style={{ fontSize:'0.82rem', color:'#c0392b' }}>No tienes tarjetas con crédito disponible.</p>
                </div>
              : <>
                  <label className="form-label">SELECCIONA TARJETA</label>
                  <select className="form-input" value={tarjetaId} onChange={e=>setTarjetaId(e.target.value)} style={{ marginBottom:10 }}>
                    <option value="">— Selecciona —</option>
                    {tarjetasParaPagar.map(t => (
                      <option key={t.tarjetaId} value={t.tarjetaId} disabled={!t.alcanzaParaPagar}>
                        {t.tarjeta} — {t.creditoDisponible} {!t.alcanzaParaPagar?'(Sin fondos)':'✓'}
                      </option>
                    ))}
                  </select>
                  {tarjetaSel && (
                    <div style={{ padding:'10px 12px', background:`${P.teal}06`, border:`1px solid ${P.teal}22`, borderRadius:8 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-2)' }}>Crédito disponible</span>
                        <span style={{ fontWeight:700, color:P.teal }}>{tarjetaSel.creditoDisponible}</span>
                      </div>
                      <div style={{ display:'flex', justifyContent:'space-between' }}>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-2)' }}>Después del pago</span>
                        <span style={{ fontSize:'0.75rem', color:'var(--text-2)' }}>
                          Q{(parseFloat(String(tarjetaSel.creditoDisponible).replace(/[^0-9.]/g,'')) - monto).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  )}
                </>}
          </div>
        )}

        {/* Botones */}
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={onClose} className="btn-outline"
            style={{ flex:1, padding:'11px', justifyContent:'center', borderColor:'var(--text-2)', color:'var(--text-2)' }}>
            Cancelar
          </button>
          <button onClick={handlePagar}
            disabled={paying || (metodo==='saldo'&&!tieneSaldo) || (metodo==='tarjeta'&&!tarjetaId)}
            className="btn-primary" style={{ flex:2 }}>
            {paying
              ? <span className="spinner"/>
              : <><ArrowRight size={14}/> Pagar {montoStr} con {metodo==='saldo'?'Saldo':'Tarjeta'}</>}
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Panel de multas ─────────────────────────────────────────────── */
const MultasPanel = () => {
  const { multas, tarjetasParaPagar, loadingMultas, fetchMisMultas, saldo, pagarConTarjeta, pagarConSaldo } = useUserStore()
  const { add } = useNotifStore()
  const [pagarData, setPagarData] = useState(null)

  const saldoNum = saldo?.saldoNumerico ?? parseFloat(saldo?.saldoActual?.replace('Q','') ?? 0)
  const pendientes = multas.filter(m => m.estado==='PENDIENTE').length

  const handlePagarTarjeta = async (multaId, tarjetaId) => {
    const res = await pagarConTarjeta(multaId, tarjetaId)
    if (res.ok) add(NOTIF_TYPES.PAGO, 'Multa pagada con tarjeta', res.message || 'Tu multa fue pagada.')
    return res
  }

  const handlePagarSaldo = async (multaId) => {
    const res = await pagarConSaldo(multaId)
    if (res.ok) add(NOTIF_TYPES.PAGO, 'Multa pagada con saldo', res.message || 'Tu multa fue pagada con saldo de cuenta.')
    return res
  }

  return (
    <>
      {pagarData && (
        <PagarModal
          multa={pagarData}
          tarjetasParaPagar={tarjetasParaPagar}
          saldoNum={saldoNum}
          onClose={()=>setPagarData(null)}
          onPagarTarjeta={handlePagarTarjeta}
          onPagarSaldo={handlePagarSaldo}
        />
      )}

      <div className="card">
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:P.dark, display:'flex', alignItems:'center', gap:8 }}>
            <AlertTriangle size={16} color="#c9860a"/> Mis Multas
            {pendientes > 0 && <span className="badge badge-yellow">{pendientes} pendiente{pendientes>1?'s':''}</span>}
          </h3>
        </div>

        {loadingMultas
          ? <div style={{ textAlign:'center', padding:32 }}><span className="spinner-dark" style={{ margin:'0 auto' }}/></div>
          : multas.length === 0
            ? <div style={{ textAlign:'center', padding:'28px 16px' }}>
                <p style={{ fontSize:'1.5rem', marginBottom:8 }}>✓</p>
                <p style={{ color:'var(--text-2)', fontSize:'0.875rem' }}>Sin multas registradas</p>
              </div>
            : <div style={{ overflowX:'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Placa</th>
                      <th>Tipo</th>
                      <th className="hide-mobile">Velocidad</th>
                      <th>Monto</th>
                      <th className="hide-mobile">Fecha</th>
                      <th>Estado</th>
                      <th>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multas.map((m, i) => {
                      const pagada = m.estado === 'PAGADA'
                      const monto  = m.montoMulta || m.monto_multa || m.monto || '—'
                      const fecha  = m.fecha || m.createdAt
                      return (
                        <tr key={m.id||m._id||i}>
                          <td style={{ fontWeight:700, color:P.teal }}>{m.placa||'—'}</td>
                          <td style={{ fontSize:'0.78rem', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            {m.tipoInfraccion||m.tipo_infraccion||'—'}
                          </td>
                          <td className="hide-mobile" style={{ color:m.velocidad>80?'#c0392b':'var(--text)', fontWeight:m.velocidad>80?700:400 }}>
                            {m.velocidad||'—'} km/h
                          </td>
                          <td style={{ fontWeight:700, color:'#c9860a' }}>{monto}</td>
                          <td className="hide-mobile" style={{ fontSize:'0.78rem', color:'var(--text-2)' }}>
                            {fecha ? new Date(fecha).toLocaleDateString('es-GT') : '—'}
                          </td>
                          <td><span className={`badge ${pagada?'badge-green':'badge-yellow'}`}>{pagada?'Pagada':'Pendiente'}</span></td>
                          <td>
                            {!pagada
                              ? <button onClick={()=>setPagarData(m)} className="btn-success"
                                  style={{ padding:'5px 10px', fontSize:'0.75rem', display:'inline-flex', alignItems:'center', gap:4 }}>
                                  <CreditCard size={11}/> Pagar
                                </button>
                              : <span style={{ fontSize:'0.75rem', color:'#3d8b6e', fontWeight:600 }}>✓ Pagada</span>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>}
      </div>
    </>
  )
}
export default MultasPanel