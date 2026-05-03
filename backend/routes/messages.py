from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth
from datetime import datetime

messages_bp = Blueprint('messages', __name__)

# ── Schema (add to DB init) ───────────────────────────────────────────────
CREATE_MESSAGES = """
CREATE TABLE IF NOT EXISTS messages (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    from_uid    INTEGER NOT NULL REFERENCES users(id),
    to_uid      INTEGER,
    subject     TEXT    NOT NULL DEFAULT '',
    body        TEXT    NOT NULL,
    `read`        INTEGER NOT NULL DEFAULT 0,
    thread_id   INTEGER,
    created_at  TEXT    NOT NULL DEFAULT (NOW())
);
"""

def ensure_table():
    conn = get_connection()
    conn.execute(CREATE_MESSAGES)
    conn.commit()
    conn.close()

@messages_bp.get('')
@require_auth
def inbox():
    ensure_table()
    uid  = g.user['sub']
    conn = get_connection()
    rows = conn.execute("""
        SELECT m.*, u.name as from_name, u.role as from_role
        FROM messages m
        JOIN users u ON m.from_uid = u.id
        WHERE m.to_uid = %s OR m.to_uid IS NULL
        ORDER BY m.created_at DESC LIMIT 50
    """, (uid,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'count': len(rows), 'data': [dict(r) for r in rows]})

@messages_bp.get('/sent')
@require_auth
def sent():
    ensure_table()
    uid  = g.user['sub']
    conn = get_connection()
    rows = conn.execute("""
        SELECT m.*, u.name as to_name
        FROM messages m
        LEFT JOIN users u ON m.to_uid = u.id
        WHERE m.from_uid = %s
        ORDER BY m.created_at DESC LIMIT 50
    """, (uid,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})

@messages_bp.post('')
@require_auth
def send_message():
    ensure_table()
    data    = request.get_json() or {}
    body    = (data.get('body') or '').strip()
    subject = (data.get('subject') or '').strip()
    if not body:
        return jsonify({'error': 'Le message ne peut pas être vide'}), 400

    conn = get_connection()
    cur  = conn.execute("""
        INSERT INTO messages (from_uid, to_uid, subject, body)
        VALUES (%s,%s,%s,%s)
    """, (g.user['sub'], data.get('to_uid'), subject, body))

    # Create notification for recipient
    if data.get('to_uid'):
        sender_name = g.user.get('name', 'Équipe')
        conn.execute("""
            INSERT INTO notifications (title, body, type, target_uid)
            VALUES (%s,%s,%s,%s)
        """, (
            f'Message de {sender_name}',
            subject or body[:60],
            'info',
            data['to_uid'],
        ))

    conn.commit()
    row = conn.execute('SELECT * FROM messages WHERE id=%s', (cur.lastrowid,)).fetchone()
    conn.close()
    return jsonify({'success': True, 'data': dict(row)}), 201

@messages_bp.patch('/<int:mid>/read')
@require_auth
def mark_read(mid):
    ensure_table()
    conn = get_connection()
    conn.execute('UPDATE messages SET `read`=1 WHERE id=%s', (mid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})
