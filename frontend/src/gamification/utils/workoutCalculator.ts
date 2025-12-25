// Расчет эффектов тренировок с учетом множителей состояний

import { ConditionLevel, PhysicalStat, WorkoutEffect } from '../types';
import {
  SLEEPINESS_MULTIPLIERS,
  HUNGER_MULTIPLIERS,
  THIRST_MULTIPLIERS,
} from '../constants/conditionMultipliers';
import { WORKOUT_EFFECTS_MAP } from '../constants/workoutEffects';

/**
 * Находит ближайшую доступную длительность тренировки
 */
function findNearestDuration(
  effectsTable: Record<number, WorkoutEffect>,
  targetDuration: number
): number {
  const durations = Object.keys(effectsTable).map(Number).sort((a, b) => a - b);
  
  // Находим ближайшую меньшую или равную длительность
  let nearest = durations[0];
  for (const duration of durations) {
    if (duration <= targetDuration) {
      nearest = duration;
    } else {
      break;
    }
  }
  
  return nearest;
}

/**
 * Получает базовые эффекты тренировки
 */
function getBaseWorkoutEffect(
  workoutType: string,
  duration: number
): WorkoutEffect | null {
  const effectsTable = WORKOUT_EFFECTS_MAP[workoutType];
  
  if (!effectsTable) {
    return null;
  }
  
  const nearestDuration = findNearestDuration(effectsTable, duration);
  return effectsTable[nearestDuration];
}

/**
 * Применяет множители состояний к физическим статам
 */
function applyConditionMultipliers(
  baseValue: number,
  stat: PhysicalStat,
  sleepiness: ConditionLevel,
  hunger: ConditionLevel,
  thirst: ConditionLevel
): number {
  const sleepinessMultiplier = SLEEPINESS_MULTIPLIERS[sleepiness][stat];
  const hungerMultiplier = HUNGER_MULTIPLIERS[hunger][stat];
  const thirstMultiplier = THIRST_MULTIPLIERS[thirst][stat];
  
  // Комбинированный множитель
  const combinedMultiplier = sleepinessMultiplier * hungerMultiplier * thirstMultiplier;
  
  return Math.round(baseValue * combinedMultiplier);
}

/**
 * Рассчитывает итоговые эффекты тренировки с учетом состояний
 */
export function calculateWorkoutEffect(
  workoutType: string,
  duration: number,
  sleepiness: ConditionLevel,
  hunger: ConditionLevel,
  thirst: ConditionLevel
): WorkoutEffect | null {
  const baseEffect = getBaseWorkoutEffect(workoutType, duration);
  
  if (!baseEffect) {
    return null;
  }
  
  // Применяем множители к физическим статам
  const physicalStats: PhysicalStat[] = [
    'strength',
    'endurance',
    'flexibility',
    'agility',
    'speed',
    'reflex',
  ];
  
  const adjustedEffect: WorkoutEffect = {
    strength: applyConditionMultipliers(
      baseEffect.strength,
      'strength',
      sleepiness,
      hunger,
      thirst
    ),
    endurance: applyConditionMultipliers(
      baseEffect.endurance,
      'endurance',
      sleepiness,
      hunger,
      thirst
    ),
    flexibility: applyConditionMultipliers(
      baseEffect.flexibility,
      'flexibility',
      sleepiness,
      hunger,
      thirst
    ),
    agility: applyConditionMultipliers(
      baseEffect.agility,
      'agility',
      sleepiness,
      hunger,
      thirst
    ),
    speed: applyConditionMultipliers(
      baseEffect.speed,
      'speed',
      sleepiness,
      hunger,
      thirst
    ),
    reflex: applyConditionMultipliers(
      baseEffect.reflex,
      'reflex',
      sleepiness,
      hunger,
      thirst
    ),
    
    // Физиологические статы не умножаются, только базовые значения
    hunger: baseEffect.hunger,
    thirst: baseEffect.thirst,
    sleepiness: baseEffect.sleepiness,
    energy: baseEffect.energy,
    
    // Здоровье тоже может корректироваться множителями (опционально)
    health: baseEffect.health,
    
    // XP рассчитывается на основе базового XP и множителя состояния
    xp: calculateXP(baseEffect.xp, sleepiness, hunger, thirst),
  };
  
  return adjustedEffect;
}

/**
 * Рассчитывает общий множитель состояния для XP
 */
function calculateConditionMultiplier(
  sleepiness: ConditionLevel,
  hunger: ConditionLevel,
  thirst: ConditionLevel
): number {
  // Берем средний множитель по всем статам для оценки общего состояния
  const stats: PhysicalStat[] = ['strength', 'endurance', 'flexibility', 'agility', 'speed', 'reflex'];
  
  let totalMultiplier = 0;
  for (const stat of stats) {
    const sleepinessMultiplier = SLEEPINESS_MULTIPLIERS[sleepiness][stat];
    const hungerMultiplier = HUNGER_MULTIPLIERS[hunger][stat];
    const thirstMultiplier = THIRST_MULTIPLIERS[thirst][stat];
    totalMultiplier += sleepinessMultiplier * hungerMultiplier * thirstMultiplier;
  }
  
  return totalMultiplier / stats.length;
}

/**
 * Рассчитывает XP на основе базового XP и множителя состояния
 */
function calculateXP(
  baseXP: number,
  sleepiness: ConditionLevel,
  hunger: ConditionLevel,
  thirst: ConditionLevel
): number {
  const conditionMultiplier = calculateConditionMultiplier(sleepiness, hunger, thirst);
  return Math.round(baseXP * conditionMultiplier);
}

/**
 * Применяет эффекты тренировки к статам пользователя
 */
export function applyWorkoutEffect(
  currentStats: {
    strength: number;
    endurance: number;
    flexibility: number;
    agility: number;
    speed: number;
    reflex: number;
    hunger: number;
    thirst: number;
    sleepiness: number;
    energy: number;
    health: number;
    maxHealth: number;
  },
  effect: WorkoutEffect
): typeof currentStats {
  return {
    strength: Math.max(0, currentStats.strength + effect.strength),
    endurance: Math.max(0, currentStats.endurance + effect.endurance),
    flexibility: Math.max(0, currentStats.flexibility + effect.flexibility),
    agility: Math.max(0, currentStats.agility + effect.agility),
    speed: Math.max(0, currentStats.speed + effect.speed),
    reflex: Math.max(0, currentStats.reflex + effect.reflex),
    hunger: Math.max(0, currentStats.hunger + effect.hunger),
    thirst: Math.max(0, currentStats.thirst + effect.thirst),
    sleepiness: Math.max(0, currentStats.sleepiness + effect.sleepiness),
    energy: Math.max(0, currentStats.energy + effect.energy),
    health: Math.max(
      1,
      Math.min(currentStats.maxHealth, currentStats.health + effect.health)
    ),
    maxHealth: currentStats.maxHealth,
  };
}

