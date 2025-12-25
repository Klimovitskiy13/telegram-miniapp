import { Telegraf } from 'telegraf';
import { env } from '../utils/env';
import logger from '../utils/logger';
import { findOrCreateUser } from './user.service';

class TelegramService {
  private bot: Telegraf | null = null;

  constructor() {
    if (env.BOT_TOKEN) {
      this.bot = new Telegraf(env.BOT_TOKEN);
      this.setupCommands();
      this.setupErrorHandling();
    } else {
      logger.warn('⚠️  BOT_TOKEN не установлен, Telegram бот не будет работать');
    }
  }

  private setupErrorHandling() {
    if (!this.bot) return;

    this.bot.catch((err: any, ctx) => {
      logger.error('Telegram bot error', {
        error: err?.message || String(err),
        update: ctx.update,
      });
    });
  }

  private setupCommands() {
    if (!this.bot) return;

    // Команда /start
    this.bot.command('start', async (ctx) => {
      const userId = ctx.from?.id;
      const username = ctx.from?.username;
      const firstName = ctx.from?.first_name;
      const lastName = ctx.from?.last_name;
      
      logger.info('Telegram /start command received', {
        userId,
        username,
        chatId: ctx.chat?.id,
      });

      const message = `🌟 Добро пожаловать в NO LIMITS!

Твой персональный помощник для здорового образа жизни.

✨ Что я умею:
• 📊 Отслеживание питания и калорий
• 🏃 Мониторинг активности
• 💬 AI-консультант по питанию
• 📸 Анализ блюд по фото
• 📈 Расчет БМР и АМР

Нажми кнопку ниже, чтобы начать! 🚀`;

      // Проверяем/создаем пользователя в базе данных (не блокируем отправку сообщения при ошибке)
      if (userId && firstName) {
        try {
          await findOrCreateUser({
            id: userId,
            first_name: firstName,
            last_name: lastName,
            username: username,
          });
          
          logger.info('User checked/created in database', {
            userId,
            username,
          });
        } catch (dbError: any) {
          // Логируем ошибку, но продолжаем отправку сообщения
          logger.error('Error creating/checking user in database', {
            userId,
            username,
            error: dbError.message,
            stack: dbError.stack,
          });
        }
      }

      // Отправляем сообщение всегда
      try {
        await ctx.reply(message, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: '🚀 Открыть приложение',
                  web_app: {
                    url: process.env.CLOUDPUB_FRONTEND_URL || 'https://disgustingly-benign-cow.cloudpub.ru',
                  },
                },
              ],
            ],
          },
        });
        
        logger.info('Telegram /start command processed successfully', {
          userId,
          username,
        });
      } catch (replyError: any) {
        logger.error('Error sending message', {
          userId,
          username,
          error: replyError.message,
          stack: replyError.stack,
        });
      }
    });
  }

  async startPolling() {
    if (!this.bot) {
      logger.warn('⚠️  Telegram бот не инициализирован');
      return;
    }

    try {
      logger.info('🔄 Запуск Telegram бота...');
      
      // Запускаем бота
      this.bot.launch().catch((error) => {
        logger.error('❌ Ошибка при запуске Telegram бота', {
          error: error.message,
          stack: error.stack,
        });
      });
      
      // Получаем информацию о боте для подтверждения (не блокируем запуск)
      this.bot.telegram.getMe()
        .then((botInfo) => {
          logger.info('🤖 Telegram бот запущен и работает', {
            botUsername: botInfo.username,
            botId: botInfo.id,
            botFirstName: botInfo.first_name,
          });
        })
        .catch((error) => {
          logger.warn('⚠️  Не удалось получить информацию о боте', {
            error: error.message,
          });
          // Бот все равно может работать, просто не получили информацию
          logger.info('🤖 Telegram бот запущен (информация о боте недоступна)');
        });
    } catch (error: any) {
      logger.error('❌ Ошибка при инициализации Telegram бота', {
        error: error.message,
        stack: error.stack,
      });
    }
  }

  async stop() {
    if (this.bot) {
      this.bot.stop();
      logger.info('🤖 Telegram бот остановлен');
    }
  }
}

export const telegramService = new TelegramService();

