@echo off
chcp 65001 > nul
echo 🚀 Запуск настройки Downloader Pro для Windows...

where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен. Пожалуйста, установите его с https://nodejs.org/
    pause
    exit /b 1
)

echo 📦 Установка зависимостей npm...
call npm install

echo 📥 Загрузка портативных утилит (yt-dlp, ffmpeg, aria2c)...
node src/scripts/download-tools.js

echo 🔍 Проверка...
call npm run setup

echo ✅ Готово! Теперь запускайте через "Запустить-Windows.bat"
pause
