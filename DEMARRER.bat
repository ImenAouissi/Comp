@echo off
title Smart Rehab & Green Center - Demarrage
color 0A
cls
echo.
echo  ================================================================
echo    SMART REHAB ^& GREEN CENTER — Demarrage complet
echo  ================================================================
echo.
echo  AVANT DE CONTINUER :
echo  1. Verifiez que XAMPP est ouvert
echo  2. MySQL doit etre VERT dans XAMPP Control Panel
echo.
echo  Appuyez sur une touche quand XAMPP MySQL est pret...
pause > nul

echo.
echo  [1/3] Demarrage Backend Flask...
start "Smart Rehab Backend" cmd /k "cd /d %~dp0backend && echo Installation... && pip install flask flask-cors PyMySQL --quiet && echo Seed MySQL... && python seed.py && echo. && echo Backend pret: http://localhost:4000 && python server.py"
timeout /t 6 /nobreak > nul

echo  [2/3] Demarrage Frontend React...
start "Smart Rehab Frontend" cmd /k "cd /d %~dp0frontend && npm install && echo. && echo Frontend pret: http://localhost:5173 && npm run dev"
timeout /t 12 /nobreak > nul

echo  [3/3] Ouverture Chrome...
start chrome http://localhost:5173
echo.
echo  ================================================================
echo    URL     : http://localhost:5173
echo    Login   : admin@smartrehab.tn
echo    Password: admin123
echo  ================================================================
echo.
pause
