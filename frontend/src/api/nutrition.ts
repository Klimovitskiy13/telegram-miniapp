/**
 * API клиент для дневника питания
 */

import axios from 'axios';
import { getTelegramUser } from './telegram';
import { API_URL } from './client';
import { getEffectiveSelectedDateISO } from '../utils/selectedDate';

const api = axios.create({
  baseURL: `${API_URL}/api/nutrition`,
});

export interface FoodEntry {
  id: string;
  userId: number;
  date: string;
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface FoodEntryInput {
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  imageUrl?: string | null;
  date?: string;
}

export interface WaterEntry {
  id: string;
  userId: number;
  date: string;
  amount: number;
  createdAt: string;
}

export interface DailyNutritionStats {
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
  breakfast: FoodEntry[];
  lunch: FoodEntry[];
  dinner: FoodEntry[];
  snack: FoodEntry[];
}

/**
 * Сохранение блюда в дневник
 */
export async function saveFoodEntry(input: FoodEntryInput): Promise<FoodEntry> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error('Telegram user not found');
  }

  const response = await api.post('/food', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    ...input,
    // страховка: если где-то забыли прокинуть дату — сохраняем в выбранный день календаря
    date: input.date ?? getEffectiveSelectedDateISO(),
  });

  return response.data.entry;
}

/**
 * Получение блюд за день
 */
export async function getFoodEntries(date?: string): Promise<FoodEntry[]> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error('Telegram user not found');
  }

  const response = await api.get('/food', {
    params: {
      date,
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return response.data.entries;
}

/**
 * Удаление блюда из дневника
 */
export async function deleteFoodEntry(entryId: string): Promise<void> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error('Telegram user not found');
  }

  await api.delete(`/food/${entryId}`, {
    data: {
      telegramUser: {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
      },
    },
  });
}

/**
 * Сохранение воды
 */
export async function saveWaterEntry(amount: number, date?: string): Promise<WaterEntry> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error('Telegram user not found');
  }

  const response = await api.post('/water', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    amount,
    date: date ?? getEffectiveSelectedDateISO(),
  });

  return response.data.entry;
}

/**
 * Получение воды за день
 */
export async function getWaterEntries(date?: string): Promise<{ entries: WaterEntry[]; totalAmount: number }> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error('Telegram user not found');
  }

  const response = await api.get('/water', {
    params: {
      date,
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return {
    entries: response.data.entries,
    totalAmount: response.data.totalAmount,
  };
}

/**
 * Уменьшить воду (удалить последнюю запись за день)
 */
export async function decrementWater(date?: string): Promise<{ entries: WaterEntry[]; totalAmount: number }> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error('Telegram user not found');
  }

  const response = await api.post('/water/decrement', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    date: date ?? getEffectiveSelectedDateISO(),
  });

  return {
    entries: response.data.entries,
    totalAmount: response.data.totalAmount,
  };
}

/**
 * Получение статистики питания за день
 */
export async function getDailyNutritionStats(date?: string): Promise<DailyNutritionStats> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) {
    throw new Error('Telegram user not found');
  }

  const response = await api.get('/stats', {
    params: {
      date,
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return response.data.stats;
}

