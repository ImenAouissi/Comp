from flask import Blueprint, request, jsonify, g
from database import get_connection
from auth import require_auth
from datetime import datetime

iot_bp = Blueprint('iot', __name__)

IOT_API_KEY = 'iot_secret_key_esp32_2025'  # matches ESP32 firmware

@iot_bp.post('/ingest')
def ingest():
    """Receive data from ESP32 sensors — uses API key, not JWT."""
    api_key = request.headers.get('x-api-key', '')
    if api_key != IOT_API_KEY:
        return jsonify({'error': 'Invalid IoT API key'}), 401

    data = request.get_json() or {}
    resident_id = data.get('resident_id')
    if not resident_id:
        return jsonify({'error': 'resident_id required'}), 400

    conn = get_connection()
    conn.execute("""
        INSERT INTO biometrics (resident_id, device_id, heart_rate, temperature, steps, spo2, recorded_at)
        VALUES (%s,%s,%s,%s,%s,%s,%s)
    """, (
        resident_id,
        data.get('device_id', 'unknown'),
        data.get('heart_rate'),
        data.get('temperature'),
        data.get('steps', 0),
        data.get('spo2'),
        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
    ))

    # Auto-create alert if heart rate is abnormal
    hr = data.get('heart_rate')
    if hr and (hr > 130 or hr < 45):
        severity = 'high'
        msg = f'Rythme cardiaque anormal: {hr} bpm'
        # Check no duplicate open alert in last 30 min
        existing = conn.execute("""
            SELECT id FROM alerts
            WHERE resident_id=%s AND type='heart_rate' AND resolved=0
            AND datetime(created_at) > datetime('now','-30 minutes')
        """, (resident_id,)).fetchone()
        if not existing:
            conn.execute("""
                INSERT INTO alerts (resident_id, type, severity, message)
                VALUES (%s,%s,%s,%s)
            """, (resident_id, 'heart_rate', severity, msg))

    conn.commit()
    conn.close()
    return jsonify({'success': True}), 201

@iot_bp.get('/biometrics/<int:resident_id>')
@require_auth
def get_biometrics(resident_id):
    hours = int(request.args.get('hours', 24))
    conn  = get_connection()
    rows  = conn.execute("""
        SELECT * FROM biometrics
        WHERE resident_id=%s
        AND datetime(recorded_at) > datetime('now', %s || ' hours')
        ORDER BY recorded_at ASC
    """, (resident_id, f'-{hours}')).fetchall()
    conn.close()
    return jsonify({'success': True, 'count': len(rows), 'data': [dict(r) for r in rows]})

@iot_bp.get('/alerts')
@require_auth
def get_alerts():
    conn = get_connection()
    rows = conn.execute("""
        SELECT a.*, r.code, r.nom, r.prenom
        FROM alerts a
        LEFT JOIN residents r ON a.resident_id = r.id
        ORDER BY a.created_at DESC
        LIMIT 50
    """).fetchall()
    conn.close()
    return jsonify({'success': True, 'count': len(rows), 'data': [dict(r) for r in rows]})

@iot_bp.patch('/alerts/<int:aid>/resolve')
@require_auth
def resolve_alert(aid):
    conn = get_connection()
    conn.execute("UPDATE alerts SET resolved=1 WHERE id=%s", (aid,))
    conn.commit()
    conn.close()
    return jsonify({'success': True})
