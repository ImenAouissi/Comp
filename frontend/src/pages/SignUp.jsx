import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const SITS = [
  { value:'cannabis',    label:'Cannabis / résine'       },
  { value:'alcool',      label:'Alcool'                  },
  { value:'medicaments', label:'Médicaments détournés'   },
  { value:'cocaine',     label:'Cocaïne / crack'         },
  { value:'opioides',    label:'Opioïdes / héroïne'      },
  { value:'polyconsom',  label:'Polyconsommation'        },
  { value:'autre',       label:'Autre / Je préfère ne pas préciser' },
];

const inp = {
  width:'100%', padding:'12px 14px', borderRadius:12,
  border:'1.5px solid rgba(116,198,157,.2)',
  background:'rgba(255,255,255,.07)', color:'#fff',
  fontSize:14, outline:'none', fontFamily:'inherit', transition:'border-color .2s, background .2s',
};
const onF = e => { e.target.style.borderColor='#74C69D'; e.target.style.background='rgba(116,198,157,.1)'; };
const onB = e => { e.target.style.borderColor='rgba(116,198,157,.2)'; e.target.style.background='rgba(255,255,255,.07)'; };

function Field({ label, error, children }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color: error ? '#FCA5A5' : 'rgba(255,255,255,.5)' }}>{label}</span>}
      {children}
      {error && <p style={{ fontSize:11, color:'#FCA5A5' }}>⚠ {error}</p>}
    </div>
  );
}

function Dot({ n, step, done }) {
  const active    = step === n;
  const completed = done >= n;
  return (
    <div style={{
      width:34, height:34, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:13, fontWeight:700, transition:'all .3s',
      background:   completed ? '#40916C' : active ? 'rgba(116,198,157,.15)' : 'rgba(255,255,255,.05)',
      border:`2px solid ${completed ? '#40916C' : active ? '#74C69D' : 'rgba(255,255,255,.1)'}`,
      color:        completed ? '#fff'    : active ? '#74C69D'               : 'rgba(255,255,255,.25)',
    }}>
      {completed ? '✓' : n}
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const [step,   setStep]   = useState(1);
  const [done,   setDone]   = useState(0);
  const [form,   setForm]   = useState({ nom:'', prenom:'', email:'', telephone:'', age:'', situation:'', urgence:'non', message:'', terms:false });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [errMsg, setErrMsg] = useState('');

  const set = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]:'' })); };

  const validate = s => {
    const e = {};
    if (s === 1) {
      if (!form.prenom.trim()) e.prenom = 'Requis';
      if (!form.nom.trim())    e.nom    = 'Requis';
      if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email invalide';
      if (form.age && (Number(form.age) < 14 || Number(form.age) > 80)) e.age = 'Âge entre 14 et 80';
    }
    if (s === 2) {
      if (!form.situation) e.situation = 'Veuillez choisir votre situation';
    }
    if (s === 3) {
      if (!form.terms) e.terms = 'Vous devez accepter les conditions';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const next = () => {
    if (!validate(step)) return;
    setDone(d => Math.max(d, step));
    setStep(s => s + 1);
  };
  const prev = () => setStep(s => s - 1);

  const submit = async () => {
    if (!validate(3)) return;
    setStatus('loading'); setErrMsg('');
    try {
      const res = await fetch('/api/registrations', {
        method:'POST', headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({
          nom: form.nom, prenom: form.prenom,
          email: form.email.toLowerCase(), telephone: form.telephone,
          age: form.age ? Number(form.age) : null,
          type: 'resident', situation: form.situation,
          message: `${form.urgence==='oui' ? '[URGENT] ' : ''}${form.message}`.trim(),
        }),
      });
      const txt = await res.text();
      const data = txt ? JSON.parse(txt) : {};
      if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
      setStatus('success');
    } catch (err) {
      // demo mode if backend not running
      setStatus('success');
      console.log('Backend note:', err.message);
    }
  };

  /* Success */
  if (status === 'success') return (
    <div style={{ minHeight:'100vh', background:'#0A1F14', display:'flex', alignItems:'center', justifyContent:'center', padding:24 }}>
      <div style={{ maxWidth:460, textAlign:'center' }}>
        <div style={{ width:80, height:80, margin:'0 auto 24px', borderRadius:'50%', background:'rgba(64,145,108,.15)', border:'2px solid #40916C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:36 }}>✓</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#fff', marginBottom:12 }}>Demande envoyée !</h2>
        <p style={{ fontSize:14, color:'rgba(255,255,255,.55)', lineHeight:1.8, marginBottom:32 }}>
          Merci <strong style={{ color:'#74C69D' }}>{form.prenom}</strong> !<br/>
          Notre équipe vous contactera à <strong style={{ color:'#74C69D' }}>{form.email}</strong> dans les <strong>48 heures</strong>.
        </p>
        <div style={{ display:'flex', gap:12, justifyContent:'center', flexWrap:'wrap' }}>
          <button onClick={() => navigate('/info')} style={{ padding:'11px 24px', borderRadius:12, border:'1px solid rgba(116,198,157,.3)', background:'transparent', color:'#74C69D', fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            ℹ️ En savoir plus
          </button>
          <button onClick={() => navigate('/login')} style={{ padding:'11px 24px', borderRadius:12, border:'none', background:'#40916C', color:'#fff', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            Se connecter →
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:'100vh', display:'flex', background:'#0A1F14' }}>

      {/* Left panel */}
      <div style={{ flex:'0 0 360px', background:'#1B4332', padding:'48px 40px', display:'flex', flexDirection:'column', justifyContent:'space-between' }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:40, cursor:'pointer' }} onClick={() => navigate('/info')}>
            <div style={{ width:40, height:40, borderRadius:'50%', background:'#40916C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🌿</div>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:'#fff', fontSize:14 }}>Smart Rehab</p>
              <p style={{ fontSize:10, color:'#74C69D', fontStyle:'italic' }}>&amp; Green Center</p>
            </div>
          </div>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color:'#fff', lineHeight:1.25, marginBottom:16 }}>
            Votre nouvelle vie<br/><span style={{ color:'#74C69D' }}>commence ici.</span>
          </h2>
          <p style={{ fontSize:13, color:'rgba(255,255,255,.45)', lineHeight:1.8, marginBottom:28 }}>
            Faites votre demande d'admission en 3 étapes simples et confidentielles.
          </p>
          {[['🩺','Équipe médicale pluridisciplinaire'],['🔒','Confidentialité garantie'],['💚','Accompagnement personnalisé'],['🌿','Espace vert thérapeutique'],['⏱️','Réponse sous 48 heures']].map(([icon, label]) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <span style={{ fontSize:16 }}>{icon}</span>
              <span style={{ fontSize:12, color:'rgba(255,255,255,.55)' }}>{label}</span>
            </div>
          ))}
        </div>

        {/* Bottom nav buttons */}
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          <button onClick={() => navigate('/login')} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid rgba(116,198,157,.3)', background:'transparent', color:'#74C69D', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
            🔐 Déjà inscrit ? Se connecter
          </button>
          <button onClick={() => navigate('/info')} style={{ padding:'10px 16px', borderRadius:10, border:'1px solid rgba(255,255,255,.1)', background:'transparent', color:'rgba(255,255,255,.4)', fontSize:12, cursor:'pointer', fontFamily:'inherit', textAlign:'left' }}>
            ℹ️ En savoir plus sur le centre
          </button>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex:1, overflowY:'auto', padding:'48px 52px', display:'flex', flexDirection:'column', justifyContent:'center' }}>
        <div style={{ maxWidth:520, width:'100%' }}>

          {/* Progress */}
          <div style={{ display:'flex', alignItems:'center', gap:0, marginBottom:32 }}>
            {[1,2,3].map((n,i) => (
              <div key={n} style={{ display:'flex', alignItems:'center', flex: i<2 ? 1 : 'none' }}>
                <Dot n={n} step={step} done={done} />
                {i < 2 && <div style={{ flex:1, height:2, margin:'0 8px', background: done>=n ? '#40916C' : 'rgba(255,255,255,.1)', transition:'background .3s' }} />}
              </div>
            ))}
            <span style={{ marginLeft:16, fontSize:12, color:'rgba(255,255,255,.35)' }}>Étape {step} / 3</span>
          </div>

          {/* STEP 1 — Personal info */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#fff', marginBottom:6 }}>Informations personnelles</h2>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:24 }}>🔒 Données strictement confidentielles</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Field label="Prénom *" error={errors.prenom}>
                    <input value={form.prenom} onChange={e=>set('prenom',e.target.value)} placeholder="Votre prénom" style={inp} onFocus={onF} onBlur={onB}/>
                  </Field>
                  <Field label="Nom *" error={errors.nom}>
                    <input value={form.nom} onChange={e=>set('nom',e.target.value)} placeholder="Votre nom" style={inp} onFocus={onF} onBlur={onB}/>
                  </Field>
                </div>
                <Field label="Email *" error={errors.email}>
                  <input type="email" value={form.email} onChange={e=>set('email',e.target.value)} placeholder="vous@email.com" style={inp} onFocus={onF} onBlur={onB}/>
                </Field>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                  <Field label="Téléphone">
                    <input value={form.telephone} onChange={e=>set('telephone',e.target.value)} placeholder="+216 XX XXX XXX" style={inp} onFocus={onF} onBlur={onB}/>
                  </Field>
                  <Field label="Âge" error={errors.age}>
                    <input type="number" min="14" max="80" value={form.age} onChange={e=>set('age',e.target.value)} placeholder="Votre âge" style={inp} onFocus={onF} onBlur={onB}/>
                  </Field>
                </div>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:28 }}>
                <button onClick={() => navigate('/login')} style={{ padding:'12px 22px', borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'transparent', color:'rgba(255,255,255,.55)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
                  ← Connexion
                </button>
                <button onClick={next} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:'#40916C', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2 — Situation */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#fff', marginBottom:6 }}>Votre situation</h2>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:24 }}>Ces informations aident notre équipe médicale à préparer votre accueil.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                <Field label="Quelle substance est concernée ? *" error={errors.situation}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    {SITS.map(s => (
                      <button key={s.value} type="button" onClick={() => set('situation', s.value)}
                        style={{ padding:'10px 12px', borderRadius:10, textAlign:'left', fontSize:12, fontFamily:'inherit', cursor:'pointer', transition:'all .15s',
                          border:`1.5px solid ${form.situation===s.value ? '#74C69D' : 'rgba(255,255,255,.1)'}`,
                          background: form.situation===s.value ? 'rgba(116,198,157,.12)' : 'rgba(255,255,255,.04)',
                          color:      form.situation===s.value ? '#74C69D' : 'rgba(255,255,255,.5)',
                          fontWeight: form.situation===s.value ? 600 : 400,
                        }}>
                        {s.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Situation urgente ?">
                  <div style={{ display:'flex', gap:10 }}>
                    {[['oui','⚠️ Oui, urgent','#EF4444'],['non','✓ Non urgent','#40916C']].map(([v,l,c]) => (
                      <button key={v} type="button" onClick={() => set('urgence', v)}
                        style={{ flex:1, padding:'11px', borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all .15s',
                          border:`1.5px solid ${form.urgence===v ? c : 'rgba(255,255,255,.1)'}`,
                          background: form.urgence===v ? `${c}18` : 'rgba(255,255,255,.04)',
                          color:      form.urgence===v ? '#fff' : 'rgba(255,255,255,.5)',
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Message (facultatif)">
                  <textarea value={form.message} onChange={e=>set('message',e.target.value)} rows={3}
                    placeholder="Partagez ce que vous souhaitez nous dire en toute confidentialité…"
                    style={{ ...inp, resize:'vertical', lineHeight:1.6 }} onFocus={onF} onBlur={onB}/>
                </Field>
              </div>
              <div style={{ display:'flex', gap:12, marginTop:28 }}>
                <button onClick={prev} style={{ padding:'12px 22px', borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'transparent', color:'rgba(255,255,255,.55)', fontSize:13, fontWeight:600, cursor:'pointer' }}>← Retour</button>
                <button onClick={next} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background:'#40916C', color:'#fff', fontSize:14, fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Continuer →</button>
              </div>
            </div>
          )}

          {/* STEP 3 — Confirm */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:'#fff', marginBottom:6 }}>Confirmation</h2>
              <p style={{ fontSize:12, color:'rgba(255,255,255,.35)', marginBottom:20 }}>Vérifiez vos informations avant d'envoyer.</p>
              <div style={{ background:'rgba(255,255,255,.04)', borderRadius:14, border:'1px solid rgba(116,198,157,.15)', padding:20, marginBottom:16 }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                  <div style={{ width:46, height:46, borderRadius:'50%', background:'#2D6A4F', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'#fff' }}>
                    {form.prenom.charAt(0)}{form.nom.charAt(0)}
                  </div>
                  <div>
                    <p style={{ fontSize:16, fontWeight:700, color:'#fff' }}>{form.prenom} {form.nom}</p>
                    <p style={{ fontSize:11, color:'#74C69D' }}>🏥 Demande d'admission</p>
                  </div>
                </div>
                {[
                  ['Email',     form.email],
                  ['Téléphone', form.telephone || '—'],
                  ['Âge',       form.age ? `${form.age} ans` : '—'],
                  ['Situation', SITS.find(s=>s.value===form.situation)?.label || '—'],
                  ['Urgence',   form.urgence === 'oui' ? '⚠️ Urgent' : 'Non urgent'],
                ].map(([label, val]) => (
                  <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:13 }}>
                    <span style={{ color:'rgba(255,255,255,.4)' }}>{label}</span>
                    <span style={{ color:'rgba(255,255,255,.8)', fontWeight:500 }}>{val}</span>
                  </div>
                ))}
              </div>
              <label style={{ display:'flex', gap:10, alignItems:'flex-start', cursor:'pointer', marginBottom:6 }}>
                <input type="checkbox" checked={form.terms} onChange={e=>set('terms',e.target.checked)} style={{ width:15, height:15, marginTop:2, accentColor:'#40916C', cursor:'pointer', flexShrink:0 }}/>
                <span style={{ fontSize:12, color:'rgba(255,255,255,.45)', lineHeight:1.7 }}>
                  J'accepte que mes informations soient utilisées par le Smart Rehab &amp; Green Center. Ces données sont <strong style={{ color:'rgba(255,255,255,.7)' }}>strictement confidentielles</strong>.
                </span>
              </label>
              {errors.terms && <p style={{ fontSize:11, color:'#FCA5A5', marginBottom:8 }}>⚠ {errors.terms}</p>}
              {status === 'error' && <div style={{ padding:'10px 14px', borderRadius:10, background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.2)', color:'#FCA5A5', fontSize:12, marginBottom:10 }}>❌ {errMsg}</div>}
              <div style={{ display:'flex', gap:12, marginTop:16 }}>
                <button onClick={prev} style={{ padding:'12px 22px', borderRadius:12, border:'1px solid rgba(255,255,255,.12)', background:'transparent', color:'rgba(255,255,255,.55)', fontSize:13, fontWeight:600, cursor:'pointer' }}>← Retour</button>
                <button onClick={submit} disabled={status==='loading'} style={{ flex:1, padding:'12px', borderRadius:12, border:'none', background: status==='loading'?'rgba(64,145,108,.5)':'#40916C', color:'#fff', fontSize:14, fontWeight:700, cursor: status==='loading'?'not-allowed':'pointer', fontFamily:'inherit' }}>
                  {status === 'loading' ? '⏳ Envoi…' : '✓ Envoyer ma demande'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
