"""
Smart Rehab & Green Center - Database Layer
MySQL (XAMPP) avec fallback SQLite automatique
"""
import os, pymysql, pymysql.cursors

DB_CONFIG = {
    'host': 'localhost', 'port': 3306,
    'user': 'root',      'password': '',
    'database':    'smartrehab',
    'charset':     'utf8mb4',
    'cursorclass': pymysql.cursors.DictCursor,
    'autocommit':  False,
}
_USE_SQLITE = False

# ── TABLE SQL — single-line strings, no triple-quote newline issues ────────
TABLES_SQL = [
    ("CREATE TABLE IF NOT EXISTS users ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "email VARCHAR(255) NOT NULL UNIQUE,"
     "password VARCHAR(255) NOT NULL,"
     "name VARCHAR(255) NOT NULL,"
     "role VARCHAR(50) NOT NULL DEFAULT 'staff',"
     "active TINYINT(1) NOT NULL DEFAULT 1,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS residents ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "code VARCHAR(20) NOT NULL UNIQUE,"
     "nom VARCHAR(100) NOT NULL,"
     "prenom VARCHAR(100) NOT NULL DEFAULT '',"
     "age INT, telephone VARCHAR(30),"
     "status VARCHAR(20) NOT NULL DEFAULT 'actif',"
     "pilier VARCHAR(30) NOT NULL DEFAULT 'therapie',"
     "progress INT NOT NULL DEFAULT 0,"
     "diagnostique TEXT, objectif TEXT, notes TEXT, entree DATE,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     "updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS sessions ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "resident_id INT NOT NULL,"
     "type VARCHAR(50) NOT NULL,"
     "praticien VARCHAR(100) NOT NULL,"
     "date DATE NOT NULL,"
     "duration INT NOT NULL DEFAULT 60,"
     "notes TEXT,"
     "status VARCHAR(20) NOT NULL DEFAULT 'planifiee',"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     "FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS biometrics ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "resident_id INT NOT NULL,"
     "device_id VARCHAR(50),"
     "heart_rate FLOAT, temperature FLOAT,"
     "steps INT DEFAULT 0, spo2 FLOAT,"
     "recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     "FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS alerts ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "resident_id INT,"
     "type VARCHAR(50) NOT NULL,"
     "severity VARCHAR(20) NOT NULL DEFAULT 'medium',"
     "message TEXT NOT NULL,"
     "resolved TINYINT(1) NOT NULL DEFAULT 0,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     "FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS notifications ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "title VARCHAR(255) NOT NULL,"
     "body TEXT NOT NULL,"
     "type VARCHAR(30) NOT NULL DEFAULT 'info',"
     "target_uid INT,"
     "`read` TINYINT(1) NOT NULL DEFAULT 0,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS formations ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "titre VARCHAR(255) NOT NULL,"
     "formateur VARCHAR(100) NOT NULL,"
     "places INT NOT NULL DEFAULT 15,"
     "inscrits INT NOT NULL DEFAULT 0,"
     "statut VARCHAR(20) NOT NULL DEFAULT 'actif',"
     "debut DATE NOT NULL,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS registrations ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "nom VARCHAR(100) NOT NULL,"
     "prenom VARCHAR(100) NOT NULL,"
     "email VARCHAR(255) NOT NULL,"
     "telephone VARCHAR(30), age INT,"
     "type VARCHAR(20) NOT NULL DEFAULT 'resident',"
     "role VARCHAR(50), situation TEXT, message TEXT,"
     "status VARCHAR(20) NOT NULL DEFAULT 'en_attente',"
     "reviewed_by INT,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     "reviewed_at DATETIME"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS activity_logs ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "user_id INT,"
     "action VARCHAR(100) NOT NULL,"
     "entity_type VARCHAR(50) NOT NULL,"
     "entity_id INT, details TEXT,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),

    ("CREATE TABLE IF NOT EXISTS messages ("
     "id INT AUTO_INCREMENT PRIMARY KEY,"
     "from_uid INT NOT NULL,"
     "to_uid INT,"
     "subject VARCHAR(255) NOT NULL DEFAULT '',"
     "body TEXT NOT NULL,"
     "`read` TINYINT(1) NOT NULL DEFAULT 0,"
     "thread_id INT,"
     "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
     "FOREIGN KEY (from_uid) REFERENCES users(id)"
     ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"),
]

# ── TEST / INIT ────────────────────────────────────────────────────────────
def test_connection():
    try:
        cfg = {k:v for k,v in DB_CONFIG.items() if k != 'database'}
        c = pymysql.connect(**cfg); c.close(); return True
    except: return False

def init_db():
    global _USE_SQLITE
    if _USE_SQLITE: _init_sqlite(); return
    try:
        cfg = {k:v for k,v in DB_CONFIG.items() if k != 'database'}
        c = pymysql.connect(**cfg)
        with c.cursor() as cur:
            cur.execute("CREATE DATABASE IF NOT EXISTS `smartrehab` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        c.commit(); c.close()
        c2 = pymysql.connect(**DB_CONFIG)
        with c2.cursor() as cur:
            for sql in TABLES_SQL:
                try: cur.execute(sql)
                except Exception as e: print(f"  Table warning: {e}")
        c2.commit(); c2.close()
        print("  MySQL DB smartrehab ready")
    except Exception as e:
        print(f"  MySQL init failed: {e} — using SQLite")
        _USE_SQLITE = True; _init_sqlite()

def _init_sqlite():
    import sqlite3, re
    db = os.path.join(os.path.dirname(__file__), 'rehab.db')
    c = sqlite3.connect(db); c.row_factory = sqlite3.Row
    for sql in TABLES_SQL:
        sq = (sql
            .replace('INT AUTO_INCREMENT PRIMARY KEY', 'INTEGER PRIMARY KEY AUTOINCREMENT')
            .replace('AUTO_INCREMENT','')
            .replace('ENGINE=InnoDB DEFAULT CHARSET=utf8mb4','')
            .replace('TINYINT(1)','INTEGER')
            .replace('`read`','"read"')
            .replace('ON UPDATE CURRENT_TIMESTAMP',''))
        sq = re.sub(r',FOREIGN KEY[^)]+\)', '', sq)
        try: c.execute(sq)
        except: pass
    c.commit(); c.close()
    print(f"  SQLite DB ready: {db}")

# ── ROW WRAPPER ────────────────────────────────────────────────────────────
class MySQLRow:
    def __init__(self, d): self._d = d or {}
    def __getitem__(self, k):
        if isinstance(k, int): return list(self._d.values())[k]
        return self._d[k]
    def __contains__(self, k): return k in self._d
    def __iter__(self): return iter(self._d.values())
    def keys(self): return self._d.keys()
    def get(self, k, d=None): return self._d.get(k, d)
    def items(self): return self._d.items()

class MySQLCursor:
    def __init__(self, cur): self._cur = cur
    @property
    def lastrowid(self): return self._cur.lastrowid
    @property
    def rowcount(self): return self._cur.rowcount
    def fetchone(self):
        r = self._cur.fetchone()
        return MySQLRow(r) if isinstance(r, dict) else r
    def fetchall(self):
        rows = self._cur.fetchall()
        return [MySQLRow(r) for r in rows] if rows and isinstance(rows[0], dict) else rows
    def __iter__(self): return iter(self.fetchall())

class DBConnection:
    def __init__(self, conn, is_sqlite=False):
        self._conn = conn; self._sqlite = is_sqlite
        self._cur  = conn.cursor()
    def execute(self, sql, params=None):
        if self._sqlite: sql = sql.replace('%s', '?')
        if params: self._cur.execute(sql, params)
        else:      self._cur.execute(sql)
        return MySQLCursor(self._cur)
    def executemany(self, sql, data):
        if self._sqlite: sql = sql.replace('%s', '?')
        self._cur.executemany(sql, data)
        return MySQLCursor(self._cur)
    def commit(self):   self._conn.commit()
    def rollback(self): self._conn.rollback()
    def close(self):
        try: self._cur.close()
        except: pass
        try: self._conn.close()
        except: pass
    def __enter__(self): return self
    def __exit__(self, *a): self.close()

def get_connection():
    global _USE_SQLITE
    if _USE_SQLITE:
        import sqlite3
        db = os.path.join(os.path.dirname(__file__), 'rehab.db')
        c = sqlite3.connect(db); c.row_factory = sqlite3.Row
        c.execute("PRAGMA foreign_keys = ON")
        return DBConnection(c, is_sqlite=True)
    try:
        return DBConnection(pymysql.connect(**DB_CONFIG), is_sqlite=False)
    except Exception as e:
        print(f"[DB] MySQL failed ({e}), using SQLite")
        _USE_SQLITE = True; return get_connection()
