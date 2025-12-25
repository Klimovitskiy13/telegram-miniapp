/**
 * Сервис для работы с данными геймификации
 */

import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

export interface GamificationStatsInput {
  strength?: number;
  endurance?: number;
  flexibility?: number;
  agility?: number;
  speed?: number;
  reflex?: number;
  hunger?: number;
  thirst?: number;
  sleepiness?: number;
  energy?: number;
  health?: number;
  maxHealth?: number;
  level?: number;
  xp?: number;
}

/**
 * Получает или создает статистику геймификации для пользователя
 */
export async function getOrCreateGamificationStats(userId: number) {
  let stats = await prisma.gamification_stats.findUnique({
    where: { userId },
  });

  if (!stats) {
    // Создаем начальные статы
    stats = await prisma.gamification_stats.create({
      data: {
        userId,
        strength: 0,
        endurance: 0,
        flexibility: 0,
        agility: 0,
        speed: 0,
        reflex: 0,
        hunger: 0,
        thirst: 0,
        sleepiness: 0,
        energy: 0,
        health: 100,
        maxHealth: 100,
        level: 1,
        xp: 0,
      },
    });
    logger.info('Created initial gamification stats', { userId });
  }

  return stats;
}

/**
 * Обновляет статистику геймификации пользователя
 */
export async function updateGamificationStats(
  userId: number,
  input: GamificationStatsInput
) {
  // Проверяем, существует ли запись
  const existing = await prisma.gamification_stats.findUnique({
    where: { userId },
  });

  if (!existing) {
    // Создаем новую запись с начальными значениями и обновляем их
    const stats = await prisma.gamification_stats.create({
      data: {
        userId,
        strength: input.strength ?? 0,
        endurance: input.endurance ?? 0,
        flexibility: input.flexibility ?? 0,
        agility: input.agility ?? 0,
        speed: input.speed ?? 0,
        reflex: input.reflex ?? 0,
        hunger: input.hunger ?? 0,
        thirst: input.thirst ?? 0,
        sleepiness: input.sleepiness ?? 0,
        energy: input.energy ?? 0,
        health: input.health ?? 100,
        maxHealth: input.maxHealth ?? 100,
        level: input.level ?? 1,
        xp: input.xp ?? 0,
      },
    });
    logger.info('Created and updated gamification stats', { userId, input });
    return stats;
  }

  // Обновляем существующую запись
  const stats = await prisma.gamification_stats.update({
    where: { userId },
    data: {
      ...(input.strength !== undefined && { strength: input.strength }),
      ...(input.endurance !== undefined && { endurance: input.endurance }),
      ...(input.flexibility !== undefined && { flexibility: input.flexibility }),
      ...(input.agility !== undefined && { agility: input.agility }),
      ...(input.speed !== undefined && { speed: input.speed }),
      ...(input.reflex !== undefined && { reflex: input.reflex }),
      ...(input.hunger !== undefined && { hunger: input.hunger }),
      ...(input.thirst !== undefined && { thirst: input.thirst }),
      ...(input.sleepiness !== undefined && { sleepiness: input.sleepiness }),
      ...(input.energy !== undefined && { energy: input.energy }),
      ...(input.health !== undefined && { health: input.health }),
      ...(input.maxHealth !== undefined && { maxHealth: input.maxHealth }),
      ...(input.level !== undefined && { level: input.level }),
      ...(input.xp !== undefined && { xp: input.xp }),
    },
  });

  logger.info('Updated gamification stats', { userId, input });
  return stats;
}

/**
 * Обновляет статы после тренировки (добавляет к текущим значениям)
 */
export async function applyWorkoutToStats(
  userId: number,
  workoutEffects: GamificationStatsInput
) {
  const current = await getOrCreateGamificationStats(userId);

  const updated = {
    strength: current.strength + (workoutEffects.strength ?? 0),
    endurance: current.endurance + (workoutEffects.endurance ?? 0),
    flexibility: current.flexibility + (workoutEffects.flexibility ?? 0),
    agility: current.agility + (workoutEffects.agility ?? 0),
    speed: current.speed + (workoutEffects.speed ?? 0),
    reflex: current.reflex + (workoutEffects.reflex ?? 0),
    hunger: Math.max(0, current.hunger + (workoutEffects.hunger ?? 0)),
    thirst: Math.max(0, current.thirst + (workoutEffects.thirst ?? 0)),
    sleepiness: Math.max(0, current.sleepiness + (workoutEffects.sleepiness ?? 0)),
    energy: Math.max(0, current.energy + (workoutEffects.energy ?? 0)),
    health: Math.max(
      1,
      Math.min(
        current.maxHealth,
        current.health + (workoutEffects.health ?? 0)
      )
    ),
    xp: current.xp + (workoutEffects.xp ?? 0),
  };

  return await updateGamificationStats(userId, updated);
}

