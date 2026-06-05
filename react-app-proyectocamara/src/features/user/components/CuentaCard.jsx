import { FileText, Wallet, Car, RefreshCw, Clock } from 'lucide-react'
import useUserStore from '../store/userStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB' }

const CuentaCard = () => {
  const { cuenta, saldo, loadingCuenta, loadingSaldo, fetchCuenta, fetchSaldo, lastRefresh } = useUserStore()

  const handleRefresh = () => { fetchCuenta(); fetchSaldo() }

  // Normaliza los datos — el backend puede devolver campos con diferentes nombres
  const numeroCuenta = cuenta?.numeroCuenta || cuenta?.NumeroCuenta || '—'
  const titular      = cuenta?.titular      || `${cuenta?.User?.Name||''} ${cuenta?.User?.Surname||''}`.trim() || '—'
  const email        = cuenta?.email        || cuenta?.User?.Email  || '—'
  const placa        = cuenta?.placa        || cuenta?.UserProfile?.Placa ||
                       saldo?.placa         || '—'

  // Saldo: viene de /saldo/mi-saldo en saldoActual o saldoNumerico
  const saldoStr     = saldo?.saldoActual   || `Q${parseFloat(saldo?.saldo ?? saldo?.Saldo ?? cuenta?.saldo ?? 0).toFixed(2)}`
  const saldoNum     = saldo?.saldoNumerico ?? parseFloat(saldo?.saldoActual?.replace('Q','') ?? 0)
  const puedesPagar  = saldo?.puedesPagar ?? saldoNum > 0

  const loading = loadingCuenta || loadingSaldo

  return (
    <div className="card">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:8 }}>
        <div>
          <h3 style={{ fontWeight:700, fontSize:'1rem', color:P.dark }}>Mi Cuenta</h3>
          {lastRefresh && (
            <p style={{ fontSize:'0.68rem', color:'var(--text-2)', marginTop:2, display:'flex', alignItems:'center', gap:4 }}>
              <Clock size={10}/>
              Actualizado {lastRefresh.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}
            </p>
          )}
        </div>
        <button onClick={handleRefresh} disabled={loading}
          style={{ display:'flex', alignItems:'center', gap:5, padding:'6px 12px', background:`rgba(70,129,137,0.08)`, border:`1.5px solid rgba(70,129,137,0.2)`, borderRadius:7, cursor:'pointer', color:P.teal, fontSize:'0.78rem', fontWeight:500, transition:'all 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(70,129,137,0.16)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(70,129,137,0.08)'}>
          <RefreshCw size={12} style={loading?{animation:'spin 1s linear infinite'}:{}}/> Actualizar
        </button>
      </div>

      {loading && !cuenta ? (
        <div style={{ textAlign:'center', padding:32 }}>
          <span className="spinner-dark" style={{ margin:'0 auto' }}/>
        </div>
      ) : (
        <>
          {/* 3 datos principales destacados */}
          <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:18 }}>

            {/* Número de cuenta */}
            <div style={{ background:'#f5faf9', border:`1.5px solid var(--border)`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:`${P.teal}18`, border:`1px solid ${P.teal}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <FileText size={13} color={P.teal}/>
                </div>
                <p style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Número de Cuenta</p>
              </div>
              <p style={{ fontWeight:700, fontSize:'0.92rem', color:P.teal, letterSpacing:'0.03em' }}>
                {loadingCuenta ? <span className="spinner-dark" style={{ width:14, height:14 }}/> : numeroCuenta}
              </p>
            </div>

            {/* Saldo disponible */}
            <div style={{ background: puedesPagar ? `${P.teal}08` : '#fef9f0', border:`1.5px solid ${puedesPagar?`${P.teal}25`:'#fde68a'}`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:`${P.tealMid}18`, border:`1px solid ${P.tealMid}25`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Wallet size={13} color={P.tealMid}/>
                </div>
                <p style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Saldo Disponible</p>
              </div>
              <p style={{ fontWeight:800, fontSize:'1.2rem', color: puedesPagar ? '#3d8b6e' : '#c9860a', fontFamily:'Poppins,sans-serif', lineHeight:1 }}>
                {loadingSaldo ? <span className="spinner-dark" style={{ width:14, height:14 }}/> : saldoStr}
              </p>
              <p style={{ fontSize:'0.68rem', color: puedesPagar ? '#3d8b6e' : '#c9860a', marginTop:4, fontWeight:500 }}>
                {puedesPagar ? '✓ Disponible para pagos' : '⚠ Sin saldo suficiente'}
              </p>
            </div>

            {/* Placa registrada */}
            <div style={{ background:'#f5faf9', border:`1.5px solid var(--border)`, borderRadius:10, padding:'16px 18px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:8 }}>
                <div style={{ width:28, height:28, borderRadius:7, background:'rgba(201,134,10,0.12)', border:'1px solid rgba(201,134,10,0.2)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Car size={13} color="#c9860a"/>
                </div>
                <p style={{ fontSize:'0.68rem', fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'0.05em' }}>Placa Registrada</p>
              </div>
              <p style={{ fontWeight:700, fontSize:'1rem', color:'#c9860a', letterSpacing:'0.08em' }}>
                {loadingCuenta ? <span className="spinner-dark" style={{ width:14, height:14 }}/> : placa}
              </p>
            </div>
          </div>

          {/* Info secundaria */}
          <div style={{ display:'flex', gap:24, flexWrap:'wrap', padding:'12px 16px', background:'#f5faf9', borderRadius:8, border:'1px solid var(--border)' }}>
            {[
              { label:'Titular', value: titular },
              { label:'Correo',  value: email },
              { label:'Estado',  value: '✓ Cuenta activa', color:'#3d8b6e' },
            ].map(f => (
              <div key={f.label}>
                <p style={{ fontSize:'0.68rem', color:'var(--text-2)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:2 }}>{f.label}</p>
                <p style={{ fontSize:'0.82rem', fontWeight:500, color: f.color || P.dark }}>{f.value}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
export default CuentaCard