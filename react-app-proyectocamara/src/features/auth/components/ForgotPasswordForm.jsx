import { useState } from 'react'
import { ArrowLeft, Mail, Send, CheckCircle, Info } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD', dark:'#031926' }

const ForgotPasswordForm = ({ onBack }) => {
  const { forgot, loading } = useAuthStore()
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [active, setActive] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const res = await forgot(email)
    if (res.ok) { toastSuccess('¡Enlace enviado!'); setSent(true) } else toastError(res.message)
  }

  if (sent) return (
    <div>
      <div style={{ width:58, height:58, borderRadius:16, background:`${P.tealMid}18`, border:`1px solid ${P.tealMid}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
        <CheckCircle size={28} color={P.tealMid}/>
      </div>
      <p style={{ fontSize:'0.68rem', fontWeight:600, color:P.tealMid, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:6 }}>Correo enviado</p>
      <h2 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1.55rem', color:P.cream, marginBottom:10 }}>¡Revisa tu bandeja!</h2>
      <p style={{ fontSize:'0.82rem', color:`${P.tealLight}88`, lineHeight:1.8, marginBottom:22 }}>
        Enviamos las instrucciones a <span style={{ color:P.tealMid, fontWeight:600 }}>{email}</span>. El enlace expira en <strong style={{ color:P.cream }}>1 hora</strong>.
      </p>
      <div style={{ background:`${P.teal}10`, border:`1px solid ${P.teal}25`, borderRadius:10, padding:'14px 16px', marginBottom:22 }}>
        {['Abre el correo de SpeedCam GT','Haz clic en "Restablecer contraseña"','Crea una nueva contraseña segura'].map((s,i)=>(
          <div key={i} style={{ display:'flex', alignItems:'center', gap:9, marginBottom:i<2?10:0 }}>
            <div style={{ width:22, height:22, borderRadius:'50%', background:`${P.teal}22`, border:`1px solid ${P.teal}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <span style={{ fontSize:'0.62rem', fontWeight:700, color:P.tealMid }}>{i+1}</span>
            </div>
            <span style={{ fontSize:'0.77rem', color:`${P.tealLight}77` }}>{s}</span>
          </div>
        ))}
      </div>
      <button onClick={onBack}
        style={{ width:'100%', padding:'12px', borderRadius:10, border:`1px solid ${P.teal}33`, background:`${P.teal}10`, color:P.tealLight, fontWeight:600, fontSize:'0.86rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.2s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background=`${P.teal}22`; e.currentTarget.style.color=P.cream }}
        onMouseLeave={e=>{ e.currentTarget.style.background=`${P.teal}10`; e.currentTarget.style.color=P.tealLight }}>
        <ArrowLeft size={14}/> Volver al inicio de sesión
      </button>
    </div>
  )

  return (
    <div>
      <button onClick={onBack} style={{ background:'none',border:'none',cursor:'pointer',color:`${P.tealLight}66`,fontSize:'0.76rem',display:'flex',alignItems:'center',gap:5,marginBottom:22,transition:'color 0.2s',padding:0 }}
        onMouseEnter={e=>e.currentTarget.style.color=P.tealMid} onMouseLeave={e=>e.currentTarget.style.color=`${P.tealLight}66`}>
        <ArrowLeft size={13}/> Volver
      </button>
      <div style={{ width:52, height:52, borderRadius:14, background:`${P.teal}18`, border:`1px solid ${P.teal}44`, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:18 }}>
        <Mail size={24} color={P.tealMid}/>
      </div>
      <p style={{ fontSize:'0.68rem', fontWeight:600, color:P.tealMid, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:6 }}>Recuperar acceso</p>
      <h2 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1.55rem', color:P.cream, marginBottom:8 }}>¿Olvidaste tu contraseña?</h2>
      <p style={{ fontSize:'0.8rem', color:`${P.tealLight}77`, lineHeight:1.75, marginBottom:24 }}>
        No te preocupes. Ingresa el correo asociado a tu cuenta y te enviaremos un enlace seguro para restablecerla.
      </p>
      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
        <div>
          <label style={{ display:'block', fontSize:'0.7rem', fontWeight:600, color:`${P.tealLight}88`, marginBottom:7, letterSpacing:'0.06em' }}>CORREO ELECTRÓNICO</label>
          <div style={{ position:'relative' }}>
            <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:active?P.tealMid:`${P.tealLight}44`, transition:'color 0.2s', pointerEvents:'none' }}><Mail size={14}/></div>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="tu@correo.com" required
              onFocus={()=>setActive(true)} onBlur={()=>setActive(false)}
              style={{ width:'100%', boxSizing:'border-box', padding:'12px 13px 12px 38px',
                background:active?`${P.teal}12`:'rgba(255,255,255,0.05)',
                border:`1px solid ${active?`${P.tealMid}55`:'rgba(255,255,255,0.1)'}`,
                borderRadius:9, color:P.cream, fontSize:'0.875rem', outline:'none', transition:'all 0.22s',
                boxShadow:active?`0 0 0 3px ${P.teal}22`:'none' }}/>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'9px 11px', background:`${P.teal}10`, border:`1px solid ${P.teal}25`, borderRadius:8 }}>
          <Info size={12} color={P.tealMid} style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:'0.67rem', color:`${P.tealLight}77`, lineHeight:1.55 }}>
            El enlace expira en <strong style={{ color:P.tealLight }}>1 hora</strong>. Si no recibes el correo, revisa tu carpeta de spam.
          </p>
        </div>
        <button type="submit" disabled={loading}
          style={{ width:'100%', padding:'13px', borderRadius:10, border:'none',
            background:`linear-gradient(135deg,${P.teal},${P.tealMid})`,
            color:P.dark, fontWeight:700, fontSize:'0.88rem', cursor:loading?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            opacity:loading?0.7:1, transition:'all 0.25s', boxShadow:`0 4px 22px ${P.teal}55` }}
          onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.boxShadow=`0 6px 30px ${P.teal}88`; e.currentTarget.style.transform='translateY(-1px)' }}}
          onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 4px 22px ${P.teal}55`; e.currentTarget.style.transform='none' }}>
          {loading ? <span style={{ width:16,height:16,border:`2px solid ${P.dark}44`,borderTopColor:P.dark,borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}/> : <><Send size={14}/><span>Enviar Enlace de Recuperación</span></>}
        </button>
      </form>
      <style>{`input::placeholder{color:${P.tealLight}33!important;}`}</style>
    </div>
  )
}
export default ForgotPasswordForm