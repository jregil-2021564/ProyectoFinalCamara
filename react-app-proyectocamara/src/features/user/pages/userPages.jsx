import { useEffect, useState, useCallback } from 'react'
import { Wallet, AlertTriangle, CreditCard, TrendingUp, RefreshCw, FileText, Car, Activity } from 'lucide-react'
import useUserStore from '../store/userStore'
import CuentaCard from '../components/CuentaCard'
import TarjetasPanel from '../components/TarjetasPanel'
import RecargasPanel from '../components/RecargasPanel'
import MultasPanel from '../components/MultasPanel'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB' }
const REFRESH_MS = 30000

const StatCard = ({ icon, label, value, sub, color, loading }) => (
  <div className="stat-card">
    <div className="stat-icon-box" style={{ background:`${color}18`, border:`1.5px solid ${color}30`, flexShrink:0 }}>
      {loading ? <span className="spinner-dark" style={{ width:16, height:16 }}/> : icon}
    </div>
    <div style={{ minWidth:0 }}>
      <p style={{ fontSize:'1.35rem', fontWeight:800, color:P.dark, lineHeight:1, fontFamily:'Poppins,sans-serif' }}>
        {loading ? '—' : value}
      </p>
      <p style={{ fontSize:'0.77rem', color:'var(--text-2)', marginTop:3 }}>{label}</p>
      {sub && !loading && <p style={{ fontSize:'0.7rem', color, marginTop:2, fontWeight:500 }}>{sub}</p>}
    </div>
  </div>
)

// ── HOME ──────────────────────────────────────────────────────────
export const UserHomePage = () => {
  const {
    fetchAll, fetchSaldo, fetchMisMultas,
    loadingCuenta, loadingSaldo, loadingTarjetas, loadingMultas,
    lastRefresh, getStats,
  } = useUserStore()

  const refresh = useCallback(async () => { await fetchAll() }, [])

  useEffect(() => { refresh() }, [])

  // Auto-refresh cada 30s
  useEffect(() => {
    const iv = setInterval(() => { fetchSaldo(); fetchMisMultas() }, REFRESH_MS)
    return () => clearInterval(iv)
  }, [])

  const s = getStats()

  return (
    <div className="page-content">
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:4 }}>
        <div>
          <p className="page-title">Mi Portal</p>
          <p className="page-subtitle" style={{ marginBottom:0 }}>
            Gestiona tu cuenta, tarjetas y multas ·
            {lastRefresh && <span style={{ color:P.teal }}> Actualizado {lastRefresh.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
          </p>
        </div>
        <button onClick={refresh}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:`rgba(70,129,137,0.1)`, border:`1.5px solid rgba(70,129,137,0.25)`, borderRadius:8, cursor:'pointer', color:P.teal, fontSize:'0.8rem', fontWeight:600, transition:'all 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.background='rgba(70,129,137,0.18)'}
          onMouseLeave={e=>e.currentTarget.style.background='rgba(70,129,137,0.1)'}>
          <RefreshCw size={14}/> Actualizar
        </button>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, margin:'18px 0' }}>
        <StatCard loading={loadingSaldo}
          icon={<Wallet size={19} color={P.teal}/>}
          label="Saldo Disponible"
          value={s.saldoStr}
          sub={s.saldoNumerico > 0 ? 'Disponible para pagar' : 'Sin saldo'}
          color={P.teal}/>
        <StatCard loading={loadingMultas}
          icon={<AlertTriangle size={19} color="#c9860a"/>}
          label="Multas Pendientes"
          value={s.multasPendientes}
          sub={s.multasPendientes > 0 ? 'Por pagar' : 'Al día ✓'}
          color="#c9860a"/>
        <StatCard loading={loadingTarjetas}
          icon={<CreditCard size={19} color={P.tealMid}/>}
          label="Tarjetas Activas"
          value={s.tarjetasActivas}
          sub="Verificadas"
          color={P.tealMid}/>
        <StatCard loading={loadingMultas}
          icon={<TrendingUp size={19} color={P.tealLight}/>}
          label="Total Multas"
          value={s.totalMultas}
          sub={`${s.totalRecargas} recargas`}
          color={P.tealLight}/>
      </div>

      <div style={{ marginBottom:16 }}><CuentaCard/></div>
      <div style={{ marginBottom:16 }}><div className="table-wrapper"><TarjetasPanel/></div></div>
      <div style={{ marginBottom:16 }}><div className="table-wrapper"><MultasPanel/></div></div>
      <div className="table-wrapper"><RecargasPanel/></div>
    </div>
  )
}

// ── CUENTA ────────────────────────────────────────────────────────
export const CuentaPage = () => {
  const { fetchCuenta, fetchSaldo, loadingCuenta } = useUserStore()
  useEffect(() => { fetchCuenta(); fetchSaldo() }, [])
  return (
    <div className="page-content">
      <p className="page-title">Mi Cuenta</p>
      <p className="page-subtitle">Información de tu cuenta en el sistema</p>
      <CuentaCard/>
    </div>
  )
}

export const SaldoPage = () => {
  const { fetchSaldo, fetchRecargas } = useUserStore()
  useEffect(() => { fetchSaldo(); fetchRecargas() }, [])
  return (
    <div className="page-content">
      <p className="page-title">Saldo</p>
      <p className="page-subtitle">Consulta tu saldo y realiza recargas</p>
      <div style={{ marginBottom:16 }}><CuentaCard/></div>
      <RecargasPanel/>
    </div>
  )
}

export const TarjetasPage = () => {
  const { fetchTarjetas } = useUserStore()
  useEffect(() => { fetchTarjetas() }, [])
  return (
    <div className="page-content">
      <p className="page-title">Mis Tarjetas</p>
      <p className="page-subtitle">Administra tus métodos de pago</p>
      <TarjetasPanel/>
    </div>
  )
}

export const RecargasPage = () => {
  const { fetchRecargas, fetchTarjetas } = useUserStore()
  useEffect(() => { fetchRecargas(); fetchTarjetas() }, [])
  return (
    <div className="page-content">
      <p className="page-title">Recargas</p>
      <p className="page-subtitle">Historial de recargas realizadas</p>
      <RecargasPanel/>
    </div>
  )
}

export const MultasPage = () => {
  const { fetchMisMultas } = useUserStore()
  useEffect(() => { fetchMisMultas() }, [])
  return (
    <div className="page-content">
      <p className="page-title">Mis Multas</p>
      <p className="page-subtitle">Consulta y paga tus infracciones pendientes</p>
      <div className="table-wrapper"><MultasPanel/></div>
    </div>
  )
}