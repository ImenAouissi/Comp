"""
Test rapide du backend - lance avant server.py pour verifier
python test_backend.py
"""
import sys
sys.path.insert(0, '.')

print("Test 1: Import modules...")
try:
    from database import test_connection, init_db, get_connection
    print("  OK - database.py")
except Exception as e:
    print(f"  ERREUR: {e}"); sys.exit(1)

print("Test 2: Connexion MySQL...")
if not test_connection():
    print("  ERREUR: MySQL non accessible")
    print("  -> Demarrez XAMPP et activez MySQL")
    sys.exit(1)
print("  OK - MySQL connecte")

print("Test 3: Init base de donnees...")
try:
    init_db()
    print("  OK - tables creees")
except Exception as e:
    print(f"  ERREUR: {e}"); sys.exit(1)

print("Test 4: Lecture users...")
try:
    conn = get_connection()
    count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
    conn.close()
    print(f"  OK - {count} utilisateurs trouves")
    if count == 0:
        print("  ATTENTION: Base vide - lancez: python seed.py")
except Exception as e:
    print(f"  ERREUR: {e}"); sys.exit(1)

print()
print("Tous les tests OK ! Lancez: python server.py")
