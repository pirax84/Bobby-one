@echo off
chcp 65001 >nul
title Bobby One - Mise en ligne temporaire
where node >nul 2>nul || (echo Node.js n'est pas installe. Installez la version LTS sur https://nodejs.org puis relancez. & pause & exit /b)
if not exist node_modules call npm install
echo.
echo === MISE EN LIGNE TEMPORAIRE (sans connexion) ===
echo Patientez 1 a 2 minutes. Appuyez sur ENTREE si une question apparait.
echo.
call npx --yes vercel deploy --temporary
echo.
echo Copiez l'adresse https://... affichee ci-dessus et envoyez-la a Claude.
pause
