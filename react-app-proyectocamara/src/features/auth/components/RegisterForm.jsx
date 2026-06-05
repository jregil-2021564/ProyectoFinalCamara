import { useState } from 'react'
import { Eye, EyeOff, Upload, ArrowRight, Info } from 'lucide-react'
import useAuthStore from '../store/authStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD', dark:'#031926' }

const IS = { width:'100%', boxSizing:'border-box', padding:'11px 13px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:9, color:P.cream, fontSize:'0.84rem', outline:'none', transition:'all 0.2s' }
const LS = { display:'block', fontSize:'0.68rem', fontWeight:600, color:`${P.tealLight}88`, marginBottom:5, letterSpacing:'0.06em' }
const fo = e => { e.target.style.borderColor=`${P.tealMid}66`; e.target.style.background=`${P.teal}12`; e.target.style.boxShadow=`0 0 0 3px ${P.teal}22` }
const bl = e => { e.target.style.borderColor='rgba(255,255,255,0.1)'; e.target.style.background='rgba(255,255,255,0.05)'; e.target.style.boxShadow='none' }

const RegisterForm = ({ onSwitchToLogin, onRegistered }) => {
  const { register, loading } = useAuthStore()
  const [form, setForm] = useState({ name:'',surname:'',username:'',email:'',password:'',confirmPassword:'',phone:'',placa:'' })
  const [pic, setPic] = useState(null)
  const [preview, setPreview] = useState(null)
  const [showPass, setShowPass] = useState(false)
  const set = (k,v) => setForm(f=>({...f,[k]:v}))
  const handleFile = e => { const f=e.target.files[0]; if(!f)return; setPic(f); setPreview(URL.createObjectURL(f)) }

  const handleSubmit = async e => {
    e.preventDefault()
    if (form.password!==form.confirmPassword) { toastError('Las contraseñas no coinciden'); return }
    if (form.password.length<8) { toastError('Contraseña mínimo 8 caracteres'); return }
    const fd = new FormData()
    Object.entries(form).forEach(([k,v])=>{ if(k!=='confirmPassword') fd.append(k,k==='placa'?v.toUpperCase():v) })
    if (pic) fd.append('profilePicture', pic)
    const res = await register(fd)
    if (res.ok) { toastSuccess('¡Cuenta creada! Verifica tu correo.'); onRegistered(form.email) }
    else toastError(res.message)
  }

  return (
    <div>
      <p style={{ fontSize:'0.68rem', fontWeight:600, color:P.tealMid, letterSpacing:'0.14em', textTransform:'uppercase', marginBottom:6 }}>Nuevo usuario</p>
      <h2 style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1.55rem', color:P.cream, marginBottom:4 }}>Crear Cuenta</h2>
      <p style={{ fontSize:'0.78rem', color:`${P.tealLight}77`, marginBottom:18, lineHeight:1.6 }}>Regístrate para gestionar tu vehículo, consultar multas y realizar pagos en línea.</p>

      <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, padding:'10px 12px', background:`${P.teal}10`, border:`1px solid ${P.teal}25`, borderRadius:10 }}>
        <div style={{ width:44, height:44, borderRadius:10, background:`${P.teal}20`, border:`1px solid ${P.teal}44`, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {preview ? <img src={preview} style={{ width:'100%',height:'100%',objectFit:'cover' }}/> : <Upload size={16} color={`${P.tealMid}88`}/>}
        </div>
        <div>
          <p style={{ fontSize:'0.75rem', fontWeight:600, color:`${P.tealLight}99`, marginBottom:3 }}>Foto de perfil <span style={{ color:`${P.tealLight}44`, fontWeight:400 }}>(opcional)</span></p>
          <p style={{ fontSize:'0.67rem', color:`${P.tealLight}55`, marginBottom:4 }}>JPG, PNG o WEBP — máx. 5MB</p>
          <input type="file" accept="image/*" onChange={handleFile} style={{ fontSize:'0.68rem', color:`${P.tealLight}66`, cursor:'pointer' }}/>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:10 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
          <div><label style={LS}>NOMBRE</label><input style={IS} value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Juan" required onFocus={fo} onBlur={bl}/></div>
          <div><label style={LS}>APELLIDO</label><input style={IS} value={form.surname} onChange={e=>set('surname',e.target.value)} placeholder="Pérez" required onFocus={fo} onBlur={bl}/></div>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
          <div><label style={LS}>USUARIO</label><input style={IS} value={form.username} onChange={e=>set('username',e.target.value)} placeholder="juanperez" required onFocus={fo} onBlur={bl}/></div>
          <div><label style={LS}>TELÉFONO</label><input style={IS} value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="42653798" required onFocus={fo} onBlur={bl}/></div>
        </div>
        <div><label style={LS}>CORREO ELECTRÓNICO</label><input type="email" style={IS} value={form.email} onChange={e=>set('email',e.target.value)} placeholder="juan@correo.com" required onFocus={fo} onBlur={bl}/></div>
        <div>
          <label style={LS}>PLACA DEL VEHÍCULO</label>
          <input style={{ ...IS, textTransform:'uppercase', letterSpacing:'0.05em' }} value={form.placa} onChange={e=>set('placa',e.target.value.toUpperCase())} placeholder="P-123ABC" required onFocus={fo} onBlur={bl}/>
          <p style={{ fontSize:'0.64rem', color:`${P.tealLight}55`, marginTop:4 }}>Formato: Letra-3Números-3Letras (ej. P-123ABC)</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9 }}>
          <div>
            <label style={LS}>CONTRASEÑA</label>
            <div style={{ position:'relative' }}>
              <input type={showPass?'text':'password'} style={{ ...IS, paddingRight:36 }} value={form.password} onChange={e=>set('password',e.target.value)} placeholder="Mín. 8 caracteres" required onFocus={fo} onBlur={bl}/>
              <button type="button" onClick={()=>setShowPass(!showPass)} style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',color:`${P.tealLight}55`,display:'flex',padding:0,transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color=P.tealMid} onMouseLeave={e=>e.currentTarget.style.color=`${P.tealLight}55`}>
                {showPass?<EyeOff size={13}/>:<Eye size={13}/>}
              </button>
            </div>
          </div>
          <div><label style={LS}>CONFIRMAR</label><input type="password" style={IS} value={form.confirmPassword} onChange={e=>set('confirmPassword',e.target.value)} placeholder="Repite tu contraseña" required onFocus={fo} onBlur={bl}/></div>
        </div>

        <div style={{ display:'flex', alignItems:'flex-start', gap:7, padding:'9px 11px', background:`${P.teal}10`, border:`1px solid ${P.teal}25`, borderRadius:8 }}>
          <Info size={12} color={P.tealMid} style={{ flexShrink:0, marginTop:1 }}/>
          <p style={{ fontSize:'0.67rem', color:`${P.tealLight}77`, lineHeight:1.55 }}>
            Al registrarte recibirás un correo de verificación. Tu cuenta se activa al confirmar tu email.
          </p>
        </div>

        <button type="submit" disabled={loading}
          style={{ width:'100%', padding:'12px', borderRadius:10, border:'none',
            background:`linear-gradient(135deg,${P.teal},${P.tealMid})`,
            color:P.dark, fontWeight:700, fontSize:'0.88rem', cursor:loading?'not-allowed':'pointer',
            display:'flex', alignItems:'center', justifyContent:'center', gap:8,
            opacity:loading?0.7:1, transition:'all 0.25s', marginTop:2,
            boxShadow:`0 4px 22px ${P.teal}55` }}
          onMouseEnter={e=>{ if(!loading){ e.currentTarget.style.boxShadow=`0 6px 30px ${P.teal}88`; e.currentTarget.style.transform='translateY(-1px)' }}}
          onMouseLeave={e=>{ e.currentTarget.style.boxShadow=`0 4px 22px ${P.teal}55`; e.currentTarget.style.transform='none' }}>
          {loading ? <span style={{ width:15,height:15,border:`2px solid ${P.dark}44`,borderTopColor:P.dark,borderRadius:'50%',display:'inline-block',animation:'spin 0.7s linear infinite' }}/> : <><span>Crear mi Cuenta</span><ArrowRight size={14}/></>}
        </button>
      </form>

      <p style={{ textAlign:'center', marginTop:14, fontSize:'0.77rem', color:`${P.tealLight}55` }}>
        ¿Ya tienes cuenta?{' '}
        <button onClick={onSwitchToLogin} style={{ background:'none',border:'none',cursor:'pointer',color:P.tealMid,fontWeight:600,fontSize:'inherit',padding:0,transition:'color 0.2s' }} onMouseEnter={e=>e.currentTarget.style.color=P.cream} onMouseLeave={e=>e.currentTarget.style.color=P.tealMid}>
          Iniciar sesión
        </button>
      </p>
      <style>{`input::placeholder{color:${P.tealLight}33!important;}`}</style>
    </div>
  )
}
export default RegisterForm