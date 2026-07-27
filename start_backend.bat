@echo off
title Aiva-Agentic-browser - Backend Server
color 0A

echo.
echo ============================================================
echo   Aiva-Agentic-browser - Backend Server
echo ============================================================
echo.

cd /d "%~dp0backend"
if not exist "server.py" (
    echo ERROR: server.py not found!
    echo Make sure this file is in the project root directory.
    echo.
    pause
    exit /b 1
)

echo Checking Python installation...
python --version >nul 2>&1
if errorlevel 1 (
    echo.
    echo [ERROR] Python not found!
    echo.
    echo Please install Python 3.8+ from https://www.python.org/downloads/
    echo Make sure to check "Add Python to PATH" during installation.
    echo.
    pause
    exit /b 1
)

python --version
echo [OK] Python found!

echo.
echo Checking critical dependencies...
python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] FastAPI not found. Installing dependencies...
    echo.
    pip install -r requirements.txt
    echo.
)

python -c "import uvicorn" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Uvicorn not found. Installing dependencies...
    echo.
    pip install -r requirements.txt
    echo.
)

python -c "import cv2" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] OpenCV not found. Installing dependencies...
    echo.
    pip install -r requirements.txt
    echo.
)

python -c "import mediapipe" >nul 2>&1
if errorlevel 1 (
    echo [WARNING] MediaPipe not found. Installing dependencies...
    echo.
    pip install -r requirements.txt
    echo.
)

echo.
echo ============================================================
echo   Starting Backend Server
echo ============================================================
echo   Server will run on: http://localhost:5000
echo   Keep this window open while using the app!
echo ============================================================
echo.
echo Press CTRL+C to stop the server
echo.

python server.py

if errorlevel 1 (
    echo.
    echo.
    echo ============================================================
    echo   ERROR: Server failed to start
    echo ============================================================
    echo   Check the error messages above for details.
    echo.
    echo   Common issues:
    echo   1. Port 5000 already in use - close other apps using it
    echo   2. Missing dependencies - run: pip install -r requirements.txt
    echo   3. Python version too old - need Python 3.8 or higher
    echo.
    pause
)
