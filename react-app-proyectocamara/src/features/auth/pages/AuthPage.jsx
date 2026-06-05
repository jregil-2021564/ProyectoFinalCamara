import { useState, useEffect } from 'react'
import { Camera, Shield, Zap, Eye, Lock, Globe, Bell } from 'lucide-react'
import LoginForm from '../components/LoginForm'
import RegisterForm from '../components/RegisterForm'
import ForgotPasswordForm from '../components/ForgotPasswordForm'
import PendingVerificationPanel from '../components/PendingVerificationPanel'

const STATS = [
  { icon: <Camera size={14}/>, value: '24/7', label: 'Monitoreo activo' },
  { icon: <Zap size={14}/>,    value: '+1.2K', label: 'Infracciones/día' },
  { icon: <Shield size={14}/>, value: '100%', label: 'Encriptado' },
]

const FEATURES = [
  { icon: <Eye size={14}/>,   title: 'Detección en tiempo real',  desc: 'Reconocimiento automático de placas y velocidades.' },
  { icon: <Lock size={14}/>,  title: 'Acceso seguro',             desc: 'Autenticación JWT con tokens de corta duración.' },
  { icon: <Globe size={14}/>, title: 'Cobertura total',           desc: 'Red de cámaras en toda la ciudad, 6 zonas activas.' },
  { icon: <Bell size={14}/>,  title: 'Alertas inmediatas',        desc: 'Notificaciones al instante cuando se registra una multa.' },
]

// Paleta: 031926 / 468189 / 77ACA2 / 9DBEBB / F4E9CD
const P = {
  darkest:  '#031926',
  teal:     '#468189',
  tealMid:  '#77ACA2',
  tealLight:'#9DBEBB',
  cream:    '#F4E9CD',
}

const AuthPage = () => {
  const [vista, setVista] = useState('login')
  const [pendingEmail, setPendingEmail] = useState('')
  const [show, setShow] = useState(false)
  useEffect(() => { setTimeout(() => setShow(true), 60) }, [])

  const handleRegistered = (email) => { setPendingEmail(email); setVista('pending') }

  const left = {
    login:    'Bienvenido\nde vuelta',
    register: 'Crea tu\ncuenta',
    forgot:   'Recupera\ntu acceso',
    pending:  'Verifica\ntu correo',
  }

  const anim = (delay = 0) => ({
    opacity: show ? 1 : 0,
    transform: show ? 'none' : 'translateY(18px)',
    transition: `opacity 0.55s ease ${delay}s, transform 0.55s ease ${delay}s`,
  })

  return (
    <div style={{ position:'relative', minHeight:'100vh', display:'flex', overflow:'hidden', background: P.darkest }}>

      {/* Video */}
      <video autoPlay muted loop playsInline
        style={{ position:'fixed', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0 }}>
        <source src="/traffic.mp4" type="video/mp4"/>
      </video>

      {/* Overlay — teal-tinted dark */}
      <div style={{ position:'fixed', inset:0, zIndex:1,
        background:`linear-gradient(110deg, rgba(3,25,38,0.93) 0%, rgba(70,129,137,0.55) 50%, rgba(3,25,38,0.88) 100%)` }}/>

      {/* Subtle grid */}
      <div style={{ position:'fixed', inset:0, zIndex:1, opacity:0.025,
        backgroundImage:`linear-gradient(${P.tealLight}88 1px,transparent 1px),linear-gradient(90deg,${P.tealLight}88 1px,transparent 1px)`,
        backgroundSize:'48px 48px' }}/>

      {/* Layout */}
      <div style={{ position:'relative', zIndex:2, display:'flex', width:'100%', minHeight:'100vh' }}>

        {/* ── LEFT ── centrado verticalmente, texto alineado a la izquierda */}
        <div className="auth-left-col"
          style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'flex-start', padding:'48px 48px 48px 64px', gap:0 }}>

          {/* Logo */}
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:48, ...anim(0) }}>
            <div style={{ width:42, height:42, borderRadius:11, background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, display:'flex', alignItems:'center', justifyContent:'center', boxShadow:`0 0 22px ${P.teal}66`, flexShrink:0 }}>
              <Camera size={20} color={P.cream}/>
            </div>
            <div>
              <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'0.95rem', color:P.cream, lineHeight:1 }}>SpeedCam GT</p>
              <p style={{ fontSize:'0.6rem', color:`${P.tealLight}bb`, letterSpacing:'0.12em', textTransform:'uppercase' }}>Sistema de Vigilancia Vial</p>
            </div>
          </div>

          {/* Badge */}
          <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:`${P.teal}22`, border:`1px solid ${P.teal}55`, borderRadius:20, padding:'5px 14px', marginBottom:20, ...anim(0.06) }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:P.tealMid, display:'inline-block', animation:'blink 1.8s ease-in-out infinite' }}/>
            <span style={{ fontSize:'0.7rem', color:P.tealLight, letterSpacing:'0.09em' }}>SISTEMA ACTIVO — 6 CÁMARAS EN LÍNEA</span>
          </div>

          {/* Headline */}
          <h1 style={{ fontFamily:'Poppins,sans-serif', fontWeight:800, lineHeight:1.05,
            fontSize:'clamp(2.8rem,4.2vw,3.8rem)', marginBottom:16,
            whiteSpace:'pre-line', letterSpacing:'-0.02em', ...anim(0.1) }}>
            {left[vista].split('\n').map((line, i) => (
              <span key={i} style={{ display:'block',
                color: i === 0 ? P.cream : P.tealMid }}>
                {line}
              </span>
            ))}
          </h1>

          {/* Description */}
          <p style={{ fontSize:'0.88rem', color:`${P.tealLight}99`, lineHeight:1.85, maxWidth:420, marginBottom:34, ...anim(0.15) }}>
            Plataforma gubernamental de control de velocidad vial con detección automática de placas, gestión de multas en línea y pagos integrados.
          </p>

          {/* Feature grid */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'14px 24px', marginBottom:36, width:'100%', maxWidth:440, ...anim(0.2) }}>
            {FEATURES.map((f,i) => (
              <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <div style={{ width:28, height:28, borderRadius:8, background:`${P.teal}25`, border:`1px solid ${P.teal}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1, color:P.tealMid }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontSize:'0.77rem', fontWeight:600, color:P.cream, marginBottom:2, opacity:0.85 }}>{f.title}</p>
                  <p style={{ fontSize:'0.69rem', color:`${P.tealLight}77`, lineHeight:1.5 }}>{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Stats */}
          <div style={{ display:'flex', gap:0, ...anim(0.25) }}>
            {STATS.map((s,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center' }}>
                <div style={{ paddingRight:22 }}>
                  <div style={{ color:P.tealMid, marginBottom:4 }}>{s.icon}</div>
                  <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1.15rem', color:P.cream, lineHeight:1 }}>{s.value}</p>
                  <p style={{ fontSize:'0.64rem', color:`${P.tealLight}77`, marginTop:3 }}>{s.label}</p>
                </div>
                {i < STATS.length-1 && <div style={{ width:1, height:36, background:`${P.teal}44`, marginRight:22 }}/>}
              </div>
            ))}
          </div>

          {/* Footer */}
          <p style={{ fontSize:'0.66rem', color:`${P.teal}88`, letterSpacing:'0.05em', marginTop:48, ...anim(0.3) }}>
            © 2026 SpeedCam GT · Municipalidad de Guatemala · v2.4.1
          </p>
        </div>

        {/* ── RIGHT ── */}
        <div className="auth-right-col"
          style={{ width:'44%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center',
            padding:'40px 52px', background:`rgba(3,25,38,0.55)`, borderLeft:`1px solid ${P.teal}22` }}>
          <div style={{ width:'100%', maxWidth:400, animation:'cardIn 0.4s cubic-bezier(0.16,1,0.3,1)' }}>
            {vista==='login'    && <LoginForm    onSwitchToRegister={()=>setVista('register')} onSwitchToForgot={()=>setVista('forgot')}/>}
            {vista==='register' && <RegisterForm onSwitchToLogin={()=>setVista('login')} onRegistered={handleRegistered}/>}
            {vista==='forgot'   && <ForgotPasswordForm onBack={()=>setVista('login')}/>}
            {vista==='pending'  && <PendingVerificationPanel email={pendingEmail} onBack={()=>setVista('login')}/>}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cardIn { from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none} }
        @keyframes spin    { to{transform:rotate(360deg)} }
        @keyframes blink   { 0%,100%{opacity:1}50%{opacity:0.3} }
        @media(max-width:820px){
          .auth-left-col  { display:none!important; }
          .auth-right-col { width:100%!important; border:none!important; background:rgba(3,25,38,0.7)!important; padding:32px 20px!important; }
        }
      `}</style>
    </div>
  )
}
export default AuthPage