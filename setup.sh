#!/bin/bash

echo "🚀 Starting Downloader Pro Setup..."

# Check for node
if ! command -v node &> /dev/null
then
    echo "❌ Node.js is not installed. Please install it from https://nodejs.org/"
    exit 1
fi

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Check tools
echo "🔍 Verifying system tools..."
node scripts/check-tools.js

if [ $? -eq 0 ]; then
    echo "✅ Setup complete! You can now run 'npm start'."
else
    echo "⚠️  Setup finished with warnings. Please resolve missing tools before running the app."
fi
