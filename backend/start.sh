#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "🌿 Smart Rehab & Green Center — Backend"
echo "======================================="
pip install flask flask-cors --quiet 2>/dev/null || pip install flask flask-cors --quiet --break-system-packages 2>/dev/null
if [ ! -f "rehab.db" ]; then
    echo "📦 First run — seeding database..."
    python3 seed.py
fi
echo "🚀 API: http://localhost:4000"
echo ""
python3 server.py
