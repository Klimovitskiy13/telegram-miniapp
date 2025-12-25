/**
 * API клиент для шагов и сна
 */

import axios from 'axios';
import { API_URL } from './client';
import { getTelegramUser } from './telegram';
import { getEffectiveSelectedDateISO } from '../utils/selectedDate';

const api = axios.create({
  baseURL: `${API_URL}/api/activity`,
});

export interface StepsEntry {
  id: string;
  userId: number;
  date: string;
  steps: number;
  source: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SleepEntry {
  id: string;
  userId: number;
  date: string;
  minutes: number;
  quality: number | null;
  sleepQuality: string | null; // Как спалось?
  sleepRest: string | null; // Выспался ли?
  createdAt: string;
  updatedAt: string;
}

export interface WorkoutEntry {
  id: string;
  userId: number;
  date: string;
  type: string;
  category: string;
  minutes: number;
  createdAt: string;
  updatedAt: string;
}

export async function addSteps(steps: number, date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.post('/steps', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    steps,
    date: date ?? getEffectiveSelectedDateISO(),
    source: 'manual',
  });

  return {
    entry: res.data.entry as StepsEntry,
    entries: res.data.entries as StepsEntry[],
    totalSteps: res.data.totalSteps as number,
  };
}

export async function getSteps(date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/steps', {
    params: {
      date: date ?? getEffectiveSelectedDateISO(),
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return { entries: res.data.entries as StepsEntry[], totalSteps: res.data.totalSteps as number };
}

export async function getStepsMonth(year: number, month: number): Promise<Record<string, number>> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/steps/month', {
    params: {
      year,
      month,
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return (res.data.totalsByDate ?? {}) as Record<string, number>;
}

export async function decrementSteps(date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.post('/steps/decrement', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    date: date ?? getEffectiveSelectedDateISO(),
  });

  return { entries: res.data.entries as StepsEntry[], totalSteps: res.data.totalSteps as number };
}

export async function updateSteps(
  id: string,
  steps?: number
) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.put(`/steps/${id}`, {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    steps,
  });

  return {
    entry: res.data.entry as StepsEntry,
    entries: res.data.entries as StepsEntry[],
    totalSteps: res.data.totalSteps as number,
  };
}

export async function deleteSteps(id: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.delete(`/steps/${id}`, {
    data: {
      telegramUser: {
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
      },
    },
  });

  return { success: true };
}

export async function addSleep(
  minutes: number,
  date?: string,
  quality?: number,
  sleepQuality?: string,
  sleepRest?: string
) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.post('/sleep', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    minutes,
    quality,
    sleepQuality,
    sleepRest,
    date: date ?? getEffectiveSelectedDateISO(),
  });

  return {
    entry: res.data.entry as SleepEntry,
    entries: res.data.entries as SleepEntry[],
    totalMinutes: res.data.totalMinutes as number,
  };
}

export async function getSleep(date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/sleep', {
    params: {
      date: date ?? getEffectiveSelectedDateISO(),
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return { entries: res.data.entries as SleepEntry[], totalMinutes: res.data.totalMinutes as number };
}

export async function addWorkout(type: string, category: string, minutes: number, date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.post('/workouts', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    type,
    category,
    minutes,
    date: date ?? getEffectiveSelectedDateISO(),
  });

  return {
    entry: res.data.entry as WorkoutEntry,
    entries: res.data.entries as WorkoutEntry[],
    totalMinutes: res.data.totalMinutes as number,
  };
}

export async function getWorkouts(date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/workouts', {
    params: {
      date: date ?? getEffectiveSelectedDateISO(),
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return { entries: res.data.entries as WorkoutEntry[], totalMinutes: res.data.totalMinutes as number };
}

/**
 * Получает все тренировки до указанной даты включительно (для пересчета статов)
 */
export async function getWorkoutsUntilDate(date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/workouts/until-date', {
    params: {
      date: date ?? getEffectiveSelectedDateISO(),
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return res.data.entries as WorkoutEntry[];
}

export async function decrementWorkout(date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.post('/workouts/decrement', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    date: date ?? getEffectiveSelectedDateISO(),
  });

  return { entries: res.data.entries as WorkoutEntry[], totalMinutes: res.data.totalMinutes as number };
}

export async function updateWorkout(
  id: string,
  type?: string,
  category?: string,
  minutes?: number
) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.put(`/workouts/${id}`, {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    type,
    category,
    minutes,
  });

  return {
    entry: res.data.entry as WorkoutEntry,
    entries: res.data.entries as WorkoutEntry[],
    totalMinutes: res.data.totalMinutes as number,
  };
}

export async function deleteWorkout(id: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.delete(`/workouts/${id}`, {
    params: {
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return res.data as { success: boolean };
}

export async function decrementSleep(date?: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.post('/sleep/decrement', {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    date: date ?? getEffectiveSelectedDateISO(),
  });

  return { entries: res.data.entries as SleepEntry[], totalMinutes: res.data.totalMinutes as number };
}

export async function updateSleep(
  id: string,
  minutes?: number,
  quality?: number,
  sleepQuality?: string,
  sleepRest?: string
) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.put(`/sleep/${id}`, {
    telegramUser: {
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    },
    minutes,
    quality,
    sleepQuality,
    sleepRest,
  });

  return {
    entry: res.data.entry as SleepEntry,
    entries: res.data.entries as SleepEntry[],
    totalMinutes: res.data.totalMinutes as number,
  };
}

export async function deleteSleep(id: string) {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.delete(`/sleep/${id}`, {
    params: {
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return res.data as { success: boolean };
}

export async function getWorkoutsMonth(year: number, month: number): Promise<Record<string, number>> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/workouts/month', {
    params: {
      year,
      month,
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return (res.data.totalsByDate ?? {}) as Record<string, number>;
}

export async function getSleepMonth(year: number, month: number): Promise<Record<string, number>> {
  const telegramUser = getTelegramUser();
  if (!telegramUser) throw new Error('Telegram user not found');

  const res = await api.get('/sleep/month', {
    params: {
      year,
      month,
      telegramUserId: telegramUser.id,
      telegramUserName: telegramUser.first_name,
    },
  });

  return (res.data.totalsByDate ?? {}) as Record<string, number>;
}


