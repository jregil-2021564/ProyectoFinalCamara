import { useState, useEffect, useRef } from 'react'
import { Camera, User, Mail, Phone, Car, Edit2, Save, X, Upload, Shield, Clock } from 'lucide-react'
import useProfileStore from '../store/profileStore'
import useAuthStore from '../../../features/auth/store/authStore'
import useNotifStore, { NOTIF_TYPES } from '../../../shared/store/notifStore'
import { toastSuccess, toastError } from '../../../shared/utils/toast'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD' }

const Field = ({ icon, label, value }) => (
  <div style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'14px 0', borderBottom:'1px solid #f0f4f3' }}>
    <div style={{ width:34, height:34, borderRadius:8, background:`${P.teal}12`, border:`1px solid ${P.teal}25`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:P.teal }}>
      {icon}
    </div>
    <div>
      <p style={{ fontSize:'0.72rem', color:'var(--text-2)', marginBottom:3, fontWeight:600, letterSpacing:'0.04em', textTransform:'uppercase' }}>{label}</p>
      <p style={{ fontSize:'0.92rem', fontWeight:500, color:P.dark }}>{value || '—'}</p>
    </div>
  </div>
)

const ProfilePage = () => {
  const { profile, loading, saving, fetchProfile, saveProfile } = useProfileStore()
  const { user: authUser, logout } = useAuthStore()
  const { add } = useNotifStore()
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState({ name:'', surname:'', phone:'' })
  const [newPic, setNewPic] = useState(null)
  const [preview, setPreview] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => { fetchProfile() }, [])

  useEffect(() => {
    if (profile) {
      setForm({
        name:    profile.name    || profile.Name    || '',
        surname: profile.surname || profile.Surname || '',
        phone:   profile.phone   || profile.UserProfile?.Phone || '',
      })
    }
  }, [profile])

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setNewPic(f)
    setPreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    const fd = new FormData()
    fd.append('name',    form.name)
    fd.append('surname', form.surname)
    fd.append('phone',   form.phone)
    if (newPic) fd.append('profilePicture', newPic)
    const res = await saveProfile(fd)
    if (res.ok) {
      toastSuccess('Perfil actualizado correctamente')
      add(NOTIF_TYPES.SISTEMA, 'Perfil actualizado', 'Tus datos de perfil fueron guardados.')
      setEditing(false)
      setNewPic(null)
      setPreview(null)
    } else {
      toastError(res.message)
    }
  }

  const handleCancel = () => {
    setEditing(false)
    setNewPic(null)
    setPreview(null)
    if (profile) setForm({ name: profile.name||'', surname: profile.surname||'', phone: profile.phone||profile.UserProfile?.Phone||'' })
  }

  const pic     = preview || profile?.profilePicture || profile?.UserProfile?.ProfilePicture
  const name    = profile?.name    || profile?.Name    || '—'
  const surname = profile?.surname || profile?.Surname || '—'
  const email   = profile?.email   || profile?.Email   || '—'
  const phone   = profile?.phone   || profile?.UserProfile?.Phone || '—'
  const placa   = profile?.placa   || profile?.UserProfile?.Placa || '—'
  const role    = authUser?.role === 'ADMIN_ROLE' ? 'Administrador' : 'Conductor'
  const isAdmin = authUser?.role === 'ADMIN_ROLE'

  if (loading) return (
    <div className="page-content" style={{ display:'flex', alignItems:'center', justifyContent:'center', minHeight:400 }}>
      <span className="spinner-dark"/>
    </div>
  )

  return (
    <div className="page-content">
      <p className="page-title">Mi Perfil</p>
      <p className="page-subtitle">Administra tu información personal y foto de perfil</p>

      <div className="profile-grid" style={{ display:'grid', gridTemplateColumns:'340px 1fr', gap:20, alignItems:'start' }}>

        {/* ── LEFT: Avatar + badge ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Avatar card */}
          <div className="card" style={{ textAlign:'center', padding:'32px 24px' }}>
            <div style={{ position:'relative', display:'inline-block', marginBottom:16 }}>
              <div style={{ width:100, height:100, borderRadius:'50%', background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem', fontWeight:800, color:P.dark, overflow:'hidden', margin:'0 auto', border:`3px solid ${P.teal}44` }}>
                {pic
                  ? <img src={pic} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
                  : (name.charAt(0)||'U').toUpperCase()}
              </div>
              {editing && (
                <button onClick={()=>fileRef.current?.click()}
                  style={{ position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, border:`2px solid #fff`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
                  <Camera size={13} color={P.dark}/>
                </button>
              )}
              <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }}/>
            </div>

            <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'1.1rem', color:P.dark, marginBottom:4 }}>{name} {surname}</p>
            <p style={{ fontSize:'0.8rem', color:'var(--text-2)', marginBottom:12 }}>{email}</p>

            <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:isAdmin?`${P.teal}15`:`${P.tealMid}15`, border:`1px solid ${isAdmin?P.teal:P.tealMid}33`, borderRadius:20, padding:'4px 14px' }}>
              <Shield size={12} color={isAdmin?P.teal:P.tealMid}/>
              <span style={{ fontSize:'0.72rem', fontWeight:600, color:isAdmin?P.teal:P.tealMid }}>{role}</span>
            </div>
          </div>

          {/* Quick info card */}
          <div className="card" style={{ padding:'16px 20px' }}>
            <p style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-2)', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:12 }}>Cuenta</p>
            <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {[
                { label:'Estado', value:'Verificado ✓', color:'#3d8b6e' },
                { label:'Placa', value:placa, color:P.teal },
              ].map(i => (
                <div key={i.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontSize:'0.8rem', color:'var(--text-2)' }}>{i.label}</span>
                  <span style={{ fontSize:'0.8rem', fontWeight:600, color:i.color }}>{i.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT: Info + edit form ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          <div className="card">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
              <h3 style={{ fontWeight:700, fontSize:'0.95rem', color:P.dark }}>Información Personal</h3>
              {!editing
                ? <button onClick={()=>setEditing(true)} className="btn-outline" style={{ padding:'7px 16px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:6 }}>
                    <Edit2 size={13}/> Editar
                  </button>
                : <div style={{ display:'flex', gap:8 }}>
                    <button onClick={handleSave} disabled={saving} className="btn-success" style={{ padding:'7px 16px', fontSize:'0.8rem', display:'flex', alignItems:'center', gap:6 }}>
                      {saving ? <span className="spinner" style={{ width:13, height:13 }}/> : <><Save size={13}/> Guardar</>}
                    </button>
                    <button onClick={handleCancel} className="btn-outline" style={{ padding:'7px 14px', fontSize:'0.8rem', borderColor:'var(--text-2)', color:'var(--text-2)' }}>
                      <X size={13}/>
                    </button>
                  </div>}
            </div>

            {!editing ? (
              <div>
                <Field icon={<User size={15}/>}   label="Nombre"   value={`${name} ${surname}`}/>
                <Field icon={<Mail size={15}/>}   label="Correo"   value={email}/>
                <Field icon={<Phone size={15}/>}  label="Teléfono" value={phone}/>
                <Field icon={<Car size={15}/>}    label="Placa"    value={placa}/>
              </div>
            ) : (
              <div style={{ display:'flex', flexDirection:'column', gap:14, marginTop:16 }}>
                {newPic && (
                  <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:`${P.teal}0a`, border:`1px solid ${P.teal}22`, borderRadius:8 }}>
                    <img src={preview} style={{ width:40, height:40, borderRadius:'50%', objectFit:'cover' }}/>
                    <div>
                      <p style={{ fontSize:'0.78rem', fontWeight:600, color:P.dark }}>Nueva foto seleccionada</p>
                      <p style={{ fontSize:'0.7rem', color:'var(--text-2)' }}>{newPic.name}</p>
                    </div>
                    <button onClick={()=>{setNewPic(null);setPreview(null)}} style={{ marginLeft:'auto', background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}><X size={14}/></button>
                  </div>
                )}
                {!newPic && (
                  <button onClick={()=>fileRef.current?.click()}
                    style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', background:`${P.teal}08`, border:`1.5px dashed ${P.teal}44`, borderRadius:9, cursor:'pointer', color:P.teal, fontSize:'0.82rem', fontWeight:500 }}>
                    <Upload size={14}/> Cambiar foto de perfil
                  </button>
                )}
                <div className="form-grid-2" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  {[['name','Nombre','Juan'],['surname','Apellido','Pérez']].map(([k,l,p])=>(
                    <div key={k}>
                      <label className="form-label">{l}</label>
                      <input className="form-input" value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} placeholder={p}/>
                    </div>
                  ))}
                </div>
                <div>
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" value={form.phone} onChange={e=>setForm(f=>({...f,phone:e.target.value}))} placeholder="42653798"/>
                </div>
                <div style={{ padding:'10px 12px', background:'#f5faf9', border:'1px solid var(--border)', borderRadius:8 }}>
                  <p style={{ fontSize:'0.72rem', color:'var(--text-2)' }}>El correo y la placa no se pueden editar desde aquí.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Responsive */}
      <style>{`
        @media(max-width:700px){
          .profile-grid { grid-template-columns:1fr!important; }
        }
      `}</style>
    </div>
  )
}

export default ProfilePage