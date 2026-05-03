import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { PageHeader, Badge, Button, Modal, Select, Input, LoadingSpinner } from '../components/UI';

const DAY_NAMES = ['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
const TYPE_COLORS = {
  individuelle: { bg:'#EEF9F3', border:'#40916C', text:'#065F46' },
  groupe:       { bg:'#EFF6FF', border:'#3A7CA5', text:'#1E40AF' },
  famille:      { bg:'#FEF3C7', border:'#F59E0B', text:'#92400E' },
  sport:        { bg:'#FDF2F8', border:'#EC4899', text:'#9D174D' },
  formation:    { bg:'#FFFBEB', border:'#D97706', text:'#78350F' },
};

function addDays(dateStr, n) {
  const d = new Date(dateStr);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr) {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

export default function Calendar() {
  const [week,    setWeek]    = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1); // Monday
    return d.toISOString().slice(0, 10);
  });
  const [days,    setDays]    = useState([]);
  const [upcoming,setUpcoming]= useState([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [residents,setResidents]=useState([]);
  const [form,    setForm]    = useState({ resident_id:'', type:'individuelle', praticien:'Dr. Khelil', date: new Date().toISOString().slice(0,10), duration:60 });
  const [saving,  setSaving]  = useState(false);

  const PRATICIEN_OPTS = [
    { value:'Dr. Khelil',    label:'Dr. Khelil'    },
    { value:'Mme. Trabelsi', label:'Mme. Trabelsi' },
    { value:'Coach Salem',   label:'Coach Salem'   },
    { value:'M. Bouzid',     label:'M. Bouzid'     },
    { value:'Mme. Sfaxi',    label:'Mme. Sfaxi'    },
  ];
  const TYPE_OPTS = [
    { value:'individuelle', label:'Thérapie individuelle' },
    { value:'groupe',       label:'Thérapie de groupe'   },
    { value:'famille',      label:'Session familiale'    },
    { value:'sport',        label:'Sport / bien-être'    },
    { value:'formation',    label:'Formation'            },
  ];

  const load = () => {
    setLoading(true);
    Promise.all([
      api.getCalendarWeek(week),
      api.getUpcomingSessions(),
      api.getResidents(),
    ]).then(([w, u, r]) => {
      setDays(w.days || []);
      setUpcoming(u.data || []);
      setResidents((r.data || []).filter(x => x.status === 'actif'));
    }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [week]);

  const prevWeek = () => setWeek(addDays(week, -7));
  const nextWeek = () => setWeek(addDays(week,  7));
  const goToday  = () => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay() + 1);
    setWeek(d.toISOString().slice(0, 10));
  };

  const handleCreate = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.createSession({ ...form, resident_id: Number(form.resident_id), duration: Number(form.duration) });
      setShowNew(false); load();
    } catch (err) { alert(err.message); }
    finally { setSaving(false); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const resOpts = residents.map(r => ({ value: String(r.id), label: `${r.prenom} ${r.nom} (${r.code})` }));

  if (loading) return <LoadingSpinner />;

  const today = new Date().toISOString().slice(0, 10);
  const totalSessions = days.reduce((s, d) => s + d.count, 0);

  return (
    <div style={{ padding:'28px 32px', maxWidth:1280, margin:'0 auto' }}>
      <PageHeader
        title="Planning"
        sub={`Semaine du ${formatDate(week)}`}
        action={<Button onClick={() => setShowNew(true)}>+ Nouvelle séance</Button>}
      />

      {/* Week nav */}
      <div className="animate-fadeUp" style={{ display:'flex', alignItems:'center', gap:12, marginBottom:20 }}>
        <Button variant="outline" onClick={prevWeek} style={{ padding:'7px 14px' }}>← Préc.</Button>
        <Button variant="outline" onClick={goToday}  style={{ padding:'7px 14px' }}>Aujourd'hui</Button>
        <Button variant="outline" onClick={nextWeek} style={{ padding:'7px 14px' }}>Suiv. →</Button>
        <span style={{ marginLeft:'auto', fontSize:12, color:'var(--muted)' }}>
          {totalSessions} séance{totalSessions !== 1 ? 's' : ''} cette semaine
        </span>
      </div>

      {/* 7-day grid */}
      <div className="animate-fadeUp delay-1" style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:10, marginBottom:24 }}>
        {days.map((day, i) => {
          const isToday = day.date === today;
          return (
            <div key={day.date} style={{
              borderRadius:12, overflow:'hidden',
              border: `2px solid ${isToday ? 'var(--leaf)' : 'var(--border)'}`,
              background: isToday ? 'rgba(64,145,108,0.04)' : '#fff',
              minHeight:160,
            }}>
              {/* Day header */}
              <div style={{ padding:'8px 10px', borderBottom:'1px solid var(--border)', background: isToday ? 'var(--leaf)' : 'rgba(27,67,50,0.03)' }}>
                <p style={{ fontSize:11, fontWeight:700, color: isToday ? '#fff' : 'var(--muted)', textTransform:'uppercase', letterSpacing:'0.05em' }}>{DAY_NAMES[i]}</p>
                <p style={{ fontSize:16, fontWeight:700, color: isToday ? '#fff' : 'var(--forest)' }}>{day.date.slice(8)}</p>
              </div>
              {/* Sessions */}
              <div style={{ padding:6, display:'flex', flexDirection:'column', gap:4 }}>
                {day.sessions.length === 0 && (
                  <p style={{ fontSize:10, color:'#D1D5DB', textAlign:'center', paddingTop:12 }}>—</p>
                )}
                {day.sessions.map(s => {
                  const tc = TYPE_COLORS[s.type] || TYPE_COLORS.individuelle;
                  return (
                    <div key={s.id} style={{ padding:'5px 7px', borderRadius:7, background:tc.bg, borderLeft:`3px solid ${tc.border}` }}>
                      <p style={{ fontSize:10, fontWeight:600, color:tc.text, lineHeight:1.2 }}>{s.prenom} {s.nom}</p>
                      <p style={{ fontSize:9, color:tc.text, opacity:0.75 }}>{s.type} · {s.duration}min</p>
                      <p style={{ fontSize:9, color:tc.text, opacity:0.6 }}>{s.praticien}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Upcoming sessions list */}
      <div className="animate-fadeUp delay-2" style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:16, boxShadow:'var(--shadow)', overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--forest)' }}>Prochaines séances planifiées</p>
          <span style={{ fontSize:11, color:'var(--muted)' }}>{upcoming.length} séance{upcoming.length !== 1 ? 's' : ''}</span>
        </div>
        {upcoming.length === 0 ? (
          <p style={{ padding:'24px', textAlign:'center', color:'var(--muted)', fontSize:13 }}>Aucune séance planifiée</p>
        ) : upcoming.map(s => {
          const tc = TYPE_COLORS[s.type] || TYPE_COLORS.individuelle;
          const daysUntil = Math.ceil((new Date(s.date) - new Date()) / 86400000);
          return (
            <div key={s.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 20px', borderBottom:'1px solid var(--border)' }}>
              <div style={{ width:42, height:42, borderRadius:10, background:tc.bg, border:`2px solid ${tc.border}`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                <span style={{ fontSize:9, fontWeight:700, color:tc.text, textAlign:'center', lineHeight:1.2 }}>{s.date.slice(5)}</span>
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <p style={{ fontSize:13, fontWeight:500, color:'var(--text)' }}>{s.prenom} {s.nom} <span style={{ color:'var(--muted)', fontSize:11 }}>({s.code})</span></p>
                <p style={{ fontSize:11, color:'var(--muted)' }}>{s.type} · {s.praticien} · {s.duration}min</p>
              </div>
              <div style={{ textAlign:'right', flexShrink:0 }}>
                <p style={{ fontSize:11, fontWeight:600, color: daysUntil === 0 ? 'var(--leaf)' : daysUntil <= 2 ? '#F59E0B' : 'var(--muted)' }}>
                  {daysUntil === 0 ? "Aujourd'hui" : daysUntil === 1 ? 'Demain' : `Dans ${daysUntil}j`}
                </p>
                <Badge status="planifiee" label="Planifiée" />
              </div>
            </div>
          );
        })}
      </div>

      {/* New session modal */}
      <Modal open={showNew} onClose={() => setShowNew(false)} title="Planifier une séance" width={480}>
        <form onSubmit={handleCreate} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <Select label="Résident" options={resOpts} value={form.resident_id} onChange={v => set('resident_id', v)} required />
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Select label="Type" options={TYPE_OPTS} value={form.type} onChange={v => set('type', v)} />
            <Select label="Praticien" options={PRATICIEN_OPTS} value={form.praticien} onChange={v => set('praticien', v)} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Date" type="date" value={form.date} onChange={v => set('date', v)} required />
            <Input label="Durée (min)" type="number" min="15" max="180" value={form.duration} onChange={v => set('duration', v)} />
          </div>
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            <Button variant="outline" type="button" onClick={() => setShowNew(false)}>Annuler</Button>
            <Button type="submit" disabled={saving || !form.resident_id}>{saving ? 'Création…' : 'Planifier'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
