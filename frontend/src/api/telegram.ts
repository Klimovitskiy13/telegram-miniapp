import { getBotToken } from './client';

/**
 * Инициализация Telegram Web App
 */
export const initTelegram = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.ready();
    tg.expand();
    return tg;
  }
  return null;
};

/**
 * Получение данных пользователя из Telegram
 */
export const getTelegramUser = () => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    return window.Telegram.WebApp.initDataUnsafe?.user || null;
  }
  return null;
};

/**
 * Получение BOT_TOKEN для использования в API запросах
 */
export const getTelegramBotToken = () => {
  return getBotToken();
};

// Расширяем Window интерфейс для TypeScript
declare global {
  interface Window {
    Telegram?: {
      WebApp: {
        ready: () => void;
        expand: () => void;
        initDataUnsafe?: {
          user?: {
            id: number;
            first_name: string;
            last_name?: string;
            username?: string;
            language_code?: string;
            is_premium?: boolean;
            photo_url?: string;
          };
        };
      };
    };
  }
}

