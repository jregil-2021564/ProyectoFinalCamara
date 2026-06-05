import { useEffect, useState, useCallback } from 'react'
import { Camera, AlertTriangle, Users, TrendingUp, Play, StopCircle, RefreshCw, Plus, DollarSign, CheckCircle, Clock } from 'lucide-react'
import useAdminStore from '../store/adminStore'
import useNotifStore, { NOTIF_TYPES } from '../../../shared/store/notifStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import RegistrarInfraccionModal from '../components/RegistrarInfraccionModal'
import MultasTabla from '../components/MultasTabla'
import UsuariosTabla from '../components/UsuariosTabla'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB' }

const StatCard = ({ icon, label, value, sub, color, loading }) => (
  <div className="stat-card">
    <div className="stat-icon-box" style={{ background:`${color}18`, border:`1.5px solid ${color}30`, flexShrink:0 }}>
      {loading ? <span className="spinner-dark" style={{ width:18, height:18 }}/> : icon}
    </div>
    <div style={{ minWidth:0 }}>
      <p style={{ fontSize:'1.4rem', fontWeight:800, color:P.dark, lineHeight:1, fontFamily:'Poppins,sans-serif' }}>
        {loading ? '—' : value}
      </p>
      <p style={{ fontSize:'0.77rem', color:'var(--text-2)', marginTop:3 }}>{label}</p>
      {sub && !loading && <p style={{ fontSize:'0.7rem', color, marginTop:2, fontWeight:500 }}>{sub}</p>}
    </div>
  </div>
)

const REFRESH_MS = 30000 // auto-refresh cada 30 seg

const AdminHomePage = () => {
  const {
    users, multas, vehiculos, camaraActiva,
    loadingUsers, loadingMultas, loadingVehiculos, loadingCamara,
    fetchAll, fetchMultas, fetchUsers,
    iniciarCamara, toggleCamara, aumentarMultas, getStats,
  } = useAdminStore()
  const { add } = useNotifStore()

  const [showInfraccion, setShowInfraccion] = useState(false)
  const [increasing, setIncreasing]         = useState(false)
  const [lastRefresh, setLastRefresh]       = useState(null)

  const refresh = useCallback(async () => {
    await fetchAll()
    setLastRefresh(new Date())
  }, [])

  // Carga inicial
  useEffect(() => { refresh() }, [])

  // Auto-refresh cada 30s
  useEffect(() => {
    const iv = setInterval(() => { fetchMultas(); fetchUsers() }, REFRESH_MS)
    return () => clearInterval(iv)
  }, [])

  const stats = getStats()

  const handleIniciar = async () => {
    const res = await iniciarCamara()
    if (res.ok) {
      toastSuccess(res.message || 'Cámara iniciada')
      add(NOTIF_TYPES.SISTEMA, 'Cámara iniciada', 'La cámara de tráfico está activa y detectando infracciones.')
    } else toastError(res.message)
  }

  const handleAumentar = async () => {
    setIncreasing(true)
    const res = await aumentarMultas()
    setIncreasing(false)
    if (res.ok) {
      toastSuccess(res.message || 'Multas aumentadas 10%')
      add(NOTIF_TYPES.MULTA, 'Multas aumentadas', res.message || 'Se aplicó aumento del 10% a multas pendientes.')
    } else toastError(res.message)
  }

  const isLoading = loadingUsers || loadingMultas

  return (
    <div className="page-content">

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:4 }}>
        <div>
          <p className="page-title">Dashboard Admin</p>
          <p className="page-subtitle" style={{ marginBottom:0 }}>
            Monitoreo en tiempo real · 
            {lastRefresh && <span style={{ color:P.teal }}> Actualizado {lastRefresh.toLocaleTimeString('es-GT',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>}
          </p>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <button onClick={refresh} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', background:'rgba(70,129,137,0.1)', border:'1.5px solid rgba(70,129,137,0.25)', borderRadius:8, cursor:'pointer', color:P.teal, fontSize:'0.8rem', fontWeight:600, transition:'all 0.2s' }}
            onMouseEnter={e=>e.currentTarget.style.background='rgba(70,129,137,0.18)'}
            onMouseLeave={e=>e.currentTarget.style.background='rgba(70,129,137,0.1)'}>
            <RefreshCw size={14}/> Actualizar
          </button>
          <button onClick={()=>setShowInfraccion(true)} className="btn-success" style={{ padding:'8px 16px', fontSize:'0.82rem' }}>
            <Plus size={14}/> Nueva Infracción
          </button>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────── */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, margin:'18px 0' }}>
        <StatCard loading={loadingUsers}
          icon={<Users size={19} color={P.teal}/>}
          label="Usuarios Registrados"
          value={stats.totalUsuarios}
          sub={`${users.filter(u=>{const r=u.roles??u.UserRoles?.map(ur=>ur.Role?.Name)??[];return r.includes('ADMIN_ROLE')}).length} admins`}
          color={P.teal}/>

        <StatCard loading={loadingMultas}
          icon={<AlertTriangle size={19} color="#c9860a"/>}
          label="Total Infracciones"
          value={stats.totalMultas}
          sub={`${stats.multasPendientes} pendientes`}
          color="#c9860a"/>

        <StatCard loading={loadingMultas}
          icon={<DollarSign size={19} color="#c0392b"/>}
          label="Monto por Cobrar"
          value={`Q${stats.montoPendiente.toFixed(0)}`}
          sub={`${stats.multasPendientes} multas`}
          color="#c0392b"/>

        <StatCard loading={loadingVehiculos}
          icon={<Camera size={19} color={P.tealMid}/>}
          label="Vehículos Registrados"
          value={vehiculos.length}
          sub={camaraActiva ? 'Cámara activa' : 'Cámara inactiva'}
          color={P.tealMid}/>
      </div>

      {/* ── STATS ROW 2 ───────────────────────────────────────── */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        <StatCard loading={loadingMultas}
          icon={<CheckCircle size={19} color="#3d8b6e"/>}
          label="Multas Pagadas"
          value={stats.multasPagadas}
          sub={`Q${multas.filter(m=>m.estado==='PAGADA').reduce((s,m)=>s+parseFloat(m.monto_multa||0),0).toFixed(0)} cobrado`}
          color="#3d8b6e"/>

        <StatCard loading={loadingMultas}
          icon={<Clock size={19} color="#c9860a"/>}
          label="Multas Pendientes"
          value={stats.multasPendientes}
          sub={`Q${stats.montoPendiente.toFixed(0)} pendiente`}
          color="#c9860a"/>

        <StatCard loading={loadingMultas}
          icon={<TrendingUp size={19} color={P.tealLight}/>}
          label="Monto Total General"
          value={`Q${stats.montoTotal.toFixed(0)}`}
          sub="Todas las multas"
          color={P.tealLight}/>

        <div className="stat-card" style={{ flexDirection:'column', alignItems:'flex-start', gap:8 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, width:'100%' }}>
            <div className="stat-icon-box" style={{ background:camaraActiva?`${P.tealMid}18`:'#f0f4f3', border:`1.5px solid ${camaraActiva?P.tealMid:'var(--border)'}`, flexShrink:0 }}>
              <Camera size={18} color={camaraActiva?P.teal:'#9aafa8'}/>
            </div>
            <div>
              <p style={{ fontSize:'0.8rem', fontWeight:700, color:P.dark }}>Cámara Principal</p>
              <div style={{ display:'flex', alignItems:'center', gap:5 }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:camaraActiva?P.tealMid:'#9aafa8', display:'inline-block' }}/>
                <span style={{ fontSize:'0.7rem', color:camaraActiva?P.teal:'var(--text-2)' }}>{camaraActiva?'Activa':'Inactiva'}</span>
              </div>
            </div>
          </div>
          {!camaraActiva
            ? <button onClick={handleIniciar} disabled={loadingCamara} className="btn-success" style={{ width:'100%', padding:'7px', fontSize:'0.78rem', justifyContent:'center' }}>
                {loadingCamara?<span className="spinner" style={{ borderTopColor:P.dark, borderColor:`${P.dark}33`, width:14, height:14 }}/>:<><Play size={12}/> Iniciar</>}
              </button>
            : <button onClick={()=>toggleCamara(false)} className="btn-outline" style={{ width:'100%', padding:'7px', fontSize:'0.78rem', borderColor:'var(--text-2)', color:'var(--text-2)', justifyContent:'center' }}>
                <StopCircle size={12}/> Detener
              </button>}
        </div>
      </div>

      {/* ── MULTAS TABLE ──────────────────────────────────────── */}
      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, flexWrap:'wrap', gap:8 }}>
          <h3 style={{ fontWeight:700, fontSize:'0.95rem', color:P.dark, display:'flex', alignItems:'center', gap:7 }}>
            <AlertTriangle size={15} color="#c9860a"/> Infracciones Recientes
            {loadingMultas && <span className="spinner-dark" style={{ width:14, height:14 }}/>}
          </h3>
          <button onClick={handleAumentar} disabled={increasing} className="btn-outline" style={{ padding:'6px 14px', fontSize:'0.78rem', display:'flex', alignItems:'center', gap:5 }}>
            {increasing ? <span className="spinner-dark" style={{ width:13, height:13 }}/> : <><TrendingUp size={13}/> +10% Pendientes</>}
          </button>
        </div>
        <div className="table-wrapper">
          <MultasTabla multas={multas.slice(0,10)} loading={loadingMultas} onRefresh={fetchMultas}/>
        </div>
      </div>

      {/* ── USUARIOS TABLE ────────────────────────────────────── */}
      <div>
        <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:12 }}>
          <Users size={15} color={P.teal}/>
          <h3 style={{ fontWeight:700, fontSize:'0.95rem', color:P.dark }}>Usuarios Registrados</h3>
          {loadingUsers && <span className="spinner-dark" style={{ width:14, height:14 }}/>}
        </div>
        <div className="table-wrapper">
          <UsuariosTabla users={users} loading={loadingUsers}/>
        </div>
      </div>

      {/* Modal nueva infracción */}
      {showInfraccion && (
        <RegistrarInfraccionModal
          users={users}
          onClose={()=>setShowInfraccion(false)}
          onSaved={()=>{ fetchMultas(); toastSuccess('Infracción registrada') }}
        />
      )}
    </div>
  )
}
export default AdminHomePage