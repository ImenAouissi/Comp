from flask import Blueprint, request, jsonify
from database import get_connection
from auth import require_auth

search_bp = Blueprint('search', __name__)

@search_bp.get('')
@require_auth
def global_search():
    q = (request.args.get('q') or '').strip()
    if len(q) < 2:
        return jsonify({'success': True, 'results': []})

    pattern = f'%{q}%'
    conn    = get_connection()
    results = []

    # Residents
    rows = conn.execute("""
        SELECT id, code, nom, prenom, status, pilier, progress
        FROM residents
        WHERE nom LIKE %s OR prenom LIKE %s OR code LIKE %s OR diagnostique LIKE %s
        LIMIT 8
    """, (pattern, pattern, pattern, pattern)).fetchall()
    for r in rows:
        results.append({
            'type':     'resident',
            'id':       r['id'],
            'title':    f'{r["prenom"]} {r["nom"]}',
            'subtitle': f'{r["code"]} · {r["status"]} · {r["pilier"]}',
            'meta':     f'{r["progress"]}%',
            'url':      f'/residents/{r["id"]}',
        })

    # Sessions
    rows = conn.execute("""
        SELECT s.id, s.type, s.praticien, s.date, s.status,
               r.nom, r.prenom, r.code
        FROM sessions s JOIN residents r ON s.resident_id=r.id
        WHERE s.praticien LIKE %s OR s.type LIKE %s OR r.nom LIKE %s OR r.prenom LIKE %s
        LIMIT 5
    """, (pattern, pattern, pattern, pattern)).fetchall()
    for r in rows:
        results.append({
            'type':     'session',
            'id':       r['id'],
            'title':    f'Séance {r["type"]} — {r["prenom"]} {r["nom"]}',
            'subtitle': f'{r["praticien"]} · {r["date"][:10] if r["date"] else ""}',
            'meta':     r['status'],
            'url':      '/sessions',
        })

    # Staff
    rows = conn.execute("""
        SELECT id, name, email, role FROM users
        WHERE name LIKE %s OR email LIKE %s OR role LIKE %s
        LIMIT 4
    """, (pattern, pattern, pattern)).fetchall()
    for r in rows:
        results.append({
            'type':     'staff',
            'id':       r['id'],
            'title':    r['name'],
            'subtitle': r['email'],
            'meta':     r['role'],
            'url':      '/staff',
        })

    # Formations
    rows = conn.execute("""
        SELECT id, titre, formateur, statut FROM formations
        WHERE titre LIKE %s OR formateur LIKE %s
        LIMIT 4
    """, (pattern, pattern)).fetchall()
    for r in rows:
        results.append({
            'type':     'formation',
            'id':       r['id'],
            'title':    r['titre'],
            'subtitle': f'Formateur: {r["formateur"]}',
            'meta':     r['statut'],
            'url':      '/formations',
        })

    conn.close()
    return jsonify({'success': True, 'count': len(results), 'results': results})
