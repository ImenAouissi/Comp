import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const GOOGLE_CLIENT_ID = '1056171045136-f07tenqu9192el91bqs7ns2ttagh0mc0.apps.googleusercontent.com';

export default function Login() {
  const [email, setEmail] = useState('admin@smartrehab.tn');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, loginWithToken } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);

    script.onload = () => {
      if (!window.google) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(
        document.getElementById('google-btn'),
        { theme: 'filled_black', size: 'large', width: 360, text: 'continue_with', shape: 'rectangular', locale: 'fr' }
      );
    };

    return () => { if (document.head.contains(script)) document.head.removeChild(script); };
  }, []);

  const handleGoogleResponse = async (response) => {
    setError(''); setLoading(true);
    try {
      const res = await fetch('http://localhost:4000/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erreur connexion Google');
      loginWithToken(data.token, data.user);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  const inp = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1.5px solid rgba(116,198,157,.2)',
    background: 'rgba(255,255,255,.06)', color: '#fff',
    fontSize: 14, outline: 'none', transition: 'border-color .2s', fontFamily: 'inherit',
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#0A1F14' }}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 52px', background: '#1B4332' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }} onClick={() => navigate('/info')}>
          <div style={{ width: 40, height: 40, borderRadius: '50%', background: '#40916C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🌿</div>
          <span style={{ fontFamily: "'Playfair Display',serif", fontSize: 18, fontWeight: 700, color: '#fff' }}>Smart Rehab &amp; Green Center</span>
        </div>
        <div>
          <blockquote style={{ fontFamily: "'Playfair Display',serif", fontSize: 38, fontWeight: 900, color: '#fff', lineHeight: 1.15, marginBottom: 16 }}>
            "Chaque jeune<br />mérite une<br />nouvelle chance."
          </blockquote>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.45)' }}>Plateforme de gestion interne — équipe soignante</p>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {[['200+', 'Bénéficiaires / an'], ['80%', 'Réintégration'], ['4', 'Piliers de soin']].map(([v, l]) => (
            <div key={l} style={{ background: 'rgba(255,255,255,.06)', borderRadius: 12, padding: '14px 16px' }}>
              <p style={{ fontFamily: "'Playfair Display',serif", fontSize: 24, fontWeight: 900, color: '#74C69D' }}>{v}</p>
              <p style={{ fontSize: 11, color: 'rgba(255,255,255,.45)', marginTop: 3 }}>{l}</p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ flex: '0 0 460px', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '48px 44px', overflowY: 'auto' }}>
        <div style={{ maxWidth: 360, width: '100%', margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: 30, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Connexion</h2>
          <p style={{ fontSize: 13, color: 'rgba(255,255,255,.4)', marginBottom: 32 }}>Accès réservé au personnel autorisé</p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#74C69D' }}>Email</span>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vous@smartrehab.tn" required style={inp}
                onFocus={e => (e.target.style.borderColor = '#74C69D')} onBlur={e => (e.target.style.borderColor = 'rgba(116,198,157,.2)')} />
            </label>
            <label style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#74C69D' }}>Mot de passe</span>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={inp}
                onFocus={e => (e.target.style.borderColor = '#74C69D')} onBlur={e => (e.target.style.borderColor = 'rgba(116,198,157,.2)')} />
            </label>

            {error && <p style={{ fontSize: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,.12)', color: '#FCA5A5' }}>{error}</p>}

            <button type="submit" disabled={loading} style={{
              padding: '13px', borderRadius: 12, border: 'none',
              background: '#40916C', color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1, fontFamily: 'inherit', transition: 'filter .15s',
            }} onMouseEnter={e => { if (!loading) e.target.style.filter = 'brightness(.9)' }} onMouseLeave={e => e.target.style.filter = ''}>
              {loading ? 'Connexion…' : 'Se connecter →'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '22px 0 16px' }}>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,.1)' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.3)' }}>ou</span>
            <hr style={{ flex: 1, border: 'none', borderTop: '1px solid rgba(255,255,255,.1)' }} />
          </div>

          <div id="google-btn" style={{ display: 'flex', justifyContent: 'center', marginBottom: 14, minHeight: 44 }} />

          <button onClick={() => navigate('/signup')} style={{
            width: '100%', padding: '13px', borderRadius: 12,
            border: '2px solid rgba(116,198,157,.4)', background: 'rgba(116,198,157,.08)',
            color: '#74C69D', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all .2s', marginBottom: 10,
          }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(116,198,157,.15)'; e.currentTarget.style.borderColor = '#74C69D' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(116,198,157,.08)'; e.currentTarget.style.borderColor = 'rgba(116,198,157,.4)' }}>
            📝 Créer un compte (Résidents)
          </button>

          <button onClick={() => navigate('/info')} style={{
            width: '100%', padding: '11px', borderRadius: 12,
            border: '1px solid rgba(255,255,255,.12)', background: 'transparent',
            color: 'rgba(255,255,255,.55)', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', transition: 'all .2s',
          }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.3)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,.12)'; e.currentTarget.style.color = 'rgba(255,255,255,.55)' }}>
            ℹ️ En savoir plus sur le centre
          </button>

          <div style={{ marginTop: 22, padding: '14px', borderRadius: 12, background: 'rgba(116,198,157,.07)', border: '1px solid rgba(116,198,157,.15)' }}>
            <p style={{ fontSize: 11, color: '#74C69D', fontWeight: 700, marginBottom: 6 }}>Comptes de démonstration</p>
            {[['admin@smartrehab.tn', 'admin123', 'Admin'], ['khelil@smartrehab.tn', 'medecin123', 'Médecin'], ['trabelsi@smartrehab.tn', 'psych123', 'Psychologue']].map(([e, p, r]) => (
              <div key={e} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,.45)', marginBottom: 2 }}>
                <span>{e}</span><span style={{ color: '#74C69D' }}>{p} ({r})</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}