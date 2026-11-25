@echo off
title DonorPulse Web Server
echo ======================================================
echo   Starting DonorPulse Web Server...
echo ======================================================
set "PYTHON_CMD=python"
where python >nul 2>nul
if %errorlevel% neq 0 (
    if exist "%LOCALAPPDATA%\Programs\Python\Python313\python.exe" (
        set "PYTHON_CMD=%LOCALAPPDATA%\Programs\Python\Python313\python.exe"
    )
)

echo.
echo ======================================================
echo   Website URL: http://localhost:3000/index.html
echo   Launching DonorPulse in your default browser...
echo ======================================================
echo.

start "" "http://localhost:3000/index.html"
%PYTHON_CMD% server.py
pause
