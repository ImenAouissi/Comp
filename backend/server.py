"""
Smart Rehab & Green Center - Flask API (MySQL/XAMPP)
Run: python server.py
API: http://localhost:4000
"""
import os, sys
from flask import Flask, jsonify, request as req
from flask_cors import CORS

app = Flask(__name__)

CORS(app,
     origins=['http://localhost:5173','http://localhost:3000','http://127.0.0.1:5173'],
     supports_credentials=True,
     allow_headers=['Content-Type','Authorization','x-api-key'],
     methods=['GET','POST','PUT','PATCH','DELETE','OPTIONS'])

@app.before_request
def handle_options():
    if req.method == 'OPTIONS':
        return jsonify({'ok': True}), 200

# ── Blueprints ─────────────────────────────────────────────────────────────
from auth                 import auth_bp
from routes.residents     import residents_bp
from routes.sessions      import sessions_bp
from routes.iot           import iot_bp
from routes.other         import dashboard_bp, formations_bp, staff_bp, notifications_bp
from routes.registrations import registrations_bp
from routes.reports       import reports_bp
from routes.search        import search_bp
from routes.logs          import logs_bp
from routes.calendar      import calendar_bp
from routes.messages      import messages_bp
from routes.email_routes  import email_bp

app.register_blueprint(auth_bp,          url_prefix='/api/auth')
app.register_blueprint(residents_bp,     url_prefix='/api/residents')
app.register_blueprint(sessions_bp,      url_prefix='/api/sessions')
app.register_blueprint(iot_bp,           url_prefix='/api/iot')
app.register_blueprint(dashboard_bp,     url_prefix='/api/dashboard')
app.register_blueprint(formations_bp,    url_prefix='/api/formations')
app.register_blueprint(staff_bp,         url_prefix='/api/staff')
app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
app.register_blueprint(registrations_bp, url_prefix='/api/registrations')
app.register_blueprint(reports_bp,       url_prefix='/api/reports')
app.register_blueprint(search_bp,        url_prefix='/api/search')
app.register_blueprint(logs_bp,          url_prefix='/api/logs')
app.register_blueprint(calendar_bp,      url_prefix='/api/calendar')
app.register_blueprint(messages_bp,      url_prefix='/api/messages')
app.register_blueprint(email_bp,         url_prefix='/api/email')

@app.get('/health')
def health():
    return jsonify({'status': 'ok', 'db': 'MySQL/XAMPP', 'service': 'Smart Rehab API'})

@app.errorhandler(400)
def bad_request(e):  return jsonify({'error': str(e)}), 400
@app.errorhandler(401)
def unauthorized(e): return jsonify({'error': 'Non autorise'}), 401
@app.errorhandler(403)
def forbidden(e):    return jsonify({'error': 'Interdit'}), 403
@app.errorhandler(404)
def not_found(e):    return jsonify({'error': f'Route introuvable: {req.path}'}), 404
@app.errorhandler(405)
def method_na(e):    return jsonify({'error': 'Methode non autorisee'}), 405
@app.errorhandler(Exception)
def unhandled(e):
    import traceback; traceback.print_exc()
    return jsonify({'error': str(e)}), 500

# ── Startup ────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    from database import init_db, test_connection, get_connection

    print()
    print('=' * 55)
    print('  Smart Rehab & Green Center - API Flask')
    print('=' * 55)
    print()
    print('  Verification MySQL (XAMPP)...')

    if not test_connection():
        print()
        print('  ERREUR : MySQL non accessible !')
        print()
        print('  SOLUTION :')
        print('  1. Ouvrez XAMPP Control Panel')
        print('  2. Cliquez START sur MySQL')
        print('  3. Attendez que MySQL soit vert')
        print('  4. Relancez : python server.py')
        print()
        sys.exit(1)

    print('  MySQL OK !')
    init_db()

    # Auto-seed if empty
    try:
        conn = get_connection()
        count = conn.execute('SELECT COUNT(*) FROM users').fetchone()[0]
        conn.close()
        if count == 0:
            print('  Base vide - seeding...')
            import subprocess
            subprocess.run(
                [sys.executable, 'seed.py'],
                cwd=os.path.dirname(os.path.abspath(__file__))
            )
    except Exception as e:
        print(f'  Warning: {e}')

    port = int(os.environ.get('PORT', 4000))
    print()
    print(f'  API     : http://localhost:{port}')
    print(f'  Health  : http://localhost:{port}/health')
    print()
    print('=' * 55)
    print()
    app.run(host='0.0.0.0', port=port, debug=False, use_reloader=False)
