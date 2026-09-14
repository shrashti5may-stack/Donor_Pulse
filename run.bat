@echo off
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
start "" "http://localhost:3000"
%PYTHON_CMD% server.py
pause

