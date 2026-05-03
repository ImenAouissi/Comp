/* ── Smart Rehab — Shared UI Components ─────────────────────────────────── */

// ── LoadingSpinner ─────────────────────────────────────────────────────────
export function LoadingSpinner({ text = 'Chargement…' }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:240, gap:12 }}>
      <span className="live-dot" style={{ width:14, height:14 }} />
      <p style={{ fontSize:13, color:'var(--muted)' }}>{text}</p>
    </div>
  );
}

// ── StatCard ───────────────────────────────────────────────────────────────
export function StatCard({ label, value, sub, accent = 'var(--forest)', icon, delay = 0 }) {
  return (
    <div className="animate-fadeUp" style={{
      animationDelay:`${delay}ms`, background:'var(--white)',
      border:'1px solid var(--border)', borderRadius:'var(--radius)',
      boxShadow:'var(--shadow)', padding:'20px 22px',
    }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 }}>
        <p style={{ fontSize:11, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.1em', color:'var(--muted)' }}>{label}</p>
        {icon && (
          <span style={{ background:`${accent}18`, borderRadius:10, width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>{icon}</span>
        )}
      </div>
      <p style={{ fontFamily:"'Playfair Display',serif", fontSize:32, fontWeight:900, color:accent, lineHeight:1 }}>{value}</p>
      {sub && <p style={{ fontSize:11, color:'var(--muted)', marginTop:6 }}>{sub}</p>}
    </div>
  );
}

// ── Badge ──────────────────────────────────────────────────────────────────
const BADGE = {
  actif:      { bg:'#D1FAE5', text:'#065F46', dot:'#22C55E' },
  sorti:      { bg:'#DBEAFE', text:'#1E40AF', dot:'#6366F1' },
  suspendu:   { bg:'#FEF3C7', text:'#92400E', dot:'#F59E0B' },
  realisee:   { bg:'#D1FAE5', text:'#065F46', dot:'#22C55E' },
  planifiee:  { bg:'#FEF3C7', text:'#92400E', dot:'#F59E0B' },
  annulee:    { bg:'#FEE2E2', text:'#991B1B', dot:'#EF4444' },
  high:       { bg:'#FEE2E2', text:'#991B1B', dot:'#EF4444' },
  medium:     { bg:'#FEF3C7', text:'#92400E', dot:'#F59E0B' },
  low:        { bg:'#D1FAE5', text:'#065F46', dot:'#22C55E' },
  default:    { bg:'#F3F4F6', text:'#374151', dot:'#9CA3AF' },
};
export function Badge({ status, label }) {
  const s = BADGE[status] || BADGE.default;
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      padding:'3px 10px', borderRadius:100,
      fontSize:11, fontWeight:600,
      background:s.bg, color:s.text,
    }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot, flexShrink:0 }} />
      {label || status}
    </span>
  );
}

// ── Button ─────────────────────────────────────────────────────────────────
const BTN = {
  primary: { background:'var(--leaf)', color:'#fff', border:'none' },
  outline: { background:'transparent', color:'var(--forest)', border:'1px solid rgba(27,67,50,0.25)' },
  danger:  { background:'#FEE2E2', color:'#991B1B', border:'1px solid #FECACA' },
  ghost:   { background:'transparent', color:'var(--muted)', border:'none' },
};
export function Button({ children, onClick, variant='primary', disabled=false, type='button', style={} }) {
  const base = { display:'inline-flex', alignItems:'center', gap:6, padding:'8px 16px',
    borderRadius:10, fontSize:13, fontWeight:600, cursor:'pointer',
    transition:'filter 0.15s', opacity: disabled ? 0.5 : 1, ...BTN[variant], ...style };
  return (
    <button type={type} style={base} onClick={onClick} disabled={disabled}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.filter='brightness(0.9)'; }}
      onMouseLeave={e => { e.currentTarget.style.filter=''; }}
    >{children}</button>
  );
}

// ── Input / Select / Textarea ──────────────────────────────────────────────
const inputStyle = {
  width:'100%', padding:'9px 13px', borderRadius:10,
  border:'1.5px solid rgba(27,67,50,0.18)', background:'#FAFAF8',
  fontSize:13, color:'var(--text)', outline:'none', transition:'border-color 0.15s',
};
export function Input({ label, value, onChange, type='text', placeholder, required, min, max }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)' }}>{label}{required&&<span style={{color:'#EF4444'}}> *</span>}</span>}
      <input
        type={type} value={value} placeholder={placeholder} required={required}
        min={min} max={max}
        onChange={e => onChange(e.target.value)}
        style={inputStyle}
        onFocus={e  => (e.target.style.borderColor='var(--leaf)')}
        onBlur={e   => (e.target.style.borderColor='rgba(27,67,50,0.18)')}
      />
    </label>
  );
}
export function Select({ label, value, onChange, options, required }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)' }}>{label}{required&&<span style={{color:'#EF4444'}}> *</span>}</span>}
      <select value={value} onChange={e => onChange(e.target.value)} required={required}
        style={{ ...inputStyle, appearance:'none', cursor:'pointer' }}
        onFocus={e => (e.target.style.borderColor='var(--leaf)')}
        onBlur={e  => (e.target.style.borderColor='rgba(27,67,50,0.18)')}
      >
        <option value="">Sélectionner…</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}
export function Textarea({ label, value, onChange, placeholder, rows=4 }) {
  return (
    <label style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <span style={{ fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--muted)' }}>{label}</span>}
      <textarea value={value} placeholder={placeholder} rows={rows}
        onChange={e => onChange(e.target.value)}
        style={{ ...inputStyle, resize:'vertical', lineHeight:1.6 }}
        onFocus={e => (e.target.style.borderColor='var(--leaf)')}
        onBlur={e  => (e.target.style.borderColor='rgba(27,67,50,0.18)')}
      />
    </label>
  );
}

// ── Table ──────────────────────────────────────────────────────────────────
export function Table({ columns, rows, onRowClick, emptyMsg='Aucune donnée' }) {
  return (
    <div style={{ borderRadius:'var(--radius)', overflow:'hidden', border:'1px solid var(--border)', boxShadow:'var(--shadow)' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ background:'var(--forest)' }}>
            {columns.map(c => (
              <th key={c.key} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, fontWeight:700, letterSpacing:'0.08em', color:'rgba(255,255,255,0.75)', whiteSpace:'nowrap' }}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} style={{ padding:'36px 16px', textAlign:'center', fontSize:13, color:'var(--muted)', background:'var(--white)' }}>{emptyMsg}</td></tr>
          ) : rows.map((row, i) => (
            <tr key={row.id || i}
              style={{ background:'var(--white)', borderBottom:'1px solid var(--border)', cursor: onRowClick ? 'pointer' : 'default', transition:'background 0.12s' }}
              onClick={() => onRowClick?.(row)}
              onMouseEnter={e => { if (onRowClick) e.currentTarget.style.background='rgba(27,67,50,0.03)'; }}
              onMouseLeave={e => { e.currentTarget.style.background='var(--white)'; }}
            >
              {columns.map(c => (
                <td key={c.key} style={{ padding:'11px 16px', fontSize:13, color:'var(--text)' }}>
                  {c.render ? c.render(row[c.key], row) : (row[c.key] ?? '—')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── PageHeader ─────────────────────────────────────────────────────────────
export function PageHeader({ title, sub, action }) {
  return (
    <div className="animate-fadeUp" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:28 }}>
      <div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:700, color:'var(--forest)', lineHeight:1.1 }}>{title}</h1>
        {sub && <p style={{ fontSize:12, color:'var(--muted)', marginTop:4 }}>{sub}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

// ── Modal ──────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, width = 480 }) {
  if (!open) return null;
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:200, background:'rgba(10,31,20,0.5)', display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="animate-fadeUp" style={{ background:'var(--white)', borderRadius:18, padding:28, width:'100%', maxWidth:width, maxHeight:'90vh', overflowY:'auto', boxShadow:'0 24px 64px rgba(0,0,0,0.2)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:'var(--forest)' }}>{title}</h2>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:8, border:'none', background:'#f3f4f6', cursor:'pointer', fontSize:14, color:'#6B7280', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ── ProgressBar ────────────────────────────────────────────────────────────
export function ProgressBar({ value, color='var(--leaf)', height=6 }) {
  const pct = Math.min(100, Math.max(0, value || 0));
  const c = pct > 70 ? 'var(--leaf)' : pct > 40 ? 'var(--gold)' : '#EF4444';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height, borderRadius:height, background:'rgba(27,67,50,0.1)', overflow:'hidden', minWidth:50 }}>
        <div style={{ width:`${pct}%`, height:'100%', background:color||c, borderRadius:height, transition:'width 0.5s ease' }} />
      </div>
      <span style={{ fontSize:11, color:'var(--muted)', minWidth:30, textAlign:'right' }}>{pct}%</span>
    </div>
  );
}

// ── Card ───────────────────────────────────────────────────────────────────
export function Card({ children, style = {}, className = '' }) {
  return (
    <div className={className} style={{ background:'var(--white)', border:'1px solid var(--border)', borderRadius:'var(--radius)', boxShadow:'var(--shadow)', ...style }}>
      {children}
    </div>
  );
}
