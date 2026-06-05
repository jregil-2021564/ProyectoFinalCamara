import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD', dark:'#031926' }

const GlowInput = ({ icon, type='text', placeholder, value, onChange, right }) => {
  const [active, setActive] = useState(false)
  return (
    <div style={{ position:'relative' }}>
      <div style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color:active?P.tealMid:`${P.tealLight}55`, transition:'color 0.2s', pointerEvents:'none', zIndex:1 }}>{icon}</div>
      <input type={type} value={value} onChange={onChange} placeholder={placeholder} required
        onFocus={()=>setActive(true)} onBlur={()=>setActive(false)}
        style={{ width:'100%', boxSizing:'border-box', padding:'12px 42px', paddingRight:right?44:14,
          background:active?`${P.teal}12`:`rgba(255,255,255,0.05)`,
          border:`1px solid ${active?`${P.tealMid}66`:'rgba(255,255,255,0.1)'}`,
          borderRadius:9, color:P.cream, fontSize:'0.875rem', outline:'none', transition:'all 0.22s',
          boxShadow:active?`0 0 0 3px ${P.teal}22`:'none' }}/>
      {right && <div style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', zIndex:1 }}>{right}</div>}
      <style>{`input::placeholder{color:${P.tealLight}44!important;}`}</style>
    </div>
  )
}

const LoginForm = ({ onSwitchToRegister, onSwitchToForgot }) => {
  const { login, loading } = useAuthStore()
  const navigate = useNavigate()
  const [form, setForm] = useState({ emailOrUsername:'', password:'' })
  const [showPass, setShowPass] = useState(false)
  const [remember, setRemember] = useState(false)

  const handleSubmit = async e => {
    e.preventDefault()
    const res = await login(form.emailOrUsername, form.password)
    if (res.ok) {
      toastSuccess('¡Bienvenido!')
      navigate(res.user?.role === 'ADMIN_ROLE' ? '/admin/dashboard' : '/dashboard')
    } else toastError(res.message)
  }

  const LS = { display:'block', fontSize:'0.7rem', fontWeight:600, color:`${P.tealLight}99`, marginBottom:6, letterSpacing:'0.06em' }

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
        <ShieldCheck size={15} color={P.tealMid}/>
        <p style={{ fontSize:'0.67rem', fontWeight:600, color:P.tealMid, letterSpacing:'0.14em', textTransform:'uppercase' }}>Acceso seguro</p>
      </div>
      <h2 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1.65rem', color:P.cream, marginBottom:4, lineHeight:1.2 }}>Iniciar Sesión</h2>
      <p style={{ fontSize:'0.79rem', color:`${P.tealLight}77`, marginBottom:26, lineHeight:1.6 }}>Ingresa tus credenciales para acceder al sistema de vigilancia vial.</p>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:13 }}>
        <div><label style={LS}>CORREO O USUARIO</label>
          <GlowInput icon={<Mail size={14}/>} placeholder="usuario@correo.com" value={form.emailOrUsername} onChange={e=>setForm({...form,emailOrUsername:e.target.value})}/>
        </div>
        <div><label style={LS}>CONTRASEÑA</label>
          <GlowInput icon={<Lock size={14}/>} type={showPass?'text':'password'} placeholder="Mínimo 8 caracteres"
            value={form.password} onChange={e=>setForm({...form,password:e.target.value})}
            right={<button type="button" onClick={()=>setShowPass(!showPass)} style={{ background:'none',border:'none',cursor:'pointer',color:`${P.tealLight}55`,display:'flex',padding:0,transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color=P.tealMid} onMouseLeave={e=>e.currentTarget.style.color=`${P.tealLight}55`}>{showPass?<EyeOff size={14}/>:<Eye size={14}/>}</button>}/>
        </div>

        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <label style={{ display:'flex', alignItems:'center', gap:7, cursor:'pointer' }}>
            <input type="checkbox" checked={remember} onChange={e=>setRemember(e.target.checked)} style={{ width:14,height:14,accentColor:P.teal,cursor:'pointer' }}/>
            <span style={{ fontSize:'0.77rem', color:`${P.tealLight}77` }}>Mantener sesión activa</span>
          </label>
          <button type="button" onClick={onSwitchToForgot} style={{ background:'none',border:'none',cursor:'pointer',fontSize:'0.77rem',color:`${P.tealLight}77`,transition:'color 0.2s',padding:0 }} onMouseEnter={e=>e.currentTarget.style.color=P.tealMid} onMouseLeave={e=>e.currentTarget.style.color=`${P.tealLight}77`}>
            ¿Olvidaste tu contraseña?
          </button>
        </div>

        <button type="submit" disabled={loading}
          style={{ width:'100%', padding:'13px', borderRadius:10, border:'none',
            background:`linear-gradient(135deg,${P.teal},${P.tealMid})`,
            color:P.dark, fontWeight:700, fontSize:'0.88rem', cursor:loading?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            opacity:loading?0.7:1, transition:'all 0.25s', marginTop:2,
            boxShadow:`0 4px 22px ${P.teal}55` }}
          onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.boxShadow=`0 6px 30px ${P.teal}88`; e.currentTarget.style.transform='translateY(-1px)' }}}
          onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 4px 22px ${P.teal}55`; e.currentTarget.style.transform='none' }}>
          {loading ? <span style={{ width:16,height:16,border:`2px solid ${P.dark}44`,borderTopColor:P.dark,borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}/> : <><span>Entrar al Sistema</span><ArrowRight size={14}/></>}
        </button>
      </form>

      <div style={{ display:'flex', alignItems:'center', gap:12, margin:'20px 0' }}>
        <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }}/>
        <span style={{ fontSize:'0.67rem', color:`${P.tealLight}55`, letterSpacing:'0.08em' }}>O ACCEDE CON</span>
        <div style={{ flex:1, height:'1px', background:'rgba(255,255,255,0.07)' }}/>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        {[{l:'Google',i:'G'},{l:'Microsoft',i:'M'}].map(s=>{
          const [h,setH]=useState(false)
          return (
            <button key={s.l} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}
              style={{ padding:'10px', borderRadius:9, cursor:'pointer', fontWeight:600, fontSize:'0.8rem',
                background:h?`${P.teal}18`:'rgba(255,255,255,0.04)',
                border:`1px solid ${h?`${P.teal}55`:'rgba(255,255,255,0.08)'}`,
                color:h?P.tealLight:`${P.tealLight}55`, transition:'all 0.2s',
                display:'flex', alignItems:'center', justifyContent:'center', gap:7 }}>
              <span style={{ fontWeight:800 }}>{s.i}</span>{s.l}
            </button>
          )
        })}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 12px', background:`${P.teal}12`, border:`1px solid ${P.teal}33`, borderRadius:8, marginBottom:18 }}>
        <ShieldCheck size={12} color={P.tealMid}/>
        <span style={{ fontSize:'0.68rem', color:`${P.tealLight}77`, lineHeight:1.5 }}>Conexión cifrada con AES-256. Tus datos están protegidos en todo momento.</span>
      </div>

      <p style={{ textAlign:'center', fontSize:'0.78rem', color:`${P.tealLight}55` }}>
        ¿No tienes cuenta?{' '}
        <button onClick={onSwitchToRegister} style={{ background:'none',border:'none',cursor:'pointer',color:P.tealMid,fontWeight:600,fontSize:'inherit',padding:0,transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color=P.cream} onMouseLeave={e=>e.currentTarget.style.color=P.tealMid}>
          Regístrate gratis
        </button>
      </p>
    </div>
  )
}
export default LoginForm