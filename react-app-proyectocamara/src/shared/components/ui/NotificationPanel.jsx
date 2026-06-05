import { useRef, useEffect } from 'react'
import { Bell, X, LogIn, AlertTriangle, CreditCard, Activity, Info, CheckCheck } from 'lucide-react'
import useNotifStore from '../../store/notifStore'

const P = { dark:'#031926', teal:'#468189', tealMid:'#77ACA2', tealLight:'#9DBEBB', cream:'#F4E9CD' }

const ICONS = {
  login:   <LogIn size={14}/>,
  multa:   <AlertTriangle size={14}/>,
  pago:    <CreditCard size={14}/>,
  recarga: <Activity size={14}/>,
  sistema: <Info size={14}/>,
}
const COLORS = {
  login:   P.tealMid,
  multa:   '#c9860a',
  pago:    '#3d8b6e',
  recarga: P.teal,
  sistema: P.tealLight,
}

const timeAgo = (date) => {
  const diff = Math.floor((Date.now() - new Date(date)) / 1000)
  if (diff < 60)   return 'ahora'
  if (diff < 3600) return `hace ${Math.floor(diff/60)}m`
  if (diff < 86400)return `hace ${Math.floor(diff/3600)}h`
  return `hace ${Math.floor(diff/86400)}d`
}

const NotificationPanel = ({ onClose }) => {
  const { notifs, unread, markAllRead, markRead, clear } = useNotifStore()
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) onClose() }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} style={{
      position:'absolute', top:'calc(100% + 8px)', right:0,
      width:340, background:'#fff',
      border:'1.5px solid var(--border)', borderRadius:14,
      boxShadow:'0 12px 40px rgba(3,25,38,0.18)', zIndex:200,
      overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'14px 16px', borderBottom:'1px solid var(--border)', background:'#f5faf9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <Bell size={15} color={P.teal}/>
          <span style={{ fontWeight:700, fontSize:'0.88rem', color:P.dark }}>Notificaciones</span>
          {unread > 0 && (
            <span style={{ background:`linear-gradient(135deg,${P.teal},${P.tealMid})`, color:P.dark, fontSize:'0.65rem', fontWeight:700, padding:'2px 7px', borderRadius:10 }}>{unread}</span>
          )}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          {notifs.length > 0 && (
            <button onClick={markAllRead} style={{ background:'none', border:'none', cursor:'pointer', color:P.teal, fontSize:'0.72rem', fontWeight:600, display:'flex', alignItems:'center', gap:4 }}>
              <CheckCheck size={12}/> Leídas
            </button>
          )}
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-2)' }}>
            <X size={15}/>
          </button>
        </div>
      </div>

      {/* List */}
      <div style={{ maxHeight:340, overflowY:'auto' }}>
        {notifs.length === 0 ? (
          <div style={{ padding:'32px 16px', textAlign:'center' }}>
            <Bell size={28} color="var(--border)" style={{ margin:'0 auto 10px' }}/>
            <p style={{ fontSize:'0.82rem', color:'var(--text-2)' }}>Sin notificaciones</p>
          </div>
        ) : notifs.map(n => (
          <div key={n.id} onClick={() => markRead(n.id)}
            style={{ display:'flex', gap:12, padding:'12px 16px', borderBottom:'1px solid #f0f4f3', cursor:'pointer', background:n.read?'#fff':'#f5faf9', transition:'background 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.background='#eef5f3'}
            onMouseLeave={e=>e.currentTarget.style.background=n.read?'#fff':'#f5faf9'}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:`${COLORS[n.type]}18`, border:`1px solid ${COLORS[n.type]}33`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:COLORS[n.type], marginTop:1 }}>
              {ICONS[n.type]}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <p style={{ fontSize:'0.82rem', fontWeight:n.read?500:700, color:P.dark, marginBottom:2 }}>{n.title}</p>
              <p style={{ fontSize:'0.75rem', color:'var(--text-2)', lineHeight:1.5 }}>{n.desc}</p>
              <p style={{ fontSize:'0.68rem', color:P.teal, marginTop:3 }}>{timeAgo(n.time)}</p>
            </div>
            {!n.read && <div style={{ width:7, height:7, borderRadius:'50%', background:P.tealMid, flexShrink:0, marginTop:6 }}/>}
          </div>
        ))}
      </div>

      {notifs.length > 0 && (
        <div style={{ padding:'10px 16px', borderTop:'1px solid var(--border)', textAlign:'center' }}>
          <button onClick={clear} style={{ background:'none', border:'none', cursor:'pointer', fontSize:'0.75rem', color:'var(--text-2)' }}>
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  )
}

export default NotificationPanel