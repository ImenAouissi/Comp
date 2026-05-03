from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth, require_role, hash_pw
from datetime import datetime

registrations_bp = Blueprint('registrations', __name__)

# ── Public endpoint — NO auth required ────────────────────────────────────
@registrations_bp.post('')
def submit_registration():
    """
    Public form: anyone can submit.
    type = 'resident'  → future resident (addicted person)
    type = 'staff'     → job applicant (medecin, coach, etc.)
    """
    data = request.get_json() or {}

    nom    = (data.get('nom') or '').strip()
    prenom = (data.get('prenom') or '').strip()
    email  = (data.get('email') or '').strip().lower()
    reg_type = data.get('type', 'resident')  # 'resident' or 'staff'

    if not nom or not prenom or not email:
        return jsonify({'error': 'Nom, prénom et email sont requis'}), 400

    if reg_type not in ('resident', 'staff'):
        return jsonify({'error': 'type must be resident or staff'}), 400

    conn = get_connection()

    # Check for duplicate email in registrations
    existing = conn.execute(
        "SELECT id FROM registrations WHERE email=%s AND status='en_attente'",
        (email,)
    ).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'Une demande avec cet email est déjà en cours de traitement'}), 409

    cur = conn.execute("""
        INSERT INTO registrations
            (nom, prenom, email, telephone, age, type, role, situation, message, status)
        VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
    """, (
        nom, prenom, email,
        data.get('telephone', ''),
        data.get('age'),
        reg_type,
        data.get('role', ''),        # for staff: their desired role
        data.get('situation', ''),   # for resident: brief description
        data.get('message', ''),
        'en_attente',
    ))

    reg_id = cur.lastrowid

    # Auto-notify admin
    conn.execute("""
        INSERT INTO notifications (title, body, type)
        VALUES (%s,%s,%s)
    """, (
        f'Nouvelle demande — {prenom} {nom}',
        f'{"Demande de résident" if reg_type == "resident" else "Candidature staff"} : {prenom} {nom} ({email})',
        'info',
    ))

    conn.commit()
    conn.close()

    # Auto-send confirmation email to the applicant
    try:
        from email_service import send_inscription_confirmation
        situation = data.get('situation') or data.get('role') or ''
        urgent    = '[URGENT]' in (data.get('message') or '')
        send_inscription_confirmation(
            prenom    = prenom,
            nom       = nom,
            email     = email,
            situation = situation,
            urgent    = urgent,
        )
    except Exception as e:
        print(f"[EMAIL] Could not send confirmation: {e}")

    return jsonify({
        'success': True,
        'message': 'Votre demande a été enregistrée. L\'équipe vous contactera sous 48h.',
        'id': reg_id,
    }), 201


# ── Staff endpoints — require auth ─────────────────────────────────────────
@registrations_bp.get('')
@require_auth
def list_registrations():
    status = request.args.get('status', 'all')
    conn   = get_connection()
    if status == 'all':
        rows = conn.execute(
            'SELECT * FROM registrations ORDER BY created_at DESC'
        ).fetchall()
    else:
        rows = conn.execute(
            'SELECT * FROM registrations WHERE status=%s ORDER BY created_at DESC',
            (status,)
        ).fetchall()
    conn.close()
    return jsonify({'success': True, 'count': len(rows), 'data': [dict(r) for r in rows]})


@registrations_bp.patch('/<int:rid>/approve')
@require_auth
@require_role('admin', 'medecin')
def approve(rid):
    """
    Approve a registration:
    - type=resident → create a resident record
    - type=staff    → create a user account
    """
    data = request.get_json() or {}
    conn = get_connection()

    reg = conn.execute('SELECT * FROM registrations WHERE id=%s', (rid,)).fetchone()
    if not reg:
        conn.close()
        return jsonify({'error': 'Demande introuvable'}), 404

    if reg['status'] != 'en_attente':
        conn.close()
        return jsonify({'error': f'Demande déjà traitée ({reg["status"]})'}), 400

    created_id = None

    if reg['type'] == 'resident':
        # Count existing residents to auto-generate code
        count = conn.execute('SELECT COUNT(*) FROM residents').fetchone()[0]
        code  = f'RES-{str(count + 1).zfill(3)}'
        cur   = conn.execute("""
            INSERT INTO residents
                (code, nom, prenom, age, telephone, status, pilier, progress,
                 diagnostique, objectif, notes, entree)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
        """, (
            code,
            reg['nom'], reg['prenom'],
            reg['age'], reg['telephone'],
            'actif',
            data.get('pilier', 'therapie'),
            0,
            reg['situation'] or '',
            data.get('objectif', 'Sevrage et réinsertion'),
            f'Admission le {datetime.now().strftime("%d/%m/%Y")}. {reg["message"] or ""}',
            datetime.now().strftime('%Y-%m-%d'),
        ))
        created_id = cur.lastrowid

        # Notify
        conn.execute("""
            INSERT INTO notifications (title, body, type)
            VALUES (%s,%s,%s)
        """, (
            f'Résident admis — {reg["prenom"]} {reg["nom"]}',
            f'Dossier {code} créé avec succès.',
            'success',
        ))

    elif reg['type'] == 'staff':
        role = data.get('role') or reg['role'] or 'coach'
        temp_password = data.get('password', 'Rehab2025!')

        # Check email not already used
        existing = conn.execute(
            'SELECT id FROM users WHERE email=%s', (reg['email'],)
        ).fetchone()

        if existing:
            conn.close()
            return jsonify({'error': 'Cet email est déjà utilisé dans le système'}), 409

        cur = conn.execute("""
            INSERT INTO users (email, password, name, role, active)
            VALUES (%s,%s,%s,%s,%s)
        """, (
            reg['email'],
            hash_pw(temp_password),
            f'{reg["prenom"]} {reg["nom"]}',
            role,
            1,
        ))
        created_id = cur.lastrowid

        # Notify
        conn.execute("""
            INSERT INTO notifications (title, body, type)
            VALUES (%s,%s,%s)
        """, (
            f'Nouveau compte créé — {reg["prenom"]} {reg["nom"]}',
            f'Compte {role} créé. Email: {reg["email"]} / MDP provisoire: {temp_password}',
            'success',
        ))

    # Mark registration as approved
    conn.execute("""
        UPDATE registrations
        SET status='approuve', reviewed_by=%s, reviewed_at=%s
        WHERE id=%s
    """, (g.user['sub'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), rid))

    conn.commit()
    conn.close()

    # Auto-send approval email
    try:
        from email_service import send_inscription_approved
        send_inscription_approved(
            prenom        = reg['prenom'],
            nom           = reg['nom'],
            email         = reg['email'],
            code_resident = f"RES-{str(created_id).zfill(3)}" if created_id else None,
        )
    except Exception as e:
        print(f"[EMAIL] Could not send approval: {e}")

    return jsonify({
        'success':    True,
        'message':    'Demande approuvée',
        'created_id': created_id,
    })


@registrations_bp.patch('/<int:rid>/reject')
@require_auth
@require_role('admin', 'medecin')
def reject(rid):
    conn = get_connection()
    reg  = conn.execute('SELECT * FROM registrations WHERE id=%s', (rid,)).fetchone()
    if not reg:
        conn.close()
        return jsonify({'error': 'Demande introuvable'}), 404

    conn.execute("""
        UPDATE registrations
        SET status='refuse', reviewed_by=%s, reviewed_at=%s
        WHERE id=%s
    """, (g.user['sub'], datetime.now().strftime('%Y-%m-%d %H:%M:%S'), rid))

    conn.execute("""
        INSERT INTO notifications (title, body, type)
        VALUES (%s,%s,%s)
    """, (
        f'Demande refusée — {reg["prenom"]} {reg["nom"]}',
        f'La demande de {reg["prenom"]} {reg["nom"]} a été refusée.',
        'warning',
    ))

    conn.commit()
    conn.close()

    # Auto-send refusal email
    try:
        from email_service import send_inscription_refused
        raison = (request.get_json() or {}).get('raison', '')
        send_inscription_refused(
            prenom = reg['prenom'],
            nom    = reg['nom'],
            email  = reg['email'],
            raison = raison,
        )
    except Exception as e:
        print(f"[EMAIL] Could not send refusal: {e}")

    return jsonify({'success': True, 'message': 'Demande refusée'})


@registrations_bp.delete('/<int:rid>')
@require_auth
@require_role('admin')
def delete_registration(rid):
    conn = get_connection()
    conn.execute('DELETE FROM registrations WHERE id=%s', (rid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})
