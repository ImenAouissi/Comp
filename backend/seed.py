"""
Smart Rehab - Database Seeder
Run: python seed.py
Requires: XAMPP MySQL running
"""
import sys, os, hashlib, random
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def h(pw):
    return hashlib.sha256(pw.encode()).hexdigest()

def seed():
    import pymysql
    import pymysql.cursors

    # ── Connect directly to MySQL ─────────────────────────────────────────
    print("\nConnecting to MySQL (XAMPP)...")
    try:
        # First connect without database to create it
        conn = pymysql.connect(
            host='localhost', port=3306,
            user='root', password='',
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        with conn.cursor() as cur:
            cur.execute("CREATE DATABASE IF NOT EXISTS smartrehab CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci")
        conn.commit()
        conn.close()
        print("  Database 'smartrehab' ready")
    except Exception as e:
        print(f"\n  ERROR: Cannot connect to MySQL: {e}")
        print("\n  SOLUTION:")
        print("  1. Open XAMPP Control Panel")
        print("  2. Click START on MySQL")
        print("  3. Wait for green light")
        print("  4. Run: python seed.py again\n")
        sys.exit(1)

    # ── Connect to smartrehab database ────────────────────────────────────
    conn = pymysql.connect(
        host='localhost', port=3306,
        user='root', password='',
        database='smartrehab',
        charset='utf8mb4',
        cursorclass=pymysql.cursors.DictCursor
    )

    try:
        with conn.cursor() as cur:
            print("  Dropping old tables (clean start)...")
            cur.execute("SET FOREIGN_KEY_CHECKS=0")
            for t in ['messages','activity_logs','registrations','notifications',
                      'formations','alerts','biometrics','sessions','residents','users']:
                cur.execute(f"DROP TABLE IF EXISTS {t}")
            cur.execute("SET FOREIGN_KEY_CHECKS=1")

            print("  Creating tables...")

            cur.execute(
                "CREATE TABLE users ("
                "id INT AUTO_INCREMENT PRIMARY KEY,"
                "email VARCHAR(255) NOT NULL UNIQUE,"
                "password VARCHAR(255) NOT NULL,"
                "name VARCHAR(255) NOT NULL,"
                "role VARCHAR(50) NOT NULL DEFAULT 'staff',"
                "active TINYINT(1) NOT NULL DEFAULT 1,"
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE residents ("
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
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE sessions ("
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
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE biometrics ("
                "id INT AUTO_INCREMENT PRIMARY KEY,"
                "resident_id INT NOT NULL,"
                "device_id VARCHAR(50),"
                "heart_rate FLOAT, temperature FLOAT,"
                "steps INT DEFAULT 0, spo2 FLOAT,"
                "recorded_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE CASCADE"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE alerts ("
                "id INT AUTO_INCREMENT PRIMARY KEY,"
                "resident_id INT,"
                "type VARCHAR(50) NOT NULL,"
                "severity VARCHAR(20) NOT NULL DEFAULT 'medium',"
                "message TEXT NOT NULL,"
                "resolved TINYINT(1) NOT NULL DEFAULT 0,"
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "FOREIGN KEY (resident_id) REFERENCES residents(id) ON DELETE SET NULL"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE notifications ("
                "id INT AUTO_INCREMENT PRIMARY KEY,"
                "title VARCHAR(255) NOT NULL,"
                "body TEXT NOT NULL,"
                "type VARCHAR(30) NOT NULL DEFAULT 'info',"
                "target_uid INT,"
                "`read` TINYINT(1) NOT NULL DEFAULT 0,"
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE formations ("
                "id INT AUTO_INCREMENT PRIMARY KEY,"
                "titre VARCHAR(255) NOT NULL,"
                "formateur VARCHAR(100) NOT NULL,"
                "places INT NOT NULL DEFAULT 15,"
                "inscrits INT NOT NULL DEFAULT 0,"
                "statut VARCHAR(20) NOT NULL DEFAULT 'actif',"
                "debut DATE NOT NULL,"
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE registrations ("
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
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE activity_logs ("
                "id INT AUTO_INCREMENT PRIMARY KEY,"
                "user_id INT,"
                "action VARCHAR(100) NOT NULL,"
                "entity_type VARCHAR(50) NOT NULL,"
                "entity_id INT, details TEXT,"
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            cur.execute(
                "CREATE TABLE messages ("
                "id INT AUTO_INCREMENT PRIMARY KEY,"
                "from_uid INT NOT NULL,"
                "to_uid INT,"
                "subject VARCHAR(255) NOT NULL DEFAULT '',"
                "body TEXT NOT NULL,"
                "`read` TINYINT(1) NOT NULL DEFAULT 0,"
                "thread_id INT,"
                "created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,"
                "FOREIGN KEY (from_uid) REFERENCES users(id)"
                ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
            )

            conn.commit()
            print("  10 tables created")

            # ── INSERT DATA ───────────────────────────────────────────────
            print("  Inserting demo data...")

            # Users
            cur.executemany(
                "INSERT INTO users (email,password,name,role) VALUES (%s,%s,%s,%s)",
                [
                    ('admin@smartrehab.tn',    h('admin123'),   'Admin Centre',       'admin'),
                    ('khelil@smartrehab.tn',   h('medecin123'), 'Dr. Sami Khelil',    'medecin'),
                    ('trabelsi@smartrehab.tn', h('psych123'),   'Mme. Ines Trabelsi', 'psychologue'),
                    ('bouzid@smartrehab.tn',   h('form123'),    'M. Yassine Bouzid',  'formateur'),
                    ('salem@smartrehab.tn',    h('coach123'),   'Coach Maher Salem',  'coach'),
                    ('sfaxi@smartrehab.tn',    h('infirm123'),  'Mme. Fatma Sfaxi',   'infirmier'),
                ]
            )
            conn.commit()
            print("  6 users")

            # Residents
            cur.executemany(
                "INSERT INTO residents (code,prenom,nom,age,status,pilier,progress,diagnostique,objectif,notes,entree) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                [
                    ('RES-001','Ahmed',   'Bensalem',  24,'actif',   'therapie',  68,'Cannabis modere, anxiete',       'Sevrage et reinsertion','Bonne participation','2024-09-12'),
                    ('RES-002','Sarra',   'Mansouri',  21,'actif',   'formation', 45,'Alcool, instabilite pro',         'Sevrage et reinsertion','Progresse en formation','2024-10-01'),
                    ('RES-003','Youssef', 'Khelifi',   27,'actif',   'sport',     82,'Polyconsommation',                'Sevrage et reinsertion','Excellent en sport','2024-08-20'),
                    ('RES-004','Nour',    'Triki',     19,'suspendu','therapie',  30,'Cannabis severe, rupture famille','Sevrage et reinsertion','Seance manquee','2024-11-05'),
                    ('RES-005','Amine',   'Riahi',     26,'sorti',   'formation', 95,'Alcool, reinsertion',             'Sevrage et reinsertion','Reintegration reussie','2024-06-14'),
                    ('RES-006','Mariem',  'Gharbi',    23,'actif',   'ecologie',  55,'Anxiete + benzodiazepines',       'Sevrage et reinsertion','Aime jardinage','2024-12-01'),
                    ('RES-007','Khalil',  'Azizi',     31,'actif',   'therapie',  40,'Heroine, methadone',              'Sevrage et reinsertion','Methadone en cours','2025-01-03'),
                    ('RES-008','Fatma',   'Elloumi',   22,'actif',   'sport',     73,'Cannabis + sedentarite',          'Sevrage et reinsertion','Motivee pour sport','2024-11-20'),
                    ('RES-009','Sofiene', 'Ben Amara', 28,'actif',   'formation', 61,'Alcool pro, divorce',             'Sevrage et reinsertion','Formation bureautique','2024-10-15'),
                    ('RES-010','Lina',    'Hammami',   20,'actif',   'ecologie',  38,'Depression + automedication',     'Sevrage et reinsertion','Suivie par psy','2025-01-10'),
                    ('RES-011','Riadh',   'Chaabane',  35,'actif',   'therapie',  52,'Alcool chronique, hepatite C',    'Sevrage et reinsertion','Traitement en cours','2024-09-28'),
                    ('RES-012','Ines',    'Boughzala', 25,'actif',   'sport',     79,'Cannabis, anxiete',               'Sevrage et reinsertion','Bons resultats','2024-12-15'),
                ]
            )
            conn.commit()
            print("  12 residents")

            # Get resident IDs
            cur.execute("SELECT id FROM residents ORDER BY id")
            rids = [r['id'] for r in cur.fetchall()]

            # Sessions
            types  = ['individuelle','groupe','famille','sport','formation']
            prats  = ['Dr. Khelil','Mme. Trabelsi','Coach Salem','M. Bouzid','Mme. Sfaxi']
            status = ['realisee','realisee','planifiee']
            sess   = []
            for rid in rids:
                for _ in range(random.randint(4,6)):
                    d = (datetime.now() - timedelta(days=random.randint(0,60))).strftime('%Y-%m-%d')
                    sess.append((rid, random.choice(types), random.choice(prats),
                                 d, random.choice([45,60,90,120]),
                                 random.choice(status), ''))
            cur.executemany(
                "INSERT INTO sessions (resident_id,type,praticien,date,duration,status,notes) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                sess
            )
            conn.commit()
            print(f"  {len(sess)} sessions")

            # Biometrics
            bio = []
            for rid in rids:
                for h_ in range(24):
                    ts = (datetime.now()-timedelta(hours=24-h_)).strftime('%Y-%m-%d %H:%M:%S')
                    bio.append((rid, f'ESP32-{rid:03d}',
                                random.randint(60,100), round(36.1+random.random()*1.2,1),
                                random.randint(0,1200),  round(96+random.random()*3,1), ts))
            cur.executemany(
                "INSERT INTO biometrics (resident_id,device_id,heart_rate,temperature,steps,spo2,recorded_at) VALUES (%s,%s,%s,%s,%s,%s,%s)",
                bio
            )
            conn.commit()
            print(f"  {len(bio)} biometrics")

            # Alerts
            cur.executemany(
                "INSERT INTO alerts (resident_id,type,severity,message,resolved) VALUES (%s,%s,%s,%s,%s)",
                [
                    (rids[0], 'heart_rate','high',   'RES-001 Ahmed Bensalem : Rythme cardiaque eleve 138 bpm', 0),
                    (rids[6], 'heart_rate','high',   'RES-007 Khalil Azizi : Rythme cardiaque bas 42 bpm',      0),
                    (rids[9], 'inactivite','medium', 'RES-010 Lina Hammami : Inactivite detectee depuis 4h',     0),
                    (rids[3], 'absence',   'medium', 'RES-004 Nour Triki : Seance manquee sans justification',   0),
                    (rids[2], 'heart_rate','low',    'RES-003 Youssef Khelifi : Valeur normalisee',              1),
                ]
            )
            conn.commit()
            print("  5 alerts")

            # Notifications
            cur.executemany(
                "INSERT INTO notifications (title,body,type,`read`) VALUES (%s,%s,%s,%s)",
                [
                    ('Alerte IoT','RES-001 rythme cardiaque eleve','alert',   0),
                    ('Nouvelle seance','RES-003 yoga planifie demain','info',  0),
                    ('Resident admis','Dossier RES-012 cree','success',        1),
                    ('Rapport mensuel','Rapport de juin disponible','info',    1),
                ]
            )
            conn.commit()
            print("  4 notifications")

            # Formations
            cur.executemany(
                "INSERT INTO formations (titre,formateur,places,inscrits,statut,debut) VALUES (%s,%s,%s,%s,%s,%s)",
                [
                    ('Bureautique et MS Office','M. Bouzid',    15,12,'actif',    '2025-01-06'),
                    ('Design graphique Canva',  'Mme. Ghorbel', 12, 8,'actif',    '2025-01-08'),
                    ('Poterie et ceramique',    'M. Chaabane',  10,10,'actif',    '2024-12-15'),
                    ('Couture et textile',      'Mme. Sfaxi',   10, 7,'actif',    '2025-01-10'),
                    ('Entrepreneuriat social',  'M. Ben Ali',   20,14,'planifiee','2025-02-01'),
                ]
            )
            conn.commit()
            print("  5 formations")

            # Registrations
            cur.executemany(
                "INSERT INTO registrations (nom,prenom,email,telephone,age,type,role,situation,message,status) VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)",
                [
                    ('Ben Salah','Omar', 'omar.b@gmail.com',  '+21622111222',23,'resident','','Cannabis depuis 3 ans','Je veux m en sortir.','en_attente'),
                    ('Mejri',   'Nadia','nadia.m@gmail.com',  '+21655333444',20,'resident','','Dependance medicaments','Besoin aide urgent.', 'en_attente'),
                    ('Haddad',  'Karim','karim.h@gmail.com',  '+21698555666',29,'resident','','Alcool, problemes pro', 'Pret a changer.',     'en_attente'),
                    ('Gharbi',  'Fatma','fatma.g2@gmail.com', '+21622444888',25,'resident','','Benzodiazepines',       'Recommandee psy.',    'approuve'),
                ]
            )
            conn.commit()
            print("  4 registrations")

            # Activity logs
            cur.executemany(
                "INSERT INTO activity_logs (user_id,action,entity_type,entity_id,details) VALUES (%s,%s,%s,%s,%s)",
                [
                    (1,'CREATE','resident',1,'Creation dossier RES-001'),
                    (1,'CREATE','resident',2,'Creation dossier RES-002'),
                    (2,'CREATE','session', 1,'Seance individuelle RES-001'),
                    (3,'UPDATE','resident',1,'Progression RES-001 : 68%'),
                    (1,'APPROVE','registration',4,'Approbation Fatma Gharbi'),
                ]
            )
            conn.commit()
            print("  5 activity logs")

            # Get user IDs for messages
            cur.execute("SELECT id FROM users ORDER BY id")
            uids = [u['id'] for u in cur.fetchall()]

            # Messages
            cur.executemany(
                "INSERT INTO messages (from_uid,to_uid,subject,body,`read`) VALUES (%s,%s,%s,%s,%s)",
                [
                    (uids[1],uids[0],'Point hebdomadaire',    'RES-001 bonne progression.\n\nDr. Khelil',          0),
                    (uids[2],uids[0],'Demande consultation',  'RES-004 anxiete accrue.\n\nMme. Trabelsi',           0),
                    (uids[0],uids[1],'Re: Point hebdo',       'Merci, je valide.\n\nAdmin',                         1),
                    (uids[4],None,   'Rappel reunion equipe', 'Reunion vendredi 14h.\n\nCoach Salem',               0),
                ]
            )
            conn.commit()
            print("  4 messages")

        print()
        print("  ================================")
        print("  SEED DONE!")
        print("  Login: admin@smartrehab.tn")
        print("  Password: admin123")
        print("  ================================")

    except Exception as e:
        conn.rollback()
        print(f"\n  SEED ERROR: {e}")
        import traceback; traceback.print_exc()
        raise
    finally:
        conn.close()

if __name__ == '__main__':
    seed()
