@echo off
chcp 65001 > nul
echo 🚀 Запуск настройки Downloader Pro...

:: Проверка Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js не установлен. Пожалуйста, установите его с https://nodejs.org/
    pause
    exit /b 1
)

:: Установка зависимостей
echo 📦 Установка зависимостей npm...
call npm install

:: Загрузка портативных утилит
echo 📥 Загрузка необходимых инструментов (yt-dlp, ffmpeg, aria2c)...
node scripts/download-tools.js

:: Проверка инструментов
echo 🔍 Проверка готовности окружения...
call npm run setup

if %errorlevel% equ 0 (
    echo ✅ Настройка завершена! Теперь вы можете запустить приложение командой: npm start
) else (
    echo ⚠️  Настройка завершена с предупреждениями. Проверьте сообщения выше.
)

pause
