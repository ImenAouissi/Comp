from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth, require_role
from datetime import datetime

residents_bp = Blueprint('residents', __name__)

@residents_bp.get('')
@require_auth
def list_residents():
    conn = get_connection()
    rows = conn.execute(
        'SELECT * FROM residents ORDER BY created_at DESC'
    ).fetchall()
    conn.close()
    return jsonify({'success': True, 'count': len(rows), 'data': [dict(r) for r in rows]})

@residents_bp.get('/<int:rid>')
@require_auth
def get_resident(rid):
    conn = get_connection()
    row  = conn.execute('SELECT * FROM residents WHERE id=%s', (rid,)).fetchone()
    # Count sessions done and total repas
    sessions_done = conn.execute(
        "SELECT COUNT(*) FROM sessions WHERE resident_id=%s AND status='realisee'", (rid,)
    ).fetchone()[0]
    total_repas = conn.execute(
        "SELECT 0", (rid,)
    ).fetchone()[0]
    conn.close()
    if not row:
        return jsonify({'error': 'Resident not found'}), 404
    data = dict(row)
    data['sessions_realisees_count'] = sessions_done
    data['total_repas']              = total_repas
    return jsonify({'success': True, 'data': data})

@residents_bp.post('')
@require_auth
def create_resident():
    data = request.get_json() or {}
    if not data.get('nom'):
        return jsonify({'error': 'nom is required'}), 400
    conn = get_connection()
    code = data.get('code') or f"RES-{datetime.now().strftime('%y%m%d%H%M%S')}"
    try:
        cur = conn.execute("""
            INSERT INTO residents (code,nom,prenom,age,telephone,status,pilier,progress,diagnostique,objectif,notes,entree)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            code,
            data.get('nom'), data.get('prenom',''),
            data.get('age'), data.get('telephone'),
            data.get('status','actif'), data.get('pilier','therapie'),
            data.get('progress',0),
            data.get('diagnostique',''), data.get('objectif',''), data.get('notes',''),
            data.get('entree', datetime.now().strftime('%Y-%m-%d')),
            data.get('date_sortie'),
            data.get('seances_requises', 20),
        ))
        conn.commit()
        new_id = cur.lastrowid
        row = conn.execute('SELECT * FROM residents WHERE id=%s', (new_id,)).fetchone()
        conn.close()
        return jsonify({'success': True, 'data': dict(row)}), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

@residents_bp.patch('/<int:rid>')
@require_auth
def update_resident(rid):
    data = request.get_json() or {}
    conn = get_connection()
    row  = conn.execute('SELECT id FROM residents WHERE id=%s', (rid,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Resident not found'}), 404

    fields = ['nom','prenom','age','telephone','status','pilier','progress',
              'diagnostique','objectif','notes','entree','date_sortie',
              'seances_requises','seances_realisees','repas_pris']
    updates = {k: data[k] for k in fields if k in data}
    if not updates:
        conn.close()
        return jsonify({'error': 'No fields to update'}), 400

    updates['updated_at'] = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    set_clause = ', '.join(f'{k}=%s' for k in updates)
    conn.execute(f'UPDATE residents SET {set_clause} WHERE id=%s', list(updates.values()) + [rid])
    conn.commit()
    row = conn.execute('SELECT * FROM residents WHERE id=%s', (rid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(row)})

@residents_bp.patch('/<int:rid>/progress')
@require_auth
def update_progress(rid):
    data = request.get_json() or {}
    progress = data.get('progress')
    if progress is None or not (0 <= int(progress) <= 100):
        return jsonify({'error': 'progress must be 0-100'}), 400
    conn = get_connection()
    conn.execute('UPDATE residents SET progress=%s, updated_at=%s WHERE id=%s',
                 (int(progress), datetime.now().strftime('%Y-%m-%d %H:%M:%S'), rid))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'progress': int(progress)})

@residents_bp.patch('/<int:rid>/sortie')
@require_auth
@require_role('admin','medecin')
def marquer_sortie(rid):
    """Marquer la date de sortie du centre."""
    data = request.get_json() or {}
    date_sortie = data.get('date_sortie', datetime.now().strftime('%Y-%m-%d'))
    conn = get_connection()
    conn.execute(
        "UPDATE residents SET date_sortie=%s, status='sorti', updated_at=%s WHERE id=%s",
        (date_sortie, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), rid)
    )
    conn.commit()
    row = conn.execute('SELECT * FROM residents WHERE id=%s', (rid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(row)})

@residents_bp.delete('/<int:rid>')
@require_auth
@require_role('admin','medecin')
def delete_resident(rid):
    conn = get_connection()
    conn.execute('DELETE FROM residents WHERE id=%s', (rid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Resident deleted'})

@residents_bp.get('/stats/summary')
@require_auth
def stats():
    conn = get_connection()
    total    = conn.execute('SELECT COUNT(*) FROM residents').fetchone()[0]
    actifs   = conn.execute("SELECT COUNT(*) FROM residents WHERE status='actif'").fetchone()[0]
    sortis   = conn.execute("SELECT COUNT(*) FROM residents WHERE status='sorti'").fetchone()[0]
    avg_prog = conn.execute('SELECT AVG(progress) FROM residents').fetchone()[0] or 0
    sessions = conn.execute("SELECT COUNT(*) FROM sessions WHERE status='realisee'").fetchone()[0]
    alerts   = conn.execute("SELECT COUNT(*) FROM alerts WHERE resolved=0").fetchone()[0]
    total_repas = conn.execute("SELECT COALESCE(SUM(repas),0) FROM sessions WHERE status='realisee'").fetchone()[0]
    conn.close()
    return jsonify({
        'success': True,
        'stats': {
            'totalResidents':    total,
            'activeResidents':   actifs,
            'dischargedCount':   sortis,
            'avgProgress':       round(avg_prog),
            'sessionsCompleted': sessions,
            'openAlerts':        alerts,
            'totalRepas':        total_repas,
            'reintegrationRate': round((sortis / total * 100) if total else 0),
        }
    })
