"""
Smart Rehab & Green Center — Configuration
==========================================
MODIFIER CE FICHIER avec vos vraies informations Gmail.

Comment obtenir un mot de passe application Gmail :
  1. Allez sur https://myaccount.google.com
  2. Sécurité → Vérification en 2 étapes → Activez
  3. Sécurité → Mots de passe des applications
  4. Sélectionnez "Autre (nom personnalisé)" → "SmartRehab"
  5. Copiez le code 16 caractères (ex: abcd efgh ijkl mnop)
  6. Collez-le dans EMAIL_PASSWORD ci-dessous (sans espaces)
"""

import os

# ── Email Gmail ────────────────────────────────────────────────────────────
# Remplacez ces valeurs par vos vraies informations :
EMAIL_FROM     = os.environ.get('EMAIL_FROM',     'votre_email@gmail.com')
EMAIL_PASSWORD = os.environ.get('EMAIL_PASSWORD', '')   # ← copiez ici le mot de passe app Gmail
EMAIL_ADMIN    = os.environ.get('EMAIL_ADMIN',    'admin@smartrehab.tn')

# ── MySQL XAMPP ────────────────────────────────────────────────────────────
DB_HOST     = os.environ.get('DB_HOST', 'localhost')
DB_PORT     = int(os.environ.get('DB_PORT', '3306'))
DB_USER     = os.environ.get('DB_USER',     'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', 'root')  # ← change '' par 'root'
DB_NAME     = os.environ.get('DB_NAME',     'smartrehab')

# ── JWT ────────────────────────────────────────────────────────────────────
JWT_SECRET = os.environ.get('JWT_SECRET', 'smartrehab_secret_key_2025_change_in_prod')
JWT_EXPIRY = 24  # heures

# ── Centre ─────────────────────────────────────────────────────────────────
CENTRE_NAME    = 'Smart Rehab & Green Center'
CENTRE_PHONE   = '+216 71 XXX XXX'
CENTRE_ADDRESS = 'Tunis, Tunisie'
CENTRE_URL     = 'http://localhost:5173'
