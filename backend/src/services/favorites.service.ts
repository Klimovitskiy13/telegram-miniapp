/**
 * Сервис для работы с избранными продуктами
 */

import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

export interface FavoriteFoodInput {
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  imageUrl?: string | null;
}

export async function listFavorites(userId: number) {
  const items = await prisma.favorite_food.findMany({
    where: { userId },
    orderBy: { updatedAt: 'desc' },
  });
  return items;
}

/**
 * Toggle: если уже в избранном — удалить, иначе — создать/обновить
 */
export async function toggleFavorite(userId: number, input: FavoriteFoodInput) {
  try {
    const existing = await prisma.favorite_food.findUnique({
      where: {
        userId_foodName: {
          userId,
          foodName: input.foodName,
        },
      },
    });

    if (existing) {
      await prisma.favorite_food.delete({ where: { id: existing.id } });
      logger.info('Favorite removed', { userId, foodName: input.foodName });
      return { favorite: false, item: null as any };
    }

    const item = await prisma.favorite_food.upsert({
      where: {
        userId_foodName: {
          userId,
          foodName: input.foodName,
        },
      },
      update: {
        portionSize: input.portionSize,
        unit: input.unit,
        calories: input.calories ?? null,
        protein: input.protein ?? null,
        fat: input.fat ?? null,
        carbs: input.carbs ?? null,
        imageUrl: input.imageUrl ?? null,
      },
      create: {
        userId,
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

    logger.info('Favorite saved', { userId, foodName: input.foodName });
    return { favorite: true, item };
  } catch (error: any) {
    logger.error('Error toggling favorite', { userId, error: error.message });
    throw error;
  }
}

export async function deleteFavorite(userId: number, id: string) {
  const existing = await prisma.favorite_food.findFirst({
    where: { id, userId },
  });
  if (!existing) {
    throw new Error('Favorite not found or access denied');
  }
  await prisma.favorite_food.delete({ where: { id } });
  logger.info('Favorite deleted', { userId, id });
  return { success: true };
}


