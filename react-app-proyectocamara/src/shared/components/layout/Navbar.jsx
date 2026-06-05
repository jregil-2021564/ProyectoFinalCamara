import { useState, useEffect } from 'react'
import { Bell, Menu, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuthStore from '../../../features/auth/store/authStore'
import useNotifStore, { NOTIF_TYPES } from '../../store/notifStore'
import NotificationPanel from '../ui/NotificationPanel'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2' }

const Navbar = ({ title, onToggleSidebar }) => {
  const { user } = useAuthStore()
  const { unread, add } = useNotifStore()
  const navigate = useNavigate()
  const [showNotifs, setShowNotifs] = useState(false)
  const isAdmin = user?.role === 'ADMIN_ROLE'

  useEffect(() => {
    add(NOTIF_TYPES.LOGIN, 'Sesión iniciada', `Bienvenido de vuelta, ${user?.username || 'usuario'}.`)
  }, [])

  const profilePath = isAdmin ? '/admin/profile' : '/dashboard/profile'

  return (
    <header className="topbar">
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        {/* Hamburger — solo visible en móvil/tablet */}
        <button onClick={onToggleSidebar}
          style={{ width:34, height:34, borderRadius:8, background:`rgba(70,129,137,0.08)`, border:`1.5px solid rgba(70,129,137,0.2)`, display:'none', alignItems:'center', justifyContent:'center', cursor:'pointer', flexShrink:0 }}
          className="hamburger-btn">
          <Menu size={17} color={P.teal}/>
        </button>

        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:4, height:20, background:`linear-gradient(${P.teal},${P.tealMid})`, borderRadius:2, flexShrink:0 }}/>
          <h1 className="topbar-title" style={{ fontSize:'1rem', fontWeight:700, color:P.dark, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:'40vw' }}>{title}</h1>
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
        {/* Status pill — hidden on small screens via CSS */}
        <div className="status-pill" style={{ display:'flex', alignItems:'center', gap:6, background:`rgba(70,129,137,0.1)`, border:`1px solid rgba(70,129,137,0.25)`, borderRadius:20, padding:'5px 12px' }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:P.tealMid, display:'inline-block' }}/>
          <span style={{ fontSize:'0.68rem', fontWeight:600, color:P.teal, letterSpacing:'0.06em' }}>EN LÍNEA</span>
        </div>

        {/* Bell */}
        <div style={{ position:'relative' }}>
          <button onClick={()=>setShowNotifs(!showNotifs)}
            style={{ width:34, height:34, borderRadius:8, background:`rgba(70,129,137,0.08)`, border:`1.5px solid rgba(70,129,137,0.2)`, display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer', position:'relative' }}>
            <Bell size={15} color={P.teal}/>
            {unread > 0 && (
              <span style={{ position:'absolute', top:-4, right:-4, width:17, height:17, borderRadius:'50%', background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, color:P.dark, fontSize:'0.58rem', fontWeight:800, display:'flex', alignItems:'center', justifyContent:'center', border:'2px solid #fff' }}>
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>
          {showNotifs && <NotificationPanel onClose={()=>setShowNotifs(false)} className="notif-panel"/>}
        </div>

        {/* User chip */}
        <button onClick={()=>navigate(profilePath)}
          style={{ display:'flex', alignItems:'center', gap:7, padding:'4px 10px 4px 4px', background:`rgba(70,129,137,0.08)`, border:`1.5px solid rgba(70,129,137,0.2)`, borderRadius:20, cursor:'pointer', transition:'all 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.background=`rgba(70,129,137,0.16)`}
          onMouseLeave={e=>e.currentTarget.style.background=`rgba(70,129,137,0.08)`}>
          <div style={{ width:26, height:26, borderRadius:'50%', background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.75rem', fontWeight:700, color:P.dark, overflow:'hidden', flexShrink:0 }}>
            {user?.profilePicture
              ? <img src={user.profilePicture} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
              : (user?.username||'U').charAt(0).toUpperCase()}
          </div>
          {/* Username — hidden on very small screens */}
          <div className="nav-user-info">
            <p style={{ fontSize:'0.76rem', fontWeight:600, color:P.dark, lineHeight:1 }}>{user?.username||'Usuario'}</p>
            <p style={{ fontSize:'0.6rem', color:P.teal }}>{isAdmin?'Admin':'Conductor'}</p>
          </div>
        </button>
      </div>

      <style>{`
        @media(max-width:900px){
          .hamburger-btn { display:flex!important; }
        }
        @media(max-width:480px){
          .nav-user-info { display:none; }
        }
      `}</style>
    </header>
  )
}
export default Navbar