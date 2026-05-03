#!/bin/bash
echo "================================================================"
echo "SMART REHAB & GREEN CENTER — Démarrage Linux"
echo "================================================================"

PROJECT_ROOT="$HOME/comp_project2/SmartRehab_FINAL_OK/rehab"
BACKEND_DIR="$PROJECT_ROOT/backend"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# MySQL
if ! systemctl is-active --quiet mysql; then
    sudo systemctl start mysql
fi
echo "✅ MySQL actif"

# ===================== BACKEND =====================
echo "[1/3] Backend Flask..."
cd "$BACKEND_DIR"

if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate
pip install --quiet flask flask-cors PyMySQL python-dotenv

echo "Seeding database..."
python seed.py

echo "🚀 Backend → http://localhost:4000"
python server.py &
sleep 5

# ===================== FRONTEND =====================
echo "[2/3] Frontend React..."
cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    npm install
fi

echo "🚀 Frontend → http://localhost:5173"
npm run dev &
sleep 6

echo "================================================================"
echo "✅ Projet lancé !"
echo "🌐 http://localhost:5173"
echo "🔑 admin@smartrehab.tn / admin123"
echo "================================================================"

wait