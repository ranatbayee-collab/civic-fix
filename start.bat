@echo off
title AI CivicFix - Full-Stack Launcher
echo ========================================================
echo  AI CivicFix - Starting Full-Stack Application
echo ========================================================
echo.
echo Launching Backend (Port 5000) and Frontend (Port 3000)...
echo.
cd /d "%~dp0"
node run-all.js
pause
