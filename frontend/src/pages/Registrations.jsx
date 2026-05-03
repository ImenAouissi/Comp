import { useEffect, useState } from 'react';
import { api } from '../utils/api';
import { PageHeader, Badge, Button, Modal, Select, Input, LoadingSpinner } from '../components/UI';

const PILIER_OPTS = [
  { value:'therapie',  label:'Thérapie'  },
  { value:'formation', label:'Formation' },
  { value:'sport',     label:'Sport'     },
  { value:'ecologie',  label:'Écologie'  },
];
const ROLE_OPTS = [
  { value:'medecin',    label:'Médecin psychiatre' },
  { value:'psychologue',label:'Psychologue'         },
  { value:'infirmier',  label:'Infirmier(ère)'      },
  { value:'coach',      label:'Coach sportif'       },
  { value:'formateur',  label:'Formateur'           },
  { value:'admin',      label:'Administrateur'      },
];

const STATUS_STYLE = {
  en_attente: { bg:'#FEF3C7', text:'#92400E', dot:'#F59E0B', label:'En attente'  },
  approuve:   { bg:'#D1FAE5', text:'#065F46', dot:'#22C55E', label:'Approuvé'    },
  refuse:     { bg:'#FEE2E2', text:'#991B1B', dot:'#EF4444', label:'Refusé'      },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.en_attente;
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:100, fontSize:11, fontWeight:600, background:s.bg, color:s.text }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:s.dot }} />
      {s.label}
    </span>
  );
}

export default function Registrations() {
  const [regs,      setRegs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [filter,    setFilter]    = useState('en_attente');
  const [selected,  setSelected]  = useState(null);
  const [approveModal, setApproveModal] = useState(false);
  const [approveForm,  setApproveForm]  = useState({ pilier:'therapie', objectif:'Sevrage et réinsertion socio-professionnelle', role:'psychologue', password:'Rehab2025!' });
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState('');

  const load = () => {
    setLoading(true);
    api.getRegistrations(filter)
      .then(r => setRegs(r.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filter]);

  const openApprove = (reg) => {
    setSelected(reg);
    setApproveForm(f => ({
      ...f,
      role: reg.role || 'psychologue',
    }));
    setMsg('');
    setApproveModal(true);
  };

  const handleApprove = async (e) => {
    e.preventDefault(); setSaving(true); setMsg('');
    try {
      const res = await api.approveRegistration(selected.id, approveForm);
      setMsg('✅ ' + res.message);
      setRegs(rs => rs.map(r => r.id === selected.id ? { ...r, status:'approuve' } : r));
      setTimeout(() => { setApproveModal(false); load(); }, 1200);
    } catch (err) { setMsg('❌ ' + err.message); }
    finally { setSaving(false); }
  };

  const handleReject = async (reg) => {
    if (!confirm(`Refuser la demande de ${reg.prenom} ${reg.nom} ?`)) return;
    try {
      await api.rejectRegistration(reg.id, {});
      setRegs(rs => rs.map(r => r.id === reg.id ? { ...r, status:'refuse' } : r));
    } catch (err) { alert(err.message); }
  };

  const handleResendEmail = async (reg, action) => {
    try {
      await api.resendInscriptionEmail(reg.id, action);
      alert(`✅ Email "${action}" envoyé à ${reg.email}`);
    } catch (err) { alert(`❌ ${err.message}`); }
  };

  const counts = {
    en_attente: regs.filter(r => r.status === 'en_attente').length,
    approuve:   regs.filter(r => r.status === 'approuve').length,
    refuse:     regs.filter(r => r.status === 'refuse').length,
  };

  const displayed = filter === 'all' ? regs : regs.filter(r => r.status === filter);

  return (
    <div style={{ padding:'28px 32px', maxWidth:1100, margin:'0 auto' }}>
      <PageHeader
        title="Demandes d'inscription"
        sub="Résidents et candidats staff en attente de validation"
      />

      {/* Summary cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14, marginBottom:20 }}>
        {[['en_attente','⏳','En attente','#FEF3C7','#92400E'],['approuve','✅','Approuvées','#D1FAE5','#065F46'],['refuse','❌','Refusées','#FEE2E2','#991B1B']].map(([key,icon,label,bg,text]) => (
          <button key={key} onClick={() => setFilter(key)}
            style={{ padding:'16px 20px', borderRadius:14, background: filter===key ? bg : '#fff', border:`2px solid ${filter===key ? STATUS_STYLE[key].dot : 'rgba(27,67,50,0.08)'}`, textAlign:'left', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', gap:12 }}>
            <span style={{ fontSize:22 }}>{icon}</span>
            <div>
              <p style={{ fontFamily:"'Playfair Display',serif", fontSize:26, fontWeight:900, color: filter===key ? text : '#1B4332', lineHeight:1 }}>
                {filter === key ? displayed.length : (key === 'all' ? regs.length : regs.filter(r=>r.status===key).length)}
              </p>
              <p style={{ fontSize:11, color:'#6B7B6E', marginTop:2 }}>{label}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:8, marginBottom:16 }}>
        {[['en_attente','En attente'],['approuve','Approuvées'],['refuse','Refusées'],['all','Toutes']].map(([val, label]) => (
          <button key={val} onClick={() => setFilter(val)}
            style={{ padding:'6px 16px', borderRadius:10, fontSize:12, fontWeight:600, cursor:'pointer', border:'1.5px solid',
              background: filter===val ? '#1B4332' : '#fff',
              color:      filter===val ? '#fff'    : '#6B7B6E',
              borderColor:filter===val ? '#1B4332' : 'rgba(27,67,50,0.15)',
            }}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <LoadingSpinner /> : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {displayed.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px 0', color:'#6B7B6E', fontSize:14 }}>
              Aucune demande {filter !== 'all' ? `"${filter}"` : ''}
            </div>
          )}
          {displayed.map(reg => (
            <div key={reg.id} className="animate-fadeUp" style={{
              background:'#fff', borderRadius:16, padding:'18px 22px',
              border:'1px solid rgba(27,67,50,0.08)', boxShadow:'0 2px 12px rgba(0,0,0,0.04)',
              display:'flex', alignItems:'flex-start', gap:16,
            }}>
              {/* Avatar */}
              <div style={{ width:46, height:46, borderRadius:'50%', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, fontWeight:700, color:'#fff',
                background: reg.type === 'resident' ? '#2D6A4F' : '#3A7CA5',
              }}>
                {reg.prenom?.charAt(0)}{reg.nom?.charAt(0)}
              </div>

              {/* Info */}
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', marginBottom:4 }}>
                  <span style={{ fontSize:15, fontWeight:600, color:'#1B4332' }}>{reg.prenom} {reg.nom}</span>
                  <span style={{ fontSize:11, padding:'2px 8px', borderRadius:100, fontWeight:600,
                    background: reg.type === 'resident' ? '#EEF9F3' : '#EFF6FF',
                    color:      reg.type === 'resident' ? '#065F46' : '#1E40AF',
                  }}>
                    {reg.type === 'resident' ? '🏥 Résident' : '👔 Staff'}
                  </span>
                  {reg.role && <span style={{ fontSize:11, color:'#6B7B6E', background:'#F3F4F6', padding:'2px 8px', borderRadius:100 }}>{reg.role}</span>}
                  <StatusBadge status={reg.status} />
                </div>
                <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:12, color:'#6B7B6E', marginBottom:6 }}>
                  <span>✉️ {reg.email}</span>
                  {reg.telephone && <span>📞 {reg.telephone}</span>}
                  {reg.age && <span>🎂 {reg.age} ans</span>}
                  <span>📅 {new Date(reg.created_at).toLocaleDateString('fr-FR')}</span>
                </div>
                {(reg.situation || reg.message) && (
                  <p style={{ fontSize:12, color:'#4B5563', background:'rgba(27,67,50,0.04)', padding:'8px 12px', borderRadius:8, borderLeft:'3px solid #74C69D', lineHeight:1.6 }}>
                    {reg.situation || reg.message}
                  </p>
                )}
              </div>

              {/* Actions */}
              {reg.status === 'en_attente' && (
                <div style={{ display:'flex', gap:8, flexShrink:0, flexWrap:'wrap' }}>
                  <Button onClick={() => openApprove(reg)} style={{ padding:'7px 14px', fontSize:12 }}>
                    ✓ Approuver
                  </Button>
                  <Button variant="danger" onClick={() => handleReject(reg)} style={{ padding:'7px 14px', fontSize:12 }}>
                    ✗ Refuser
                  </Button>
                  <Button variant="outline" onClick={() => handleResendEmail(reg, 'confirmation')} style={{ padding:'7px 10px', fontSize:11 }}
                    title="Renvoyer email de confirmation">
                    📧
                  </Button>
                </div>
              )}
              {reg.status === 'approuve' && (
                <Button variant="outline" onClick={() => handleResendEmail(reg, 'approved')} style={{ padding:'7px 12px', fontSize:11, flexShrink:0 }}
                  title="Renvoyer email d'approbation">
                  📧 Renvoyer
                </Button>
              )}
              {reg.status === 'refuse' && (
                <Button variant="outline" onClick={() => handleResendEmail(reg, 'refused')} style={{ padding:'7px 12px', fontSize:11, flexShrink:0 }}
                  title="Renvoyer email de refus">
                  📧 Renvoyer
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Approve modal */}
      <Modal open={approveModal} onClose={() => setApproveModal(false)}
        title={`Approuver — ${selected?.prenom} ${selected?.nom}`} width={480}>
        {selected && (
          <form onSubmit={handleApprove} style={{ display:'flex', flexDirection:'column', gap:14 }}>
            <div style={{ padding:'12px 14px', borderRadius:10, background:'rgba(27,67,50,0.04)', border:'1px solid rgba(27,67,50,0.1)', fontSize:12, color:'#1B4332' }}>
              <strong>Type :</strong> {selected.type === 'resident' ? 'Résident (nouveau dossier médical)' : 'Staff (nouveau compte utilisateur)'}
            </div>

            {selected.type === 'resident' && (
              <>
                <Select label="Pilier thérapeutique" options={PILIER_OPTS}
                  value={approveForm.pilier}
                  onChange={v => setApproveForm(f => ({ ...f, pilier:v }))} />
                <Input label="Objectif de séjour"
                  value={approveForm.objectif}
                  onChange={v => setApproveForm(f => ({ ...f, objectif:v }))} />
              </>
            )}

            {selected.type === 'staff' && (
              <>
                <Select label="Rôle à attribuer" options={ROLE_OPTS}
                  value={approveForm.role}
                  onChange={v => setApproveForm(f => ({ ...f, role:v }))} required />
                <Input label="Mot de passe provisoire" type="text"
                  value={approveForm.password}
                  onChange={v => setApproveForm(f => ({ ...f, password:v }))} />
                <div style={{ fontSize:11, color:'#6B7B6E', padding:'8px 12px', background:'#F9FAFB', borderRadius:8 }}>
                  Le membre pourra modifier son mot de passe après la première connexion via "Mon profil".
                </div>
              </>
            )}

            {msg && (
              <p style={{ fontSize:12, padding:'8px 12px', borderRadius:8,
                background: msg.startsWith('✅') ? '#D1FAE5' : '#FEE2E2',
                color:      msg.startsWith('✅') ? '#065F46' : '#991B1B',
              }}>{msg}</p>
            )}

            <div style={{ display:'flex', justifyContent:'flex-end', gap:10, marginTop:4 }}>
              <Button variant="outline" type="button" onClick={() => setApproveModal(false)}>Annuler</Button>
              <Button type="submit" disabled={saving}>{saving ? 'Traitement…' : '✓ Confirmer l\'approbation'}</Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
