# Полный стек проекта Telegram Mini App

## 🎯 Frontend стек

### Основные технологии
- **React 18** - UI библиотека
- **TypeScript** - типизация
- **Vite** - сборщик и dev-сервер

### Стили и UI
- **Tailwind CSS** - утилитарный CSS фреймворк
- **shadcn/ui** - готовые компоненты на основе Tailwind
- **next-themes** - переключение тем (dark/light mode)
- **clsx** + **tailwind-merge** - условные классы

### Анимации
- **Framer Motion** - основные анимации и переходы
- **@react-spring/web** - физические анимации

### Графики и визуализация
- **Recharts** - основные графики (линейные, столбчатые, круговые)
- **@nivo/core** - ядро Nivo
- **@nivo/line** - линейные графики Nivo
- **@nivo/bar** - столбчатые графики Nivo

### Управление состоянием
- **Zustand** - легковесный state manager
- **Immer** - иммутабельные обновления состояния

### API и данные
- **@tanstack/react-query** (React Query) - кэширование, синхронизация, оптимистичные обновления
- **Axios** - HTTP клиент

### Формы
- **React Hook Form** - производительная работа с формами
- **Zod** - валидация схем
- **@hookform/resolvers** - интеграция Zod с React Hook Form

### Роутинг
- **React Router v6** - навигация между страницами

### Telegram SDK
- **@twa-dev/sdk** - официальный SDK для Telegram Mini Apps

### Утилиты
- **date-fns** - работа с датами
- **lodash-es** - утилиты для работы с данными
- **mathjs** - математические расчеты
- **@tanstack/react-virtual** - виртуализация длинных списков

### Dev зависимости
- **@types/react**, **@types/react-dom** - типы для React
- **@types/lodash-es** - типы для lodash
- **tailwindcss**, **postcss**, **autoprefixer** - CSS инструменты
- **vite-plugin-svgr** - поддержка SVG как React компонентов

---

## 🔧 Backend стек

### Основные технологии
- **Node.js** - runtime
- **Express** - веб-фреймворк
- **TypeScript** - типизация

### База данных
- **PostgreSQL** - реляционная БД
- **Prisma** - ORM с типобезопасностью
- **@prisma/client** - Prisma клиент

### GPT API
- **openai** - официальный SDK OpenAI

### Аутентификация
- **jsonwebtoken** - JWT токены
- **bcrypt** - хеширование паролей

### Безопасность
- **helmet** - защита HTTP заголовков
- **express-rate-limit** - ограничение запросов
- **cors** - CORS настройки

### Валидация
- **Zod** - валидация данных (общий с фронтом)

### Утилиты
- **dotenv** - переменные окружения

### Dev зависимости
- **@types/express**, **@types/node** - типы
- **@types/jsonwebtoken**, **@types/bcrypt**, **@types/cors** - типы для библиотек
- **tsx** - запуск TypeScript файлов
- **typescript** - компилятор TypeScript

---

## 📦 Полный список зависимостей

### Frontend (package.json)
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "framer-motion": "^10.16.0",
    "@react-spring/web": "^9.7.0",
    "recharts": "^2.10.0",
    "@nivo/core": "^0.87.0",
    "@nivo/line": "^0.87.0",
    "@nivo/bar": "^0.87.0",
    "zustand": "^4.4.0",
    "immer": "^10.0.0",
    "@tanstack/react-query": "^5.14.0",
    "axios": "^1.6.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@hookform/resolvers": "^3.3.0",
    "date-fns": "^2.30.0",
    "clsx": "^2.0.0",
    "tailwind-merge": "^2.0.0",
    "lodash-es": "^4.17.21",
    "mathjs": "^12.2.0",
    "@tanstack/react-virtual": "^3.0.0",
    "@twa-dev/sdk": "^1.0.0",
    "next-themes": "^0.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/lodash-es": "^4.17.12",
    "@vitejs/plugin-react": "^4.2.0",
    "typescript": "^5.3.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "vite": "^5.0.0",
    "vite-plugin-svgr": "^4.2.0"
  }
}
```

### Backend (package.json)
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "openai": "^4.20.0",
    "prisma": "^5.7.0",
    "@prisma/client": "^5.7.0",
    "zod": "^3.22.0",
    "jsonwebtoken": "^9.0.2",
    "bcrypt": "^5.1.1",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/jsonwebtoken": "^9.0.5",
    "@types/bcrypt": "^5.0.2",
    "@types/cors": "^2.8.17",
    "tsx": "^4.7.0",
    "typescript": "^5.3.0"
  }
}
```

---

## 📁 Структура проекта

```
NO LIMITS. 2.0/
├── frontend/
│   ├── public/
│   │   ├── vite.svg
│   │   └── ...
│   ├── src/
│   │   ├── components/
│   │   │   ├── ui/              # shadcn/ui компоненты
│   │   │   │   ├── button.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   └── ...
│   │   │   ├── charts/          # Компоненты графиков
│   │   │   │   ├── LineChart.tsx
│   │   │   │   ├── BarChart.tsx
│   │   │   │   ├── PieChart.tsx
│   │   │   │   └── ...
│   │   │   ├── layout/          # Layout компоненты
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── Footer.tsx
│   │   │   │   └── Container.tsx
│   │   │   ├── theme/           # Компоненты темы
│   │   │   │   ├── ThemeToggle.tsx
│   │   │   │   └── ThemeProvider.tsx
│   │   │   └── common/         # Общие компоненты
│   │   │       ├── Loading.tsx
│   │   │       ├── Error.tsx
│   │   │       └── ...
│   │   ├── pages/              # Страницы/экраны
│   │   │   ├── Home.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── Statistics.tsx
│   │   │   ├── Charts.tsx
│   │   │   └── ...
│   │   ├── hooks/              # Кастомные хуки
│   │   │   ├── useTelegram.ts
│   │   │   ├── useTheme.ts
│   │   │   ├── useApi.ts
│   │   │   └── ...
│   │   ├── store/              # Zustand stores
│   │   │   ├── useAuthStore.ts
│   │   │   ├── useDataStore.ts
│   │   │   ├── useThemeStore.ts
│   │   │   └── ...
│   │   ├── api/                # API клиенты
│   │   │   ├── client.ts       # Axios instance
│   │   │   ├── gpt.ts          # GPT API
│   │   │   ├── user.ts         # User API
│   │   │   └── ...
│   │   ├── lib/                # Утилиты
│   │   │   ├── utils.ts        # Общие утилиты
│   │   │   ├── cn.ts           # clsx + tailwind-merge
│   │   │   ├── calculations.ts # Математические функции
│   │   │   └── ...
│   │   ├── types/              # TypeScript типы
│   │   │   ├── api.ts
│   │   │   ├── user.ts
│   │   │   ├── chart.ts
│   │   │   └── ...
│   │   ├── styles/             # Глобальные стили
│   │   │   ├── globals.css
│   │   │   └── ...
│   │   ├── App.tsx             # Главный компонент
│   │   ├── main.tsx            # Точка входа
│   │   └── vite-env.d.ts
│   ├── .env.local              # Локальные переменные
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── postcss.config.js
│
├── backend/
│   ├── src/
│   │   ├── routes/             # API routes
│   │   │   ├── index.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── gpt.routes.ts
│   │   │   ├── user.routes.ts
│   │   │   └── ...
│   │   ├── controllers/        # Контроллеры
│   │   │   ├── auth.controller.ts
│   │   │   ├── gpt.controller.ts
│   │   │   ├── user.controller.ts
│   │   │   └── ...
│   │   ├── services/           # Бизнес-логика
│   │   │   ├── gpt.service.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── user.service.ts
│   │   │   └── ...
│   │   ├── models/             # Prisma models (генерируются)
│   │   ├── middleware/         # Express middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── error.middleware.ts
│   │   │   ├── validation.middleware.ts
│   │   │   └── ...
│   │   ├── utils/              # Утилиты
│   │   │   ├── logger.ts
│   │   │   ├── errors.ts
│   │   │   ├── calculations.ts
│   │   │   └── ...
│   │   ├── types/              # TypeScript типы
│   │   │   ├── express.d.ts
│   │   │   └── ...
│   │   └── index.ts            # Точка входа
│   ├── prisma/
│   │   ├── schema.prisma       # Схема БД
│   │   └── migrations/         # Миграции
│   ├── .env                    # Переменные окружения
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   └── README.md
│
├── .cursor/
│   └── rules/
│       └── smart.mdc
│
├── STACK.md                    # Этот файл
└── README.md                   # Основной README
```

---

## 🚀 Команды для установки

### Frontend
```bash
cd frontend
npm create vite@latest . -- --template react-ts
npm install
npm install react-router-dom framer-motion @react-spring/web recharts @nivo/core @nivo/line @nivo/bar zustand immer @tanstack/react-query axios react-hook-form zod @hookform/resolvers date-fns clsx tailwind-merge lodash-es mathjs @tanstack/react-virtual @twa-dev/sdk next-themes
npm install -D tailwindcss postcss autoprefixer @types/lodash-es vite-plugin-svgr
npx tailwindcss init -p
```

### Backend
```bash
cd backend
npm init -y
npm install express openai prisma @prisma/client zod jsonwebtoken bcrypt cors dotenv helmet express-rate-limit
npm install -D @types/express @types/node @types/jsonwebtoken @types/bcrypt @types/cors tsx typescript
npx prisma init
```

---

## 🎨 Дополнительные улучшения (опционально)

### Для красоты UI
- **lucide-react** - красивые иконки
- **react-confetti** - эффекты конфетти
- **react-hot-toast** - красивые уведомления
- **sonner** - альтернатива toast

### Для расчетов
- **decimal.js** - точные вычисления с плавающей точкой

### Для производительности
- **React.memo** - мемоизация компонентов
- **useMemo/useCallback** - оптимизация рендеринга

### Для тестирования
- **Vitest** - unit тесты
- **@testing-library/react** - тестирование React компонентов
- **Playwright** - E2E тесты

---

## 📝 Примечания

- Все зависимости используют последние стабильные версии
- TypeScript используется на фронте и бэке для типобезопасности
- Prisma обеспечивает типобезопасную работу с БД
- React Query кэширует запросы и синхронизирует данные
- Zustand - легковесная альтернатива Redux
- Framer Motion + React Spring для плавных анимаций
- Recharts + Nivo для гибкой визуализации данных

