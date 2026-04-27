@echo off
REM ═══════════════════════════════════════════════════════════
REM E-COM Quick Start Script
REM ═══════════════════════════════════════════════════════════

echo.
echo ✅ E-Com MongoDB Setup
echo ═══════════════════════════════════════════════════════════
echo.

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ npm not found! Please install Node.js from nodejs.org
    pause
    exit /b 1
)

echo ✅ npm found
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    echo.
) else (
    echo ✅ Dependencies already installed
    echo.
)

REM Check if .env exists
if not exist ".env" (
    echo ⚙️ Creating .env file from template...
    copy .env.example .env
    echo ❌ IMPORTANT: Update .env with your MongoDB URI!
    echo.
    start .env
    pause
) else (
    echo ✅ .env file found
    echo.
)

REM Start server
echo 🚀 Starting MongoDB E-Com server...
echo.
echo Server will run on: http://localhost:5000
echo API: http://localhost:5000/api/health
echo Frontend: Open index.html in browser
echo.
pause

npm start
