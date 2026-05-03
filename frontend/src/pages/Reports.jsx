import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { PageHeader, Card, LoadingSpinner, Button } from '../components/UI';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line,
} from 'recharts';

const COLORS = ['#40916C','#B7935F','#74C69D','#2D6A4F','#3A7CA5','#9FE1CB'];
const TT = { borderRadius:10, border:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', fontSize:12 };

function SectionTitle({ children }) {
  return (
    <p style={{ fontSize:13, fontWeight:600, color:'var(--forest)', marginBottom:14 }}>{children}</p>
  );
}

export default function Reports() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getReportsSummary()
      .then(r => setData(r))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const download = async (type) => {
    const token = localStorage.getItem('token') || '';
    const url   = `/api/reports/export/${type}`;
    const resp  = await fetch(url, { headers:{ Authorization:`Bearer ${token}` } });
    const blob  = await resp.blob();
    const a     = document.createElement('a');
    a.href      = URL.createObjectURL(blob);
    a.download  = `${type}_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
  };

  if (loading) return <LoadingSpinner />;
  if (!data)   return <div style={{ padding:32, color:'var(--muted)' }}>Impossible de charger les rapports.</div>;

  const { byStatus, byPilier, sessionsByType, monthlyAdmissions, progressDist, topPraticiens, alertStats, bioAvg } = data;

  return (
    <div style={{ padding:'28px 32px', maxWidth:1280, margin:'0 auto' }}>
      <PageHeader
        title="Rapports & Statistiques"
        sub="Vue d'ensemble complète du centre"
        action={
          <div style={{ display:'flex', gap:10 }}>
            <Button variant="outline" onClick={() => download('residents')}>⬇ Résidents CSV</Button>
            <Button variant="outline" onClick={() => download('sessions')}>⬇ Séances CSV</Button>
          </div>
        }
      />

      {/* KPI row */}
      <div className="animate-fadeUp" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:20 }}>
        {[
          ['Rythme cardiaque moy.', bioAvg?.avg_hr ? `${bioAvg.avg_hr} bpm` : '—', '💓', '#EF4444'],
          ['Température moy.',      bioAvg?.avg_temp ? `${bioAvg.avg_temp}°C` : '—', '🌡️', '#F59E0B'],
          ['Pas / heure moy.',      bioAvg?.avg_steps ? `${bioAvg.avg_steps}` : '—', '👟', '#40916C'],
          ['Alertes ouvertes',      alertStats?.open ?? '—', '⚠️', '#EF4444'],
        ].map(([label, val, icon, color]) => (
          <div key={label} style={{ background:'#fff', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)', padding:'18px 20px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
              <p style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)' }}>{label}</p>
              <span style={{ fontSize:16 }}>{icon}</span>
            </div>
            <p style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color, lineHeight:1 }}>{val}</p>
            <p style={{ fontSize:10, color:'var(--muted)', marginTop:4 }}>Moyenne 7 derniers jours</p>
          </div>
        ))}
      </div>

      {/* Row 1: Status pie + Pilier bar */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.5fr', gap:16, marginBottom:16 }}>
        <Card className="animate-fadeUp delay-1" style={{ padding:20 }}>
          <SectionTitle>Résidents par statut</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={byStatus} dataKey="count" nameKey="status" cx="50%" cy="44%" outerRadius={72} stroke="none">
                {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Legend formatter={v => v.charAt(0).toUpperCase() + v.slice(1)} wrapperStyle={{ fontSize:11 }} />
              <Tooltip contentStyle={TT} />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        <Card className="animate-fadeUp delay-2" style={{ padding:20 }}>
          <SectionTitle>Progression moyenne par pilier</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={byPilier} layout="vertical" margin={{ left:20 }}>
              <XAxis type="number" domain={[0,100]} tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="pilier" tick={{ fontSize:11, fill:'var(--text)' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={TT} formatter={(v) => [`${v}%`, 'Progression']} />
              <Bar dataKey="avg_progress" name="Progression %" fill="#40916C" radius={[0,6,6,0]}>
                {byPilier.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 2: Monthly admissions + Progress distribution */}
      <div style={{ display:'grid', gridTemplateColumns:'1.5fr 1fr', gap:16, marginBottom:16 }}>
        <Card className="animate-fadeUp delay-2" style={{ padding:20 }}>
          <SectionTitle>Admissions mensuelles (6 mois)</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyAdmissions}>
              <XAxis dataKey="month" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={TT} />
              <Line type="monotone" dataKey="count" name="Admissions" stroke="var(--leaf)" strokeWidth={2.5}
                dot={{ fill:'var(--leaf)', r:4, strokeWidth:0 }} activeDot={{ r:6, fill:'var(--forest)' }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="animate-fadeUp delay-3" style={{ padding:20 }}>
          <SectionTitle>Distribution de la progression</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={progressDist}>
              <XAxis dataKey="range" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="count" name="Résidents" radius={[6,6,0,0]}>
                {progressDist.map((entry, i) => {
                  const colors = ['#EF4444','#F59E0B','#3B82F6','#22C55E'];
                  return <Cell key={i} fill={colors[i] || '#40916C'} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Row 3: Sessions by type + Top praticiens */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
        <Card className="animate-fadeUp delay-3" style={{ padding:20 }}>
          <SectionTitle>Séances ce mois par type</SectionTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={sessionsByType}>
              <XAxis dataKey="type" tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="done"  name="Réalisées"  fill="#40916C" radius={[0,0,0,0]} stackId="a" />
              <Bar dataKey="count" name="Total"      fill="rgba(27,67,50,0.1)" radius={[4,4,0,0]} stackId="b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="animate-fadeUp delay-4" style={{ padding:20 }}>
          <SectionTitle>Top praticiens (séances)</SectionTitle>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {topPraticiens.map((p, i) => (
              <div key={p.praticien} style={{ display:'flex', alignItems:'center', gap:12 }}>
                <span style={{ width:22, height:22, borderRadius:'50%', background: i===0?'#B7935F':i===1?'#9CA3AF':'rgba(27,67,50,0.08)', color: i<2?'#fff':'var(--muted)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, flexShrink:0 }}>{i+1}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:12, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{p.praticien}</p>
                  <div style={{ height:4, borderRadius:2, background:'rgba(27,67,50,0.08)', marginTop:3, overflow:'hidden' }}>
                    <div style={{ width:`${Math.round(p.done/p.total*100)}%`, height:'100%', background:'var(--leaf)', borderRadius:2 }} />
                  </div>
                </div>
                <span style={{ fontSize:12, fontWeight:700, color:'var(--forest)', flexShrink:0 }}>{p.total}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts summary */}
      <Card className="animate-fadeUp delay-4" style={{ padding:20 }}>
        <SectionTitle>Résumé des alertes IoT</SectionTitle>
        <div style={{ display:'flex', gap:24 }}>
          {[['Ouvertes', alertStats?.open, '#EF4444'],['Résolues', alertStats?.resolved, '#22C55E'],['Total', alertStats?.total, 'var(--forest)']].map(([label, val, color]) => (
            <div key={label} style={{ textAlign:'center', padding:'12px 24px', borderRadius:12, background:'rgba(27,67,50,0.04)' }}>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:900, color }}>{val ?? '—'}</p>
              <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>{label}</p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
