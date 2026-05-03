import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ROLES = [
  'Médecin psychiatre',
  'Psychologue',
  'Infirmier(ère)',
  'Coach sportif',
  'Formateur',
  'Administrateur',
];

const inp = (extra = {}) => ({
  width: '100%', padding: '11px 14px', borderRadius: 10,
  border: '1.5px solid rgba(27,67,50,0.18)', background: '#FAFAF8',
  fontSize: 14, outline: 'none', fontFamily: 'inherit',
  color: '#2C3E30', transition: 'border-color 0.15s', ...extra,
});

export default function Register() {
  const [tab,    setTab]    = useState('resident'); // 'resident' | 'staff'
  const [form,   setForm]   = useState({ nom:'', prenom:'', email:'', telephone:'', age:'', situation:'', message:'', role:'' });
  const [status, setStatus] = useState('idle'); // 'idle' | 'loading' | 'success' | 'error'
  const [errMsg, setErrMsg] = useState('');
  const navigate = useNavigate();

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async e => {
    e.preventDefault();
    setStatus('loading'); setErrMsg('');

    const payload = {
      ...form,
      age:  form.age ? Number(form.age) : null,
      type: tab,
    };

    try {
      const res  = await fetch('/api/registrations', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : {};
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setStatus('success');
    } catch (err) {
      setErrMsg(err.message);
      setStatus('error');
    }
  };

  // ── Success screen ────────────────────────────────────────────────────
  if (status === 'success') {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#F8F6F0', padding:20 }}>
        <div style={{ maxWidth:480, width:'100%', background:'#fff', borderRadius:20, padding:'40px 36px', boxShadow:'0 8px 40px rgba(0,0,0,0.08)', textAlign:'center' }}>
          <div style={{ width:64, height:64, borderRadius:'50%', background:'#D1FAE5', display:'flex', alignItems:'center', justifyContent:'center', fontSize:28, margin:'0 auto 20px' }}>✓</div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#1B4332', marginBottom:10 }}>
            Demande enregistrée !
          </h2>
          <p style={{ fontSize:14, color:'#6B7B6E', lineHeight:1.7, marginBottom:24 }}>
            Votre demande a bien été reçue. Notre équipe l'examinera et vous contactera dans les <strong>48 heures</strong> à l'adresse <strong>{form.email}</strong>.
          </p>
          <button onClick={() => navigate('/login')} style={{ padding:'10px 28px', borderRadius:10, background:'#40916C', color:'#fff', border:'none', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            Retour à la connexion
          </button>
        </div>
      </div>
    );
  }

  // ── Main form ─────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#0A1F14' }}>

      {/* Left panel */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', justifyContent:'space-between', padding:'48px 52px', background:'#1B4332' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:40, height:40, borderRadius:'50%', background:'#40916C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🌿</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#fff' }}>Smart Rehab &amp; Green Center</span>
        </div>
        <div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:36, fontWeight:900, color:'#fff', lineHeight:1.2, marginBottom:16 }}>
            Rejoignez-nous.<br/>
            <span style={{ color:'#74C69D' }}>Commencez<br/>votre parcours.</span>
          </h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,0.5)', lineHeight:1.7 }}>
            Que vous soyez en quête de soin ou professionnel de santé,
            soumettez votre demande — notre équipe l'examinera sous 48h.
          </p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
          {[['🩺','Équipe pluridisciplinaire'],['🌿','Espace écologique'],['💪','Sport thérapeutique'],['🎓','Formations certifiées']].map(([icon, label]) => (
            <div key={label} style={{ background:'rgba(255,255,255,0.06)', borderRadius:12, padding:'12px 14px', display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontSize:18 }}>{icon}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,0.7)' }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div style={{ flex:'0 0 520px', overflowY:'auto', padding:'48px 40px', display:'flex', flexDirection:'column', justifyContent:'center' }}>

        {/* Tab switcher */}
        <div style={{ display:'flex', gap:8, marginBottom:28, background:'rgba(255,255,255,0.06)', borderRadius:12, padding:5 }}>
          {[['resident','Je cherche de l\'aide'],['staff','Je suis professionnel']].map(([val, label]) => (
            <button key={val} onClick={() => { setTab(val); setForm(f => ({ ...f, role:'', situation:'' })); }}
              style={{ flex:1, padding:'10px 14px', borderRadius:9, border:'none', fontSize:13, fontWeight:600, cursor:'pointer', transition:'all 0.2s', fontFamily:'inherit',
                background: tab===val ? '#40916C' : 'transparent',
                color:      tab===val ? '#fff'    : 'rgba(255,255,255,0.5)',
              }}>
              {label}
            </button>
          ))}
        </div>

        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'#fff', marginBottom:6 }}>
          {tab === 'resident' ? 'Demande d\'admission' : 'Candidature professionnelle'}
        </h2>
        <p style={{ fontSize:12, color:'rgba(255,255,255,0.4)', marginBottom:24 }}>
          {tab === 'resident'
            ? 'Remplissez ce formulaire — votre demande sera examinée par notre équipe médicale.'
            : 'Envoyez votre candidature — l\'administrateur créera votre compte.'}
        </p>

        <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:14 }}>

          {/* Name row */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>Prénom *</span>
              <input value={form.prenom} onChange={e => set('prenom', e.target.value)} required placeholder="Votre prénom"
                style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color:'#fff' }}
                onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>Nom *</span>
              <input value={form.nom} onChange={e => set('nom', e.target.value)} required placeholder="Votre nom"
                style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color:'#fff' }}
                onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')} />
            </div>
          </div>

          {/* Email */}
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>Email *</span>
            <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required placeholder="votre@email.com"
              style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color:'#fff' }}
              onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')} />
          </div>

          {/* Phone + Age */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>Téléphone</span>
              <input value={form.telephone} onChange={e => set('telephone', e.target.value)} placeholder="+216 XX XXX XXX"
                style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color:'#fff' }}
                onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')} />
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>Âge</span>
              <input type="number" min="14" max="70" value={form.age} onChange={e => set('age', e.target.value)} placeholder="Votre âge"
                style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color:'#fff' }}
                onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')} />
            </div>
          </div>

          {/* Role selector — staff only */}
          {tab === 'staff' && (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>Poste souhaité *</span>
              <select value={form.role} onChange={e => set('role', e.target.value)} required
                style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color: form.role ? '#fff' : 'rgba(255,255,255,0.4)', appearance:'none' }}
                onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')}>
                <option value="" style={{ background:'#0A1F14' }}>Sélectionnez votre rôle...</option>
                {ROLES.map(r => <option key={r} value={r.toLowerCase().replace(/[^a-z]/g,'')} style={{ background:'#0A1F14', color:'#fff' }}>{r}</option>)}
              </select>
            </div>
          )}

          {/* Situation — resident only */}
          {tab === 'resident' && (
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>Situation actuelle</span>
              <textarea value={form.situation} onChange={e => set('situation', e.target.value)} rows={3}
                placeholder="Décrivez brièvement votre situation (facultatif — confidentiel)"
                style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color:'#fff', resize:'vertical' }}
                onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')} />
            </div>
          )}

          {/* Message */}
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'rgba(255,255,255,0.5)' }}>
              {tab === 'resident' ? 'Message (facultatif)' : 'Expérience & motivations'}
            </span>
            <textarea value={form.message} onChange={e => set('message', e.target.value)} rows={3}
              placeholder={tab === 'resident' ? 'Tout ce que vous souhaitez nous dire...' : 'Vos années d\'expérience, certifications, motivations...'}
              style={{ ...inp(), background:'rgba(255,255,255,0.07)', border:'1.5px solid rgba(116,198,157,0.2)', color:'#fff', resize:'vertical' }}
              onFocus={e => (e.target.style.borderColor='#74C69D')} onBlur={e => (e.target.style.borderColor='rgba(116,198,157,0.2)')} />
          </div>

          {/* Confidentiality notice */}
          <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(116,198,157,0.07)', border:'1px solid rgba(116,198,157,0.15)', fontSize:11, color:'rgba(255,255,255,0.5)', lineHeight:1.6 }}>
            🔒 Vos informations sont strictement confidentielles et ne seront utilisées que dans le cadre de votre dossier au sein du Smart Rehab &amp; Green Center.
          </div>

          {/* Error */}
          {status === 'error' && (
            <p style={{ fontSize:12, padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,0.12)', color:'#FCA5A5', border:'1px solid rgba(239,68,68,0.2)' }}>
              ❌ {errMsg}
            </p>
          )}

          {/* Submit */}
          <button type="submit" disabled={status === 'loading'}
            style={{ padding:'13px', borderRadius:12, background:'#40916C', color:'#fff', border:'none', fontSize:14, fontWeight:700, cursor: status==='loading' ? 'not-allowed' : 'pointer', opacity: status==='loading' ? 0.7 : 1, fontFamily:'inherit', transition:'filter 0.15s' }}
            onMouseEnter={e => { if (status!=='loading') e.target.style.filter='brightness(0.9)'; }}
            onMouseLeave={e => { e.target.style.filter=''; }}>
            {status === 'loading' ? '⏳ Envoi en cours...' : tab === 'resident' ? 'Soumettre ma demande d\'admission →' : 'Envoyer ma candidature →'}
          </button>

          {/* Link to login */}
          <p style={{ textAlign:'center', fontSize:12, color:'rgba(255,255,255,0.35)', marginTop:4 }}>
            Vous avez déjà un compte ?{' '}
            <button type="button" onClick={() => navigate('/login')} style={{ color:'#74C69D', background:'none', border:'none', cursor:'pointer', fontSize:12, fontFamily:'inherit' }}>
              Se connecter
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}
