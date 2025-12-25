// Оценка состояний на основе данных пользователя

import { ConditionLevel, ConditionState } from '../types';

/**
 * Оценивает уровень голода на основе КБЖУ
 * @param targetCalories - целевые калории
 * @param actualCalories - фактически съеденные калории
 * @param consecutiveDays - количество дней подряд с дефицитом >500 ккал
 */
export function evaluateHunger(
  targetCalories: number,
  actualCalories: number,
  consecutiveDays: number = 0
): ConditionLevel {
  const diff = actualCalories - targetCalories;
  const percentDiff = Math.abs(diff / targetCalories);
  
  // Критический: дефицит >500 ккал 3-7 дней подряд
  if (diff < -500 && consecutiveDays >= 3) {
    return 'critical';
  }
  
  // Высокий: дефицит >500 ккал
  if (diff < -500) {
    return 'high';
  }
  
  // Средний: дефицит 200-500 ккал
  if (diff < -200) {
    return 'medium';
  }
  
  // Низкий: КБЖУ в цели ±10%
  if (percentDiff <= 0.1) {
    return 'low';
  }
  
  // Средний для остальных случаев
  return 'medium';
}

/**
 * Оценивает уровень сонливости на основе сна
 * @param sleepMinutes - количество минут сна
 * @param quality - качество сна (1-5, опционально)
 * @param consecutiveDays - количество дней подряд с недосыпом <5ч
 */
export function evaluateSleepiness(
  sleepMinutes: number,
  quality?: number,
  consecutiveDays: number = 0
): ConditionLevel {
  const sleepHours = sleepMinutes / 60;
  
  // Критический: <5ч или 3+ ночи сильного недосыпа
  if (sleepHours < 5 || consecutiveDays >= 3) {
    return 'critical';
  }
  
  // Высокий: 5-6ч или рваный сон (низкое качество)
  if (sleepHours < 6 || (quality !== undefined && quality <= 2)) {
    return 'high';
  }
  
  // Средний: 6-7ч или 9-10ч
  if ((sleepHours >= 6 && sleepHours < 7) || (sleepHours > 9 && sleepHours <= 10)) {
    return 'medium';
  }
  
  // Низкий: 7-9ч, хороший сон
  if (sleepHours >= 7 && sleepHours <= 9) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Оценивает уровень жажды на основе воды
 * @param targetWater - целевое количество воды (мл)
 * @param actualWater - фактически выпито воды (мл)
 * @param consecutiveDays - количество дней подряд с <70% нормы
 */
export function evaluateThirst(
  targetWater: number,
  actualWater: number,
  consecutiveDays: number = 0
): ConditionLevel {
  const percent = (actualWater / targetWater) * 100;
  
  // Критическая: <70% нормы 3-7 дней подряд
  if (percent < 70 && consecutiveDays >= 3) {
    return 'critical';
  }
  
  // Высокая: <70% нормы
  if (percent < 70) {
    return 'high';
  }
  
  // Средняя: 70-89% нормы
  if (percent >= 70 && percent < 90) {
    return 'medium';
  }
  
  // Низкая: 90-120% нормы
  if (percent >= 90 && percent <= 120) {
    return 'low';
  }
  
  return 'medium';
}

/**
 * Оценивает уровень энергии на основе всех факторов
 * @param conditionState - состояние по всем факторам
 * @returns ConditionLevel где low = высокая энергия (хорошо), high = низкая энергия (плохо)
 */
export function evaluateEnergy(conditionState: Omit<ConditionState, 'energy'>): ConditionLevel {
  const { hunger, sleepiness, thirst } = conditionState;
  
  // Низкая энергия (high): если есть критические или высокие уровни
  const hasCritical = hunger === 'critical' || sleepiness === 'critical' || thirst === 'critical';
  const hasHigh = hunger === 'high' || sleepiness === 'high' || thirst === 'high';
  
  if (hasCritical || (hasHigh && (hunger === 'high' && sleepiness === 'high'))) {
    return 'high'; // Низкая энергия = high (это плохо)
  }
  
  // Средняя энергия: есть 1-2 проблемы
  const problemCount = [hunger, sleepiness, thirst].filter(
    (level) => level === 'high' || level === 'medium'
  ).length;
  
  if (problemCount >= 2) {
    return 'medium';
  }
  
  // Высокая энергия: всё в порядке
  return 'low'; // Высокая энергия = low (это хорошо)
}

