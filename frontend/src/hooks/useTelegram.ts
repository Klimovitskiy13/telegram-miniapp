import { useEffect, useState } from 'react';
import { initTelegram, getTelegramUser } from '../api/telegram';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  photo_url?: string;
}

export const useTelegram = () => {
  const [user, setUser] = useState<TelegramUser | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Инициализируем Telegram Web App
    const tg = initTelegram();
    
    if (tg) {
      setIsReady(true);
      const telegramUser = getTelegramUser();
      if (telegramUser) {
        setUser(telegramUser);
      }
    } else {
      // Если не в Telegram, можно использовать для разработки
      setIsReady(true);
      console.warn('Telegram Web App не обнаружен. Работа в режиме разработки.');
    }
  }, []);

  return {
    user,
    isReady,
    isTelegram: typeof window !== 'undefined' && !!window.Telegram?.WebApp,
  };
};

