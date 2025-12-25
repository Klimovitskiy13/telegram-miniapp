/**
 * API клиент для избранных продуктов
 */

import axios from 'axios';
import { getTelegramUser } from './telegram';
import { API_URL } from './client';

const api = axios.create({
  baseURL: `${API_URL}/api/favorites`,
});

export interface FavoriteFood {
  id: string;
  userId: number;
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

export async function listFavorites(): Promise<FavoriteFood[]> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/', {
    params: {
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return res.data.items as FavoriteFood[];
}

export async function toggleFavorite(input: FavoriteFoodInput): Promise<{ favorite: boolean; item: FavoriteFood | null }> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.post('/toggle', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    ...input,
  });

  return { favorite: !!res.data.favorite, item: res.data.item ?? null };
}

export async function deleteFavorite(id: string): Promise<void> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  await api.delete(`/${id}`, {
    params: {
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });
}


