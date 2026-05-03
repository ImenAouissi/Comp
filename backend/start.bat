@echo off
title Smart Rehab - Backend (MySQL/XAMPP)
cd /d "%~dp0"
echo.
echo  ==============================================
echo    Smart Rehab - Backend API (MySQL/XAMPP)
echo  ==============================================
echo.
echo  IMPORTANT: Verifiez que XAMPP est demarre !
echo  Apache + MySQL doivent etre verts dans XAMPP
echo  phpMyAdmin: http://localhost/phpmyadmin
echo.
echo  Installation des dependances...
pip install flask flask-cors PyMySQL --quiet
echo.
echo  Initialisation base de donnees MySQL...
python seed.py
echo.
echo  Demarrage du serveur API...
echo  API: http://localhost:4000
echo.
python server.py
pause
