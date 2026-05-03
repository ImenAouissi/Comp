import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useState, useEffect } from 'react';
import { api } from '../utils/api';
import NotificationBell from './NotificationBell';
import SearchBar from './SearchBar';

const LINKS = [
  { to:'/',               icon:'◈',  label:'Tableau de bord'  },
  { to:'/residents',      icon:'👥', label:'Résidents'        },
  { to:'/sessions',       icon:'📋', label:'Séances'          },
  { to:'/calendar',       icon:'📅', label:'Planning'         },
  { to:'/biometrics',     icon:'💓', label:'Biométrie IoT'    },
  { to:'/formations',     icon:'🎓', label:'Formations'       },
  { to:'/staff',          icon:'🩺', label:'Équipe'           },
  { to:'/messages',       icon:'✉️', label:'Messagerie'       },
  { to:'/registrations',  icon:'📝', label:'Inscriptions'     },
  { to:'/reports',        icon:'📊', label:'Rapports'         },
  { to:'/alerts',         icon:'🔔', label:'Alertes'          },
  { to:'/settings',       icon:'⚙', label:'Paramètres'       },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);
  const [unreadMsg, setUnreadMsg] = useState(0);

  useEffect(() => {
    const loadBadges = () => {
      api.getNotifications()
        .then(r => setUnread((r.data || []).filter(n => !n.read).length))
        .catch(() => {});
      api.getMessages()
        .then(r => setUnreadMsg((r.data || []).filter(m => !m.read).length))
        .catch(() => {});
    };
    loadBadges();
    const t = setInterval(loadBadges, 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <aside style={{
      width: 220, minHeight:'100vh', flexShrink:0,
      background: 'var(--dark)',
      borderRight: '1px solid rgba(116,198,157,0.1)',
      display:'flex', flexDirection:'column',
    }}>
      {/* Logo */}
      <div style={{ padding:'20px 20px 16px', borderBottom:'1px solid rgba(116,198,157,0.08)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:34, height:34, borderRadius:'50%', background:'var(--leaf)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>🌿</div>
          <div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:'#fff', fontSize:13, lineHeight:1.1 }}>Smart Rehab</p>
            <p style={{ fontSize:10, color:'var(--mint)', fontStyle:'italic' }}>&amp; Green Center</p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ padding:'8px 10px', borderBottom:'1px solid rgba(116,198,157,0.08)' }}>
        <SearchBar />
      </div>

      {/* Nav */}
      <nav style={{ flex:1, padding:'10px 10px' }}>
        {LINKS.map(({ to, icon, label }) => (
          <NavLink key={to} to={to} end={to==='/'} style={{ textDecoration:'none' }}>
            {({ isActive }) => (
              <div style={{
                display:'flex', alignItems:'center', gap:9,
                padding:'8px 12px', borderRadius:10, marginBottom:2,
                background: isActive ? 'var(--mid)' : 'transparent',
                color: isActive ? '#fff' : 'rgba(255,255,255,0.55)',
                fontSize:13, fontWeight: isActive ? 600 : 400,
                transition:'all 0.15s', cursor:'pointer',
                position:'relative',
              }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.color='#fff'; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background='transparent'; e.currentTarget.style.color='rgba(255,255,255,0.55)'; }}
              >
                <span style={{ fontSize:14, width:18, textAlign:'center' }}>{icon}</span>
                <span style={{ flex:1 }}>{label}</span>
                {label === 'Alertes' && unread > 0 && (
                  <span style={{ background:'#EF4444', color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, minWidth:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                    {unread > 9 ? '9+' : unread}
                  </span>
                )}
                {label === 'Messagerie' && unreadMsg > 0 && (
                  <span style={{ background:'#3A7CA5', color:'#fff', borderRadius:10, fontSize:10, fontWeight:700, minWidth:16, height:16, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>
                    {unreadMsg > 9 ? '9+' : unreadMsg}
                  </span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ margin:'0 10px 14px', padding:'12px 14px', borderRadius:12, background:'rgba(255,255,255,0.04)', border:'1px solid rgba(116,198,157,0.1)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
          <div style={{ width:28, height:28, borderRadius:'50%', background:'var(--mid)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, color:'#fff', fontWeight:700, flexShrink:0 }}>
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div style={{ minWidth:0, flex:1 }}>
            <p style={{ fontSize:12, color:'#fff', fontWeight:500, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{user?.name}</p>
            <p style={{ fontSize:10, color:'rgba(255,255,255,0.4)' }}>{user?.role}</p>
          </div>
          <NotificationBell />
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button onClick={() => navigate('/profile')} style={{ fontSize:11, color:'rgba(255,255,255,0.45)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit' }}
            onMouseEnter={e => (e.target.style.color='#fff')} onMouseLeave={e => (e.target.style.color='rgba(255,255,255,0.45)')}>
            Mon profil
          </button>
          <span style={{ color:'rgba(255,255,255,0.2)' }}>·</span>
          <button onClick={() => { logout(); navigate('/login'); }} style={{ fontSize:11, color:'var(--mint)', background:'none', border:'none', cursor:'pointer', padding:0, fontFamily:'inherit' }}
            onMouseEnter={e => (e.target.style.color='#fff')} onMouseLeave={e => (e.target.style.color='var(--mint)')}>
            Déconnexion →
          </button>
        </div>
      </div>
    </aside>
  );
}
