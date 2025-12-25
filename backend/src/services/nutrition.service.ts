/**
 * Сервис для работы с дневником питания
 */

import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

function normalizeDay(dateStr?: string): Date {
  // Храним/фильтруем по UTC-полуночи, чтобы не было сдвигов по таймзонам.
  if (!dateStr) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  }

  // Формат YYYY-MM-DD (из календаря)
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map((x) => Number(x));
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }

  // Любой ISO/DateTime -> берем календарный день в UTC
  const dt = new Date(dateStr);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 0, 0, 0, 0));
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
  date?: string; // ISO date string, по умолчанию сегодня
}

export interface WaterEntryInput {
  amount: number; // в мл
  date?: string; // ISO date string, по умолчанию сегодня
}

/**
 * Сохранение блюда в дневник питания
 */
export async function saveFoodEntry(userId: number, input: FoodEntryInput) {
  try {
    const date = normalizeDay(input.date);

    const entry = await prisma.food_entry.create({
      data: {
        userId,
        date,
        mealType: input.mealType,
        foodName: input.foodName,
        portionSize: input.portionSize,
        unit: input.unit,
        calories: input.calories ?? null,
        protein: input.protein ?? null,
        fat: input.fat ?? null,
        carbs: input.carbs ?? null,
        imageUrl: input.imageUrl ?? null,
      },
    });

    logger.info('Food entry saved', { userId, entryId: entry.id, mealType: input.mealType });
    return entry;
  } catch (error: any) {
    logger.error('Error saving food entry', { error: error.message, userId });
    throw error;
  }
}

/**
 * Получение блюд за день
 */
export async function getFoodEntries(userId: number, date?: string) {
  try {
    const targetDate = normalizeDay(date);
    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const entries = await prisma.food_entry.findMany({
      where: {
        userId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    logger.debug('Food entries retrieved', { userId, date: targetDate.toISOString(), count: entries.length });
    return entries;
  } catch (error: any) {
    logger.error('Error getting food entries', { error: error.message, userId });
    throw error;
  }
}

/**
 * Удаление блюда из дневника
 */
export async function deleteFoodEntry(userId: number, entryId: string) {
  try {
    // Проверяем, что запись принадлежит пользователю
    const entry = await prisma.food_entry.findFirst({
      where: {
        id: entryId,
        userId,
      },
    });

    if (!entry) {
      throw new Error('Food entry not found or access denied');
    }

    await prisma.food_entry.delete({
      where: {
        id: entryId,
      },
    });

    logger.info('Food entry deleted', { userId, entryId });
    return { success: true };
  } catch (error: any) {
    logger.error('Error deleting food entry', { error: error.message, userId, entryId });
    throw error;
  }
}

/**
 * Сохранение воды
 */
export async function saveWaterEntry(userId: number, input: WaterEntryInput) {
  try {
    const date = normalizeDay(input.date);

    const entry = await prisma.water_entry.create({
      data: {
        userId,
        date,
        amount: input.amount,
      },
    });

    logger.info('Water entry saved', { userId, entryId: entry.id, amount: input.amount });
    return entry;
  } catch (error: any) {
    logger.error('Error saving water entry', { error: error.message, userId });
    throw error;
  }
}

/**
 * Получение воды за день
 */
export async function getWaterEntries(userId: number, date?: string) {
  try {
    const targetDate = normalizeDay(date);
    const nextDay = new Date(targetDate);
    nextDay.setUTCDate(nextDay.getUTCDate() + 1);

    const entries = await prisma.water_entry.findMany({
      where: {
        userId,
        date: {
          gte: targetDate,
          lt: nextDay,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Суммируем количество воды за день
    const totalAmount = entries.reduce((sum, entry) => sum + entry.amount, 0);

    logger.debug('Water entries retrieved', { userId, date: targetDate.toISOString(), totalAmount });
    return {
      entries,
      totalAmount,
    };
  } catch (error: any) {
    logger.error('Error getting water entries', { error: error.message, userId });
    throw error;
  }
}

/**
 * Удалить последнюю запись воды за день (для "минус стакан")
 */
export async function deleteLastWaterEntry(userId: number, date?: string) {
  const targetDate = normalizeDay(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const last = await prisma.water_entry.findFirst({
    where: {
      userId,
      date: {
        gte: targetDate,
        lt: nextDay,
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!last) {
    throw new Error('No water entries for this day');
  }

  await prisma.water_entry.delete({ where: { id: last.id } });
  logger.info('Water entry deleted', { userId, entryId: last.id });
  return last;
}

/**
 * Получение статистики питания за день
 */
export async function getDailyNutritionStats(userId: number, date?: string) {
  try {
    const entries = await getFoodEntries(userId, date);

    const stats = {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
      breakfast: [] as any[],
      lunch: [] as any[],
      dinner: [] as any[],
      snack: [] as any[],
    };

    entries.forEach((entry) => {
      if (entry.calories) stats.calories += entry.calories;
      if (entry.protein) stats.protein += entry.protein;
      if (entry.fat) stats.fat += entry.fat;
      if (entry.carbs) stats.carbs += entry.carbs;

      // Группируем по приемам пищи
      if (entry.mealType === 'breakfast') stats.breakfast.push(entry);
      else if (entry.mealType === 'lunch') stats.lunch.push(entry);
      else if (entry.mealType === 'dinner') stats.dinner.push(entry);
      else if (entry.mealType === 'snack') stats.snack.push(entry);
    });

    return stats;
  } catch (error: any) {
    logger.error('Error getting daily nutrition stats', { error: error.message, userId });
    throw error;
  }
}

