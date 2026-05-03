import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { PageHeader, Button, Modal, Input, LoadingSpinner } from '../components/UI';
import { useAuth } from '../hooks/useAuth';

export default function Messages() {
  const { user }   = useAuth();
  const [messages, setMessages] = useState([]);
  const [staff,    setStaff]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [tab,      setTab]      = useState('inbox');   // 'inbox' | 'sent'
  const [compose,  setCompose]  = useState(false);
  const [selected, setSelected] = useState(null);
  const [form,     setForm]     = useState({ to_uid:'', subject:'', body:'' });
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const load = () => {
    setLoading(true);
    const req = tab === 'inbox' ? api.getMessages() : api.getSentMessages();
    Promise.all([req, api.getStaff()])
      .then(([m, s]) => { setMessages(m.data || []); setStaff(s.data || []); })
      .catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [tab]);

  const handleSend = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      await api.sendMessage(form);
      setCompose(false);
      setForm({ to_uid:'', subject:'', body:'' });
      if (tab === 'sent') load();
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const markRead = async (msg) => {
    if (!msg.read) {
      await api.markMessageRead(msg.id).catch(() => {});
      setMessages(ms => ms.map(m => m.id === msg.id ? { ...m, read: 1 } : m));
    }
    setSelected(msg);
  };

  const staffOpts = staff.filter(s => s.id !== user?.id);
  const unread    = messages.filter(m => !m.read).length;
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div style={{ padding:'28px 32px', maxWidth:1100, margin:'0 auto' }}>
      <PageHeader
        title="Messagerie interne"
        sub="Communication entre l'équipe soignante"
        action={<Button onClick={() => { setCompose(true); setError(''); }}>+ Nouveau message</Button>}
      />

      <div style={{ display:'grid', gridTemplateColumns:'280px 1fr', gap:16, height:580 }}>
        {/* Sidebar list */}
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, overflow:'hidden', boxShadow:'var(--shadow)', display:'flex', flexDirection:'column' }}>
          {/* Tabs */}
          <div style={{ display:'flex', borderBottom:'1px solid var(--border)' }}>
            {[['inbox','Boîte de réception'],['sent','Envoyés']].map(([val, label]) => (
              <button key={val} onClick={() => { setTab(val); setSelected(null); }}
                style={{ flex:1, padding:'11px 8px', fontSize:12, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s',
                  background: tab===val ? 'var(--cream)' : '#fff',
                  color:      tab===val ? 'var(--forest)' : 'var(--muted)',
                  borderBottom: tab===val ? '2px solid var(--leaf)' : '2px solid transparent',
                }}>
                {label}
                {val === 'inbox' && unread > 0 && (
                  <span style={{ marginLeft:5, background:'var(--leaf)', color:'#fff', borderRadius:8, fontSize:9, fontWeight:700, padding:'1px 5px' }}>{unread}</span>
                )}
              </button>
            ))}
          </div>

          {/* Message list */}
          <div style={{ flex:1, overflowY:'auto' }}>
            {loading ? (
              <div style={{ padding:24, textAlign:'center' }}><LoadingSpinner text="" /></div>
            ) : messages.length === 0 ? (
              <p style={{ padding:24, textAlign:'center', color:'var(--muted)', fontSize:12 }}>
                {tab === 'inbox' ? 'Aucun message reçu' : 'Aucun message envoyé'}
              </p>
            ) : messages.map(msg => (
              <div key={msg.id} onClick={() => markRead(msg)}
                style={{
                  padding:'12px 14px', cursor:'pointer', borderBottom:'1px solid var(--border)',
                  background: selected?.id === msg.id ? 'rgba(27,67,50,0.05)' : msg.read ? '#fff' : 'rgba(64,145,108,0.04)',
                  transition:'background 0.1s',
                }}
                onMouseEnter={e => { if (selected?.id !== msg.id) e.currentTarget.style.background='rgba(27,67,50,0.03)'; }}
                onMouseLeave={e => { if (selected?.id !== msg.id) e.currentTarget.style.background=msg.read?'#fff':'rgba(64,145,108,0.04)'; }}
              >
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                  <p style={{ fontSize:12, fontWeight: msg.read ? 400 : 700, color:'var(--forest)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis', maxWidth:140 }}>
                    {tab === 'inbox' ? (msg.from_name || 'Système') : (msg.to_name || 'Tous')}
                  </p>
                  <p style={{ fontSize:10, color:'var(--muted)', flexShrink:0 }}>
                    {new Date(msg.created_at).toLocaleDateString('fr-FR', { day:'2-digit', month:'short' })}
                  </p>
                </div>
                {msg.subject && <p style={{ fontSize:11, fontWeight:600, color:'var(--text)', marginBottom:2 }}>{msg.subject}</p>}
                <p style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>
                  {msg.body}
                </p>
                {!msg.read && tab === 'inbox' && (
                  <span style={{ display:'inline-block', width:6, height:6, borderRadius:'50%', background:'var(--leaf)', marginTop:4 }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Message viewer */}
        <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, boxShadow:'var(--shadow)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
          {!selected ? (
            <div style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'var(--muted)' }}>
              <span style={{ fontSize:36, marginBottom:12 }}>✉️</span>
              <p style={{ fontSize:13 }}>Sélectionnez un message</p>
            </div>
          ) : (
            <>
              <div style={{ padding:'18px 22px', borderBottom:'1px solid var(--border)' }}>
                <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, fontWeight:700, color:'var(--forest)', marginBottom:6 }}>
                  {selected.subject || '(Sans objet)'}
                </h3>
                <div style={{ display:'flex', gap:16, fontSize:11, color:'var(--muted)' }}>
                  <span>De : <strong>{selected.from_name}</strong> ({selected.from_role})</span>
                  <span>{new Date(selected.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
              <div style={{ flex:1, padding:'20px 22px', overflowY:'auto' }}>
                <p style={{ fontSize:14, color:'var(--text)', lineHeight:1.8, whiteSpace:'pre-wrap' }}>{selected.body}</p>
              </div>
              <div style={{ padding:'12px 22px', borderTop:'1px solid var(--border)' }}>
                <Button variant="outline" style={{ fontSize:12 }} onClick={() => {
                  const sender = staff.find(s => s.id === selected.from_uid);
                  setForm({ to_uid: String(selected.from_uid), subject: `Re: ${selected.subject || ''}`, body:'' });
                  setCompose(true);
                }}>
                  ↩ Répondre
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Compose modal */}
      <Modal open={compose} onClose={() => setCompose(false)} title="Nouveau message" width={520}>
        <form onSubmit={handleSend} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)' }}>Destinataire</span>
            <select value={form.to_uid} onChange={e => set('to_uid', e.target.value)}
              style={{ padding:'9px 13px', borderRadius:10, border:'1.5px solid rgba(27,67,50,0.18)', background:'#FAFAF8', fontSize:13, outline:'none', fontFamily:'inherit' }}
              onFocus={e => (e.target.style.borderColor='var(--leaf)')} onBlur={e => (e.target.style.borderColor='rgba(27,67,50,0.18)')}>
              <option value="">Tous les membres de l'équipe</option>
              {staffOpts.map(s => <option key={s.id} value={String(s.id)}>{s.name} ({s.role})</option>)}
            </select>
          </label>
          <Input label="Objet" value={form.subject} onChange={v => set('subject', v)} placeholder="Sujet du message" />
          <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)' }}>Message *</span>
            <textarea value={form.body} onChange={e => set('body', e.target.value)} required rows={6}
              placeholder="Rédigez votre message ici…"
              style={{ padding:'9px 13px', borderRadius:10, border:'1.5px solid rgba(27,67,50,0.18)', background:'#FAFAF8', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none' }}
              onFocus={e => (e.target.style.borderColor='var(--leaf)')} onBlur={e => (e.target.style.borderColor='rgba(27,67,50,0.18)')} />
          </label>
          {error && <p style={{ fontSize:12, padding:'8px 12px', borderRadius:8, background:'#FEE2E2', color:'#991B1B' }}>{error}</p>}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <Button variant="outline" type="button" onClick={() => setCompose(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !form.body.trim()}>{saving ? 'Envoi…' : 'Envoyer →'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
