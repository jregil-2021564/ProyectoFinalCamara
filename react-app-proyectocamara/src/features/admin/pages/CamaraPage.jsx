import { useState, useEffect, useRef, useCallback } from 'react'
import { Camera, Play, Square, Wifi, WifiOff, AlertTriangle, RefreshCw, Settings, Monitor } from 'lucide-react'
import { toastSuccess, toastError } from '../../../shared/utils/toast'
import useNotifStore, { NOTIF_TYPES } from '../../../shared/store/notifStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB' }
const STREAM_BASE = import.meta.env.VITE_STREAM_URL || 'http://localhost:5001'

const CAMARAS_DEF = [
  { id:0, nombre:'Cámara 1 — Principal' },
  { id:1, nombre:'Cámara 2' },
  { id:2, nombre:'Cámara 3' },
  { id:3, nombre:'Cámara 4' },
]

/* ── Stream con auto-reconexión ─────────────────────────────────── */
const MjpegImg = ({ camId, style, active }) => {
  const [key, setKey] = useState(0)
  const [err, setErr] = useState(false)
  const retryRef = useRef(null)

  // Auto-reconectar 2s después de un error
  const handleError = () => {
    setErr(true)
    clearTimeout(retryRef.current)
    retryRef.current = setTimeout(() => {
      setErr(false)
      setKey(k => k + 1)  // nuevo key = nuevo <img> = nueva conexión MJPEG
    }, 2000)
  }

  const handleLoad = () => setErr(false)

  useEffect(() => () => clearTimeout(retryRef.current), [])

  if (!active) return null

  return err
    ? <div style={{ ...style, display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a0a' }}>
        <div style={{ textAlign:'center' }}>
          <WifiOff size={24} color="rgba(255,100,100,0.5)" style={{ margin:'0 auto 8px' }}/>
          <p style={{ color:'rgba(255,255,255,0.3)', fontSize:'0.72rem' }}>Reconectando…</p>
        </div>
      </div>
    : <img
        key={key}
        src={`${STREAM_BASE}/cam/${camId}`}
        alt={`CAM${camId}`}
        onError={handleError}
        onLoad={handleLoad}
        style={style}/>
}

/* ── Thumbnail ──────────────────────────────────────────────────── */
const CameraThumb = ({ cam, activa, tieneFrame, semaforo, selected, onSelect }) => (
  <div onClick={onSelect}
    style={{ borderRadius:10, overflow:'hidden',
      border:`2px solid ${selected?P.teal:'var(--border)'}`,
      cursor:'pointer', transition:'border 0.2s, box-shadow 0.2s',
      boxShadow:selected?`0 0 0 3px ${P.teal}33`:'none', background:'#000' }}>

    <div style={{ position:'relative', aspectRatio:'4/3', background:'#0a0a0a', overflow:'hidden' }}>
      <MjpegImg
        camId={cam.id}
        active={activa && tieneFrame}
        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}/>

      {(!activa || !tieneFrame) && (
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6 }}>
          <Camera size={22} color="rgba(255,255,255,0.12)"/>
          <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.68rem' }}>{activa?'Esperando…':'Sin cámara'}</p>
        </div>
      )}

      <div style={{ position:'absolute', top:6, left:6, display:'flex', alignItems:'center', gap:3,
        background:'rgba(0,0,0,0.65)', borderRadius:5, padding:'2px 6px', zIndex:2 }}>
        <span style={{ width:5, height:5, borderRadius:'50%', background:activa&&tieneFrame?P.tealMid:'#666', display:'inline-block' }}/>
        <span style={{ fontSize:'0.6rem', color:'#fff', fontWeight:600 }}>CAM {cam.id}</span>
      </div>

      {activa && semaforo && (
        <div style={{ position:'absolute', top:6, right:6, zIndex:2,
          background:'rgba(192,57,43,0.9)', borderRadius:5, padding:'2px 6px' }}>
          <span style={{ fontSize:'0.6rem', color:'#fff', fontWeight:700 }}>🔴 ROJO</span>
        </div>
      )}
    </div>

    <div style={{ padding:'7px 10px', background:'var(--surface)', borderTop:'1px solid var(--border)' }}>
      <p style={{ fontSize:'0.72rem', fontWeight:600, color:P.dark, marginBottom:1 }}>{cam.nombre}</p>
      <p style={{ fontSize:'0.6rem', color:'var(--text-2)' }}>
        {activa?(tieneFrame?'● En línea':'○ Conectando…'):'○ Inactiva'}
      </p>
    </div>
  </div>
)

/* ── Página ─────────────────────────────────────────────────────── */
const CamaraPage = () => {
  const [running,  setRunning]  = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [status,   setStatus]   = useState(null)
  const [selected, setSelected] = useState(0)
  const errCount = useRef(0)
  const { add } = useNotifStore()

  const fetchStatus = useCallback(async () => {
    try {
      const res  = await fetch(`${STREAM_BASE}/status`, { signal: AbortSignal.timeout(2000) })
      const data = await res.json()
      setStatus(data)
      errCount.current = 0
      setRunning(true)
    } catch {
      errCount.current++
      if (errCount.current >= 3) { setRunning(false); setStatus(null) }
    }
  }, [])

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 5000)
    return () => clearInterval(iv)
  }, [fetchStatus])

  const iniciar = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${STREAM_BASE}/status`, { signal: AbortSignal.timeout(3000) })
      if (res.ok) {
        const data = await res.json()
        setStatus(data); setRunning(true); errCount.current = 0
        toastSuccess('Sistema conectado')
        add(NOTIF_TYPES.SISTEMA, 'Cámaras activas', 'El sistema de vigilancia está en línea.')
      }
    } catch {
      toastError('Script Python no detectado. Ejecuta: python speed_detector.py')
    }
    setLoading(false)
  }

  const detener = () => {
    setRunning(false); setStatus(null); errCount.current = 99
    toastSuccess('Monitor detenido')
  }

  const camaras = status?.camaras ?? CAMARAS_DEF.map(c=>({...c,activa:false,semaforo_rojo:false,tiene_frame:false}))
  const activas = camaras.filter(c=>c.activa&&c.tiene_frame).length
  const multas  = status?.multas_count ?? 0
  const selStatus = camaras.find(c=>c.id===selected) || { activa:false, tiene_frame:false }

  return (
    <div className="page-content">

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div>
          <p className="page-title">Control de Cámaras</p>
          <p className="page-subtitle" style={{ marginBottom:0 }}>
            Monitoreo en tiempo real · {activas} cámara{activas!==1?'s':''} en línea
          </p>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={fetchStatus}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', background:`rgba(70,129,137,0.1)`, border:`1.5px solid rgba(70,129,137,0.25)`, borderRadius:8, cursor:'pointer', color:P.teal, fontSize:'0.8rem', fontWeight:600 }}>
            <RefreshCw size={13}/> Actualizar
          </button>
          {!running
            ? <button onClick={iniciar} disabled={loading} className="btn-success"
                style={{ padding:'8px 18px', fontSize:'0.85rem', display:'flex', alignItems:'center', gap:6 }}>
                {loading?<span className="spinner" style={{ borderTopColor:P.dark,borderColor:`${P.dark}33`,width:14,height:14 }}/>:<><Play size={14}/> Iniciar Sistema</>}
              </button>
            : <button onClick={detener} className="btn-outline"
                style={{ padding:'8px 18px', fontSize:'0.85rem', borderColor:'#c0392b', color:'#c0392b', display:'flex', alignItems:'center', gap:6 }}>
                <Square size={14}/> Detener
              </button>}
        </div>
      </div>

      {/* Stats */}
      <div className="stats-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          { label:'Cámaras en línea',   value:`${activas}/4`,              color:P.teal,    icon:<Camera size={18}/> },
          { label:'Infracciones hoy',   value:multas,                      color:'#c9860a', icon:<AlertTriangle size={18}/> },
          { label:'Sistema',            value:running?'Activo':'Inactivo', color:running?'#3d8b6e':'#c0392b', icon:<Monitor size={18}/> },
          { label:'Stream MJPEG',       value:'Puerto 5001',               color:P.tealMid, icon:<Wifi size={18}/> },
        ].map(s=>(
          <div key={s.label} className="stat-card">
            <div className="stat-icon-box" style={{ background:`${s.color}18`, border:`1.5px solid ${s.color}30`, color:s.color, flexShrink:0 }}>{s.icon}</div>
            <div>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, fontSize:'1.1rem', color:s.color, lineHeight:1 }}>{s.value}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--text-2)', marginTop:3 }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Aviso */}
      {!running && (
        <div style={{ padding:'14px 18px', background:'rgba(201,134,10,0.08)', border:'1px solid rgba(201,134,10,0.25)', borderRadius:10, marginBottom:20, display:'flex', alignItems:'center', gap:12 }}>
          <AlertTriangle size={18} color="#c9860a"/>
          <div>
            <p style={{ fontWeight:600, color:'#c9860a', fontSize:'0.88rem' }}>Script Python no detectado</p>
            <p style={{ color:'var(--text-2)', fontSize:'0.78rem', marginTop:2 }}>
              Ejecuta: <code style={{ background:'#f5faf9', padding:'1px 6px', borderRadius:4 }}>python speed_detector.py</code>
              &nbsp;y luego haz clic en <strong>Iniciar Sistema</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Vista ampliada */}
      <div className="card" style={{ padding:0, overflow:'hidden', marginBottom:16 }}>
        <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <p style={{ fontWeight:700, color:P.dark, fontSize:'0.9rem' }}>
            {CAMARAS_DEF.find(c=>c.id===selected)?.nombre}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', background:running&&selStatus.tiene_frame?P.tealMid:'#ccc', display:'inline-block' }}/>
            <span style={{ fontSize:'0.72rem', color:running&&selStatus.tiene_frame?P.teal:'var(--text-2)', fontWeight:600 }}>
              {running&&selStatus.tiene_frame?'EN VIVO':'Sin señal'}
            </span>
          </div>
        </div>
        <div style={{ background:'#000', minHeight:320, position:'relative' }}>
          <MjpegImg
            camId={selected}
            active={running && selStatus.activa && selStatus.tiene_frame}
            style={{ width:'100%', maxHeight:480, objectFit:'contain', display:'block' }}/>
          {(!running || !selStatus.activa || !selStatus.tiene_frame) && (
            <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
              <Camera size={44} color="rgba(255,255,255,0.08)" style={{ marginBottom:12 }}/>
              <p style={{ color:'rgba(255,255,255,0.2)', fontSize:'0.85rem' }}>
                {!running?'Sistema detenido':'Sin señal en esta cámara'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnails */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}
        className="cam-grid">
        {CAMARAS_DEF.map(camDef => {
          const cs = camaras.find(c=>c.id===camDef.id)||{activa:false,semaforo_rojo:false,tiene_frame:false}
          return (
            <CameraThumb key={camDef.id} cam={camDef}
              activa={cs.activa} tieneFrame={cs.tiene_frame}
              semaforo={cs.semaforo_rojo}
              selected={selected===camDef.id}
              onSelect={()=>setSelected(camDef.id)}/>
          )
        })}
      </div>

      {/* Instrucciones */}
      <div className="card" style={{ padding:'16px 20px' }}>
        <h3 style={{ fontWeight:700, fontSize:'0.9rem', color:P.dark, marginBottom:12, display:'flex', alignItems:'center', gap:7 }}>
          <Settings size={14}/> Agregar más cámaras
        </h3>
        <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div>
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:P.dark, marginBottom:6 }}>Pasos por teléfono extra:</p>
            <ol style={{ fontSize:'0.76rem', color:'var(--text-2)', lineHeight:2.1, paddingLeft:16 }}>
              <li>Instala <strong>DroidCam</strong> en el teléfono</li>
              <li>Conéctalo a la misma red WiFi</li>
              <li>Anota la IP que muestra DroidCam</li>
              <li>Agrégala al <code style={{ background:'#f5faf9', padding:'1px 5px', borderRadius:3 }}>.env</code> de ms-core</li>
              <li>Reinicia <code style={{ background:'#f5faf9', padding:'1px 5px', borderRadius:3 }}>speed_detector.py</code></li>
            </ol>
          </div>
          <div>
            <p style={{ fontSize:'0.78rem', fontWeight:600, color:P.dark, marginBottom:6 }}>Variables en <code>.env</code>:</p>
            <pre style={{ fontSize:'0.72rem', background:'#f5faf9', border:'1px solid var(--border)', borderRadius:8, padding:'10px 12px', color:P.dark, lineHeight:1.9, overflow:'auto', margin:0 }}>
{`CAM_0_URL=http://IP_1:4747/video
CAM_1_URL=http://IP_2:4747/video
CAM_2_URL=http://IP_3:4747/video
CAM_3_URL=http://IP_4:4747/video
STREAMING_PORT=5001`}
            </pre>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:768px){ .cam-grid{ grid-template-columns:repeat(2,1fr)!important; } }
        @media(max-width:480px){ .cam-grid{ grid-template-columns:1fr!important; } }
      `}</style>
    </div>
  )
}
export default CamaraPage