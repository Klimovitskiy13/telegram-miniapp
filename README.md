# NO LIMITS 2.0

Telegram Mini App проект с полным стеком технологий.

## Структура проекта

```
NO LIMITS. 2.0/
├── frontend/     # React + TypeScript + Vite
├── backend/      # Node.js + Express + Prisma
└── STACK.md      # Полное описание стека
```

## Быстрый старт

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install

# Настройка переменных окружения
npm run setup:env
# Затем отредактируй .env.local и .env.production

# Запуск с локальной базой (когда нет доступа к онлайн)
npm run dev:local

# Запуск с онлайн базой (когда есть доступ)
npm run dev:prod
```

**Подробнее:** Смотри [backend/README.md](./backend/README.md) и [backend/SETUP_LOCAL_DB.md](./backend/SETUP_LOCAL_DB.md)

## Технологии

Подробное описание всех технологий и зависимостей смотрите в [STACK.md](./STACK.md).

## Разработка

Проект использует:
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Zustand, React Query
- **Backend**: Node.js, Express, TypeScript, PostgreSQL, Prisma, OpenAI API, Telegraf

## Telegram Bot

Бот автоматически запускается при старте backend сервера. Команда `/start` отправляет приветственное сообщение с кнопкой для открытия Mini App.

## Cloudpub

Для публичного доступа к приложению используется Cloudpub. Подробности в [docs/CLOUDPUB.md](./docs/CLOUDPUB.md).

## Лицензия

MIT
