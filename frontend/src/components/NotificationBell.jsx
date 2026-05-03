import { useEffect, useState, useRef } from 'react';
import { api } from '../utils/api';

const TYPE_ICON  = { alert:'🔴', warning:'🟡', info:'🔵', success:'🟢' };
const TYPE_BG    = { alert:'#FEE2E2', warning:'#FEF3C7', info:'#EFF6FF', success:'#D1FAE5' };

export default function NotificationBell() {
  const [notifs, setNotifs] = useState([]);
  const [open,   setOpen]   = useState(false);
  const ref = useRef(null);

  const load = () =>
    api.getNotifications()
      .then(r => setNotifs(r.data || []))
      .catch(() => {});

  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const unread = notifs.filter(n => !n.read).length;

  const markRead = async id => {
    setNotifs(ns => ns.map(n => n.id === id ? { ...n, read: 1 } : n));
    api.markRead(id).catch(() => {});
  };

  const markAll = () => {
    setNotifs(ns => ns.map(n => ({ ...n, read: 1 })));
    api.markAllRead().catch(() => {});
  };

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <button onClick={() => setOpen(o => !o)} style={{
        position:'relative', width:34, height:34, borderRadius:10, border:'1px solid rgba(116,198,157,0.2)',
        background: open ? 'rgba(116,198,157,0.15)' : 'rgba(255,255,255,0.06)',
        cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15,
      }}>
        🔔
        {unread > 0 && (
          <span style={{
            position:'absolute', top:-4, right:-4,
            background:'#EF4444', color:'#fff', borderRadius:8,
            fontSize:9, fontWeight:700, minWidth:15, height:15,
            display:'flex', alignItems:'center', justifyContent:'center', padding:'0 3px',
          }}>{unread > 9 ? '9+' : unread}</span>
        )}
      </button>

      {open && (
        <div style={{
          position:'absolute', top:40, right:0, width:300, zIndex:300,
          background:'#fff', borderRadius:14, border:'1px solid rgba(27,67,50,0.1)',
          boxShadow:'0 16px 48px rgba(0,0,0,0.15)', overflow:'hidden',
        }}>
          <div style={{ padding:'10px 14px', background:'#F8F6F0', borderBottom:'1px solid rgba(27,67,50,0.06)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <span style={{ fontSize:12, fontWeight:700, color:'var(--forest)' }}>Notifications {unread > 0 && `(${unread})`}</span>
            {unread > 0 && (
              <button onClick={markAll} style={{ fontSize:11, color:'var(--leaf)', background:'none', border:'none', cursor:'pointer' }}>
                Tout lire
              </button>
            )}
          </div>
          <div style={{ maxHeight:320, overflowY:'auto' }}>
            {notifs.length === 0 ? (
              <p style={{ padding:'24px 14px', textAlign:'center', fontSize:12, color:'var(--muted)' }}>Aucune notification</p>
            ) : notifs.map(n => (
              <div key={n.id} onClick={() => markRead(n.id)} style={{
                padding:'10px 14px', display:'flex', gap:10, cursor:'pointer',
                background: n.read ? '#fff' : TYPE_BG[n.type] || '#F9FAFB',
                borderBottom:'1px solid rgba(27,67,50,0.05)',
                transition:'filter 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.filter='brightness(0.97)')}
                onMouseLeave={e => (e.currentTarget.style.filter='')}
              >
                <span style={{ fontSize:13, flexShrink:0 }}>{TYPE_ICON[n.type] || '🔵'}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight: n.read ? 400 : 700, color:'var(--text)', marginBottom:2 }}>{n.title}</p>
                  <p style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{n.body}</p>
                  <p style={{ fontSize:10, color:'#C0BDB5', marginTop:2 }}>
                    {new Date(n.created_at).toLocaleString('fr-FR',{ hour:'2-digit', minute:'2-digit', day:'2-digit', month:'short' })}
                  </p>
                </div>
                {!n.read && <span style={{ width:7, height:7, borderRadius:'50%', background:'var(--leaf)', flexShrink:0, marginTop:4 }} />}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
