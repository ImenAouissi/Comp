import hashlib, hmac, base64, json, time, urllib.request
from functools import wraps
from flask import Blueprint, request, jsonify, g
from database import get_connection

SECRET          = 'smartrehab_jwt_secret_2025'
GOOGLE_CLIENT_ID = '1056171045136-f07tenqu9192el91bqs7ns2ttagh0mc0.apps.googleusercontent.com'

auth_bp = Blueprint('auth', __name__)

# ── Pure-Python JWT ───────────────────────────────────────────────────────

def _b64encode(data):
    if isinstance(data, str):
        data = data.encode()
    return base64.urlsafe_b64encode(data).rstrip(b'=').decode()

def _b64decode(s):
    s += '=' * (4 - len(s) % 4)
    return base64.urlsafe_b64decode(s)

def make_token(user):
    header  = _b64encode(json.dumps({'alg':'HS256','typ':'JWT'}))
    payload = _b64encode(json.dumps({
        'sub':   user['id'],
        'email': user['email'],
        'role':  user['role'],
        'name':  user['name'],
        'exp':   int(time.time()) + 86400 * 7,
    }))
    msg = f'{header}.{payload}'.encode()
    sig = _b64encode(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
    return f'{header}.{payload}.{sig}'

def verify_token(token):
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        header, payload, sig = parts
        msg      = f'{header}.{payload}'.encode()
        expected = _b64encode(hmac.new(SECRET.encode(), msg, hashlib.sha256).digest())
        if not hmac.compare_digest(sig, expected):
            return None
        data = json.loads(_b64decode(payload))
        if data.get('exp', 0) < time.time():
            return None
        return data
    except Exception:
        return None

# ── Password hashing ──────────────────────────────────────────────────────

def hash_pw(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

# ── Auth middleware ───────────────────────────────────────────────────────

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        header = request.headers.get('Authorization', '')
        token  = header.replace('Bearer ', '').strip()
        if not token:
            return jsonify({'error': 'Missing token'}), 401
        payload = verify_token(token)
        if not payload:
            return jsonify({'error': 'Invalid or expired token'}), 401
        g.user = payload
        return f(*args, **kwargs)
    return decorated

def require_role(*roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not getattr(g, 'user', None):
                return jsonify({'error': 'Not authenticated'}), 401
            if g.user.get('role') not in roles:
                return jsonify({'error': 'Access denied'}), 403
            return f(*args, **kwargs)
        return decorated
    return decorator

# ── Routes ────────────────────────────────────────────────────────────────

@auth_bp.post('/login')
def login():
    data     = request.get_json() or {}
    email    = (data.get('email') or '').strip().lower()
    password = data.get('password') or ''

    if not email or not password:
        return jsonify({'error': 'Email et mot de passe requis'}), 400

    conn = get_connection()
    user = conn.execute(
        'SELECT * FROM users WHERE email=%s AND active=1', (email,)
    ).fetchone()
    conn.close()

    if not user or user['password'] != hash_pw(password):
        return jsonify({'error': 'Email ou mot de passe incorrect'}), 401

    token = make_token(user)
    return jsonify({
        'success': True,
        'token':   token,
        'user': {
            'id':    user['id'],
            'email': user['email'],
            'name':  user['name'],
            'role':  user['role'],
        }
    })


@auth_bp.post('/google')
def google_login():
    data     = request.get_json() or {}
    id_token = (data.get('credential') or '').strip()

    if not id_token:
        return jsonify({'error': 'Token Google manquant'}), 400

    # Vérification du token via API Google (100% gratuit, pas de lib externe)
    try:
        url      = f'https://oauth2.googleapis.com/tokeninfo?id_token={id_token}'
        response = urllib.request.urlopen(url, timeout=8)
        info     = json.loads(response.read())
    except urllib.error.HTTPError as e:
        return jsonify({'error': 'Token Google invalide ou expiré'}), 401
    except Exception as e:
        return jsonify({'error': f'Erreur vérification Google: {str(e)}'}), 401

    # Vérifier que le token appartient bien à notre app
    if info.get('aud') != GOOGLE_CLIENT_ID:
        return jsonify({'error': 'Client ID non autorisé'}), 401

    # Vérifier que l'email est vérifié par Google
    if info.get('email_verified') != 'true':
        return jsonify({'error': 'Email Google non vérifié'}), 401

    email = info.get('email', '').lower().strip()
    name  = info.get('name') or email.split('@')[0]

    if not email:
        return jsonify({'error': 'Email Google introuvable'}), 400

    conn = get_connection()

    # Cherche l'utilisateur existant
    user = conn.execute(
        'SELECT * FROM users WHERE email=%s AND active=1', (email,)
    ).fetchone()

    # Sinon → crée le compte automatiquement avec rôle staff
    if not user:
        conn.execute(
            'INSERT INTO users (email, name, password, role, active) VALUES (%s, %s, %s, %s, 1)',
            (email, name, hash_pw('google_oauth_' + email), 'staff')
        )
        conn.commit()
        user = conn.execute(
            'SELECT * FROM users WHERE email=%s', (email,)
        ).fetchone()

    conn.close()

    token = make_token(user)
    return jsonify({
        'success': True,
        'token':   token,
        'user': {
            'id':    user['id'],
            'email': user['email'],
            'name':  user['name'],
            'role':  user['role'],
        }
    })


@auth_bp.get('/me')
@require_auth
def me():
    conn = get_connection()
    user = conn.execute(
        'SELECT id, email, name, role FROM users WHERE id=%s',
        (g.user['sub'],)
    ).fetchone()
    conn.close()
    if not user:
        return jsonify({'error': 'User not found'}), 404
    return jsonify({'success': True, 'user': dict(user)})

@auth_bp.patch('/profile')
@require_auth
def update_profile():
    data    = request.get_json() or {}
    user_id = g.user['sub']
    updates = {}
    if data.get('name'):
        updates['name'] = data['name']
    if data.get('password'):
        if len(data['password']) < 6:
            return jsonify({'error': 'Mot de passe trop court (min 6 caractères)'}), 400
        updates['password'] = hash_pw(data['password'])
    if not updates:
        return jsonify({'error': 'Rien à modifier'}), 400

    conn       = get_connection()
    set_clause = ', '.join(f'{k}=%s' for k in updates)
    conn.execute(f'UPDATE users SET {set_clause} WHERE id=%s',
                 list(updates.values()) + [user_id])
    conn.commit()
    user = conn.execute(
        'SELECT id, email, name, role FROM users WHERE id=%s', (user_id,)
    ).fetchone()
    conn.close()
    return jsonify({'success': True, 'user': dict(user)})