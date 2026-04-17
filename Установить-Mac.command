#!/bin/bash
cd "$(dirname "$0")"
echo "🚀 Запуск настройки Downloader Pro для macOS..."

if ! command -v node &> /dev/null
then
    echo "❌ Node.js не установлен. Пожалуйста, установите его с https://nodejs.org/"
    exit 1
fi

echo "📦 Установка зависимостей npm..."
npm install

echo "📥 Загрузка портативных утилит (yt-dlp, ffmpeg, aria2c)..."
node src/scripts/download-tools.js

echo "🔍 Проверка..."
npm run setup

echo "✅ Готово! Теперь запускайте через 'Запустить-Mac.command'"
read -n 1 -s -p "Нажмите любую клавишу для завершения..."
