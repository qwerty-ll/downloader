@echo off
echo 🚀 Starting Downloader Pro Setup...

:: Check for node
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install it from https://nodejs.org/
    pause
    exit /b 1
)

:: Install dependencies
echo 📦 Installing npm dependencies...
call npm install

:: Check tools
echo 🔍 Verifying system tools...
node scripts/check-tools.js

if %errorlevel% equ 0 (
    echo ✅ Setup complete! You can now run 'npm start'.
) else (
    echo ⚠️  Setup finished with warnings. Please resolve missing tools before running the app.
)

pause
