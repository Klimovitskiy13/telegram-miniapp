# Настройка базы данных

## Текущий статус

База данных настроена и используется для хранения данных пользователей и онбординга.

## Структура базы данных

### Таблица `users`

Хранит основную информацию о пользователях:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | Int (PK, автоинкремент) | Уникальный идентификатор пользователя (1, 2, 3...) |
| `telegramId` | String (UNIQUE) | ID пользователя в Telegram |
| `createdAt` | DateTime | Дата создания записи |
| `updatedAt` | DateTime | Дата последнего обновления |

### Таблица `onboarding_data`

Хранит данные о прохождении онбординга:

| Поле | Тип | Описание |
|------|-----|----------|
| `id` | String (PK, UUID) | Уникальный идентификатор записи |
| `userId` | Int (FK, UNIQUE) | Ссылка на пользователя из таблицы `users` |
| `goal` | String (опционально) | Цель пользователя: `lose_weight`, `maintain`, `gain_muscle` |
| `activityLevel` | String (опционально) | Уровень активности: `rarely`, `sometimes`, `often`, `constant`, `intensive` |
| `gender` | String (опционально) | Пол пользователя: `male`, `female` |
| `height` | Int (опционально) | Рост в см |
| `weight` | Float (опционально) | Вес в кг |
| `age` | Int (опционально) | Возраст |
| `isCompleted` | Boolean | Флаг завершения онбординга (по умолчанию `false`) |
| `createdAt` | DateTime | Дата создания записи |
| `updatedAt` | DateTime | Дата последнего обновления |

**Связь:** `onboarding_data.userId` → `users.id` (один к одному, каскадное удаление)

**Пример данных:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "userId": 1,
  "goal": "lose_weight",
  "activityLevel": "often",
  "gender": "male",
  "height": 180,
  "weight": 75.5,
  "age": 30,
  "isCompleted": false,
  "createdAt": "2024-01-15T10:30:00Z",
  "updatedAt": "2024-01-15T10:35:00Z"
}
```

### Принцип работы

**Минималистичный подход:** Поля добавляются в базу данных только по мере необходимости. Не создаем лишние колонки заранее.

**Пример:**
- Нужно сохранить возраст → добавляем поле `age`
- Нужно сохранить вес → добавляем поле `weight`
- И так далее по мере необходимости

### Служебные таблицы

- `_prisma_migrations` - служебная таблица Prisma для отслеживания миграций (не трогаем)

## Настройка PostgreSQL в timeweb.cloud

База данных настроена на timeweb.cloud PostgreSQL.

### 1. Получение параметров подключения

В панели timeweb.cloud:

1. Перейдите в раздел **"Базы данных"**
2. Выберите вашу базу данных (например, `no-limits-db`)
3. Откройте раздел **"Подключение"** или **"Параметры подключения"**
4. Выберите:
   - **Тип подключения:** `Публичный доступ` (Public)
   - **Способ подключения:** `NodeJS`
   - **Формат:** `Connection String (URI)`
5. Скопируйте строку подключения

**Параметры подключения:**
- **Хост (Host):** IP-адрес сервера (например, `147.45.232.169`)
- **Порт (Port):** обычно `5432`
- **База данных (Database):** имя базы (например, `default_db`)
- **Пользователь (User):** имя пользователя (например, `gen_user`)
- **Пароль (Password):** пароль базы данных

**Важно:** Если пароль содержит специальные символы (`>`, `!`, `,`, `.` и т.д.), их нужно закодировать в URL:
- `>` → `%3E`
- `!` → `%21`
- `,` → `%2C`
- `.` → `%2E`

### 2. Настройка в проекте

Обновите `.env` файл в `backend/`:

```env
DATABASE_URL="postgresql://USERNAME:ENCODED_PASSWORD@HOST:PORT/DATABASE?sslmode=require"
```

**Пример:**
```env
DATABASE_URL="postgresql://gen_user:H2pIRJ%3E!d%2CyB.s@147.45.232.169:5432/default_db?sslmode=require"
```

**Примечание:** 
- Всегда используйте `sslmode=require` для безопасного подключения
- Пароль с специальными символами должен быть закодирован в URL-формате
- Используйте публичный доступ, если backend работает не на timeweb.cloud

### 3. Применение миграций

После настройки `DATABASE_URL`:

```bash
cd backend

# Применить все миграции
npx prisma migrate deploy

# Сгенерировать Prisma Client
npx prisma generate
```

## Важно

Проект использует **PostgreSQL через Prisma ORM**.
База данных настроена на **timeweb.cloud PostgreSQL**.

## Проверка подключения

После настройки DATABASE_URL:

```bash
cd backend

# Проверка подключения через Prisma
npx prisma db pull

# Или через Prisma Studio (визуальный редактор)
npm run prisma:studio
```

## Работа с базой данных

### Просмотр данных

**Через панель timeweb.cloud:**
1. Базы данных → выберите вашу БД → Таблицы
2. Выберите нужную таблицу для просмотра данных
3. Или используйте SQL Editor для выполнения запросов:
   ```sql
   SELECT * FROM users;
   ```

**Через Prisma Studio (локально):**
```bash
cd backend
npx prisma studio
```
Откроется браузер на `http://localhost:5555` с визуальным редактором.

### Добавление новых полей

Когда нужно сохранить новые данные:

1. Обновите схему `backend/prisma/schema.prisma`:
   ```prisma
   model onboarding_data {
     // ... существующие поля
     age Int?  // новое поле
   }
   ```

2. Создайте миграцию:
   ```bash
   cd backend
   npx prisma migrate dev --name add_age_field
   ```

3. Обновите код сервисов и API для работы с новым полем

4. Сгенерируйте Prisma Client:
   ```bash
   npx prisma generate
   ```

### API для работы с пользователями

- `POST /api/users/check` - Проверка/создание пользователя по данным Telegram
  ```json
  {
    "id": 123456789,
    "first_name": "Иван",
    "last_name": "Иванов",
    "username": "ivanov"
  }
  ```
  Ответ:
  ```json
  {
    "success": true,
    "user": {
      "id": 1,
      "telegramId": "123456789",
      "onboarding": {
        "isCompleted": false,
        "goal": "lose_weight",
        "activityLevel": "often"
      }
    }
  }
  ```

- `POST /api/users/goal` - Сохранение/обновление цели пользователя
  ```json
  {
    "userId": 1,
    "goal": "lose_weight"
  }
  ```
  Возможные значения `goal`: `lose_weight`, `maintain`, `gain_muscle`

- `POST /api/users/activity-level` - Сохранение/обновление уровня активности
  ```json
  {
    "userId": 1,
    "activityLevel": "often"
  }
  ```
  Возможные значения `activityLevel`: `rarely`, `sometimes`, `often`, `constant`, `intensive`

- `POST /api/users/profile` - Сохранение/обновление профиля пользователя (пол, рост, вес, возраст)
  ```json
  {
    "userId": 1,
    "gender": "male",
    "height": 180,
    "weight": 75.5,
    "age": 30
  }
  ```
  Возможные значения `gender`: `male`, `female`
  Все поля опциональны (можно передать `null` или не передавать)

## Важно

- ⚠️ **Не коммитьте** DATABASE_URL с реальными паролями в git
- ✅ Используйте `.env` файл (он в `.gitignore`)
- ✅ Для продакшена используйте переменные окружения на сервере
- ✅ Регулярно делайте бэкапы базы данных
- ✅ Сохраните пароль базы данных в безопасном месте
- ✅ Добавляйте поля в БД только когда они реально нужны

