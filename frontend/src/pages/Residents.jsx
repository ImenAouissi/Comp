import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { PageHeader, Table, Badge, Button, Modal, Input, Select, ProgressBar, LoadingSpinner } from '../components/UI';

const STATUS_OPTS = [{ value:'actif',label:'Actif' },{ value:'suspendu',label:'Suspendu' },{ value:'sorti',label:'Sorti' }];
const PILIER_OPTS = [{ value:'therapie',label:'Thérapie' },{ value:'formation',label:'Formation' },{ value:'sport',label:'Sport' },{ value:'ecologie',label:'Écologie' }];

const EMPTY_FORM = { nom:'', prenom:'', age:'', telephone:'', status:'actif', pilier:'therapie', diagnostique:'', objectif:'', entree:new Date().toISOString().slice(0,10) };

export default function Residents() {
  const [residents, setResidents] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [filter,    setFilter]    = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [selected,  setSelected]  = useState(null);
  const [form,      setForm]      = useState(EMPTY_FORM);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState('');
  const navigate = useNavigate();

  const load = () => {
    setLoading(true);
    api.getResidents()
      .then(r => setResidents(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const f = r => r.nom || '';
  const filtered = residents.filter(r => {
    const q = search.toLowerCase();
    const match = !q || f(r).toLowerCase().includes(q) || r.prenom?.toLowerCase().includes(q) || r.code?.toLowerCase().includes(q);
    const statusMatch = filter === 'all' || r.status === filter;
    return match && statusMatch;
  });

  const openCreate = () => { setSelected(null); setForm(EMPTY_FORM); setError(''); setShowModal(true); };
  const openEdit   = (r)  => { setSelected(r); setForm({ nom:r.nom,prenom:r.prenom||'',age:r.age||'',telephone:r.telephone||'',status:r.status,pilier:r.pilier,diagnostique:r.diagnostique||'',objectif:r.objectif||'',entree:r.entree||'' }); setError(''); setShowModal(true); };

  const handleSave = async (e) => {
    e.preventDefault(); setSaving(true); setError('');
    const payload = { ...form, age: form.age ? Number(form.age) : null };
    if (!payload.nom) { setError('Le nom est requis'); setSaving(false); return; }
    if (!selected) { payload.code = `RES-${String(residents.length + 1).padStart(3,'0')}`; }
    try {
      if (selected) {
        await api.updateResident(selected.id, payload);
        setResidents(rs => rs.map(r => r.id === selected.id ? { ...r, ...payload } : r));
      } else {
        const res = await api.createResident(payload);
        setResidents(rs => [res.data, ...rs]);
      }
      setShowModal(false);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleDelete = async (r) => {
    if (!confirm(`Supprimer ${r.prenom} ${r.nom} ?`)) return;
    try { await api.deleteResident(r.id); setResidents(rs => rs.filter(x => x.id !== r.id)); }
    catch (err) { alert(err.message); }
  };

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const columns = [
    { key:'code',   label:'ID' },
    { key:'nom',    label:'Nom', render:(v,r) => (
      <div>
        <span style={{ fontWeight:500 }}>{r.prenom} {v}</span>
        {r.age && <span style={{ color:'var(--muted)', fontSize:11, marginLeft:6 }}>{r.age} ans</span>}
      </div>
    )},
    { key:'status',       label:'Statut',      render: v => <Badge status={v} label={v} /> },
    { key:'pilier',       label:'Pilier' },
    { key:'progress',     label:'Progression', render: v => <ProgressBar value={v} /> },
    { key:'seances_realisees', label:'Séances', render:(v,row) => {
      const req  = row.seances_requises || 20;
      const pct  = Math.min(100, Math.round((v||0)/req*100));
      const left = Math.max(0, req - (v||0));
      return (
        <div>
          <div style={{ fontSize:12, fontWeight:600, color:'var(--text)', marginBottom:3 }}>{v||0} / {req}</div>
          <div style={{ height:4, borderRadius:2, background:'rgba(27,67,50,.1)', overflow:'hidden', width:60 }}>
            <div style={{ width:`${pct}%`, height:'100%', background: pct>=100?'var(--leaf)':'var(--gold)', borderRadius:2 }} />
          </div>
          <div style={{ fontSize:10, color: left===0?'var(--leaf)':'var(--muted)', marginTop:2 }}>
            {left===0 ? '✓ Complété' : `${left} restantes`}
          </div>
        </div>
      );
    }},
    { key:'repas_pris',   label:'🍽️ Repas', render: v => <span style={{ fontWeight:600, color: v>0?'#3A7CA5':'var(--muted)' }}>{v||0}</span> },
    { key:'date_sortie',  label:'Sortie',      render: v => v ? <span style={{ fontSize:12, color:'var(--forest)', fontWeight:500 }}>🚪 {v}</span> : <span style={{ color:'var(--muted)', fontSize:11 }}>—</span> },
    { key:'_',            label:'', render:(_,r) => (
      <div style={{ display:'flex', gap:6 }} onClick={e => e.stopPropagation()}>
        <Button variant="outline" style={{ padding:'4px 10px', fontSize:11 }} onClick={() => openEdit(r)}>Modifier</Button>
        <Button variant="danger"  style={{ padding:'4px 10px', fontSize:11 }} onClick={() => handleDelete(r)}>✕</Button>
      </div>
    )},
  ];

  if (loading) return <LoadingSpinner />;

  return (
    <div style={{ padding:'28px 32px', maxWidth:1280, margin:'0 auto' }}>
      <PageHeader title="Résidents" sub={`${residents.length} dossiers — ${residents.filter(r=>r.status==='actif').length} actifs`}
        action={<Button onClick={openCreate}>+ Nouveau résident</Button>} />

      {/* Filters */}
      <div className="animate-fadeUp delay-1" style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, prénom ou ID…"
          style={{ flex:1, minWidth:200, padding:'8px 14px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--white)', fontSize:13, outline:'none', fontFamily:'inherit' }}
          onFocus={e => (e.target.style.borderColor='var(--leaf)')} onBlur={e => (e.target.style.borderColor='var(--border)')} />
        {['all','actif','suspendu','sorti'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding:'7px 14px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', border:'1.5px solid', transition:'all 0.15s',
              background: filter===s ? 'var(--forest)' : 'var(--white)',
              color: filter===s ? '#fff' : 'var(--muted)',
              borderColor: filter===s ? 'var(--forest)' : 'var(--border)',
            }}
          >{s === 'all' ? 'Tous' : s.charAt(0).toUpperCase()+s.slice(1)}</button>
        ))}
      </div>

      <div className="animate-fadeUp delay-2">
        <Table columns={columns} rows={filtered}
          onRowClick={r => navigate(`/residents/${r.id}`)}
          emptyMsg="Aucun résident trouvé" />
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={selected ? 'Modifier le résident' : 'Nouveau résident'} width={520}>
        <form onSubmit={handleSave} style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Prénom" value={form.prenom} onChange={v => set('prenom',v)} placeholder="Prénom" />
            <Input label="Nom" value={form.nom} onChange={v => set('nom',v)} placeholder="Nom" required />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Input label="Âge" type="number" min="14" max="60" value={form.age} onChange={v => set('age',v)} />
            <Input label="Téléphone" value={form.telephone} onChange={v => set('telephone',v)} placeholder="+216 XX XXX XXX" />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <Select label="Statut" options={STATUS_OPTS} value={form.status} onChange={v => set('status',v)} />
            <Select label="Pilier principal" options={PILIER_OPTS} value={form.pilier} onChange={v => set('pilier',v)} />
          </div>
          <Input label="Date d'entrée" type="date" value={form.entree} onChange={v => set('entree',v)} />
          <Input label="Diagnostique" value={form.diagnostique} onChange={v => set('diagnostique',v)} placeholder="Résumé du diagnostic clinique" />
          <Input label="Objectif" value={form.objectif} onChange={v => set('objectif',v)} placeholder="Objectif principal du séjour" />
          {error && <p style={{ fontSize:12, padding:'8px 12px', borderRadius:8, background:'#FEE2E2', color:'#991B1B' }}>{error}</p>}
          <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:4 }}>
            <Button variant="outline" type="button" onClick={() => setShowModal(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
