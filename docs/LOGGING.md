# Система логирования

## Обзор

В проекте используется **Winston** для логирования всех событий приложения и бота. Логи сохраняются в файлы и выводятся в консоль.

## Структура логов

### Файлы логов

Логи сохраняются в папке `backend/logs/`:

- **`error.log`** - только ошибки (уровень error)
- **`combined.log`** - все логи (все уровни)

### Уровни логирования

- **error** - ошибки, требующие внимания
- **warn** - предупреждения
- **info** - информационные сообщения (по умолчанию в production)
- **debug** - отладочная информация (только в development)

## Что логируется

### HTTP запросы

Все входящие запросы логируются с информацией:
- Метод (GET, POST, etc.)
- URL
- IP адрес
- User-Agent
- Время выполнения
- Статус код

**Пример:**
```
12:34:56 [info]: Incoming request {"method":"POST","url":"/api/gpt/chat","ip":"127.0.0.1"}
12:34:57 [info]: Request completed {"method":"POST","url":"/api/gpt/chat","statusCode":200,"duration":"1234ms"}
```

### Telegram бот

- Команды пользователей (`/start`)
- Ошибки обработки команд
- Запуск/остановка бота
- Ошибки бота

**Пример:**
```
12:34:56 [info]: Telegram /start command received {"userId":123456,"username":"user123"}
12:34:56 [info]: Telegram /start command processed successfully {"userId":123456}
```

### OpenAI API

- Запросы к API
- Использованные токены
- Ошибки API
- Время выполнения

**Пример:**
```
12:34:56 [debug]: Sending request to OpenAI {"messageCount":2,"model":"gpt-4"}
12:34:58 [info]: OpenAI API response received {"tokensUsed":150,"responseLength":200}
```

### Системные события

- Запуск сервера
- Ошибки запуска
- Ошибки приложения
- Graceful shutdown

## Просмотр логов

### В реальном времени

```bash
# Все логи
tail -f backend/logs/combined.log

# Только ошибки
tail -f backend/logs/error.log
```

### Поиск в логах

```bash
# Найти все запросы к GPT
grep "GPT" backend/logs/combined.log

# Найти все команды /start
grep "/start" backend/logs/combined.log

# Найти ошибки за сегодня
grep "$(date +%Y-%m-%d)" backend/logs/error.log
```

## Ротация логов

Логи автоматически ротируются:
- Максимальный размер файла: **5MB**
- Максимальное количество файлов: **5**
- Старые файлы автоматически удаляются

## Настройка уровня логирования

В файле `backend/src/utils/logger.ts`:

```typescript
level: env.NODE_ENV === 'production' ? 'info' : 'debug'
```

- **Development**: показывает все логи (включая debug)
- **Production**: показывает только info, warn, error

## Использование в коде

```typescript
import logger from './utils/logger';

// Информационное сообщение
logger.info('User logged in', { userId: 123 });

// Предупреждение
logger.warn('Rate limit approaching', { requests: 90 });

// Ошибка
logger.error('Database connection failed', { error: err.message });

// Отладка (только в development)
logger.debug('Processing request', { data: requestData });
```

## Мониторинг

Рекомендуется регулярно проверять:
- `error.log` - на наличие критических ошибок
- `combined.log` - для анализа использования API
- Логи Telegram бота - для отслеживания активности пользователей

## Важно

- Папка `logs/` добавлена в `.gitignore` - логи не попадут в репозиторий
- В production логи можно отправлять в внешние сервисы (например, Sentry, LogRocket)
- Для продакшена рекомендуется настроить централизованное логирование

