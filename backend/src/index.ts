// Загружаем переменные окружения ПЕРВЫМ ДЕЛОМ
import './config/env.config.js'

import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { env, validateEnv } from './utils/env'
import logger from './utils/logger'
import { requestLogger } from './middleware/logger.middleware'
import { getDatabaseConfigSummary, prisma } from './utils/prisma'
import gptRoutes from './routes/gpt.routes'
import userRoutes from './routes/user.routes'
import nutritionRoutes from './routes/nutrition.routes'
import favoritesRoutes from './routes/favorites.routes'
import activityRoutes from './routes/activity.routes'
import aiRoutes from './routes/ai.routes'
import { telegramService } from './services/telegram.service'

const app = express()
const PORT = env.PORT

// Trust proxy для правильной работы rate limiting.
// В Telegram WebApp/Cloudpub часто приходит X-Forwarded-For даже локально, поэтому включаем.
app.set('trust proxy', 1)

// Middleware
app.use(helmet())

// Логирование запросов (должно быть после helmet, но до других middleware)
app.use(requestLogger)

// CORS настройка - разрешаем запросы с локального и публичного адресов
const allowedOrigins = [
  env.CORS_ORIGIN,
  'http://localhost:3000',
  'https://disgustingly-benign-cow.cloudpub.ru',
  process.env.CLOUDPUB_FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Разрешаем запросы без origin (например, Postman, мобильные приложения)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}))
// Увеличиваем лимит размера тела запроса для загрузки изображений
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 100, // максимум 100 запросов с одного IP
  skip: (req) => {
    // Пропускаем activity routes, для них отдельный лимитер
    return req.path.startsWith('/api/activity') || req.path.startsWith('/activity')
  }
})
app.use('/api/', limiter)

// Более мягкий лимит для activity routes (частое добавление данных)
const activityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 300, // максимум 300 запросов с одного IP для activity
})

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Server is running' })
})

// API routes
app.get('/api', (_req, res) => {
  res.json({ message: 'NO LIMITS 2.0 API' })
})

// Root route для проверки работы сервера
app.get('/', (_req, res) => {
  res.json({ 
    message: 'NO LIMITS 2.0 Backend',
    status: 'running',
    endpoints: {
      health: '/health',
      api: '/api',
      gpt: '/api/gpt/chat',
      users: '/api/users/check'
    }
  })
})

// API routes
app.use('/api/gpt', gptRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/users', userRoutes)
app.use('/api/nutrition', nutritionRoutes)
// Backward-compat / safety: некоторые клиенты уже стучатся без /api
app.use('/nutrition', nutritionRoutes)
app.use('/api/favorites', favoritesRoutes)
app.use('/favorites', favoritesRoutes)
app.use('/api/activity', activityLimiter, activityRoutes)
app.use('/activity', activityLimiter, activityRoutes)

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: _req.path,
    method: _req.method
  })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
    path: _req.path,
    method: _req.method,
  });
  res.status(500).json({ error: 'Internal server error' })
})

// Запуск сервера
const server = app.listen(PORT, async () => {
  logger.info('🚀 Server started', {
    port: PORT,
    environment: env.NODE_ENV,
    openaiConfigured: !!env.OPENAI_API_KEY,
    botTokenConfigured: !!env.BOT_TOKEN,
  });
  
  // Проверка переменных окружения
  if (!validateEnv()) {
    logger.warn('⚠️  Некоторые обязательные переменные окружения отсутствуют');
  }

  // Supabase DB is required: fail-fast if connection is broken
  const dbSummary = getDatabaseConfigSummary();
  logger.info('Database config', dbSummary);
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');
  } catch (error: any) {
    logger.error('❌ Database connection failed', {
      error: error?.message,
    });
    process.exit(1);
  }

  // Запуск Telegram бота
  await telegramService.startPolling()
})

// Обработка ошибок при запуске сервера
server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    logger.error('❌ Port already in use', {
      port: PORT,
      error: error.message,
    });
    process.exit(1)
  } else {
    logger.error('❌ Server startup error', {
      error: error.message,
      stack: error.stack,
    });
    process.exit(1)
  }
})

// Graceful shutdown
process.once('SIGINT', () => telegramService.stop())
process.once('SIGTERM', () => telegramService.stop())

