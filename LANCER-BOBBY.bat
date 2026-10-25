@echo off
chcp 65001 >nul
title Bobby One
where node >nul 2>nul || (echo Node.js n'est pas installe. Installez la version LTS sur https://nodejs.org puis relancez ce fichier. & pause & exit /b)
if not exist node_modules (echo Premiere fois : installation, patientez 2 a 3 minutes... & call npm install)
echo.
echo ===== Sur ce PC : http://localhost:3000 =====
echo Sur votre telephone (meme Wi-Fi) : http://VOTRE-IP:3000  (votre IP IPv4 est affichee ci-dessous)
ipconfig | findstr /i "IPv4"
echo.
start "" http://localhost:3000
call npm run dev:phone
pause
