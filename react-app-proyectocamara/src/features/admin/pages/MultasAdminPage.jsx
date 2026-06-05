import { useEffect } from 'react'
import { AlertTriangle, TrendingUp, Plus } from 'lucide-react'
import { useState } from 'react'
import useAdminStore from '../store/adminStore'
import MultasTabla from '../components/MultasTabla'
import RegistrarInfraccionModal from '../components/RegistrarInfraccionModal'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2' }

const MultasAdminPage = () => {
  const { multas, users, loadingMultas, fetchMultas, fetchUsers, aumentarMultas, getStats } = useAdminStore()
  const [showInfraccion, setShowInfraccion] = useState(false)
  const [increasing, setIncreasing] = useState(false)

  useEffect(() => { fetchMultas(); fetchUsers() }, [])

  const stats = getStats()

  const handleAumentar = async () => {
    setIncreasing(true)
    const res = await aumentarMultas()
    setIncreasing(false)
    if (res.ok) toastSuccess(res.message || 'Multas aumentadas')
    else toastError(res.message)
  }

  return (
    <>
      {showInfraccion && (
        <RegistrarInfraccionModal users={users} onClose={()=>setShowInfraccion(false)} onSaved={fetchMultas}/>
      )}

      <div className="page-content">
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:10, marginBottom:4 }}>
          <div>
            <p className="page-title">Infracciones y Multas</p>
            <p className="page-subtitle" style={{ marginBottom:0 }}>Gestiona todas las infracciones del sistema</p>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={handleAumentar} disabled={increasing} className="btn-outline" style={{ padding:'8px 14px', fontSize:'0.82rem', display:'flex', alignItems:'center', gap:5 }}>
              {increasing?<span className="spinner-dark" style={{ width:13, height:13 }}/>:<><TrendingUp size={13}/> +10% Pendientes</>}
            </button>
            <button onClick={()=>setShowInfraccion(true)} className="btn-success" style={{ padding:'8px 16px', fontSize:'0.82rem' }}>
              <Plus size={14}/> Nueva Infracción
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, margin:'18px 0' }}>
          {[
            { label:'Total multas',    value:stats.totalMultas,              color:P.teal },
            { label:'Pendientes',      value:stats.multasPendientes,         color:'#c9860a' },
            { label:'Total por cobrar',value:`Q${stats.montoPendiente.toFixed(2)}`, color:'#c0392b' },
          ].map(s=>(
            <div key={s.label} className="card" style={{ textAlign:'center', padding:'16px' }}>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'1.4rem', color:s.color }}>{s.value}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--text-2)', marginTop:3 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="table-wrapper">
          <MultasTabla multas={multas} loading={loadingMultas} onRefresh={fetchMultas} showSearch={true}/>
        </div>
      </div>
    </>
  )
}
export default MultasAdminPage