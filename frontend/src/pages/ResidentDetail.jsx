import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { Badge, Button, LoadingSpinner, Modal, Card, ProgressBar } from '../components/UI';

function Ring({ value, size = 90 }) {
  const r = (size - 10) / 2, circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, value || 0));
  const dash = (pct / 100) * circ;
  const color = pct > 70 ? 'var(--leaf)' : pct > 40 ? 'var(--gold)' : '#EF4444';
  return (
    <svg width={size} height={size} style={{ flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(27,67,50,0.08)" strokeWidth={8} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={8}
        strokeDasharray={`${dash} ${circ-dash}`} strokeLinecap="round"
        transform={`rotate(-90 ${size/2} ${size/2})`} style={{ transition:'stroke-dasharray 0.8s ease' }} />
      <text x={size/2} y={size/2+1} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize:16, fontWeight:700, fill:'var(--forest)', fontFamily:"'Playfair Display',serif" }}>{pct}%</text>
    </svg>
  );
}

export default function ResidentDetail() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [r,          setR]          = useState(null);
  const [sessions,   setSessions]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [noteOpen,   setNoteOpen]   = useState(false);
  const [sortieOpen, setSortieOpen] = useState(false);
  const [note,       setNote]       = useState('');
  const [dateSortie, setDateSortie] = useState('');
  const [saving,     setSaving]     = useState(false);
  const [progEdit,   setProgEdit]   = useState(false);
  const [progVal,    setProgVal]    = useState(0);

  useEffect(() => { if (r) setProgVal(r.progress || 0); }, [r]);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getResident(id),
      api.getSessions(id),
    ]).then(([rd, sd]) => {
      setR(rd.data);
      setSessions(sd.data || []);
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const saveProgress = async () => {
    try { await api.updateProgress(id, progVal); setR(x => ({ ...x, progress: progVal })); }
    catch {} setProgEdit(false);
  };

  const addNote = async (e) => {
    e.preventDefault(); setSaving(true);
    const updated = `${r.notes || ''}\n[${new Date().toLocaleDateString('fr-FR')}] ${note}`.trim();
    try { await api.updateResident(id, { notes: updated }); setR(x => ({ ...x, notes: updated })); }
    catch {}
    setNote(''); setNoteOpen(false); setSaving(false);
  };

  const marquerSortie = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      const res = await api.marquerSortie(id, dateSortie || new Date().toISOString().slice(0,10));
      setR(res.data);
    } catch (err) { alert(err.message); }
    setSortieOpen(false); setSaving(false);
  };

  if (loading) return <LoadingSpinner />;
  if (!r) return <div style={{ padding:32, color:'var(--muted)' }}>Résident introuvable</div>;

  // Computed stats
  const seancesDone  = r.seances_realisees || sessions.filter(s=>s.status==='realisee').length;
  const seancesReq   = r.seances_requises  || 20;
  const seancesPct   = Math.min(100, Math.round(seancesDone / seancesReq * 100));
  const totalRepas   = r.repas_pris || sessions.filter(s=>s.status==='realisee').reduce((acc,s)=>acc+(s.repas||0),0);
  const seancesLeft  = Math.max(0, seancesReq - seancesDone);

  return (
    <div style={{ padding:'28px 32px', maxWidth:1280, margin:'0 auto' }}>
      <button onClick={() => navigate('/residents')} style={{ fontSize:12, color:'var(--muted)', background:'none', border:'none', cursor:'pointer', marginBottom:16, display:'flex', alignItems:'center', gap:4 }}>
        ← Retour aux résidents
      </button>

      {/* Header */}
      <div className="animate-fadeUp" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:24 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ width:52, height:52, borderRadius:'50%', background:'var(--leaf)', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, flexShrink:0 }}>
            {r.prenom?.charAt(0)}{r.nom?.charAt(0)}
          </div>
          <div>
            <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'var(--forest)' }}>{r.prenom} {r.nom}</h1>
            <div style={{ display:'flex', alignItems:'center', gap:10, marginTop:4 }}>
              <span style={{ fontSize:12, color:'var(--muted)' }}>{r.code}</span>
              <Badge status={r.status} label={r.status} />
              {r.date_sortie && <span style={{ fontSize:11, color:'var(--muted)', background:'rgba(27,67,50,.06)', padding:'2px 8px', borderRadius:6 }}>Sorti le {r.date_sortie}</span>}
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <Button variant="outline" onClick={() => setNoteOpen(true)}>+ Note</Button>
          {r.status === 'actif' && (
            <Button variant="outline" style={{ borderColor:'#EF4444', color:'#EF4444' }} onClick={() => { setDateSortie(new Date().toISOString().slice(0,10)); setSortieOpen(true); }}>
              🚪 Marquer la sortie
            </Button>
          )}
        </div>
      </div>

      {/* ── TOP ROW: Info + Progress ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 2fr', gap:16, marginBottom:16 }}>

        {/* Info card */}
        <Card className="animate-fadeUp delay-1" style={{ padding:20 }}>
          <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:14 }}>Informations</p>
          {[
            ['Âge',          r.age ? `${r.age} ans` : '—'],
            ['Téléphone',    r.telephone || '—'],
            ['Pilier',       r.pilier],
            ['Date entrée',  r.entree || '—'],
            ['Date sortie',  r.date_sortie || '—'],
          ].map(([label, val]) => (
            <div key={label} style={{ display:'flex', justifyContent:'space-between', paddingBottom:9, marginBottom:9, borderBottom:'1px solid var(--border)', fontSize:13 }}>
              <span style={{ color:'var(--muted)' }}>{label}</span>
              <span style={{ fontWeight:500, color: label==='Date sortie' && r.date_sortie ? 'var(--forest)' : 'var(--text)' }}>{val}</span>
            </div>
          ))}
          {r.diagnostique && (
            <div style={{ marginTop:4 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:5 }}>Diagnostique</p>
              <p style={{ fontSize:12, color:'var(--text)', lineHeight:1.6 }}>{r.diagnostique}</p>
            </div>
          )}
        </Card>

        {/* Progress card */}
        <Card className="animate-fadeUp delay-2" style={{ padding:20 }}>
          <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:14 }}>Progression globale</p>
          <div style={{ display:'flex', gap:24, alignItems:'center' }}>
            <Ring value={r.progress} size={90} />
            <div style={{ flex:1, display:'flex', flexDirection:'column', gap:10 }}>
              {[['Thérapie',r.progress+8,'var(--forest)'],['Formation',r.progress-10,'var(--gold)'],['Sport',r.progress+4,'#3A7CA5'],['Écologie',r.progress-4,'var(--mint)']].map(([name, val, color]) => (
                <div key={name}>
                  <div style={{ display:'flex', justifyContent:'space-between', fontSize:11, color:'var(--muted)', marginBottom:4 }}>
                    <span>{name}</span><span>{Math.max(0,Math.min(100,val))}%</span>
                  </div>
                  <ProgressBar value={Math.max(0,Math.min(100,val))} color={color} height={5} />
                </div>
              ))}
            </div>
          </div>
          {/* Progress editor */}
          <div style={{ marginTop:14, padding:'12px 14px', borderRadius:10, background:'rgba(27,67,50,.04)', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:progEdit?8:0 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)' }}>Modifier la progression</p>
              {!progEdit
                ? <Button variant="ghost" style={{ padding:'2px 8px', fontSize:11 }} onClick={() => setProgEdit(true)}>Modifier</Button>
                : <div style={{ display:'flex', gap:8 }}>
                    <Button variant="outline" style={{ padding:'2px 8px', fontSize:11 }} onClick={() => setProgEdit(false)}>Annuler</Button>
                    <Button style={{ padding:'2px 8px', fontSize:11 }} onClick={saveProgress}>Enregistrer</Button>
                  </div>
              }
            </div>
            {progEdit && (
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <input type="range" min={0} max={100} value={progVal} onChange={e => setProgVal(Number(e.target.value))}
                  style={{ flex:1, accentColor:'var(--leaf)' }} />
                <span style={{ fontSize:14, fontWeight:700, color:'var(--forest)', minWidth:36 }}>{progVal}%</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* ── SÉANCES STATS ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:16 }}>
        {[
          ['📋', 'Séances requises',   seancesReq,   'var(--forest)'],
          ['✅', 'Séances réalisées',  seancesDone,  'var(--leaf)'],
          ['⏳', 'Séances restantes',  seancesLeft,  seancesLeft>5?'var(--gold)':'#EF4444'],
          ['🍽️', 'Repas pris',         totalRepas,   '#3A7CA5'],
        ].map(([icon, label, val, color]) => (
          <Card key={label} className="animate-fadeUp delay-2" style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', marginBottom:6 }}>{icon} {label}</div>
            <div style={{ fontFamily:"'Playfair Display',serif", fontSize:30, fontWeight:900, color, lineHeight:1 }}>{val}</div>
            {label === 'Séances réalisées' && (
              <div style={{ marginTop:8 }}>
                <div style={{ display:'flex', justifyContent:'space-between', fontSize:10, color:'var(--muted)', marginBottom:3 }}>
                  <span>Progression séances</span><span>{seancesPct}%</span>
                </div>
                <div style={{ height:5, borderRadius:3, background:'rgba(27,67,50,.1)', overflow:'hidden' }}>
                  <div style={{ width:`${seancesPct}%`, height:'100%', background:'var(--leaf)', borderRadius:3, transition:'width .5s' }} />
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {/* ── SESSIONS LIST ── */}
      <Card className="animate-fadeUp delay-3" style={{ padding:20, marginBottom:16 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
          <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)' }}>Séances récentes</p>
          <button onClick={() => navigate('/sessions')} style={{ fontSize:11, color:'var(--leaf)', background:'none', border:'none', cursor:'pointer' }}>Voir tout →</button>
        </div>
        {sessions.slice(0,6).map(s => (
          <div key={s.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 10px', borderRadius:10, background:'rgba(27,67,50,.03)', marginBottom:6 }}>
            <span style={{ width:7, height:7, borderRadius:'50%', flexShrink:0, background: s.status==='realisee' ? '#22C55E' : '#F59E0B' }} />
            <div style={{ flex:1 }}>
              <p style={{ fontSize:12, fontWeight:500 }}>{s.type}</p>
              <p style={{ fontSize:11, color:'var(--muted)' }}>{s.praticien} · {s.date?.slice(0,10)}</p>
            </div>
            {s.repas > 0 && <span style={{ fontSize:11, color:'#3A7CA5', fontWeight:600 }}>🍽️ {s.repas}</span>}
            <Badge status={s.status} label={s.status} />
          </div>
        ))}
        {sessions.length === 0 && <p style={{ fontSize:12, color:'var(--muted)', textAlign:'center', padding:'16px 0' }}>Aucune séance</p>}
      </Card>

      {/* ── NOTES ── */}
      <Card className="animate-fadeUp delay-4" style={{ padding:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
          <p style={{ fontSize:12, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)' }}>Notes cliniques</p>
          <Button variant="outline" style={{ padding:'4px 12px', fontSize:11 }} onClick={() => setNoteOpen(true)}>+ Ajouter</Button>
        </div>
        {r.notes ? r.notes.split('\n').filter(Boolean).map((line, i) => (
          <div key={i} style={{ padding:'8px 12px', borderRadius:8, borderLeft:'3px solid var(--mint)', background:'rgba(27,67,50,.03)', marginBottom:6, fontSize:12, color:'var(--text)', lineHeight:1.6 }}>
            {line}
          </div>
        )) : <p style={{ fontSize:12, color:'var(--muted)' }}>Aucune note.</p>}
      </Card>

      {/* ── MODAL: Note ── */}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title="Ajouter une note clinique">
        <form onSubmit={addNote} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)' }}>Note</label>
            <textarea value={note} onChange={e=>setNote(e.target.value)} rows={4} placeholder="Observations cliniques…" style={{ padding:'9px 13px', borderRadius:10, border:'1.5px solid rgba(27,67,50,.18)', background:'#FAFAF8', fontSize:13, fontFamily:'inherit', resize:'vertical', outline:'none' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <Button variant="outline" type="button" onClick={() => setNoteOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !note.trim()}>{saving ? 'Enregistrement…' : 'Ajouter'}</Button>
          </div>
        </form>
      </Modal>

      {/* ── MODAL: Sortie ── */}
      <Modal open={sortieOpen} onClose={() => setSortieOpen(false)} title="🚪 Marquer la date de sortie">
        <form onSubmit={marquerSortie} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ padding:'12px 16px', borderRadius:10, background:'#FEF3C7', border:'1px solid #F59E0B', fontSize:13, color:'#92400E' }}>
            ⚠️ Cette action marquera <strong>{r.prenom} {r.nom}</strong> comme sorti(e) du centre.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)' }}>Date de sortie</label>
            <input type="date" value={dateSortie} onChange={e=>setDateSortie(e.target.value)} style={{ padding:'10px 14px', borderRadius:10, border:'1.5px solid rgba(27,67,50,.18)', background:'#FAFAF8', fontSize:14, outline:'none', fontFamily:'inherit' }} />
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)' }}>Résumé à la sortie</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[['Séances réalisées', seancesDone],['Séances requises', seancesReq],['Repas pris', totalRepas],['Progression', `${r.progress}%`]].map(([l,v]) => (
                <div key={l} style={{ padding:'10px 14px', background:'rgba(27,67,50,.04)', borderRadius:8 }}>
                  <div style={{ fontSize:10, color:'var(--muted)', textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
                  <div style={{ fontSize:20, fontWeight:700, color:'var(--forest)', fontFamily:"'Playfair Display',serif" }}>{v}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <Button variant="outline" type="button" onClick={() => setSortieOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving} style={{ background:'#EF4444' }}>{saving ? 'Enregistrement…' : '🚪 Confirmer la sortie'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
