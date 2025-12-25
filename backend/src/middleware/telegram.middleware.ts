/**
 * Middleware для извлечения данных пользователя Telegram из запроса
 */

import { Request, Response, NextFunction } from 'express';

// Расширяем тип Request для добавления telegramUser
declare global {
  namespace Express {
    interface Request {
      telegramUser?: {
        id: number;
        first_name: string;
        last_name?: string;
        username?: string;
      };
    }
  }
}

/**
 * Middleware для извлечения данных пользователя Telegram
 * В Telegram WebApp данные пользователя доступны через window.Telegram.WebApp.initDataUnsafe.user
 * На бэкенде мы получаем их через заголовки или body запроса
 */
export const getTelegramUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Пытаемся получить данные из body (если фронтенд отправляет)
    if (req.body.telegramUser) {
      req.telegramUser = req.body.telegramUser;
      return next();
    }

    // Пытаемся получить из заголовков (если фронтенд отправляет)
    const telegramUserId = req.headers['x-telegram-user-id'];
    const telegramUserName = req.headers['x-telegram-user-name'];
    
    if (telegramUserId) {
      req.telegramUser = {
        id: parseInt(telegramUserId as string, 10),
        first_name: (telegramUserName as string) || 'User',
      };
      return next();
    }

    // Если данных нет, продолжаем без telegramUser (для некоторых endpoints это нормально)
    // Но для nutrition endpoints это обязательно, поэтому вернем ошибку
    return res.status(401).json({ error: 'Telegram user data required' });
  } catch (error) {
    return res.status(401).json({ error: 'Invalid Telegram user data' });
  }
};

