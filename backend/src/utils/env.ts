/**
 * Утилиты для работы с переменными окружения
 */

export const env = {
  // Server
  PORT: process.env.PORT || '5001',
  NODE_ENV: process.env.NODE_ENV || 'development',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',

  // Database
  DATABASE_URL: process.env.DATABASE_URL || '',

  // OpenAI
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',

  // Telegram
  BOT_TOKEN: process.env.BOT_TOKEN || '',
};

/**
 * Проверка обязательных переменных окружения
 */
export const validateEnv = () => {
  // База данных обязательна: проект работает с PostgreSQL
  const required = ['DATABASE_URL', 'BOT_TOKEN'];

  const missing: string[] = [];

  required.forEach((key) => {
    if (!env[key as keyof typeof env]) {
      missing.push(key);
    }
  });

  if (!env.DATABASE_URL) {
    console.warn('❌ DATABASE_URL не настроен - PostgreSQL обязателен для работы приложения');
  }

  if (missing.length > 0) {
    console.warn(
      `⚠️  Отсутствуют обязательные переменные окружения: ${missing.join(', ')}`
    );
  }

  return missing.length === 0;
};

/**
 * Проверка переменных при старте приложения
 * Вызывается вручную из index.ts после загрузки dotenv
 */

