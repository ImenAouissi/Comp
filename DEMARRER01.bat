@echo off
chcp 65001 >nul
title Smart Rehab & Green Center

echo ================================================================
echo   SMART REHAB ^& GREEN CENTER — Demarrage Windows
echo ================================================================
echo.

:: ── Chemins ────────────────────────────────────────────────────────
set PROJECT_ROOT=%~dp0rehab
set BACKEND_DIR=%PROJECT_ROOT%\backend
set FRONTEND_DIR=%PROJECT_ROOT%\frontend

:: ── MySQL via XAMPP ────────────────────────────────────────────────
echo [0/3] Verification MySQL (XAMPP)...
sc query mysql >nul 2>&1
if %errorlevel% neq 0 (
    echo     MySQL pas encore demarré — tentative via XAMPP...
    start "" "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini"
    timeout /t 4 /nobreak >nul
)
echo     MySQL OK

:: ── Backend Flask ──────────────────────────────────────────────────
echo [1/3] Backend Flask...
cd /d "%BACKEND_DIR%"

if not exist "venv\Scripts\activate.bat" (
    echo     Creation du venv Python...
    python -m venv venv
)

call venv\Scripts\activate.bat

echo     Installation des dependances...
pip install --quiet flask flask-cors PyMySQL python-dotenv

echo     Seeding base de donnees...
python seed.py

echo     Backend → http://localhost:4000
start "SmartRehab Backend" cmd /k "cd /d %BACKEND_DIR% && call venv\Scripts\activate.bat && python server.py"
timeout /t 5 /nobreak >nul

:: ── Frontend React ─────────────────────────────────────────────────
echo [2/3] Frontend React...
cd /d "%FRONTEND_DIR%"

if not exist "node_modules" (
    echo     Installation npm...
    npm install
)

echo     Frontend → http://localhost:5173
start "SmartRehab Frontend" cmd /k "cd /d %FRONTEND_DIR% && npm run dev"
timeout /t 6 /nobreak >nul

:: ── Ouvre le navigateur ────────────────────────────────────────────
echo [3/3] Ouverture du navigateur...
start "" http://localhost:5173

echo.
echo ================================================================
echo   Projet lance !
echo   http://localhost:5173
echo   admin@smartrehab.tn / admin123
echo ================================================================
echo.
echo   Ferme les fenetres "SmartRehab Backend" et "SmartRehab Frontend"
echo   pour arreter le projet.
echo.
pause