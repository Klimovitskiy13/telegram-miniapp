#!/bin/bash

# Скрипт для создания .env файлов из шаблонов

echo "🔧 Настройка переменных окружения..."

# Создаем .env.local если его нет
if [ ! -f .env.local ]; then
  echo "📝 Создаю .env.local..."
  CURRENT_USER=$(whoami)
  cat > .env.local << EOF
# Локальная база данных PostgreSQL
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database (локальная PostgreSQL)
# Используется текущий пользователь системы (без пароля для локального доступа)
# Если нужен другой пользователь: postgresql://USER:PASSWORD@localhost:5432/DATABASE_NAME
DATABASE_URL=postgresql://${CURRENT_USER}@localhost:5432/no_limits_dev

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Telegram
BOT_TOKEN=your_telegram_bot_token_here
EOF
  echo "✅ .env.local создан (пользователь: ${CURRENT_USER})"
else
  echo "ℹ️  .env.local уже существует"
fi

# Создаем .env.production если его нет
if [ ! -f .env.production ]; then
  echo "📝 Создаю .env.production..."
  cat > .env.production << 'EOF'
# Онлайн база данных PostgreSQL
PORT=5001
NODE_ENV=development
CORS_ORIGIN=http://localhost:3000

# Database (онлайн PostgreSQL)
# Замени на свои данные: postgresql://USER:PASSWORD@HOST:PORT/DATABASE_NAME?sslmode=require
DATABASE_URL=postgresql://gen_user:password@147.45.232.169:5432/default_db?sslmode=require

# OpenAI
OPENAI_API_KEY=your_openai_api_key_here

# Telegram
BOT_TOKEN=your_telegram_bot_token_here
EOF
  echo "✅ .env.production создан"
else
  echo "ℹ️  .env.production уже существует"
fi

echo ""
echo "🎉 Готово! Теперь:"
echo "   1. Отредактируй .env.local и .env.production"
echo "   2. Заполни DATABASE_URL, OPENAI_API_KEY и BOT_TOKEN"
echo "   3. Используй: npm run dev:local или npm run dev:prod"

