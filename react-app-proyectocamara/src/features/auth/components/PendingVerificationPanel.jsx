import { useState } from 'react'
import { MailCheck, RefreshCw, ArrowLeft, CheckCircle, Clock, ShieldCheck } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD', dark:'#031926' }

const PendingVerificationPanel = ({ email, onBack }) => {
  const { resend, loading } = useAuthStore()
  const [resent, setResent] = useState(false)

  const handleResend = async () => {
    const res = await resend(email)
    if (res.ok) { toastSuccess('Correo reenviado'); setResent(true) } else toastError(res.message)
  }

  return (
    <div>
      <div style={{ width:60, height:60, borderRadius:16, background:`${P.teal}18`, border:`1px solid ${P.teal}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
        <MailCheck size={28} color={P.tealMid}/>
      </div>
      <p style={{ fontSize:'0.68rem', fontWeight:600, color:P.tealMid, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:6 }}>Verificación pendiente</p>
      <h2 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1.55rem', color:P.cream, marginBottom:8 }}>Verifica tu correo</h2>
      <p style={{ fontSize:'0.8rem', color:`${P.tealLight}77`, marginBottom:6, lineHeight:1.7 }}>
        Hemos enviado un enlace de activación a tu dirección de correo electrónico:
      </p>
      <p style={{ fontWeight:700, color:P.tealMid, marginBottom:22, wordBreak:'break-all', fontSize:'0.88rem' }}>{email}</p>

      <div style={{ background:`${P.teal}10`, border:`1px solid ${P.teal}25`, borderRadius:10, padding:'14px 16px', marginBottom:14 }}>
        <p style={{ fontSize:'0.68rem', fontWeight:600, color:`${P.tealLight}77`, letterSpacing:'0.08em', marginBottom:12 }}>PASOS A SEGUIR</p>
        {['Abre tu bandeja de entrada','Busca un correo de SpeedCam GT','Haz clic en "Verificar mi cuenta"','Serás redirigido automáticamente'].map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:9, marginBottom:i<3?10:0 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:`${P.teal}22`, border:`1px solid ${P.teal}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'0.6rem', fontWeight:700, color:P.tealMid }}>{i+1}</span>
            </div>
            <span style={{ fontSize:'0.76rem', color:`${P.tealLight}77` }}>{s}</span>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 11px', background:'rgba(251,191,36,0.07)', border:'1px solid rgba(251,191,36,0.2)', borderRadius:8, marginBottom:16 }}>
        <Clock size={12} color="#fbbf24" style={{ flexShrink:0 }}/>
        <p style={{ fontSize:'0.67rem', color:`${P.tealLight}77`, lineHeight:1.5 }}>
          El enlace expira en <strong style={{ color:'rgba(251,191,36,0.8)' }}>24 horas</strong>. Si no aparece, revisa spam o solicita uno nuevo.
        </p>
      </div>

      {!resent
        ? <button onClick={handleResend} disabled={loading}
            style={{ width:'100%', padding:'11px', borderRadius:10, border:`1px solid ${P.teal}33`, background:`${P.teal}0e`, color:`${P.tealLight}99`, fontWeight:600, fontSize:'0.84rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.2s', marginBottom:12 }}
            onMouseEnter={e=>{ e.currentTarget.style.background=`${P.teal}22`; e.currentTarget.style.borderColor=`${P.teal}55`; e.currentTarget.style.color=P.cream }}
            onMouseLeave={e=>{ e.currentTarget.style.background=`${P.teal}0e`; e.currentTarget.style.borderColor=`${P.teal}33`; e.currentTarget.style.color=`${P.tealLight}99` }}>
            <RefreshCw size={13} style={loading?{animation:'spin 0.8s linear infinite'}:{}}/> Reenviar correo de verificación
          </button>
        : <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 13px', background:`${P.tealMid}12`, border:`1px solid ${P.tealMid}33`, borderRadius:10, marginBottom:12 }}>
            <CheckCircle size={14} color={P.tealMid}/>
            <span style={{ fontSize:'0.8rem', color:P.tealMid }}>Correo reenviado exitosamente</span>
          </div>}

      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 11px', background:`${P.teal}0a`, border:`1px solid ${P.teal}20`, borderRadius:8, marginBottom:16 }}>
        <ShieldCheck size={12} color={P.tealLight} style={{ flexShrink:0 }}/>
        <p style={{ fontSize:'0.67rem', color:`${P.tealLight}66`, lineHeight:1.5 }}>
          SpeedCam GT nunca te pedirá tu contraseña por correo. Si tienes dudas, contacta a soporte.
        </p>
      </div>

      <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:`${P.tealLight}55`,fontSize:'0.76rem',display:'flex',alignItems:'center',gap:5,transition:'color 0.2s',padding:0 }}
        onMouseEnter={e=>e.currentTarget.style.color=P.cream} onMouseLeave={e=>e.currentTarget.style.color=`${P.tealLight}55`}>
        <ArrowLeft size={13}/> Volver al inicio de sesión
      </button>
    </div>
  )
}
export default PendingVerificationPanel