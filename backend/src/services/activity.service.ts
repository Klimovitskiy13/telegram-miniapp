/**
 * Сервис для шагов и сна (по выбранной дате календаря)
 */

import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

function normalizeDay(dateStr?: string): Date {
  if (!dateStr) {
    const now = new Date();
    return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0));
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map((x) => Number(x));
    return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0));
  }
  const dt = new Date(dateStr);
  return new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), 0, 0, 0, 0));
}

export async function addSteps(userId: number, input: { steps: number; date?: string; source?: string | null }) {
  const date = normalizeDay(input.date);
  const entry = await prisma.step_entry.create({
    data: {
      userId,
      date,
      steps: input.steps,
      source: input.source ?? 'manual',
    },
  });
  logger.info('Steps entry saved', { userId, entryId: entry.id, steps: input.steps });
  return entry;
}

export async function getStepsDay(userId: number, date?: string) {
  const targetDate = normalizeDay(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const entries = await prisma.step_entry.findMany({
    where: { userId, date: { gte: targetDate, lt: nextDay } },
    orderBy: { createdAt: 'asc' },
  });
  const totalSteps = entries.reduce((sum, e) => sum + (e.steps || 0), 0);
  return { entries, totalSteps };
}

export async function getStepsMonth(userId: number, year: number, month: number) {
  // month: 1-12
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const grouped = await prisma.step_entry.groupBy({
    by: ['date'],
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    _sum: { steps: true },
  });

  const totalsByDate: Record<string, number> = {};
  for (const row of grouped) {
    const iso = row.date.toISOString().split('T')[0];
    totalsByDate[iso] = Number(row._sum.steps ?? 0);
  }

  return totalsByDate;
}

export async function updateStepsEntry(
  userId: number,
  id: string,
  input: {
    steps?: number;
  }
) {
  const existing = await prisma.step_entry.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Steps entry not found or access denied');

  const updated = await prisma.step_entry.update({
    where: { id },
    data: {
      ...(input.steps !== undefined && { steps: input.steps }),
    },
  });

  logger.info('Steps entry updated', { userId, id, updates: input });
  return updated;
}

export async function deleteStepsEntry(userId: number, id: string) {
  const existing = await prisma.step_entry.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Steps entry not found or access denied');
  await prisma.step_entry.delete({ where: { id } });
  logger.info('Steps entry deleted', { userId, id });
  return { success: true };
}

export async function deleteLastStepsEntry(userId: number, date?: string) {
  const targetDate = normalizeDay(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const last = await prisma.step_entry.findFirst({
    where: {
      userId,
      date: { gte: targetDate, lt: nextDay },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!last) {
    throw new Error('No steps entries for this day');
  }

  await prisma.step_entry.delete({ where: { id: last.id } });
  logger.info('Steps entry deleted (last)', { userId, id: last.id });
  return last;
}

export async function addSleep(
  userId: number,
  input: {
    minutes: number;
    date?: string;
    quality?: number | null;
    sleepQuality?: string | null; // Как спалось?
    sleepRest?: string | null; // Выспался ли?
  }
) {
  const date = normalizeDay(input.date);
  const entry = await prisma.sleep_entry.create({
    data: {
      userId,
      date,
      minutes: input.minutes,
      quality: input.quality ?? null,
      sleepQuality: input.sleepQuality ?? null,
      sleepRest: input.sleepRest ?? null,
    },
  });
  logger.info('Sleep entry saved', {
    userId,
    entryId: entry.id,
    minutes: input.minutes,
    sleepQuality: input.sleepQuality,
    sleepRest: input.sleepRest,
  });
  return entry;
}

export async function getSleepDay(userId: number, date?: string) {
  const targetDate = normalizeDay(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const entries = await prisma.sleep_entry.findMany({
    where: { userId, date: { gte: targetDate, lt: nextDay } },
    orderBy: { createdAt: 'asc' },
  });
  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0);
  return { entries, totalMinutes };
}

export async function updateSleepEntry(
  userId: number,
  id: string,
  input: {
    minutes?: number;
    quality?: number | null;
    sleepQuality?: string | null;
    sleepRest?: string | null;
  }
) {
  const existing = await prisma.sleep_entry.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Sleep entry not found or access denied');

  const updated = await prisma.sleep_entry.update({
    where: { id },
    data: {
      ...(input.minutes !== undefined && { minutes: input.minutes }),
      ...(input.quality !== undefined && { quality: input.quality }),
      ...(input.sleepQuality !== undefined && { sleepQuality: input.sleepQuality }),
      ...(input.sleepRest !== undefined && { sleepRest: input.sleepRest }),
    },
  });

  logger.info('Sleep entry updated', { userId, id, updates: input });
  return updated;
}

export async function deleteSleepEntry(userId: number, id: string) {
  const existing = await prisma.sleep_entry.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Sleep entry not found or access denied');
  await prisma.sleep_entry.delete({ where: { id } });
  logger.info('Sleep entry deleted', { userId, id });
  return { success: true };
}

export async function deleteLastSleepEntry(userId: number, date?: string) {
  const targetDate = normalizeDay(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const entries = await prisma.sleep_entry.findMany({
    where: { userId, date: { gte: targetDate, lt: nextDay } },
    orderBy: { createdAt: 'desc' },
  });

  if (entries.length === 0) {
    throw new Error('No sleep entries found for this date');
  }

  const lastEntry = entries[0];
  await prisma.sleep_entry.delete({ where: { id: lastEntry.id } });
  logger.info('Last sleep entry deleted', { userId, id: lastEntry.id, date: targetDate });

  const remainingEntries = await prisma.sleep_entry.findMany({
    where: { userId, date: { gte: targetDate, lt: nextDay } },
    orderBy: { createdAt: 'asc' },
  });
  const totalMinutes = remainingEntries.reduce((sum, e) => sum + (e.minutes || 0), 0);

  return { entries: remainingEntries, totalMinutes };
}

// Workouts
export async function addWorkout(
  userId: number,
  input: { type: string; category: string; minutes: number; date?: string },
) {
  const date = normalizeDay(input.date);
  const entry = await prisma.workout_entry.create({
    data: {
      userId,
      date,
      type: input.type,
      category: input.category,
      minutes: input.minutes,
    },
  });
  logger.info('Workout entry saved', { userId, entryId: entry.id, type: input.type, minutes: input.minutes });
  return entry;
}

export async function getWorkoutsDay(userId: number, date?: string) {
  const targetDate = normalizeDay(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const entries = await prisma.workout_entry.findMany({
    where: { userId, date: { gte: targetDate, lt: nextDay } },
    orderBy: { createdAt: 'asc' },
  });
  const totalMinutes = entries.reduce((sum, e) => sum + (e.minutes || 0), 0);
  return { entries, totalMinutes };
}

/**
 * Получает все тренировки до указанной даты включительно (для пересчета статов)
 */
export async function getWorkoutsUntilDate(userId: number, untilDate?: string) {
  const targetDate = normalizeDay(untilDate);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const entries = await prisma.workout_entry.findMany({
    where: { userId, date: { lt: nextDay } },
    orderBy: { date: 'asc', createdAt: 'asc' },
  });

  return entries;
}

export async function updateWorkoutEntry(
  userId: number,
  id: string,
  input: {
    type?: string;
    category?: string;
    minutes?: number;
  }
) {
  const existing = await prisma.workout_entry.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Workout entry not found or access denied');

  const updated = await prisma.workout_entry.update({
    where: { id },
    data: {
      ...(input.type !== undefined && { type: input.type }),
      ...(input.category !== undefined && { category: input.category }),
      ...(input.minutes !== undefined && { minutes: input.minutes }),
    },
  });

  logger.info('Workout entry updated', { userId, id, updates: input });
  return updated;
}

export async function deleteWorkoutEntry(userId: number, id: string) {
  const existing = await prisma.workout_entry.findFirst({ where: { id, userId } });
  if (!existing) throw new Error('Workout entry not found or access denied');
  await prisma.workout_entry.delete({ where: { id } });
  logger.info('Workout entry deleted', { userId, id });
  return { success: true };
}

export async function getWorkoutsMonth(userId: number, year: number, month: number) {
  // month: 1-12
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const grouped = await prisma.workout_entry.groupBy({
    by: ['date'],
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    _sum: { minutes: true },
  });

  const totalsByDate: Record<string, number> = {};
  for (const row of grouped) {
    const iso = row.date.toISOString().split('T')[0];
    totalsByDate[iso] = Number(row._sum.minutes ?? 0);
  }

  return totalsByDate;
}

export async function getSleepMonth(userId: number, year: number, month: number) {
  // month: 1-12
  const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));

  const grouped = await prisma.sleep_entry.groupBy({
    by: ['date'],
    where: {
      userId,
      date: {
        gte: start,
        lt: end,
      },
    },
    _sum: { minutes: true },
  });

  const totalsByDate: Record<string, number> = {};
  for (const row of grouped) {
    const iso = row.date.toISOString().split('T')[0];
    totalsByDate[iso] = Number(row._sum.minutes ?? 0);
  }

  return totalsByDate;
}

export async function deleteLastWorkoutEntry(userId: number, date?: string) {
  const targetDate = normalizeDay(date);
  const nextDay = new Date(targetDate);
  nextDay.setUTCDate(nextDay.getUTCDate() + 1);

  const last = await prisma.workout_entry.findFirst({
    where: {
      userId,
      date: { gte: targetDate, lt: nextDay },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!last) {
    throw new Error('No workout entries for this day');
  }

  await prisma.workout_entry.delete({ where: { id: last.id } });
  logger.info('Workout entry deleted (last)', { userId, id: last.id, type: last.type });
  return last;
}


