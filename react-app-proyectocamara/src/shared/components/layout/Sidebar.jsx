import { NavLink, useNavigate } from 'react-router-dom'
import { Camera, Shield, Users, Activity, CreditCard, Wallet, Car, FileText, LogOut, BarChart2, AlertTriangle, Eye, User, X } from 'lucide-react'
import useAuthStore from '../../../features/auth/store/authStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD' }

const NavItem = ({ to, icon, label, onClose }) => (
  <NavLink to={to} onClick={onClose} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
    {icon}<span>{label}</span>
  </NavLink>
)

const SidebarShell = ({ logo, subtitle, userBadge, navSections, onLogout, onClose }) => (
  <div style={{ display:'flex', flexDirection:'column', height:'100%' }}>
    {/* Header */}
    <div style={{ padding:'18px 16px 14px', borderBottom:`1px solid rgba(119,172,162,0.12)`, display:'flex', alignItems:'center', justifyContent:'space-between' }}>
      <div style={{ display:'flex', alignItems:'center', gap:11 }}>
        <div style={{ width:36, height:36, borderRadius:9, background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
          {logo}
        </div>
        <div>
          <p style={{ fontFamily:'Poppins,sans-serif', fontWeight:700, fontSize:'0.9rem', color:P.cream, lineHeight:1 }}>SpeedCam GT</p>
          <p style={{ fontSize:'0.58rem', color:`${P.tealLight}66`, letterSpacing:'0.06em', textTransform:'uppercase' }}>{subtitle}</p>
        </div>
      </div>
      {/* Close btn for mobile */}
      <button onClick={onClose} className="sidebar-close-btn"
        style={{ display:'none', background:'none', border:'none', cursor:'pointer', color:`${P.tealLight}77`, padding:4 }}>
        <X size={18}/>
      </button>
    </div>

    {/* User badge */}
    <div style={{ padding:'12px 16px', borderBottom:`1px solid rgba(119,172,162,0.1)`, display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ width:32, height:32, borderRadius:'50%', background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.82rem', fontWeight:700, color:P.dark, flexShrink:0, overflow:'hidden' }}>
        {userBadge.pic
          ? <img src={userBadge.pic} style={{ width:'100%', height:'100%', objectFit:'cover' }}/>
          : userBadge.initial}
      </div>
      <div style={{ overflow:'hidden', flex:1, minWidth:0 }}>
        <p style={{ fontSize:'0.8rem', fontWeight:600, color:P.cream, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{userBadge.name}</p>
        <p style={{ fontSize:'0.6rem', color:`${P.tealLight}66` }}>{userBadge.role}</p>
      </div>
    </div>

    {/* Nav */}
    <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
      {navSections}
    </nav>

    {/* Logout */}
    <div style={{ padding:'10px 8px', borderTop:`1px solid rgba(119,172,162,0.1)` }}>
      <button onClick={onLogout}
        style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'9px 16px', background:'rgba(192,57,43,0.1)', border:'1px solid rgba(192,57,43,0.2)', borderRadius:8, color:'rgba(250,140,130,0.8)', cursor:'pointer', fontSize:'0.85rem', fontWeight:500, transition:'all 0.2s' }}
        onMouseEnter={e=>{ e.currentTarget.style.background='rgba(192,57,43,0.18)'; e.currentTarget.style.color='#fca5a5' }}
        onMouseLeave={e=>{ e.currentTarget.style.background='rgba(192,57,43,0.1)'; e.currentTarget.style.color='rgba(250,140,130,0.8)' }}>
        <LogOut size={14}/> Cerrar Sesión
      </button>
    </div>

    <style>{`
      @media(max-width:900px){
        .sidebar-close-btn { display:flex!important; }
      }
    `}</style>
  </div>
)

export const AdminSidebar = ({ onClose = () => {} }) => {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  return (
    <SidebarShell
      logo={<Camera size={17} color={P.dark}/>}
      subtitle="Panel Admin"
      userBadge={{ initial:(user?.username||'A').charAt(0).toUpperCase(), name:user?.username||'Administrador', role:'Administrador', pic:user?.profilePicture }}
      onClose={onClose}
      onLogout={()=>{ logout(); navigate('/auth') }}
      navSections={<>
        <p className="nav-section">General</p>
        <NavItem to="/admin/dashboard"  icon={<BarChart2 size={15}/>}     label="Dashboard"    onClose={onClose}/>
        <NavItem to="/admin/cameras"    icon={<Camera size={15}/>}        label="Cámaras"      onClose={onClose}/>
        <NavItem to="/admin/multas"     icon={<AlertTriangle size={15}/>} label="Infracciones" onClose={onClose}/>
        <NavItem to="/admin/vehiculos"  icon={<Car size={15}/>}           label="Vehículos"    onClose={onClose}/>
        <p className="nav-section">Usuarios</p>
        <NavItem to="/admin/users"      icon={<Users size={15}/>}         label="Usuarios"     onClose={onClose}/>
        <p className="nav-section">Cuenta</p>
        <NavItem to="/admin/profile"    icon={<User size={15}/>}          label="Mi Perfil"    onClose={onClose}/>
      </>}
    />
  )
}

export const UserSidebar = ({ onClose = () => {} }) => {
  const { logout, user } = useAuthStore()
  const navigate = useNavigate()
  return (
    <SidebarShell
      logo={<Eye size={17} color={P.dark}/>}
      subtitle="Portal Usuario"
      userBadge={{ initial:(user?.username||'U').charAt(0).toUpperCase(), name:user?.username||'Usuario', role:'Conductor', pic:user?.profilePicture }}
      onClose={onClose}
      onLogout={()=>{ logout(); navigate('/auth') }}
      navSections={<>
        <p className="nav-section">Mi Cuenta</p>
        <NavItem to="/dashboard"          icon={<BarChart2 size={15}/>}   label="Inicio"       onClose={onClose}/>
        <NavItem to="/dashboard/cuenta"   icon={<FileText size={15}/>}    label="Mi Cuenta"    onClose={onClose}/>
        <NavItem to="/dashboard/saldo"    icon={<Wallet size={15}/>}      label="Saldo"        onClose={onClose}/>
        <NavItem to="/dashboard/tarjetas" icon={<CreditCard size={15}/>}  label="Tarjetas"     onClose={onClose}/>
        <NavItem to="/dashboard/recargas" icon={<Activity size={15}/>}    label="Recargas"     onClose={onClose}/>
        <p className="nav-section">Multas</p>
        <NavItem to="/dashboard/multas"      icon={<AlertTriangle size={15}/>} label="Ver Multas"   onClose={onClose}/>
        <NavItem to="/dashboard/pagar-multa" icon={<CreditCard size={15}/>}    label="Pagar Multa"  onClose={onClose}/>
        <p className="nav-section">Cuenta</p>
        <NavItem to="/dashboard/profile"  icon={<User size={15}/>}        label="Mi Perfil"    onClose={onClose}/>
      </>}
    />
  )
}