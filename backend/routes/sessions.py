from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth
from datetime import datetime

sessions_bp = Blueprint('sessions', __name__)

@sessions_bp.get('')
@require_auth
def list_sessions():
    conn = get_connection()
    rid  = request.args.get('resident_id')
    if rid:
        rows = conn.execute(
            '''SELECT s.*, r.nom, r.prenom, r.code 
               FROM sessions s JOIN residents r ON s.resident_id=r.id 
               WHERE s.resident_id=%s ORDER BY s.date DESC''', (rid,)
        ).fetchall()
    else:
        rows = conn.execute(
            '''SELECT s.*, r.nom, r.prenom, r.code 
               FROM sessions s JOIN residents r ON s.resident_id=r.id 
               ORDER BY s.date DESC LIMIT 100'''
        ).fetchall()
    conn.close()
    return jsonify({'success': True, 'count': len(rows), 'data': [dict(r) for r in rows]})

@sessions_bp.get('/<int:sid>')
@require_auth
def get_session(sid):
    conn = get_connection()
    row  = conn.execute('SELECT * FROM sessions WHERE id=%s', (sid,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': 'Not found'}), 404
    return jsonify({'success': True, 'data': dict(row)})

@sessions_bp.post('')
@require_auth
def create_session():
    data = request.get_json() or {}
    for f in ['resident_id', 'type', 'praticien', 'date']:
        if not data.get(f):
            return jsonify({'error': f'{f} is required'}), 400
    conn = get_connection()
    cur  = conn.execute("""
        INSERT INTO sessions (resident_id, type, praticien, date, duration, notes, repas, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        data['resident_id'], data['type'], data['praticien'], data['date'],
        data.get('duration', 60), data.get('notes', ''),
        data.get('repas', 0),
        data.get('status', 'planifiee'),
    ))
    conn.commit()
    row = conn.execute(
        'SELECT s.*, r.nom, r.prenom, r.code FROM sessions s JOIN residents r ON s.resident_id=r.id WHERE s.id=%s',
        (cur.lastrowid,)
    ).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(row)}), 201

@sessions_bp.patch('/<int:sid>')
@require_auth
def update_session(sid):
    """Edit any field of a session."""
    data = request.get_json() or {}
    conn = get_connection()
    row  = conn.execute('SELECT id FROM sessions WHERE id=%s', (sid,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    fields  = ['type', 'praticien', 'date', 'duration', 'notes', 'repas', 'status']
    updates = {k: data[k] for k in fields if k in data}
    if not updates:
        conn.close()
        return jsonify({'error': 'No fields to update'}), 400

    set_clause = ', '.join(f'{k}=%s' for k in updates)
    conn.execute(f'UPDATE sessions SET {set_clause} WHERE id=%s', list(updates.values()) + [sid])

    # If marking as done, update resident counters
    if updates.get('status') == 'realisee':
        conn.execute("""
            UPDATE residents SET
                seances_realisees = seances_realisees + 1,
                repas_pris = repas_pris + %s,
                updated_at = %s
            WHERE id = (SELECT resident_id FROM sessions WHERE id=%s)
        """, (updates.get('repas', 0), datetime.now().strftime('%Y-%m-%d %H:%M:%S'), sid))

    conn.commit()
    updated = conn.execute(
        'SELECT s.*, r.nom, r.prenom, r.code FROM sessions s JOIN residents r ON s.resident_id=r.id WHERE s.id=%s',
        (sid,)
    ).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(updated)})

@sessions_bp.patch('/<int:sid>/complete')
@require_auth
def complete_session(sid):
    data  = request.get_json() or {}
    notes = data.get('notes', '')
    repas = int(data.get('repas', 0))
    conn  = get_connection()
    row   = conn.execute('SELECT * FROM sessions WHERE id=%s', (sid,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'Not found'}), 404

    conn.execute(
        "UPDATE sessions SET status='realisee', notes=%s, repas=%s WHERE id=%s",
        (notes, repas, sid)
    )
    # Update resident counters
    conn.execute("""
        UPDATE residents SET
            seances_realisees = seances_realisees + 1,
            repas_pris = repas_pris + %s,
            updated_at = %s
        WHERE id=%s
    """, (repas, datetime.now().strftime('%Y-%m-%d %H:%M:%S'), row['resident_id']))

    conn.commit()
    conn.close()
    return jsonify({'success': True, 'message': 'Session completed'})

@sessions_bp.delete('/<int:sid>')
@require_auth
def delete_session(sid):
    conn = get_connection()
    conn.execute('DELETE FROM sessions WHERE id=%s', (sid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})
