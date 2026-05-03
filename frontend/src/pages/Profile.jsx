import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { api } from '../utils/api';
import { PageHeader, Card, Input, Button } from '../components/UI';

export default function Profile() {
  const { user } = useAuth();
  const [name,    setName]    = useState(user?.name || '');
  const [pw,      setPw]      = useState('');
  const [pw2,     setPw2]     = useState('');
  const [saving,  setSaving]  = useState(false);
  const [msg,     setMsg]     = useState('');
  const [err,     setErr]     = useState('');

  const handleSubmit = async e => {
    e.preventDefault();
    setMsg(''); setErr('');
    if (pw && pw !== pw2) { setErr('Les mots de passe ne correspondent pas'); return; }
    if (pw && pw.length < 6) { setErr('Mot de passe trop court (min. 6 caractères)'); return; }
    setSaving(true);
    try {
      const payload = {};
      if (name && name !== user?.name) payload.name = name;
      if (pw) payload.password = pw;
      if (!Object.keys(payload).length) { setErr('Aucune modification'); setSaving(false); return; }
      await api.updateProfile(payload);
      setMsg('Profil mis à jour avec succès. Reconnectez-vous si vous avez changé le mot de passe.');
      setPw(''); setPw2('');
    } catch (e) { setErr(e.message); }
    finally { setSaving(false); }
  };

  const ROLE_LABELS = { admin:'Administrateur', medecin:'Médecin psychiatre', psychologue:'Psychologue', formateur:'Formateur', coach:'Coach sportif', infirmier:'Infirmier(ère)' };

  return (
    <div style={{ padding:'28px 32px', maxWidth:560, margin:'0 auto' }}>
      <PageHeader title="Mon profil" sub="Gérer vos informations et mot de passe" />

      {/* User card */}
      <Card className="animate-fadeUp" style={{ padding:24, marginBottom:20 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:20 }}>
          <div style={{ width:56, height:56, borderRadius:'50%', background:'var(--leaf)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, fontFamily:"'Playfair Display',serif", fontWeight:700 }}>
            {user?.name?.charAt(0)}
          </div>
          <div>
            <p style={{ fontSize:17, fontWeight:600, color:'var(--forest)' }}>{user?.name}</p>
            <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>{user?.email}</p>
            <span style={{ display:'inline-block', marginTop:5, padding:'2px 10px', borderRadius:100, fontSize:11, fontWeight:600, background:'rgba(27,67,50,0.08)', color:'var(--forest)' }}>
              {ROLE_LABELS[user?.role] || user?.role}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <Input label="Nom affiché" value={name} onChange={setName} placeholder="Votre nom complet" />

          <div style={{ height:1, background:'var(--border)', margin:'4px 0' }} />

          <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)' }}>
            Changer le mot de passe
          </p>
          <Input label="Nouveau mot de passe" type="password" value={pw} onChange={setPw} placeholder="Laisser vide pour ne pas changer" />
          <Input label="Confirmer le mot de passe" type="password" value={pw2} onChange={setPw2} placeholder="Confirmer le nouveau mot de passe" />

          {err && <p style={{ fontSize:12, padding:'8px 12px', borderRadius:8, background:'#FEE2E2', color:'#991B1B' }}>{err}</p>}
          {msg && <p style={{ fontSize:12, padding:'8px 12px', borderRadius:8, background:'#D1FAE5', color:'#065F46' }}>{msg}</p>}

          <div style={{ display:'flex', justifyContent:'flex-end' }}>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Mettre à jour'}</Button>
          </div>
        </form>
      </Card>

      {/* Session info */}
      <Card className="animate-fadeUp delay-1" style={{ padding:18 }}>
        <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)', marginBottom:12 }}>Session en cours</p>
        {[['Email', user?.email],['Rôle', ROLE_LABELS[user?.role]||user?.role],['Token stocké', 'localStorage (JWT 7 jours)']].map(([label,val]) => (
          <div key={label} style={{ display:'flex', justifyContent:'space-between', fontSize:12, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ color:'var(--muted)' }}>{label}</span>
            <span style={{ fontWeight:500, color:'var(--text)' }}>{val}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
