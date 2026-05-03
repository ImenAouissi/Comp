@echo off
title Smart Rehab - Frontend
color 0B
cd /d "%~dp0frontend"
echo.
echo  Smart Rehab - Frontend React
echo  ==============================
echo.
echo  Installation des modules npm...
npm install
echo.
echo  Demarrage sur http://localhost:5173
echo.
npm run dev
pause
