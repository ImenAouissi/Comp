import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';

const TYPE_ICON = { resident:'👥', session:'📋', staff:'🩺', formation:'🎓' };
const TYPE_COLOR = {
  resident:  { bg:'#EEF9F3', text:'#065F46' },
  session:   { bg:'#EFF6FF', text:'#1E40AF' },
  staff:     { bg:'#F5F3FF', text:'#4C1D95' },
  formation: { bg:'#FEF3C7', text:'#92400E' },
};

export default function SearchBar() {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [active,  setActive]  = useState(-1);
  const ref      = useRef(null);
  const navigate = useNavigate();
  const timer    = useRef(null);

  // Close on outside click
  useEffect(() => {
    const h = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const search = (q) => {
    clearTimeout(timer.current);
    if (q.length < 2) { setResults([]); setOpen(false); return; }
    setLoading(true);
    timer.current = setTimeout(() => {
      api.search(q)
        .then(r => { setResults(r.results || []); setOpen(true); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 300);
  };

  const handleKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a+1, results.length-1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a-1, -1)); }
    if (e.key === 'Escape')    { setOpen(false); setQuery(''); }
    if (e.key === 'Enter' && active >= 0 && results[active]) {
      navigate(results[active].url); setOpen(false); setQuery('');
    }
  };

  const go = (result) => {
    navigate(result.url);
    setOpen(false); setQuery(''); setResults([]);
  };

  return (
    <div ref={ref} style={{ position:'relative', flex:1, maxWidth:380 }}>
      <div style={{ position:'relative' }}>
        <span style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)', fontSize:14, pointerEvents:'none' }}>🔍</span>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          onFocus={() => { if (results.length) setOpen(true); }}
          onKeyDown={handleKey}
          placeholder="Rechercher résidents, séances, staff…"
          style={{
            width:'100%', padding:'8px 12px 8px 36px', borderRadius:10,
            border:'1px solid rgba(116,198,157,0.2)', background:'rgba(255,255,255,0.06)',
            color:'rgba(255,255,255,0.8)', fontSize:13, outline:'none',
            fontFamily:'inherit', transition:'border-color 0.15s',
          }}
          onMouseEnter={e => (e.target.style.borderColor='rgba(116,198,157,0.4)')}
          onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor='rgba(116,198,157,0.2)'; }}
        />
        {loading && (
          <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', fontSize:10, color:'var(--mint)' }}>…</span>
        )}
      </div>

      {open && results.length > 0 && (
        <div style={{
          position:'absolute', top:40, left:0, right:0, zIndex:300,
          background:'#fff', borderRadius:12, border:'1px solid rgba(27,67,50,0.1)',
          boxShadow:'0 16px 48px rgba(0,0,0,0.15)', overflow:'hidden',
        }}>
          {results.map((r, i) => {
            const tc = TYPE_COLOR[r.type] || TYPE_COLOR.resident;
            return (
              <div key={`${r.type}-${r.id}`}
                onClick={() => go(r)}
                style={{
                  padding:'10px 14px', display:'flex', alignItems:'center', gap:10,
                  cursor:'pointer', borderBottom:'1px solid rgba(27,67,50,0.05)',
                  background: i === active ? 'rgba(27,67,50,0.04)' : '#fff',
                  transition:'background 0.1s',
                }}
                onMouseEnter={e => { setActive(i); e.currentTarget.style.background='rgba(27,67,50,0.04)'; }}
                onMouseLeave={e => { if (active !== i) e.currentTarget.style.background='#fff'; }}
              >
                <span style={{ fontSize:16, flexShrink:0 }}>{TYPE_ICON[r.type]}</span>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ fontSize:13, fontWeight:500, color:'var(--text)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.title}</p>
                  <p style={{ fontSize:11, color:'var(--muted)', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{r.subtitle}</p>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                  <span style={{ fontSize:10, padding:'2px 7px', borderRadius:100, fontWeight:600, background:tc.bg, color:tc.text }}>{r.type}</span>
                  {r.meta && <span style={{ fontSize:10, color:'var(--muted)' }}>{r.meta}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && query.length >= 2 && results.length === 0 && !loading && (
        <div style={{
          position:'absolute', top:40, left:0, right:0, zIndex:300,
          background:'#fff', borderRadius:12, border:'1px solid rgba(27,67,50,0.1)',
          padding:'16px', textAlign:'center', fontSize:12, color:'var(--muted)',
          boxShadow:'0 16px 48px rgba(0,0,0,0.15)',
        }}>
          Aucun résultat pour « {query} »
        </div>
      )}
    </div>
  );
}
