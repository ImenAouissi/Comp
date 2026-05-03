from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth
from datetime import datetime

logs_bp = Blueprint('logs', __name__)

def log_action(conn, user_id, action, entity_type, entity_id=None, details=''):
    """Call this inside any route to record an action."""
    conn.execute("""
        INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
        VALUES (%s,%s,%s,%s,%s)
    """, (user_id, action, entity_type, entity_id, details))

@logs_bp.get('')
@require_auth
def list_logs():
    limit  = int(request.args.get('limit', 50))
    offset = int(request.args.get('offset', 0))
    entity = request.args.get('entity_type', '')

    conn = get_connection()
    if entity:
        rows = conn.execute("""
            SELECT l.*, u.name as user_name, u.role as user_role
            FROM activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            WHERE l.entity_type=%s
            ORDER BY l.created_at DESC LIMIT %s OFFSET %s
        """, (entity, limit, offset)).fetchall()
        total = conn.execute(
            'SELECT COUNT(*) as n FROM activity_logs WHERE entity_type=%s', (entity,)
        ).fetchone()[0]
    else:
        rows = conn.execute("""
            SELECT l.*, u.name as user_name, u.role as user_role
            FROM activity_logs l
            LEFT JOIN users u ON l.user_id = u.id
            ORDER BY l.created_at DESC LIMIT %s OFFSET %s
        """, (limit, offset)).fetchall()
        total = conn.execute('SELECT COUNT(*) as n FROM activity_logs').fetchone()[0]

    conn.close()
    return jsonify({
        'success': True,
        'total': total,
        'count': len(rows),
        'data': [dict(r) for r in rows],
    })
