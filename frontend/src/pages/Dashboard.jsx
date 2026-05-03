import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { StatCard, LoadingSpinner, Card } from '../components/UI';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend,
} from 'recharts';

const PIE_COLORS = ['#40916C','#B7935F','#74C69D','#2D6A4F','#9FE1CB'];

const TOOLTIP_STYLE = { borderRadius:10, border:'none', boxShadow:'0 8px 24px rgba(0,0,0,0.1)', fontSize:12 };

export default function Dashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getStats()
      .then(r => setData(r))
      .catch(() => setData({
        stats: { totalResidents:47, activeResidents:38, dischargedCount:9, avgProgress:62, sessionsCompleted:284, openAlerts:2, reintegrationRate:78 },
        sessionsByType: [{ name:'individuelle',value:38 },{ name:'groupe',value:24 },{ name:'sport',value:21 },{ name:'formation',value:17 }],
        weeklyData: [{ day:'Lun',sessions:12,sport:8 },{ day:'Mar',sessions:9,sport:10 },{ day:'Mer',sessions:15,sport:7 },{ day:'Jeu',sessions:11,sport:9 },{ day:'Ven',sessions:14,sport:12 },{ day:'Sam',sessions:6,sport:5 },{ day:'Dim',sessions:4,sport:3 }],
        progressTrend: [{week:'S1',avg:18},{week:'S2',avg:24},{week:'S3',avg:29},{week:'S4',avg:35},{week:'S5',avg:41},{week:'S6',avg:48},{week:'S7',avg:52},{week:'S8',avg:60}],
      }))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <LoadingSpinner />;

  const { stats, sessionsByType, weeklyData, progressTrend } = data;

  return (
    <div style={{ padding:'28px 32px', maxWidth:1280, margin:'0 auto' }}>
      <div className="animate-fadeUp" style={{ marginBottom:24 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:24, fontWeight:700, color:'var(--forest)' }}>Tableau de bord</h1>
        <p style={{ fontSize:12, color:'var(--muted)', marginTop:3 }}>
          {new Date().toLocaleDateString('fr-FR',{ weekday:'long', day:'numeric', month:'long', year:'numeric' })}
        </p>
      </div>

      {/* KPI cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:20 }}>
        <StatCard label="Résidents actifs"    value={stats.activeResidents}         sub={`/ ${stats.totalResidents} total`}       accent="var(--forest)" icon="👥" delay={0}   />
        <StatCard label="Progression moyenne" value={`${stats.avgProgress}%`}       sub="objectif : 70%"                          accent="var(--leaf)"   icon="📈" delay={60}  />
        <StatCard label="Séances réalisées"   value={stats.sessionsCompleted}        sub="cumulées"                                accent="var(--gold)"   icon="📋" delay={120} />
        <StatCard label="Réintégration"       value={`${stats.reintegrationRate}%`} sub={`${stats.dischargedCount} sortis`}       accent="#3A7CA5"       icon="🎯" delay={180} />
      </div>

      {/* Alert banner */}
      {stats.openAlerts > 0 && (
        <div className="animate-fadeUp delay-2" style={{ marginBottom:20, padding:'12px 16px', borderRadius:12, background:'#FEF3C7', border:'1px solid #F59E0B', display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:18 }}>⚠️</span>
          <p style={{ fontSize:13, color:'#92400E', fontWeight:600 }}>
            {stats.openAlerts} alerte{stats.openAlerts>1?'s':''} IoT ouvertes —{' '}
            <a href="/alerts" style={{ textDecoration:'underline', color:'#78350F' }}>voir les alertes</a>
          </p>
        </div>
      )}

      {/* Charts row 1 */}
      <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:16, marginBottom:16 }}>
        <Card className="animate-fadeUp delay-2" style={{ padding:20 }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--forest)', marginBottom:16 }}>Séances cette semaine</p>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={weeklyData} barGap={3}>
              <XAxis dataKey="day" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} width={24} />
              <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill:'rgba(27,67,50,0.04)' }} />
              <Bar dataKey="sessions" name="Thérapie" fill="#40916C" radius={[5,5,0,0]} />
              <Bar dataKey="sport"    name="Sport"    fill="#B7935F" radius={[5,5,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card className="animate-fadeUp delay-3" style={{ padding:20 }}>
          <p style={{ fontSize:13, fontWeight:600, color:'var(--forest)', marginBottom:16 }}>Types de séances</p>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={sessionsByType} cx="50%" cy="44%" outerRadius={68} dataKey="value" stroke="none">
                {sessionsByType.map((_,i) => <Cell key={i} fill={PIE_COLORS[i%PIE_COLORS.length]} />)}
              </Pie>
              <Legend wrapperStyle={{ fontSize:11 }} />
              <Tooltip contentStyle={TOOLTIP_STYLE} />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Progress trend */}
      <Card className="animate-fadeUp delay-4" style={{ padding:20 }}>
        <p style={{ fontSize:13, fontWeight:600, color:'var(--forest)', marginBottom:16 }}>Progression moyenne des résidents — 8 semaines</p>
        <ResponsiveContainer width="100%" height={180}>
          <LineChart data={progressTrend}>
            <XAxis dataKey="week" tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:11, fill:'#9CA3AF' }} axisLine={false} tickLine={false} width={28} domain={[0,100]} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            <Line type="monotone" dataKey="avg" name="Progression %" stroke="var(--leaf)" strokeWidth={2.5}
              dot={{ fill:'var(--leaf)', r:4, strokeWidth:0 }} activeDot={{ r:6, fill:'var(--forest)' }} />
          </LineChart>
        </ResponsiveContainer>
      </Card>
    </div>
  );
}
