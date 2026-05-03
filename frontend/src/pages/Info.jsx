import { useNavigate } from 'react-router-dom';

export default function Info() {
  const navigate = useNavigate();

  const btn = (label, onClick, primary=false) => (
    <button onClick={onClick} style={{
      padding: primary ? '13px 28px' : '11px 24px',
      borderRadius:100, fontSize:14, fontWeight: primary ? 700 : 600,
      border: primary ? 'none' : '1px solid rgba(255,255,255,.25)',
      background: primary ? '#40916C' : 'transparent',
      color: primary ? '#fff' : 'rgba(255,255,255,.7)',
      cursor:'pointer', fontFamily:'inherit', transition:'all .2s',
      boxShadow: primary ? '0 4px 20px rgba(64,145,108,.4)' : 'none',
    }}
    onMouseEnter={e => { e.currentTarget.style.filter='brightness(.9)'; e.currentTarget.style.transform='translateY(-1px)'; }}
    onMouseLeave={e => { e.currentTarget.style.filter=''; e.currentTarget.style.transform=''; }}
    >{label}</button>
  );

  return (
    <div style={{ background:'#0A1F14', minHeight:'100vh', fontFamily:"'DM Sans',sans-serif" }}>

      {/* NAV */}
      <nav style={{ position:'sticky', top:0, zIndex:100, background:'rgba(10,31,20,.95)', backdropFilter:'blur(12px)', borderBottom:'1px solid rgba(116,198,157,.1)', padding:'14px 40px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }} onClick={() => navigate('/')}>
          <div style={{ width:36, height:36, borderRadius:'50%', background:'#40916C', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16 }}>🌿</div>
          <span style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, color:'#fff', fontSize:15 }}>Smart Rehab <span style={{ color:'#74C69D', fontStyle:'italic', fontWeight:400 }}>&amp; Green Center</span></span>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={() => navigate('/info')} style={{ fontSize:13, color:'#74C69D', background:'rgba(116,198,157,.08)', border:'1px solid rgba(116,198,157,.2)', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:600 }}>ℹ️ À propos</button>
          <button onClick={() => navigate('/signup')} style={{ fontSize:13, color:'#fff', background:'transparent', border:'1px solid rgba(255,255,255,.2)', padding:'7px 16px', borderRadius:8, cursor:'pointer', fontFamily:'inherit' }}>📝 S'inscrire</button>
          <button onClick={() => navigate('/login')} style={{ fontSize:13, color:'#fff', background:'#40916C', border:'none', padding:'8px 20px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', fontWeight:700 }}>🔐 Connexion</button>
        </div>
      </nav>

      {/* HERO */}
      <div style={{ padding:'90px 48px 60px', maxWidth:960, margin:'0 auto', textAlign:'center' }}>
        <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#74C69D', marginBottom:16 }}>Tout savoir sur le centre</p>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:'clamp(32px,5vw,56px)', fontWeight:900, color:'#fff', lineHeight:1.1, marginBottom:20 }}>
          Smart Rehab<br/><span style={{ color:'#74C69D' }}>&amp; Green Center</span>
        </h1>
        <p style={{ fontSize:16, color:'rgba(255,255,255,.55)', lineHeight:1.85, maxWidth:620, margin:'0 auto 36px' }}>
          Centre innovant de réhabilitation combinant soins médicaux, formation professionnelle et espaces verts thérapeutiques.
        </p>
        <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap', marginBottom:48 }}>
          {btn('📝 Faire une demande', () => navigate('/signup'), true)}
          {btn('🔐 Accès professionnel', () => navigate('/login'))}
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', borderRadius:18, overflow:'hidden', border:'1px solid rgba(116,198,157,.1)' }}>
          {[['200+','Bénéficiaires / an'],['80%','Réintégration'],['4','Piliers de soin'],['100%','Vert & durable']].map(([n,l]) => (
            <div key={l} style={{ padding:'26px 16px', textAlign:'center', background:'rgba(27,67,50,.4)', borderRight:'1px solid rgba(116,198,157,.1)' }}>
              <div style={{ fontFamily:"'Playfair Display',serif", fontSize:34, fontWeight:900, color:'#74C69D' }}>{n}</div>
              <div style={{ fontSize:12, color:'rgba(255,255,255,.4)', marginTop:4 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* À PROPOS */}
      <div style={{ maxWidth:960, margin:'0 auto', padding:'0 48px 80px' }}>

        {/* Block 1 — Vision */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:44, alignItems:'center', marginBottom:48, padding:36, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:20 }}>
          <div>
            <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#B7935F', marginBottom:8 }}>À propos</p>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'#fff', marginBottom:14 }}>Une vision holistique de la réhabilitation</h2>
            <p style={{ fontSize:14, color:'rgba(255,255,255,.55)', lineHeight:1.85, marginBottom:14 }}>
              Le Smart Rehab &amp; Green Center est né d'un constat simple : traiter l'addiction de manière isolée ne suffit pas. Il faut accompagner le jeune vers une réinsertion complète et durable.
            </p>
            {[['🎯','Vision','Devenir le centre de référence au Maghreb pour la réhabilitation innovante.'],
              ['💚','Mission','Offrir un parcours médical, psychologique, sportif et écologique intégré.'],
              ['⭐','Valeurs','Dignité, bienveillance, innovation, durabilité, réinsertion.']].map(([icon,title,desc]) => (
              <div key={title} style={{ display:'flex', gap:12, marginBottom:10 }}>
                <div style={{ width:24, height:24, borderRadius:6, background:'rgba(116,198,157,.1)', border:'1px solid rgba(116,198,157,.2)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, flexShrink:0, marginTop:1 }}>{icon}</div>
                <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', lineHeight:1.6 }}><strong style={{ color:'#fff' }}>{title}</strong> — {desc}</div>
              </div>
            ))}
          </div>
          <div style={{ borderRadius:16, aspectRatio:'4/3', background:'linear-gradient(135deg,#2D6A4F,#40916C)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:80 }}>🌿</div>
        </div>

        {/* Block 2 — Google Maps */}
        <div style={{ marginBottom:48, padding:36, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:20 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#B7935F', marginBottom:8 }}>Notre emplacement</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'#fff', marginBottom:8 }}>Nous trouver</h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', lineHeight:1.8, marginBottom:20 }}>Situé en Tunisie, notre centre est facilement accessible. Venez nous rendre visite ou prenez rendez-vous.</p>
          <div style={{ borderRadius:16, overflow:'hidden', border:'2px solid rgba(116,198,157,.15)', boxShadow:'0 8px 32px rgba(0,0,0,.3)', marginBottom:16 }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m14!1m12!1m3!1d3000.0!2d10.4673!3d35.9548!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!5e0!3m2!1sfr!2stn!4v1700000000000!5m2!1sfr!2stn"
              width="100%" height="360" style={{ border:0, display:'block' }}
              allowFullScreen="" loading="lazy" referrerPolicy="no-referrer-when-downgrade">
            </iframe>
          </div>
          <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
            {[['📍','Adresse','Sousse, Tunisie (35.9548, 10.4673)'],['🚗','Accès','Parking gratuit'],['🕐','Horaires','Lun–Ven, 8h–17h']].map(([icon,label,val]) => (
              <div key={label} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'rgba(116,198,157,.08)', border:'1px solid rgba(116,198,157,.15)', borderRadius:10 }}>
                <span style={{ fontSize:16 }}>{icon}</span>
                <div><div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#74C69D' }}>{label}</div><div style={{ fontSize:13, color:'rgba(255,255,255,.7)' }}>{val}</div></div>
              </div>
            ))}
            <a href="https://www.google.com/maps?q=35.9548,10.4673" target="_blank" rel="noreferrer"
              style={{ marginLeft:'auto', padding:'10px 18px', borderRadius:10, background:'#40916C', color:'#fff', fontSize:13, fontWeight:600, textDecoration:'none' }}>
              Ouvrir dans Maps →
            </a>
          </div>
        </div>

        {/* Block 3 — Contact */}
        <div style={{ padding:36, background:'rgba(255,255,255,.03)', border:'1px solid rgba(255,255,255,.06)', borderRadius:20 }}>
          <p style={{ fontSize:11, fontWeight:700, letterSpacing:'.14em', textTransform:'uppercase', color:'#B7935F', marginBottom:8 }}>Contact</p>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, fontWeight:700, color:'#fff', marginBottom:8 }}>Nous contacter</h2>
          <p style={{ fontSize:14, color:'rgba(255,255,255,.5)', marginBottom:24, lineHeight:1.8 }}>Notre équipe est disponible du lundi au vendredi de 8h à 17h.</p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:28 }}>
            {[['✉️','Email','contact@smartrehabgreen.tn'],['📞','Téléphone','+216 71 XXX XXX'],['📍','Adresse','Sousse, Tunisie (35.9548, 10.4673)'],['🕐','Horaires','Lun – Ven, 8h00 – 17h00']].map(([icon,label,val]) => (
              <div key={label} style={{ display:'flex', gap:12, alignItems:'flex-start', padding:16, background:'rgba(255,255,255,.04)', border:'1px solid rgba(255,255,255,.07)', borderRadius:14 }}>
                <div style={{ width:38, height:38, borderRadius:10, background:'rgba(116,198,157,.1)', border:'1px solid rgba(116,198,157,.15)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, flexShrink:0 }}>{icon}</div>
                <div><div style={{ fontSize:10, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#74C69D', marginBottom:3 }}>{label}</div><div style={{ fontSize:13, color:'rgba(255,255,255,.65)' }}>{val}</div></div>
              </div>
            ))}
          </div>
          <div style={{ textAlign:'center', display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
            {btn('📝 Faire une demande d\'admission', () => navigate('/signup'), true)}
            {btn('🔐 Accès professionnel', () => navigate('/login'))}
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <footer style={{ padding:'24px 48px', borderTop:'1px solid rgba(116,198,157,.08)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10, background:'#060F09' }}>
        <div style={{ fontFamily:"'Playfair Display',serif", fontSize:14, color:'rgba(255,255,255,.35)' }}>
          <strong style={{ color:'#74C69D' }}>Smart Rehab</strong> &amp; Green Center
        </div>
        <div style={{ display:'flex', gap:10 }}>
          {[['📝 S\'inscrire','/signup'],['🔐 Connexion','/login'],['🏠 Accueil','/']].map(([label, path]) => (
            <button key={label} onClick={() => navigate(path)} style={{ fontSize:12, color:'rgba(255,255,255,.35)', background:'none', border:'1px solid rgba(255,255,255,.1)', padding:'6px 14px', borderRadius:8, cursor:'pointer', fontFamily:'inherit', transition:'color .2s' }}
              onMouseEnter={e=>(e.target.style.color='#74C69D')} onMouseLeave={e=>(e.target.style.color='rgba(255,255,255,.35)')}>
              {label}
            </button>
          ))}
        </div>
        <div style={{ fontSize:11, color:'rgba(255,255,255,.2)' }}>© 2025 Smart Rehab &amp; Green Center.</div>
      </footer>
    </div>
  );
}
