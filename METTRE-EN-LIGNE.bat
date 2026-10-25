@echo off
chcp 65001 >nul
title Bobby One - Mise en ligne
where node >nul 2>nul || (echo Node.js n'est pas installe. Installez la version LTS sur https://nodejs.org puis relancez. & pause & exit /b)
if not exist node_modules call npm install
echo.
echo === MISE EN LIGNE DE BOBBY ===
echo Une page web va s'ouvrir pour vous connecter a Vercel (compte gratuit).
echo Ensuite, appuyez simplement sur ENTREE a chaque question.
echo Si une question demande "Link to existing project?", tapez la lettre n puis ENTREE.
echo Pour toute autre question, appuyez sur ENTREE sans rien taper.
echo.
echo --- ETAPE 1 : connexion (suivez les instructions a l'ecran) ---
call npx --yes vercel login
echo.
echo --- ETAPE 2 : mise en ligne ---
call npx --yes vercel --prod
if errorlevel 1 (echo. & echo La mise en ligne normale a echoue, essai en mode temporaire... & call npx --yes vercel deploy --temporary)
echo.
echo Cherchez la ligne "Production:" ci-dessus : c'est votre adresse publique (https://...vercel.app).
pause
