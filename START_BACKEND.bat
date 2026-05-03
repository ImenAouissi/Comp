@echo off
title Smart Rehab - Backend
color 0A
cd /d "%~dp0backend"
echo.
echo  Smart Rehab - Backend Flask
echo  ============================
echo.
echo  Installation des dependances...
pip install flask flask-cors PyMySQL --quiet
echo.
echo  Verification MySQL...
python test_backend.py
if errorlevel 1 (
    echo.
    echo  ERREUR: Verifiez que XAMPP MySQL est demarre !
    pause
    exit /b 1
)
echo.
echo  Demarrage API sur http://localhost:4000
echo.
python server.py
pause
