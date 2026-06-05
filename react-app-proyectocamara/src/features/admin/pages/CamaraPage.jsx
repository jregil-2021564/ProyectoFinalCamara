import { useState } from 'react'
import { Camera, Play, StopCircle } from 'lucide-react'
import MultasTable from '../components/MultasTable'
import useCamara from '../hooks/useCamara'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const CamaraPage = () => {
  const { camaraActiva, loadingCamara, iniciarCamara, toggleCamara } = useCamara()
  const handleIniciar = async () => {
    const res = await iniciarCamara()
    if (res.ok) toastSuccess(res.message || 'Cámara iniciada')
    else toastError(res.message)
  }
  return (
    <div className="page-content">
      <p className="page-title">Control de Cámara</p>
      <p className="page-subtitle">Inicia o detiene la cámara de detección de velocidad</p>

      <div className="card" style={{ marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: camaraActiva ? '#d1fae5' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Camera size={22} color={camaraActiva ? '#0e9f6e' : '#9ca3af'} />
          </div>
          <div>
            <p style={{ fontWeight: 600, fontSize: '1rem', color: '#111827' }}>Cámara de Tráfico Principal</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: camaraActiva ? '#0e9f6e' : '#9ca3af', display: 'inline-block' }} />
              <span style={{ fontSize: '0.85rem', color: camaraActiva ? '#0e9f6e' : '#9ca3af' }}>
                {camaraActiva ? 'Activa — Reconocimiento de placas activo' : 'Inactiva'}
              </span>
            </div>
          </div>
        </div>
        {!camaraActiva
          ? <button onClick={handleIniciar} disabled={loadingCamara} className="btn-success" style={{ padding: '10px 24px' }}>
              {loadingCamara ? <span className="spinner" style={{ borderTopColor: '#fff', borderColor: 'rgba(255,255,255,0.3)' }} /> : <><Play size={15}/> Iniciar Cámara</>}
            </button>
          : <button onClick={() => toggleCamara(false)} className="btn-outline" style={{ borderColor: '#9ca3af', color: '#6b7280' }}>
              <StopCircle size={15}/> Detener
            </button>}
      </div>
      <MultasTable />
    </div>
  )
}
export default CamaraPage
