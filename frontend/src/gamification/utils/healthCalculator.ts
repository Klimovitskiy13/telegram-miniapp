// Расчет влияния физиологии на здоровье

import { ConditionLevel, HealthImpact } from '../types';
import {
  HUNGER_HEALTH_IMPACTS,
  SLEEPINESS_HEALTH_IMPACTS,
  THIRST_HEALTH_IMPACTS,
  ENERGY_HEALTH_IMPACTS,
} from '../constants/healthImpacts';

/**
 * Рассчитывает влияние состояния на здоровье
 * Использует среднее значение из диапазона для простоты
 */
function getHealthImpact(level: ConditionLevel, impacts: typeof HUNGER_HEALTH_IMPACTS): number {
  const range = impacts[level];
  return (range.min + range.max) / 2;
}

/**
 * Рассчитывает изменение здоровья за день на основе физиологии
 */
export function calculateDailyHealthImpact(
  hunger: ConditionLevel,
  sleepiness: ConditionLevel,
  thirst: ConditionLevel,
  energy: ConditionLevel
): HealthImpact {
  const hungerImpact = getHealthImpact(hunger, HUNGER_HEALTH_IMPACTS);
  const sleepinessImpact = getHealthImpact(sleepiness, SLEEPINESS_HEALTH_IMPACTS);
  const thirstImpact = getHealthImpact(thirst, THIRST_HEALTH_IMPACTS);
  const energyImpact = getHealthImpact(energy, ENERGY_HEALTH_IMPACTS);
  
  const total = hungerImpact + sleepinessImpact + thirstImpact + energyImpact;
  
  return {
    hunger: hungerImpact,
    sleepiness: sleepinessImpact,
    thirst: thirstImpact,
    energy: energyImpact,
    total,
  };
}

/**
 * Применяет изменение здоровья к текущему здоровью с учетом максимума
 */
export function applyHealthChange(
  currentHealth: number,
  maxHealth: number,
  healthChange: number
): number {
  const newHealth = currentHealth + healthChange;
  
  // Ограничиваем максимумом
  if (newHealth > maxHealth) {
    return maxHealth;
  }
  
  // Ограничиваем минимумом (не даем упасть ниже 1)
  if (newHealth < 1) {
    return 1;
  }
  
  return newHealth;
}

