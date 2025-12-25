# Настройка локальной PostgreSQL базы

## Быстрый старт

### 1. Установка PostgreSQL

#### macOS
```bash
brew install postgresql@14
brew services start postgresql@14
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Windows
Скачай установщик с [официального сайта](https://www.postgresql.org/download/windows/)

### 2. Создание базы данных

```bash
# Войди в PostgreSQL
psql postgres

# Создай базу данных
CREATE DATABASE no_limits_dev;

# Создай пользователя (опционально)
CREATE USER no_limits_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE no_limits_dev TO no_limits_user;

# Выйди
\q
```

### 3. Настройка .env.local

Создай файл `.env.local` на основе `.env.local.example`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/no_limits_dev
```

Или если создал отдельного пользователя:

```env
DATABASE_URL=postgresql://no_limits_user:your_password@localhost:5432/no_limits_dev
```

### 4. Применение миграций

```bash
# Переключись на локальную базу
npm run db:switch:local

# Примени миграции
npm run prisma:migrate
```

### 5. Запуск

```bash
# Запусти с локальной базой
npm run dev:local
```

## Проверка подключения

```bash
# Проверь, что база создана
psql -l | grep no_limits_dev

# Или через Prisma Studio
npm run prisma:studio
```

## Важные замечания

- ✅ Локальная база **не влияет** на онлайн базу
- ✅ Можно работать с локальной базой без интернета
- ✅ Миграции применяются только к той базе, на которую указывает `DATABASE_URL`
- ⚠️  Данные в локальной и онлайн базах **не синхронизируются** автоматически

## Решение проблем

### Ошибка подключения

```bash
# Проверь, что PostgreSQL запущен
# macOS
brew services list | grep postgresql

# Linux
sudo systemctl status postgresql
```

### База данных не найдена

```bash
# Создай базу заново
createdb no_limits_dev
```

### Проблемы с правами доступа

```bash
# Дай права текущему пользователю
psql postgres
ALTER USER your_username CREATEDB;
\q
```

