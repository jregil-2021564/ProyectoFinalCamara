import { useNavigate } from 'react-router-dom'
import { ShieldOff } from 'lucide-react'
const UnauthorizedPage = () => {
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <ShieldOff size={56} color="#e02424" style={{ margin: '0 auto 16px', opacity: 0.6 }} />
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, marginBottom: 8 }}>Acceso denegado</h1>
        <p style={{ color: '#6b7280', marginBottom: 24 }}>No tienes permisos para ver esta página.</p>
        <button onClick={() => navigate(-1)} className="btn-outline">Regresar</button>
      </div>
    </div>
  )
}
export default UnauthorizedPage
