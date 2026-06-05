import { useNavigate } from 'react-router-dom'
import { CheckCircle, XCircle, Loader, Camera } from 'lucide-react'
import useVerifyEmail from '../hooks/useVerifyEmail'

const VerifyEmailPage = () => {
  const { status, message } = useVerifyEmail()
  const navigate = useNavigate()
  return (
    <div style={{ minHeight: '100vh', background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div className="auth-card" style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: 20 }}>
          {status === 'loading' && <Loader size={48} color="#1a56db" style={{ margin: '0 auto', animation: 'spin 1s linear infinite' }} />}
          {status === 'success' && <CheckCircle size={52} color="#0e9f6e" style={{ margin: '0 auto' }} />}
          {status === 'error'   && <XCircle size={52} color="#e02424" style={{ margin: '0 auto' }} />}
        </div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
          {status === 'loading' ? 'Verificando...' : status === 'success' ? '¡Correo verificado!' : 'Error de verificación'}
        </h2>
        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: 24 }}>{message}</p>
        {status !== 'loading' && (
          <button onClick={() => navigate('/auth')} className="btn-primary" style={{ maxWidth: 200, margin: '0 auto' }}>
            {status === 'success' ? 'Iniciar sesión' : 'Volver'}
          </button>
        )}
      </div>
    </div>
  )
}
export default VerifyEmailPage
