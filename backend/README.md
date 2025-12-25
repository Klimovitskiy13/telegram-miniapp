# NO LIMITS Backend

Backend сервер для Telegram Mini App.

## Технологии

- Node.js + Express
- TypeScript
- PostgreSQL + Prisma
- OpenAI API
- Telegraf (Telegram Bot API)
- JWT аутентификация

## Установка

```bash
npm install
```

## Настройка

### Базовая настройка

**Быстрый способ:**
```bash
npm run setup:env
```
Этот скрипт создаст `.env.local` и `.env.production` с шаблонами. Затем отредактируй их и заполни реальные значения.

**Ручной способ:**
1. Создай `.env.local` и заполни переменные для локальной разработки
2. Создай `.env.production` и заполни переменные для онлайн базы
3. Укажи `OPENAI_API_KEY` для работы с GPT
4. Укажи `BOT_TOKEN` для работы Telegram бота

### Настройка локальной PostgreSQL

1. Установи PostgreSQL локально:
   ```bash
   # macOS
   brew install postgresql@14
   brew services start postgresql@14
   
   # Linux
   sudo apt-get install postgresql postgresql-contrib
   sudo systemctl start postgresql
   ```

2. Создай базу данных:
   ```bash
   createdb no_limits_dev
   ```

3. Примени миграции:
   ```bash
   npm run prisma:migrate
   ```

### Переключение между базами

**Важно:** Локальная и онлайн базы — это разные экземпляры PostgreSQL и не связаны между собой. Онлайн база не пострадает при работе с локальной.

#### Вариант 1: Автоматическое переключение (рекомендуется)

```bash
# Локальная база (когда нет доступа к онлайн)
npm run dev:local

# Онлайн база (когда есть доступ)
npm run dev:prod
```

#### Вариант 2: Ручное переключение

```bash
# Переключиться на локальную базу
npm run db:switch:local

# Переключиться на онлайн базу
npm run db:switch:prod

# Затем запусти приложение
npm run dev
```

#### Вариант 3: Прямое редактирование .env

Просто измени `DATABASE_URL` в файле `.env` на нужный URL.

## Запуск

```bash
# Разработка (использует текущий .env)
npm run dev

# Разработка с локальной базой
npm run dev:local

# Разработка с онлайн базой
npm run dev:prod

# Сборка
npm run build

# Продакшн
npm start
```

## Prisma

```bash
# Генерация клиента
npm run prisma:generate

# Миграции
npm run prisma:migrate

# Prisma Studio
npm run prisma:studio
```

