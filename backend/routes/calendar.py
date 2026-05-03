from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth
from datetime import datetime, timedelta

calendar_bp = Blueprint('calendar', __name__)

@calendar_bp.get('/week')
@require_auth
def week_view():
    """Return sessions for a given week (default = current week)."""
    # Accept ?date=YYYY-MM-DD  (any day in target week)
    date_str = request.args.get('date', datetime.now().strftime('%Y-%m-%d'))
    try:
        base = datetime.strptime(date_str, '%Y-%m-%d')
    except ValueError:
        base = datetime.now()

    # Monday of that week
    monday = base - timedelta(days=base.weekday())
    sunday = monday + timedelta(days=6)

    mon_str = monday.strftime('%Y-%m-%d')
    sun_str = sunday.strftime('%Y-%m-%d')

    conn = get_connection()
    rows = conn.execute("""
        SELECT s.id, s.type, s.praticien, s.date, s.duration, s.status, s.notes,
               r.id as resident_id, r.nom, r.prenom, r.code
        FROM sessions s
        JOIN residents r ON s.resident_id = r.id
        WHERE s.date >= %s AND s.date <= %s
        ORDER BY s.date, s.praticien
    """, (mon_str, sun_str)).fetchall()
    conn.close()

    # Group by day
    days = {}
    for i in range(7):
        day = (monday + timedelta(days=i)).strftime('%Y-%m-%d')
        days[day] = []

    for r in rows:
        day_key = r['date'][:10] if r['date'] else ''
        if day_key in days:
            days[day_key].append(dict(r))

    return jsonify({
        'success': True,
        'week_start': mon_str,
        'week_end':   sun_str,
        'days': [
            {
                'date':     d,
                'label':    datetime.strptime(d, '%Y-%m-%d').strftime('%A %d/%m'),
                'sessions': sessions,
                'count':    len(sessions),
            }
            for d, sessions in days.items()
        ]
    })


@calendar_bp.get('/upcoming')
@require_auth
def upcoming():
    """Next 10 planned sessions from today."""
    today = datetime.now().strftime('%Y-%m-%d')
    conn  = get_connection()
    rows  = conn.execute("""
        SELECT s.id, s.type, s.praticien, s.date, s.duration, s.status,
               r.nom, r.prenom, r.code
        FROM sessions s
        JOIN residents r ON s.resident_id = r.id
        WHERE s.status = 'planifiee' AND s.date >= %s
        ORDER BY s.date LIMIT 10
    """, (today,)).fetchall()
    conn.close()
    return jsonify({'success': True, 'data': [dict(r) for r in rows]})
