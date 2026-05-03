# 🌿 Smart Rehab & Green Center — Version Finale

## ⚡ DÉMARRAGE RAPIDE AVEC VS CODE

### Prérequis installés sur votre PC :
- ✅ [VS Code](https://code.visualstudio.com/)
- ✅ [Python 3.8+](https://python.org)
- ✅ [Node.js 18+](https://nodejs.org)
- ✅ [XAMPP](https://www.apachefriends.org) (pour MySQL)

---

## 📂 Ouvrir dans VS Code

1. Extrayez le ZIP sur le Bureau
2. Ouvrez VS Code
3. **Fichier → Ouvrir le dossier** → sélectionnez le dossier `rehab`
   — OU double-cliquez sur `SmartRehab.code-workspace`

---

## 🗄️ Étape 1 — Démarrer XAMPP (MySQL)

1. Ouvrez **XAMPP Control Panel**
2. Cliquez **START** sur **MySQL** (doit devenir vert)
3. phpMyAdmin disponible sur : http://localhost/phpmyadmin

---

## 🐍 Étape 2 — Backend (Terminal VS Code n°1)

Dans VS Code : **Terminal → Nouveau Terminal**

```bash
cd backend
pip install flask flask-cors PyMySQL
python seed.py
python server.py
```

✅ Succès : `Smart Rehab API → http://localhost:4000`

---

## ⚛️ Étape 3 — Frontend (Terminal VS Code n°2)

Dans VS Code : **Terminal → Fractionner le Terminal** (icône +)

```bash
cd frontend
npm install
npm run dev
```

✅ Succès : `Local: http://localhost:5173`

---

## 🌐 Ouvrir dans Chrome

**http://localhost:5173**

---

## 🔑 Comptes de connexion

| Email | Mot de passe | Rôle |
|---|---|---|
| admin@smartrehab.tn | admin123 | Administrateur |
| khelil@smartrehab.tn | medecin123 | Médecin |
| trabelsi@smartrehab.tn | psych123 | Psychologue |
| bouzid@smartrehab.tn | form123 | Formateur |
| salem@smartrehab.tn | coach123 | Coach |
| sfaxi@smartrehab.tn | infirm123 | Infirmier |

---

## 📧 Configuration Email Gmail (optionnel)

Modifiez `backend/config.py` :

```python
EMAIL_FROM     = 'votre@gmail.com'
EMAIL_PASSWORD = 'xxxx xxxx xxxx xxxx'  # mot de passe app Gmail
EMAIL_ADMIN    = 'admin@smartrehab.tn'
```

**Créer un mot de passe Gmail :**
1. myaccount.google.com → Sécurité
2. Vérification en 2 étapes → Activez
3. Mots de passe des applications → "SmartRehab"
4. Copiez le code 16 caractères

---

## 📁 Structure complète du projet

```
rehab/
├── SmartRehab.code-workspace  ← Ouvrir avec VS Code
├── DEMARRER.bat               ← Lancement auto Windows
├── SmartRehab_App.html        ← Site standalone (sans serveur)
├── README.md
│
├── .vscode/
│   ├── settings.json          ← Config VS Code
│   ├── launch.json            ← Debug Python Flask
│   ├── tasks.json             ← Tâches rapides
│   └── extensions.json        ← Extensions recommandées
│
├── backend/                   ← API Python Flask + MySQL
│   ├── server.py              ← Serveur Flask (port 4000)
│   ├── database.py            ← MySQL XAMPP connection
│   ├── seed.py                ← Données de démo
│   ├── auth.py                ← JWT authentification
│   ├── config.py              ← Configuration email + DB
│   ├── email_service.py       ← Service Gmail SMTP
│   ├── requirements.txt       ← flask, flask-cors, PyMySQL
│   └── routes/
│       ├── residents.py       ← CRUD résidents
│       ├── sessions.py        ← Séances thérapeutiques
│       ├── iot.py             ← Biométrie + alertes IoT
│       ├── calendar.py        ← Planning semaine
│       ├── messages.py        ← Messagerie interne
│       ├── registrations.py   ← Inscriptions + emails auto
│       ├── reports.py         ← Rapports + export CSV
│       ├── email_routes.py    ← API email (test, rapport...)
│       ├── search.py          ← Recherche globale
│       ├── logs.py            ← Journal d'activité
│       └── other.py           ← Dashboard, formations, staff
│
├── frontend/                  ← React 18 + Vite
│   ├── package.json
│   ├── vite.config.js         ← Proxy /api → port 4000
│   └── src/
│       ├── App.jsx            ← Routeur principal
│       ├── main.jsx
│       ├── pages/
│       │   ├── Login.jsx      ← Connexion + boutons SignUp/Info
│       │   ├── SignUp.jsx     ← Inscription résidents (3 étapes)
│       │   ├── Info.jsx       ← À propos + Google Maps
│       │   ├── Dashboard.jsx  ← Tableau de bord
│       │   ├── Residents.jsx  ← CRUD résidents
│       │   ├── ResidentDetail.jsx
│       │   ├── Calendar.jsx   ← Planning semaine
│       │   ├── Messages.jsx   ← Messagerie interne
│       │   ├── Reports.jsx    ← Rapports CSV
│       │   ├── Registrations.jsx ← Inscriptions + emails
│       │   ├── Profile.jsx    ← Mon profil
│       │   └── OtherPages.jsx ← Sessions, Biométrie, Alertes,
│       │                         Formations, Staff, Paramètres
│       ├── components/
│       │   ├── UI.jsx         ← Composants réutilisables
│       │   ├── Sidebar.jsx    ← Navigation latérale
│       │   ├── SearchBar.jsx
│       │   ├── NotificationBell.jsx
│       │   └── ErrorBoundary.jsx
│       ├── hooks/
│       │   └── useAuth.jsx    ← Contexte authentification
│       ├── utils/
│       │   └── api.js         ← Client API REST
│       └── styles/
│           └── global.css
│
└── esp32/
    └── firmware.ino           ← Code Arduino capteurs IoT
```

---

## 🗄️ Base de données MySQL

**Connexion :** localhost:3306 · root · (vide) · smartrehab

**Tables :**
users, residents, sessions, biometrics, alerts,
notifications, formations, registrations, messages, activity_logs

**Réinitialiser :**
```bash
cd backend
python seed.py
```

---

## 🔌 API Routes

| Route | Description |
|---|---|
| POST /api/auth/login | Connexion |
| GET /api/residents | Liste résidents |
| POST /api/residents | Créer résident |
| GET /api/sessions | Séances |
| GET /api/iot/biometrics/:id | Biométrie |
| GET /api/alerts | Alertes IoT |
| POST /api/registrations | Inscription publique |
| PATCH /api/registrations/:id/approve | Approuver |
| POST /api/email/test | Test email |
| POST /api/email/report | Rapport mensuel |
| POST /api/email/alert/:id | Alerte par email |
| GET /api/dashboard/stats | Statistiques |
| GET /api/reports/summary | Rapport complet |
| GET /api/search?q=... | Recherche globale |
| GET /health | Santé du serveur |

---

## 📧 Emails automatiques

| Événement | Email envoyé |
|---|---|
| Résident s'inscrit | Confirmation → résident |
| Inscription approuvée | Approbation → résident |
| Inscription refusée | Refus → résident |
| Bouton 📧 Alertes | Alerte IoT → tout le staff |
| Bouton Paramètres | Rapport mensuel → admin |
