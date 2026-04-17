#!/bin/bash

echo "🚀 Запуск настройки Downloader Pro..."

# Проверка Node.js
if ! command -v node &> /dev/null
then
    echo "❌ Node.js не установлен. Пожалуйста, установите его с https://nodejs.org/"
    exit 1
fi

# Установка зависимостей
echo "📦 Установка зависимостей npm..."
npm install

# Загрузка портативных утилит
echo "📥 Загрузка необходимых инструментов (yt-dlp, ffmpeg, aria2c)..."
node scripts/download-tools.js

# Финальная проверка
echo "🔍 Проверка готовности окружения..."
npm run setup

if [ $? -eq 0 ]; then
    echo "✅ Настройка завершена! Теперь вы можете запустить приложение командой: npm start"
else
    echo "⚠️  Настройка завершена с предупреждениями. Проверьте сообщения выше."
fi
