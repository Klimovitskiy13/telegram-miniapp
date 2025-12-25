# Настройка Cloudpub

## Обзор

Cloudpub используется для создания публичных туннелей к локальным серверам, что позволяет тестировать приложение извне и использовать его в Telegram Mini App.

## Текущая конфигурация

### Backend
- **Локальный адрес:** `http://localhost:5001`
- **Публичный адрес:** `https://murkily-cosmic-hummingbird.cloudpub.ru`

### Frontend
- **Локальный адрес:** `http://localhost:3000`
- **Публичный адрес:** `https://disgustingly-benign-cow.cloudpub.ru`

## Настройка

### 1. Backend (.env)

```env
CORS_ORIGIN=https://disgustingly-benign-cow.cloudpub.ru
CLOUDPUB_BACKEND_URL=https://murkily-cosmic-hummingbird.cloudpub.ru
CLOUDPUB_FRONTEND_URL=https://disgustingly-benign-cow.cloudpub.ru
```

### 2. Frontend (.env.local)

```env
VITE_API_URL=https://murkily-cosmic-hummingbird.cloudpub.ru
```

## Использование

1. **Запустите cloudpub туннели:**
   - Backend: `http://localhost:5001` → `https://murkily-cosmic-hummingbird.cloudpub.ru`
   - Frontend: `http://localhost:3000` → `https://disgustingly-benign-cow.cloudpub.ru`

2. **Запустите серверы:**
   ```bash
   # Backend
   cd backend
   npm run dev
   
   # Frontend
   cd frontend
   npm run dev
   ```

3. **Доступ к приложению:**
   - Frontend: `https://disgustingly-benign-cow.cloudpub.ru`
   - Backend API: `https://murkily-cosmic-hummingbird.cloudpub.ru/api`

## CORS

Backend настроен для разрешения запросов с:
- `http://localhost:3000` (локальная разработка)
- `https://disgustingly-benign-cow.cloudpub.ru` (публичный адрес)

## Примечания

- Cloudpub туннели работают только пока запущены локальные серверы
- Публичные адреса могут изменяться при перезапуске cloudpub
- Для продакшена рекомендуется использовать постоянные домены

