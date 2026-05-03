"""
Smart Rehab & Green Center — Email Routes
=========================================
Routes:
  POST /api/email/test              → Envoyer un email de test
  POST /api/email/inscription/:id   → Renvoyer confirmation inscription
  POST /api/email/alert/:id         → Envoyer alerte IoT par email
  POST /api/email/report            → Envoyer rapport mensuel
  GET  /api/email/status            → Statut de la configuration email
"""

from flask      import Blueprint, request, jsonify, g
from database   import get_connection
from auth import require_auth
from email_service import (
    send_test_email,
    send_inscription_confirmation,
    send_inscription_approved,
    send_inscription_refused,
    send_iot_alert,
    send_monthly_report,
    EMAIL_ENABLED,
    EMAIL_FROM,
    EMAIL_ADMIN,
)

email_bp = Blueprint('email', __name__)


# ── GET /status ────────────────────────────────────────────────────────────
@email_bp.get('/status')
@require_auth
def email_status():
    """Check email configuration status."""
    return jsonify({
        'enabled':    EMAIL_ENABLED,
        'from_email': EMAIL_FROM if EMAIL_ENABLED else None,
        'admin_email':EMAIL_ADMIN,
        'provider':   'Gmail SMTP (smtp.gmail.com:587)',
        'message':    'Email actif' if EMAIL_ENABLED else 'Email désactivé — configurez EMAIL_PASSWORD dans config.py',
    })


# ── POST /test ─────────────────────────────────────────────────────────────
@email_bp.post('/test')
@require_auth
def test_email():
    """Send a test email to verify configuration."""
    data = request.get_json() or {}
    to   = data.get('email', g.user.get('email', EMAIL_ADMIN) if hasattr(g, 'user') else EMAIL_ADMIN)

    if not to:
        return jsonify({'error': 'Email destinataire requis'}), 400

    send_test_email(to)
    return jsonify({
        'success': True,
        'message': f'Email de test envoyé à {to}' if EMAIL_ENABLED else f'[MODE DEMO] Email simulé vers {to}',
        'enabled': EMAIL_ENABLED,
    })


# ── POST /inscription/<id> ─────────────────────────────────────────────────
@email_bp.post('/inscription/<int:reg_id>')
@require_auth
def email_inscription(reg_id):
    """Resend inscription confirmation email."""
    conn = get_connection()
    row  = conn.execute('SELECT * FROM registrations WHERE id=%s', (reg_id,)).fetchone()
    conn.close()

    if not row:
        return jsonify({'error': 'Inscription non trouvée'}), 404

    data   = request.get_json() or {}
    action = data.get('action', 'confirmation')  # 'confirmation' | 'approved' | 'refused'

    if action == 'approved':
        conn2 = get_connection()
        res   = conn2.execute(
            'SELECT code FROM residents WHERE nom=%s AND prenom=%s ORDER BY id DESC LIMIT 1',
            (row['nom'], row['prenom'])
        ).fetchone()
        conn2.close()
        send_inscription_approved(
            prenom         = row['prenom'],
            nom            = row['nom'],
            email          = row['email'],
            code_resident  = res['code'] if res else None,
        )
        msg = f"Email d'approbation envoyé à {row['email']}"

    elif action == 'refused':
        raison = data.get('raison', '')
        send_inscription_refused(
            prenom = row['prenom'],
            nom    = row['nom'],
            email  = row['email'],
            raison = raison,
        )
        msg = f"Email de refus envoyé à {row['email']}"

    else:
        msg_body = row.get('message', '') or row.get('situation', '') or ''
        urgent   = '[URGENT]' in (msg_body or '')
        send_inscription_confirmation(
            prenom    = row['prenom'],
            nom       = row['nom'],
            email     = row['email'],
            situation = row.get('situation') or row.get('role') or '',
            urgent    = urgent,
        )
        msg = f"Email de confirmation envoyé à {row['email']}"

    return jsonify({'success': True, 'message': msg, 'enabled': EMAIL_ENABLED})


# ── POST /alert/<id> ───────────────────────────────────────────────────────
@email_bp.post('/alert/<int:alert_id>')
@require_auth
def email_alert(alert_id):
    """Send IoT alert email to staff."""
    conn = get_connection()

    alert = conn.execute('''
        SELECT a.*, r.code, r.prenom, r.nom
        FROM alerts a
        LEFT JOIN residents r ON a.resident_id = r.id
        WHERE a.id = %s
    ''', (alert_id,)).fetchone()

    # Collect staff emails
    staff = conn.execute("SELECT email FROM users WHERE active=1").fetchall()
    conn.close()

    if not alert:
        return jsonify({'error': 'Alerte non trouvée'}), 404

    staff_emails = [s['email'] for s in staff if s['email']]
    if not staff_emails:
        staff_emails = [EMAIL_ADMIN]

    send_iot_alert(
        resident_code  = alert['code']   or f"ID-{alert['resident_id']}",
        resident_name  = f"{alert['prenom'] or ''} {alert['nom'] or ''}".strip() or 'Résident inconnu',
        alert_type     = alert['type'],
        message        = alert['message'],
        severity       = alert['severity'],
        staff_emails   = staff_emails,
    )

    return jsonify({
        'success':      True,
        'message':      f"Alerte envoyée à {len(staff_emails)} membre(s) du staff",
        'recipients':   staff_emails,
        'enabled':      EMAIL_ENABLED,
    })


# ── POST /report ───────────────────────────────────────────────────────────
@email_bp.post('/report')
@require_auth
def email_report():
    """Generate and send monthly report by email."""
    conn = get_connection()

    # Build stats
    total   = conn.execute("SELECT COUNT(*) as n FROM residents").fetchone()[0]
    actifs  = conn.execute("SELECT COUNT(*) as n FROM residents WHERE status='actif'").fetchone()[0]
    sortis  = conn.execute("SELECT COUNT(*) as n FROM residents WHERE status='sorti'").fetchone()[0]
    avg_p   = conn.execute("SELECT AVG(progress) FROM residents").fetchone()[0] or 0

    s_plan  = conn.execute("SELECT COUNT(*) as n FROM sessions WHERE status='planifiee'").fetchone()[0]
    s_real  = conn.execute("SELECT COUNT(*) as n FROM sessions WHERE status='realisee'").fetchone()[0]
    s_total = s_plan + s_real

    r_new   = conn.execute("SELECT COUNT(*) as n FROM registrations WHERE status='en_attente'").fetchone()[0]
    r_app   = conn.execute("SELECT COUNT(*) as n FROM registrations WHERE status='approuve'").fetchone()[0]
    r_ref   = conn.execute("SELECT COUNT(*) as n FROM registrations WHERE status='refuse'").fetchone()[0]

    a_total = conn.execute("SELECT COUNT(*) as n FROM alerts").fetchone()[0]
    a_crit  = conn.execute("SELECT COUNT(*) as n FROM alerts WHERE severity='high'").fetchone()[0]
    a_res   = conn.execute("SELECT COUNT(*) as n FROM alerts WHERE resolved=1").fetchone()[0]

    conn.close()

    stats = {
        'total_residents':      total,
        'actifs':               actifs,
        'sortis':               sortis,
        'avg_progress':         round(avg_p, 1),
        'sessions_planifiees':  s_plan,
        'sessions_realisees':   s_real,
        'taux_realisation':     round(s_real / s_total * 100) if s_total else 0,
        'new_registrations':    r_new,
        'approved':             r_app,
        'refused':              r_ref,
        'total_alerts':         a_total,
        'critical_alerts':      a_crit,
        'resolved_alerts':      a_res,
    }

    data        = request.get_json() or {}
    to_email    = data.get('email', EMAIL_ADMIN)

    send_monthly_report(admin_email=to_email, stats=stats)

    return jsonify({
        'success': True,
        'message': f"Rapport mensuel envoyé à {to_email}",
        'stats':   stats,
        'enabled': EMAIL_ENABLED,
    })
