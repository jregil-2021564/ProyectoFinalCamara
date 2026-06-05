import { Play, StopCircle, Camera, Activity } from 'lucide-react'
import useCamara from '../hooks/useCamara'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const CamaraControl = () => {
  const { camaraActiva, loadingCamara, iniciarCamara, toggleCamara } = useCamara()

  const handleIniciar = async () => {
    const res = await iniciarCamara()
    if (res.ok) toastSuccess(res.message || 'CÁMARA INICIADA')
    else toastError(res.message)
  }

  return (
    <div className="card-cyan" style={{ padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(0,229,255,0.1)', border: '1px solid rgba(0,229,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            className={camaraActiva ? 'pulse-cyan' : ''}>
            <Camera size={20} color="#00e5ff" />
          </div>
          <div>
            <p style={{ fontFamily: 'Orbitron,monospace', fontSize: '0.75rem', color: '#00e5ff' }}>
              CÁMARA DE TRÁFICO
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: camaraActiva ? '#00ff88' : '#ff4444', display: 'inline-block' }}
                className={camaraActiva ? 'pulse-green' : ''} />
              <span style={{ fontFamily: 'Orbitron,monospace', fontSize: '0.55rem', color: camaraActiva ? '#00ff88' : '#ff6666' }}>
                {camaraActiva ? 'ACTIVA — DETECTANDO INFRACCIONES' : 'INACTIVA'}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          {!camaraActiva ? (
            <button onClick={handleIniciar} disabled={loadingCamara} className="btn-cyan"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {loadingCamara
                ? <span style={{ width: 14, height: 14, border: '2px solid rgba(2,12,10,0.3)', borderTopColor: '#020c0a', borderRadius: '50%', display: 'inline-block' }} />
                : <><Play size={14} /> INICIAR CÁMARA</>}
            </button>
          ) : (
            <button onClick={() => toggleCamara(false)} className="btn-outline-green"
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <StopCircle size={14} /> DETENER
            </button>
          )}
        </div>
      </div>

      {camaraActiva && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: 'rgba(0,255,136,0.04)', borderRadius: 8, border: '1px solid rgba(0,255,136,0.1)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={12} color="#00ff88" />
          <span style={{ fontFamily: 'Orbitron,monospace', fontSize: '0.55rem', color: 'rgba(0,255,136,0.7)' }}>
            PROCESANDO FLUJO DE VÍDEO — RECONOCIMIENTO DE PLACAS ACTIVO
          </span>
        </div>
      )}
    </div>
  )
}

export default CamaraControl
