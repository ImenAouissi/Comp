import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import { PageHeader, Table, Badge, Button, Modal, Input, Select, LoadingSpinner, Card } from '../components/UI';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, BarChart, Bar } from 'recharts';
import { useAuth } from '../hooks/useAuth';

/* ══ SESSIONS ══════════════════════════════════════════════ */
const TYPE_OPTS = [
  {value:'individuelle',label:'Thérapie individuelle'},{value:'groupe',label:'Thérapie de groupe'},
  {value:'famille',label:'Session familiale'},{value:'sport',label:'Sport / bien-être'},{value:'formation',label:'Formation'},
];
const PRAT_OPTS = [
  {value:'Dr. Khelil',label:'Dr. Khelil (Psychiatre)'},{value:'Mme. Trabelsi',label:'Mme. Trabelsi (Psychologue)'},
  {value:'Coach Salem',label:'Coach Salem (Sport)'},{value:'M. Bouzid',label:'M. Bouzid (Formateur)'},{value:'Mme. Sfaxi',label:'Mme. Sfaxi (Infirmière)'},
];

export function Sessions() {
  const [sessions,setSessions]=useState([]);const [residents,setResidents]=useState([]);
  const [loading,setLoading]=useState(true);const [showModal,setShowModal]=useState(false);
  const [filter,setFilter]=useState('all');const [search,setSearch]=useState('');
  const [form,setForm]=useState({resident_id:'',type:'individuelle',praticien:'Dr. Khelil',date:new Date().toISOString().slice(0,10),duration:60,notes:''});
  const [saving,setSaving]=useState(false);const [msg,setMsg]=useState('');

  useEffect(()=>{
    Promise.all([api.getSessions(),api.getResidents()])
      .then(([s,r])=>{setSessions(s.data||[]);setResidents(r.data||[]);})
      .catch(()=>{}).finally(()=>setLoading(false));
  },[]);

  const filtered=sessions.filter(s=>{
    const q=search.toLowerCase();
    const ms=!q||(s.nom||'').toLowerCase().includes(q)||(s.prenom||'').toLowerCase().includes(q)||(s.praticien||'').toLowerCase().includes(q);
    return ms&&(filter==='all'||s.status===filter);
  });

  const handleCreate=async(e)=>{
    e.preventDefault();setSaving(true);
    try{
      const res=await api.createSession({...form,duration:Number(form.duration)});
      const r=residents.find(x=>String(x.id)===String(form.resident_id));
      setSessions(ss=>[{...res.data,nom:r?.nom,prenom:r?.prenom,code:r?.code},...ss]);
      setShowModal(false);setMsg('✅ Séance créée !');setTimeout(()=>setMsg(''),3000);
    }catch(err){alert(err.message);}finally{setSaving(false);}
  };

  const complete=async(s)=>{
    try{await api.completeSession(s.id,'');setSessions(ss=>ss.map(x=>x.id===s.id?{...x,status:'realisee'}:x));}
    catch(err){alert(err.message);}
  };

  const del=async(id)=>{
    if(!confirm('Supprimer ?'))return;
    try{await api.deleteSession(id);setSessions(ss=>ss.filter(x=>x.id!==id));}
    catch(err){alert(err.message);}
  };

  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const resOpts=residents.map(r=>({value:String(r.id),label:`${r.prenom} ${r.nom} (${r.code})`}));

  const cols=[
    {key:'prenom',label:'Résident',render:(_,r)=><span style={{fontWeight:500}}>{r.prenom} {r.nom} <span style={{color:'var(--muted)',fontSize:11}}>{r.code}</span></span>},
    {key:'type',label:'Type'},{key:'praticien',label:'Praticien',render:v=><span style={{fontSize:12,color:'var(--muted)'}}>{v}</span>},
    {key:'date',label:'Date',render:v=>v?.slice(0,10)},{key:'duration',label:'Durée',render:v=>`${v} min`},
    {key:'status',label:'Statut',render:v=><Badge status={v} label={v}/>},
    {key:'_',label:'',render:(_,r)=>(
      <div style={{display:'flex',gap:6}} onClick={e=>e.stopPropagation()}>
        {r.status==='planifiee'&&<Button variant="outline" style={{padding:'4px 10px',fontSize:11}} onClick={()=>complete(r)}>✓ Réaliser</Button>}
        <Button variant="danger" style={{padding:'4px 10px',fontSize:11}} onClick={()=>del(r.id)}>✕</Button>
      </div>
    )},
  ];

  if(loading)return<LoadingSpinner/>;
  const planif=sessions.filter(s=>s.status==='planifiee').length;
  const real=sessions.filter(s=>s.status==='realisee').length;

  return(
    <div style={{padding:'28px 32px',maxWidth:1280,margin:'0 auto'}}>
      <PageHeader title="Séances thérapeutiques" sub={`${sessions.length} séances — ${planif} planifiées — ${real} réalisées`}
        action={<Button onClick={()=>setShowModal(true)}>+ Nouvelle séance</Button>}/>
      {msg&&<div style={{padding:'10px 14px',borderRadius:10,background:'#D1FAE5',color:'#065F46',fontSize:13,marginBottom:14}}>{msg}</div>}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:16}}>
        {[['Total',sessions.length,'#1B4332'],['Planifiées',planif,'#92400E'],['Réalisées',real,'#065F46'],['Annulées',sessions.filter(s=>s.status==='annulee').length,'#991B1B']].map(([l,v,c])=>(
          <div key={l} style={{background:'#fff',border:'1px solid var(--border)',borderRadius:12,padding:'14px 18px',boxShadow:'var(--shadow)'}}>
            <p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:'var(--muted)',marginBottom:6}}>{l}</p>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:c,lineHeight:1}}>{v}</p>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:10,marginBottom:14,flexWrap:'wrap'}}>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Rechercher par résident ou praticien…"
          style={{flex:1,minWidth:200,padding:'8px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'#fff',fontSize:13,outline:'none',fontFamily:'inherit'}}
          onFocus={e=>(e.target.style.borderColor='var(--leaf)')} onBlur={e=>(e.target.style.borderColor='var(--border)')}/>
        {['all','planifiee','realisee'].map(s=>(
          <button key={s} onClick={()=>setFilter(s)} style={{padding:'7px 14px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',border:'1.5px solid',transition:'all .15s',
            background:filter===s?'var(--forest)':'#fff',color:filter===s?'#fff':'var(--muted)',borderColor:filter===s?'var(--forest)':'var(--border)'}}>
            {s==='all'?'Toutes':s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>
      <div className="animate-fadeUp delay-1"><Table columns={cols} rows={filtered} emptyMsg="Aucune séance"/></div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Nouvelle séance" width={500}>
        <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:12}}>
          <Select label="Résident *" options={resOpts} value={form.resident_id} onChange={v=>set('resident_id',v)} required/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Select label="Type" options={TYPE_OPTS} value={form.type} onChange={v=>set('type',v)}/>
            <Select label="Praticien" options={PRAT_OPTS} value={form.praticien} onChange={v=>set('praticien',v)}/>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Date *" type="date" value={form.date} onChange={v=>set('date',v)} required/>
            <Input label="Durée (min)" type="number" min="15" max="180" value={form.duration} onChange={v=>set('duration',v)}/>
          </div>
          <Input label="Notes" value={form.notes} onChange={v=>set('notes',v)} placeholder="Objectifs, observations…"/>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <Button variant="outline" type="button" onClick={()=>setShowModal(false)}>Annuler</Button>
            <Button type="submit" disabled={saving||!form.resident_id}>{saving?'Création…':'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ══ BIOMETRICS ════════════════════════════════════════════ */
export function Biometrics() {
  const [residents,setResidents]=useState([]);const [resId,setResId]=useState('');
  const [bio,setBio]=useState([]);const [loading,setLoading]=useState(false);const [hours,setHours]=useState(24);

  useEffect(()=>{
    api.getResidents().then(r=>{const a=(r.data||[]).filter(x=>x.status==='actif');setResidents(a);if(a.length>0)setResId(String(a[0].id));}).catch(()=>{});
  },[]);
  useEffect(()=>{
    if(!resId)return;setLoading(true);
    api.getBiometrics(resId,hours).then(r=>setBio(r.data||[])).catch(()=>setBio([])).finally(()=>setLoading(false));
  },[resId,hours]);

  const data=bio.map(d=>({time:new Date(d.recorded_at).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}),bpm:d.heart_rate,steps:d.steps}));
  const latest=bio[bio.length-1]||{};
  const hrSt=!latest.heart_rate?'ok':(latest.heart_rate>130||latest.heart_rate<45)?'alert':latest.heart_rate>110?'warn':'ok';
  const MC={ok:'#D1FAE5',warn:'#FEF3C7',alert:'#FEE2E2'};const MT={ok:'#065F46',warn:'#92400E',alert:'#991B1B'};
  const TT={borderRadius:10,border:'none',boxShadow:'0 8px 24px rgba(0,0,0,.1)',fontSize:12};

  return(
    <div style={{padding:'28px 32px',maxWidth:1280,margin:'0 auto'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
        <div><h1 style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:700,color:'var(--forest)'}}>Biométrie IoT</h1><p style={{fontSize:12,color:'var(--muted)',marginTop:3}}>Données capteurs ESP32 en temps réel</p></div>
        <div style={{display:'flex',gap:10}}>
          <select value={resId} onChange={e=>setResId(e.target.value)} style={{padding:'8px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'#fff',fontSize:13,outline:'none',fontFamily:'inherit'}}>
            {residents.map(r=><option key={r.id} value={String(r.id)}>{r.code} — {r.prenom} {r.nom}</option>)}
          </select>
          <select value={hours} onChange={e=>setHours(Number(e.target.value))} style={{padding:'8px 14px',borderRadius:10,border:'1.5px solid var(--border)',background:'#fff',fontSize:13,outline:'none',fontFamily:'inherit'}}>
            {[6,12,24,48].map(h=><option key={h} value={h}>{h}h</option>)}
          </select>
        </div>
      </div>
      <div className="animate-fadeUp" style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:14,marginBottom:18}}>
        {[['💓','Rythme cardiaque',latest.heart_rate,'bpm',hrSt],['🌡️','Température',latest.temperature,'°C',latest.temperature>37.8?'warn':'ok'],['👟','Pas / heure',latest.steps,'pas',latest.steps<50?'warn':'ok']].map(([icon,label,val,unit,st])=>(
          <div key={label} style={{padding:'18px 20px',borderRadius:'var(--radius)',background:MC[st]||'#F9FAFB',border:`1px solid ${MC[st]}`,display:'flex',alignItems:'center',gap:14}}>
            <span style={{fontSize:26}}>{icon}</span>
            <div style={{flex:1}}>
              <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.08em',color:MT[st]||'#6B7280'}}>{label}</p>
              <p style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color:MT[st]||'#111',lineHeight:1}}>{val??'—'} <span style={{fontSize:13,fontWeight:400}}>{unit}</span></p>
            </div>
            <span className="live-dot" style={{marginLeft:'auto'}}/>
          </div>
        ))}
      </div>
      {loading?<LoadingSpinner/>:(
        <>
          <Card className="animate-fadeUp delay-1" style={{padding:20,marginBottom:14}}>
            <p style={{fontSize:13,fontWeight:600,color:'var(--forest)',marginBottom:14}}>Rythme cardiaque (bpm) — {hours}h</p>
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={data}>
                <XAxis dataKey="time" tick={{fontSize:10,fill:'#9CA3AF'}} axisLine={false} tickLine={false} interval={Math.floor(data.length/8)}/>
                <YAxis tick={{fontSize:10,fill:'#9CA3AF'}} axisLine={false} tickLine={false} width={30} domain={[40,150]}/>
                <Tooltip contentStyle={TT}/>
                <ReferenceLine y={130} stroke="#EF4444" strokeDasharray="4 2" strokeWidth={1}/>
                <ReferenceLine y={45}  stroke="#3B82F6" strokeDasharray="4 2" strokeWidth={1}/>
                <Line type="monotone" dataKey="bpm" stroke="#EF4444" strokeWidth={2} dot={false} activeDot={{r:4}} name="BPM"/>
              </LineChart>
            </ResponsiveContainer>
          </Card>
          <Card className="animate-fadeUp delay-2" style={{padding:20}}>
            <p style={{fontSize:13,fontWeight:600,color:'var(--forest)',marginBottom:14}}>Activité physique — Pas par heure</p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart data={data}>
                <XAxis dataKey="time" tick={{fontSize:10,fill:'#9CA3AF'}} axisLine={false} tickLine={false} interval={Math.floor(data.length/8)}/>
                <YAxis tick={{fontSize:10,fill:'#9CA3AF'}} axisLine={false} tickLine={false} width={35}/>
                <Tooltip contentStyle={TT}/>
                <Bar dataKey="steps" fill="var(--leaf)" radius={[3,3,0,0]} name="Pas"/>
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </>
      )}
    </div>
  );
}

/* ══ ALERTS ════════════════════════════════════════════════ */
export function Alerts() {
  const [alerts,setAlerts]=useState([]);const [loading,setLoading]=useState(true);const [filter,setFilter]=useState('all');
  useEffect(()=>{api.getAlerts().then(r=>setAlerts(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[]);
  const resolve=async(id)=>{
    try{await api.resolveAlert(id);setAlerts(as=>as.map(a=>a.id===id?{...a,resolved:1}:a));}catch(err){alert(err.message);}
  };
  const filtered=filter==='all'?alerts:filter==='open'?alerts.filter(a=>!a.resolved):alerts.filter(a=>a.resolved);
  const openCount=alerts.filter(a=>!a.resolved).length;
  const SEV={high:{bg:'#FEE2E2',border:'#F87171',text:'#991B1B',icon:'🔴'},medium:{bg:'#FEF3C7',border:'#FCD34D',text:'#92400E',icon:'🟡'},low:{bg:'#D1FAE5',border:'#6EE7B7',text:'#065F46',icon:'🟢'}};
  if(loading)return<LoadingSpinner/>;
  return(
    <div style={{padding:'28px 32px',maxWidth:900,margin:'0 auto'}}>
      <PageHeader title="Alertes IoT" sub={`${openCount} alertes ouvertes sur ${alerts.length} total`}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginBottom:20}}>
        {[['🔴','Critiques',alerts.filter(a=>a.severity==='high'&&!a.resolved).length,'#FEE2E2','#991B1B'],
          ['🟡','Moyennes',alerts.filter(a=>a.severity==='medium'&&!a.resolved).length,'#FEF3C7','#92400E'],
          ['✅','Résolues',alerts.filter(a=>a.resolved).length,'#D1FAE5','#065F46']].map(([icon,label,count,bg,color])=>(
          <div key={label} style={{padding:'16px 20px',borderRadius:14,background:bg,border:`1px solid ${color}22`,display:'flex',alignItems:'center',gap:12}}>
            <span style={{fontSize:22}}>{icon}</span>
            <div><p style={{fontFamily:"'Playfair Display',serif",fontSize:28,fontWeight:900,color,lineHeight:1}}>{count}</p><p style={{fontSize:11,color,opacity:.75,marginTop:2}}>{label}</p></div>
          </div>
        ))}
      </div>
      <div style={{display:'flex',gap:8,marginBottom:16}}>
        {[['all','Toutes'],['open','Ouvertes'],['resolved','Résolues']].map(([v,l])=>(
          <button key={v} onClick={()=>setFilter(v)} style={{padding:'6px 16px',borderRadius:10,fontSize:12,fontWeight:600,cursor:'pointer',border:'1.5px solid',transition:'all .15s',
            background:filter===v?'var(--forest)':'#fff',color:filter===v?'#fff':'var(--muted)',borderColor:filter===v?'var(--forest)':'var(--border)'}}>{l}</button>
        ))}
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:12}}>
        {filtered.length===0&&<div style={{textAlign:'center',padding:'48px 0',color:'var(--muted)',fontSize:14}}>Aucune alerte dans cette catégorie</div>}
        {filtered.map(a=>{const s=SEV[a.severity]||SEV.low;return(
          <div key={a.id} className="animate-fadeUp" style={{padding:'16px 20px',borderRadius:14,border:`1px solid ${s.border}`,background:s.bg,display:'flex',alignItems:'flex-start',gap:14,opacity:a.resolved?.55:1}}>
            <span style={{fontSize:22,flexShrink:0}}>{s.icon}</span>
            <div style={{flex:1}}>
              <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap',marginBottom:5}}>
                <span style={{fontSize:14,fontWeight:700,color:s.text}}>{a.code||`RES-${a.resident_id}`} — {a.prenom} {a.nom}</span>
                <Badge status={a.severity} label={a.severity}/>{a.resolved===1&&<Badge status="realisee" label="Résolu"/>}
              </div>
              <p style={{fontSize:13,color:s.text}}>{a.message}</p>
              <p style={{fontSize:11,color:s.text,opacity:.6,marginTop:4}}>{new Date(a.created_at).toLocaleString('fr-FR')}</p>
            </div>
            {!a.resolved&&(
              <div style={{display:'flex',gap:6,flexShrink:0}}>
                <Button variant="outline" style={{padding:'6px 10px',fontSize:11}} onClick={()=>api.sendAlertEmail(a.id).then(()=>alert('📧 Alerte envoyée par email au staff')).catch(e=>alert('❌ '+e.message))} title="Envoyer par email au staff">📧</Button>
                <Button variant="outline" style={{padding:'6px 14px',fontSize:12}} onClick={()=>resolve(a.id)}>✓ Résoudre</Button>
              </div>
            )}
          </div>
        );})}
      </div>
    </div>
  );
}

/* ══ FORMATIONS ════════════════════════════════════════════ */
export function Formations() {
  const [formations,setFormations]=useState([]);const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);const [saving,setSaving]=useState(false);
  const [form,setForm]=useState({titre:'',formateur:'',places:15,inscrits:0,statut:'planifiee',debut:''});
  useEffect(()=>{api.getFormations().then(r=>setFormations(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[]);
  const handleCreate=async(e)=>{e.preventDefault();setSaving(true);
    try{const res=await api.createFormation({...form,places:Number(form.places),inscrits:Number(form.inscrits)});
      setFormations(fs=>[...fs,res.data]);setShowModal(false);}catch(err){alert(err.message);}finally{setSaving(false);}
  };
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const cols=[
    {key:'titre',label:'Module',render:v=><span style={{fontWeight:500}}>{v}</span>},
    {key:'formateur',label:'Formateur',render:v=><span style={{fontSize:12,color:'var(--muted)'}}>{v}</span>},
    {key:'inscrits',label:'Inscrits',render:(v,r)=>`${v} / ${r.places}`},
    {key:'_taux',label:'Remplissage',render:(_,r)=>(
      <div style={{display:'flex',alignItems:'center',gap:8}}>
        <div style={{flex:1,height:6,borderRadius:3,background:'rgba(27,67,50,.1)',overflow:'hidden',minWidth:60}}>
          <div style={{width:`${Math.round(r.inscrits/r.places*100)}%`,height:'100%',background:'var(--leaf)',borderRadius:3}}/>
        </div>
        <span style={{fontSize:11,color:'var(--muted)'}}>{Math.round(r.inscrits/r.places*100)}%</span>
      </div>
    )},
    {key:'statut',label:'Statut',render:v=><Badge status={v==='actif'?'actif':v==='termine'?'sorti':'planifiee'} label={v}/>},
    {key:'debut',label:'Début'},
  ];
  if(loading)return<LoadingSpinner/>;
  return(
    <div style={{padding:'28px 32px',maxWidth:1280,margin:'0 auto'}}>
      <PageHeader title="Formations" sub={`${formations.length} modules — ${formations.filter(f=>f.statut==='actif').length} actifs`}
        action={<Button onClick={()=>setShowModal(true)}>+ Nouveau module</Button>}/>
      <div className="animate-fadeUp delay-1"><Table columns={cols} rows={formations} emptyMsg="Aucune formation"/></div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Nouveau module de formation">
        <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:12}}>
          <Input label="Titre du module *" value={form.titre} onChange={v=>set('titre',v)} required/>
          <Input label="Formateur *" value={form.formateur} onChange={v=>set('formateur',v)} required/>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12}}>
            <Input label="Places" type="number" min="5" max="30" value={form.places} onChange={v=>set('places',v)}/>
            <Input label="Date de début *" type="date" value={form.debut} onChange={v=>set('debut',v)} required/>
          </div>
          <Select label="Statut" options={[{value:'actif',label:'Actif'},{value:'planifiee',label:'Planifié'},{value:'termine',label:'Terminé'}]} value={form.statut} onChange={v=>set('statut',v)}/>
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <Button variant="outline" type="button" onClick={()=>setShowModal(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving?'Création…':'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ══ STAFF ══════════════════════════════════════════════════ */
const ROLE_OPTS=[{value:'medecin',label:'Médecin psychiatre'},{value:'psychologue',label:'Psychologue'},{value:'formateur',label:'Formateur'},{value:'coach',label:'Coach sportif'},{value:'infirmier',label:'Infirmier(ère)'},{value:'admin',label:'Administrateur'}];
const RBGS={medecin:'#D1FAE5',psychologue:'#EDE9FE',formateur:'#FEF3C7',coach:'#DBEAFE',infirmier:'#FCE7F3',admin:'#F3F4F6'};
const RTXTS={medecin:'#065F46',psychologue:'#4C1D95',formateur:'#92400E',coach:'#1E40AF',infirmier:'#9D174D',admin:'#1F2937'};

export function Staff() {
  const [staff,setStaff]=useState([]);const [loading,setLoading]=useState(true);
  const [showModal,setShowModal]=useState(false);const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  const [form,setForm]=useState({name:'',email:'',password:'',role:'medecin'});
  useEffect(()=>{api.getStaff().then(r=>setStaff(r.data||[])).catch(()=>{}).finally(()=>setLoading(false));
  },[]);
  const handleCreate=async(e)=>{e.preventDefault();setSaving(true);setError('');
    try{const res=await api.createStaff(form);setStaff(s=>[res.data,...s]);setShowModal(false);}
    catch(err){setError(err.message);}finally{setSaving(false);}
  };
  const deactivate=async(id)=>{
    if(!confirm('Désactiver ?'))return;
    try{await api.deactivateStaff(id);setStaff(s=>s.map(m=>m.id===id?{...m,active:0}:m));}catch(err){alert(err.message);}
  };
  const set=(k,v)=>setForm(f=>({...f,[k]:v}));
  const roleCounts=ROLE_OPTS.reduce((acc,o)=>{acc[o.value]=staff.filter(s=>s.role===o.value&&s.active).length;return acc;},{});
  const cols=[
    {key:'name',label:'Membre',render:(v,r)=>(
      <div style={{display:'flex',alignItems:'center',gap:10}}>
        <div style={{width:32,height:32,borderRadius:'50%',background:RBGS[r.role]||'#f3f4f6',color:RTXTS[r.role]||'#374151',display:'flex',alignItems:'center',justifyContent:'center',fontSize:12,fontWeight:700,flexShrink:0}}>{v?.charAt(0)}</div>
        <span style={{fontWeight:500}}>{v}</span>
      </div>
    )},
    {key:'email',label:'Email',render:v=><span style={{color:'var(--muted)',fontSize:12}}>{v}</span>},
    {key:'role',label:'Rôle',render:v=><span style={{padding:'3px 10px',borderRadius:100,fontSize:11,fontWeight:600,background:RBGS[v]||'#f3f4f6',color:RTXTS[v]||'#374151'}}>{ROLE_OPTS.find(o=>o.value===v)?.label||v}</span>},
    {key:'active',label:'Statut',render:v=><Badge status={v?'actif':'suspendu'} label={v?'Actif':'Inactif'}/>},
    {key:'_',label:'',render:(_,r)=>r.active&&r.role!=='admin'?(<Button variant="danger" style={{padding:'4px 10px',fontSize:11}} onClick={e=>{e.stopPropagation();deactivate(r.id);}}>Désactiver</Button>):null},
  ];
  if(loading)return<LoadingSpinner/>;
  return(
    <div style={{padding:'28px 32px',maxWidth:1280,margin:'0 auto'}}>
      <PageHeader title="Équipe soignante" sub={`${staff.filter(s=>s.active).length} membres actifs`}
        action={<Button onClick={()=>{setForm({name:'',email:'',password:'',role:'medecin'});setError('');setShowModal(true);}}>+ Nouveau membre</Button>}/>
      <div className="animate-fadeUp" style={{display:'grid',gridTemplateColumns:'repeat(6,1fr)',gap:10,marginBottom:18}}>
        {ROLE_OPTS.map(o=>(
          <div key={o.value} style={{padding:'12px 14px',borderRadius:12,background:RBGS[o.value],textAlign:'center',border:`1px solid ${RTXTS[o.value]}22`}}>
            <p style={{fontFamily:"'Playfair Display',serif",fontSize:24,fontWeight:900,color:RTXTS[o.value]}}>{roleCounts[o.value]||0}</p>
            <p style={{fontSize:10,color:RTXTS[o.value],opacity:.75,marginTop:2,lineHeight:1.3}}>{o.label}</p>
          </div>
        ))}
      </div>
      <div className="animate-fadeUp delay-1"><Table columns={cols} rows={staff}/></div>
      <Modal open={showModal} onClose={()=>setShowModal(false)} title="Ajouter un membre">
        <form onSubmit={handleCreate} style={{display:'flex',flexDirection:'column',gap:12}}>
          <Input label="Nom complet *" value={form.name} onChange={v=>set('name',v)} required/>
          <Input label="Email *" type="email" value={form.email} onChange={v=>set('email',v)} required/>
          <Input label="Mot de passe *" type="password" value={form.password} onChange={v=>set('password',v)} required/>
          <Select label="Rôle *" options={ROLE_OPTS} value={form.role} onChange={v=>set('role',v)} required/>
          {error&&<p style={{fontSize:12,padding:'8px 12px',borderRadius:8,background:'#FEE2E2',color:'#991B1B'}}>{error}</p>}
          <div style={{display:'flex',justifyContent:'flex-end',gap:10,marginTop:4}}>
            <Button variant="outline" type="button" onClick={()=>setShowModal(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving?'Création…':'Créer'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

/* ══ SETTINGS ══════════════════════════════════════════════ */
export function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [emailStatus, setEmailStatus] = useState(null);
  const [testEmail,   setTestEmail]   = useState('');
  const [testMsg,     setTestMsg]     = useState('');
  const [sendingTest, setSendingTest] = useState(false);
  const [reportMsg,   setReportMsg]   = useState('');

  useEffect(() => {
    api.get('/email/status').then(r => setEmailStatus(r.data)).catch(() => {});
  }, []);

  const sendTest = async () => {
    if (!testEmail) return;
    setSendingTest(true); setTestMsg('');
    try {
      const r = await api.post('/email/test', { email: testEmail });
      setTestMsg('✅ ' + r.data.message);
    } catch(e) { setTestMsg('❌ ' + e.message); }
    finally { setSendingTest(false); }
  };

  const sendReport = async () => {
    setReportMsg('');
    try {
      const r = await api.post('/email/report', {});
      setReportMsg('✅ ' + r.data.message);
    } catch(e) { setReportMsg('❌ ' + e.message); }
  };

  return (
    <div style={{ padding:'28px 32px', maxWidth:700, margin:'0 auto' }}>
      <PageHeader title="Paramètres" sub="Configuration de l'application" />

      {/* Email Card */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow)', marginBottom:14 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:16 }}>
          <span style={{ fontSize:20 }}>✉️</span>
          <span style={{ fontSize:14, fontWeight:600, color:'var(--forest)' }}>Configuration Email (Gmail)</span>
          {emailStatus && (
            <span style={{ marginLeft:'auto', padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600,
              background: emailStatus.enabled ? '#D1FAE5' : '#FEF3C7',
              color:      emailStatus.enabled ? '#065F46' : '#92400E' }}>
              {emailStatus.enabled ? '✅ Actif' : '⚠️ Non configuré'}
            </span>
          )}
        </div>

        {emailStatus && !emailStatus.enabled && (
          <div style={{ padding:'12px 14px', borderRadius:10, background:'#FEF3C7', border:'1px solid #FDE68A', marginBottom:14, fontSize:13, color:'#92400E' }}>
            <p style={{ fontWeight:700, marginBottom:6 }}>⚠️ Email non configuré</p>
            <p style={{ fontSize:12, lineHeight:1.7 }}>Modifiez <code style={{ background:'rgba(0,0,0,.07)', padding:'1px 6px', borderRadius:4 }}>backend/config.py</code> :</p>
            <pre style={{ marginTop:8, padding:'10px 12px', background:'rgba(0,0,0,.06)', borderRadius:8, fontSize:11, overflow:'auto', fontFamily:'monospace' }}>{`EMAIL_FROM     = 'votre@gmail.com'\nEMAIL_PASSWORD = 'xxxx xxxx xxxx xxxx'\nEMAIL_ADMIN    = 'admin@smartrehab.tn'`}</pre>
            <p style={{ fontSize:11, marginTop:8, opacity:.8 }}>💡 Créez un <strong>mot de passe d'application Gmail</strong> sur : <code>myaccount.google.com/apppasswords</code></p>
          </div>
        )}

        {emailStatus?.enabled && (
          <div style={{ fontSize:12, color:'var(--muted)', marginBottom:12 }}>
            <p>📤 Expéditeur : <strong style={{ color:'var(--text)' }}>{emailStatus.from_email}</strong></p>
            <p>👤 Admin : <strong style={{ color:'var(--text)' }}>{emailStatus.admin_email}</strong></p>
          </div>
        )}

        <div style={{ display:'flex', gap:10, alignItems:'flex-end' }}>
          <div style={{ flex:1 }}>
            <label style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'.08em', color:'var(--muted)', display:'block', marginBottom:5 }}>Tester l'envoi</label>
            <input value={testEmail} onChange={e=>setTestEmail(e.target.value)} type="email" placeholder="votre@email.com"
              style={{ width:'100%', padding:'9px 13px', borderRadius:10, border:'1.5px solid var(--border)', background:'#FAFAF8', fontSize:13, outline:'none', fontFamily:'inherit' }}
              onFocus={e=>(e.target.style.borderColor='var(--leaf)')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
          </div>
          <Button onClick={sendTest} disabled={sendingTest||!testEmail}>{sendingTest ? '⏳' : '📧 Tester'}</Button>
        </div>
        {testMsg && <p style={{ fontSize:12, marginTop:8, color:testMsg.startsWith('✅')?'#065F46':'#991B1B' }}>{testMsg}</p>}
      </div>

      {/* Auto emails */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow)', marginBottom:14 }}>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--forest)', marginBottom:14 }}>📬 Emails automatiques</p>
        {[
          { icon:'📝', title:"Confirmation d'inscription", desc:"Envoyée au résident dès qu'il soumet le formulaire de Sign Up.", auto:true },
          { icon:'✅', title:"Approbation d'inscription",  desc:"Envoyée quand vous approuvez une demande dans Inscriptions.", auto:true },
          { icon:'❌', title:"Refus d'inscription",        desc:"Envoyée quand vous refusez une demande dans Inscriptions.", auto:true },
          { icon:'🔔', title:"Alertes IoT critiques",      desc:"Envoi email à tout le staff quand une alerte haute sévérité est déclenchée.", auto:false },
          { icon:'📊', title:"Rapport mensuel",            desc:"Résumé statistique mensuel envoyé à l'administrateur.", auto:false },
        ].map(({ icon, title, desc, auto }) => (
          <div key={title} style={{ display:'flex', alignItems:'flex-start', gap:12, padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
            <span style={{ fontSize:18, flexShrink:0 }}>{icon}</span>
            <div style={{ flex:1 }}>
              <p style={{ fontSize:13, fontWeight:600, color:'var(--text)' }}>{title}</p>
              <p style={{ fontSize:12, color:'var(--muted)', marginTop:3, lineHeight:1.6 }}>{desc}</p>
            </div>
            <span style={{ padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600, flexShrink:0,
              background: auto ? '#D1FAE5' : '#DBEAFE', color: auto ? '#065F46' : '#1E40AF' }}>
              {auto ? 'Auto' : 'Manuel'}
            </span>
          </div>
        ))}
        <div style={{ marginTop:14 }}>
          <Button variant="outline" onClick={sendReport} style={{ fontSize:12 }}>📊 Envoyer rapport mensuel maintenant</Button>
          {reportMsg && <p style={{ fontSize:12, marginTop:8, color:reportMsg.startsWith('✅')?'#065F46':'#991B1B' }}>{reportMsg}</p>}
        </div>
      </div>

      {/* Quick links */}
      <div style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:20, boxShadow:'var(--shadow)', marginBottom:14 }}>
        <p style={{ fontSize:12, fontWeight:600, color:'var(--forest)', marginBottom:12 }}>⚡ Raccourcis</p>
        <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
          <Button variant="outline" style={{ fontSize:12 }} onClick={()=>navigate('/profile')}>👤 Mon profil</Button>
          <Button variant="outline" style={{ fontSize:12 }} onClick={()=>navigate('/reports')}>📊 Rapports</Button>
          <Button variant="outline" style={{ fontSize:12 }} onClick={()=>navigate('/registrations')}>📋 Inscriptions</Button>
          <Button variant="outline" style={{ fontSize:12 }} onClick={()=>navigate('/info')}>ℹ️ Page publique</Button>
        </div>
      </div>

      {/* DB */}
      <div style={{ padding:'16px 20px', borderRadius:'var(--radius)', background:'rgba(27,67,50,.04)', border:'1px solid var(--border)' }}>
        <p style={{ fontSize:12, fontWeight:600, color:'var(--forest)', marginBottom:6 }}>🗄️ Base de données MySQL (XAMPP)</p>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, fontSize:12, color:'var(--muted)' }}>
          <div>Base : <code style={{ background:'rgba(27,67,50,.06)', padding:'1px 6px', borderRadius:4, fontSize:11 }}>smartrehab</code></div>
          <div>phpMyAdmin : <a href="http://localhost/phpmyadmin" target="_blank" rel="noreferrer" style={{ color:'var(--leaf)' }}>Ouvrir →</a></div>
        </div>
      </div>
    </div>
  );
}
