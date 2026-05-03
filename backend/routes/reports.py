from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth, require_role
from datetime import datetime, timedelta
import csv, io

reports_bp = Blueprint('reports', __name__)

@reports_bp.get('/summary')
@require_auth
def summary():
    """Comprehensive stats for the reports page."""
    conn = get_connection()

    # Residents by status
    by_status = conn.execute("""
        SELECT status, COUNT(*) as count FROM residents GROUP BY status
    """).fetchall()

    # Residents by pilier
    by_pilier = conn.execute("""
        SELECT pilier, COUNT(*) as count, ROUND(AVG(progress)) as avg_progress
        FROM residents GROUP BY pilier
    """).fetchall()

    # Sessions last 30 days by type
    sessions_by_type = conn.execute("""
        SELECT type, COUNT(*) as count,
               SUM(CASE WHEN status='realisee' THEN 1 ELSE 0 END) as done
        FROM sessions
        WHERE date >= date('now','-30 days')
        GROUP BY type ORDER BY count DESC
    """).fetchall()

    # Monthly admissions (last 6 months)
    monthly_admissions = conn.execute("""
        SELECT DATE_FORMAT(entree, '%Y-%m') as month, COUNT(*) as count
        FROM residents
        WHERE entree IS NOT NULL AND entree != ''
        AND entree >= date('now', '-6 months')
        GROUP BY month ORDER BY month
    """).fetchall()

    # Progress distribution
    progress_dist = conn.execute("""
        SELECT
            CASE
                WHEN progress < 25  THEN '0-24%'
                WHEN progress < 50  THEN '25-49%'
                WHEN progress < 75  THEN '50-74%'
                ELSE '75-100%'
            END as range,
            COUNT(*) as count
        FROM residents
        GROUP BY range ORDER BY range
    """).fetchall()

    # Top praticiens by sessions
    top_praticiens = conn.execute("""
        SELECT praticien, COUNT(*) as total,
               SUM(CASE WHEN status='realisee' THEN 1 ELSE 0 END) as done
        FROM sessions GROUP BY praticien ORDER BY total DESC LIMIT 5
    """).fetchall()

    # Alert stats
    alert_stats = conn.execute("""
        SELECT
            SUM(CASE WHEN resolved=0 THEN 1 ELSE 0 END) as open,
            SUM(CASE WHEN resolved=1 THEN 1 ELSE 0 END) as resolved,
            COUNT(*) as total
        FROM alerts
    """).fetchone()

    # Biometrics averages (last 7 days)
    bio_avg = conn.execute("""
        SELECT
            ROUND(AVG(heart_rate),1) as avg_hr,
            ROUND(AVG(temperature),1) as avg_temp,
            ROUND(AVG(steps)) as avg_steps
        FROM biometrics
        WHERE 1=1
    """).fetchone()

    conn.close()
    return jsonify({
        'success': True,
        'byStatus':          [dict(r) for r in by_status],
        'byPilier':          [dict(r) for r in by_pilier],
        'sessionsByType':    [dict(r) for r in sessions_by_type],
        'monthlyAdmissions': [dict(r) for r in monthly_admissions],
        'progressDist':      [dict(r) for r in progress_dist],
        'topPraticiens':     [dict(r) for r in top_praticiens],
        'alertStats':        dict(alert_stats) if alert_stats else {},
        'bioAvg':            dict(bio_avg) if bio_avg else {},
    })


@reports_bp.get('/export/residents')
@require_auth
@require_role('admin', 'medecin')
def export_residents():
    """Export residents as CSV."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT code, prenom, nom, age, telephone, status, pilier,
               progress, diagnostique, objectif, entree, created_at
        FROM residents ORDER BY code
    """).fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Code','Prénom','Nom','Âge','Téléphone','Statut','Pilier',
                     'Progression %','Diagnostique','Objectif','Date entrée','Créé le'])
    for r in rows:
        writer.writerow([
            r['code'], r['prenom'], r['nom'], r['age'] or '',
            r['telephone'] or '', r['status'], r['pilier'],
            r['progress'], r['diagnostique'] or '', r['objectif'] or '',
            r['entree'] or '', r['created_at'][:10],
        ])

    from flask import Response
    return Response(
        '\ufeff' + output.getvalue(),   # BOM for Excel UTF-8
        mimetype='text/csv; charset=utf-8',
        headers={'Content-Disposition': f'attachment; filename=residents_{datetime.now().strftime("%Y%m%d")}.csv'}
    )


@reports_bp.get('/export/sessions')
@require_auth
def export_sessions():
    """Export sessions as CSV."""
    conn = get_connection()
    rows = conn.execute("""
        SELECT r.code, r.prenom, r.nom, s.type, s.praticien,
               s.date, s.duration, s.status, s.notes
        FROM sessions s
        JOIN residents r ON s.resident_id = r.id
        ORDER BY s.date DESC
    """).fetchall()
    conn.close()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['Code résident','Prénom','Nom','Type séance','Praticien',
                     'Date','Durée (min)','Statut','Notes'])
    for r in rows:
        writer.writerow([
            r['code'], r['prenom'], r['nom'], r['type'],
            r['praticien'], r['date'][:10] if r['date'] else '',
            r['duration'], r['status'], r['notes'] or '',
        ])

    from flask import Response
    return Response(
        '\ufeff' + output.getvalue(),
        mimetype='text/csv; charset=utf-8',
        headers={'Content-Disposition': f'attachment; filename=sessions_{datetime.now().strftime("%Y%m%d")}.csv'}
    )
