from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth, require_role, hash_pw
from datetime import datetime

# ── Dashboard ──────────────────────────────────────────────────────────────
dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.get('/stats')
@require_auth
def get_stats():
    conn = get_connection()

    total    = conn.execute('SELECT COUNT(*) as n FROM residents').fetchone()[0]
    actifs   = conn.execute("SELECT COUNT(*) as n FROM residents WHERE status='actif'").fetchone()[0]
    sortis   = conn.execute("SELECT COUNT(*) as n FROM residents WHERE status='sorti'").fetchone()[0]
    avg_prog = conn.execute('SELECT ROUND(AVG(progress)) as n FROM residents').fetchone()[0] or 0
    sessions = conn.execute("SELECT COUNT(*) as n FROM sessions WHERE status='realisee'").fetchone()[0]
    alerts   = conn.execute("SELECT COUNT(*) as n FROM alerts WHERE resolved=0").fetchone()[0]

    # Sessions by type
    type_rows = conn.execute(
        "SELECT type, COUNT(*) as cnt FROM sessions GROUP BY type"
    ).fetchall()

    # Weekly data - simple count per day name
    import database as _db
    if _db._USE_SQLITE:
        weekly = conn.execute("""
            SELECT strftime('%w', date) as dow,
                   COUNT(*) as total,
                   SUM(CASE WHEN type='sport' THEN 1 ELSE 0 END) as sport
            FROM sessions WHERE status='realisee'
            GROUP BY strftime('%w', date)
        """).fetchall()
    else:
        weekly = conn.execute("""
            SELECT DAYOFWEEK(date)-1 as dow,
                   COUNT(*) as total,
                   SUM(CASE WHEN type='sport' THEN 1 ELSE 0 END) as sport
            FROM sessions WHERE status='realisee'
              AND date >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            GROUP BY DAYOFWEEK(date)
        """).fetchall()

    # Progress by pilier
    progress_trend = conn.execute("""
        SELECT pilier as week, ROUND(AVG(progress)) as avg
        FROM residents GROUP BY pilier
    """).fetchall()

    conn.close()

    days = ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam']
    weekly_data = []
    for r in weekly:
        try:
            day_idx = int(r['dow']) if r['dow'] is not None else 0
            weekly_data.append({'day': days[day_idx % 7], 'sessions': r['total'], 'sport': r['sport'] or 0})
        except: pass

    return jsonify({
        'success': True,
        'stats': {
            'totalResidents':    total,
            'activeResidents':   actifs,
            'dischargedCount':   sortis,
            'avgProgress':       int(avg_prog or 0),
            'sessionsCompleted': sessions,
            'openAlerts':        alerts,
            'reintegrationRate': round((sortis / total * 100) if total else 0),
        },
        'sessionsByType': [{'name': r.get('type','?'), 'value': r.get('cnt',0)} for r in type_rows],
        'weeklyData':     weekly_data,
        'progressTrend':  [{'week': r.get('week','?'), 'avg': r.get('avg',0)} for r in progress_trend],
    })


# ── Formations ─────────────────────────────────────────────────────────────
formations_bp = Blueprint('formations', __name__)

@formations_bp.get('')
@require_auth
def list_formations():
    conn = get_connection()
    rows = conn.execute('SELECT * FROM formations ORDER BY debut').fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@formations_bp.post('')
@require_auth
def create_formation():
    data = request.get_json() or {}
    conn = get_connection()
    cur  = conn.execute("""
        INSERT INTO formations (titre, formateur, places, inscrits, statut, debut)
        VALUES (%s,%s,%s,%s,%s,%s)
    """, (data.get('titre'), data.get('formateur'), data.get('places', 15),
          data.get('inscrits', 0), data.get('statut', 'planifiee'), data.get('debut')))
    conn.commit()
    row = conn.execute('SELECT * FROM formations WHERE id=%s', (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(row)}), 201

@formations_bp.patch('/<int:fid>')
@require_auth
def update_formation(fid):
    data = request.get_json() or {}
    conn = get_connection()
    fields = ['titre','formateur','places','inscrits','statut','debut']
    updates = {k: data[k] for k in fields if k in data}
    if updates:
        set_clause = ', '.join(f'{k}=%s' for k in updates)
        conn.execute(f'UPDATE formations SET {set_clause} WHERE id=%s', list(updates.values()) + [fid])
        conn.commit()
    row = conn.execute('SELECT * FROM formations WHERE id=%s', (fid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(row)})


# ── Staff ──────────────────────────────────────────────────────────────────
staff_bp = Blueprint('staff', __name__)

@staff_bp.get('')
@require_auth
def list_staff():
    conn = get_connection()
    rows = conn.execute('SELECT id, email, name, role, active, created_at FROM users ORDER BY role').fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@staff_bp.post('')
@require_auth
@require_role('admin')
def create_staff():
    data = request.get_json() or {}
    for f in ['email', 'password', 'name', 'role']:
        if not data.get(f):
            return jsonify({'error': f'{f} is required'}), 400
    conn = get_connection()
    try:
        cur = conn.execute(
            'INSERT INTO users (email, password, name, role) VALUES (%s,%s,%s,%s)',
            (data['email'].lower(), hash_pw(data['password']), data['name'], data['role'])
        )
        conn.commit()
        row = conn.execute('SELECT id, email, name, role, active FROM users WHERE id=%s', (cur.lastrowid,)).fetchone()
        conn.close()
        return jsonify({'success': True, 'data': dict(row)}), 201
    except Exception as e:
        conn.close()
        return jsonify({'error': str(e)}), 400

@staff_bp.patch('/<int:uid>/deactivate')
@require_auth
@require_role('admin')
def deactivate_staff(uid):
    conn = get_connection()
    conn.execute('UPDATE users SET active=0 WHERE id=%s', (uid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@staff_bp.patch('/<int:uid>/password')
@require_auth
def change_password(uid):
    # Users can change their own password; admin can change any
    if g.user['sub'] != uid and g.user.get('role') != 'admin':
        return jsonify({'error': 'Forbidden'}), 403
    data = request.get_json() or {}
    new_pw = data.get('password', '')
    if len(new_pw) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    conn = get_connection()
    conn.execute('UPDATE users SET password=%s WHERE id=%s', (hash_pw(new_pw), uid))
    conn.commit()
    conn.close()
    return jsonify({'success': True})


# ── Notifications ──────────────────────────────────────────────────────────
notifications_bp = Blueprint('notifications', __name__)

@notifications_bp.get('')
@require_auth
def list_notifications():
    conn = get_connection()
    rows = conn.execute("""
        SELECT * FROM notifications
        WHERE target_uid IS NULL OR target_uid=%s
        ORDER BY created_at DESC
        LIMIT 30
    """, (g.user['sub'],)).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@notifications_bp.post('')
@require_auth
def create_notification():
    data = request.get_json() or {}
    conn = get_connection()
    cur  = conn.execute(
        'INSERT INTO notifications (title, body, type, target_uid) VALUES (%s,%s,%s,%s)',
        (data.get('title'), data.get('body'), data.get('type', 'info'), data.get('target_uid'))
    )
    conn.commit()
    row = conn.execute('SELECT * FROM notifications WHERE id=%s', (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(row)}), 201

@notifications_bp.patch('/<int:nid>/read')
@require_auth
def mark_read(nid):
    conn = get_connection()
    conn.execute('UPDATE notifications SET `read`=1 WHERE id=%s', (nid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})

@notifications_bp.patch('/read-all')
@require_auth
def mark_all_read():
    conn = get_connection()
    conn.execute(
        'UPDATE notifications SET `read`=1 WHERE target_uid IS NULL OR target_uid=%s',
        (g.user['sub'],)
    )
    conn.commit()
    conn.close()
    return jsonify({'success': True})
