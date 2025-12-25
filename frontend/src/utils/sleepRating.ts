/**
 * Формула оценки сна (0-100)
 * Основана на времени сна и ответах пользователя
 */

export interface SleepRatingInput {
  minutes: number;
  sleepQuality: string | null; // excellent, good, poor, very_poor
  sleepRest: string | null; // fully, enough, not_enough, very_tired
}

/**
 * Рассчитывает оценку сна от 0 до 100
 */
export function calculateSleepRating({ minutes, sleepQuality, sleepRest }: SleepRatingInput): number {
  // Базовый балл за время сна (0-60)
  let timeScore = 0;
  if (minutes >= 540) { // 9+ часов
    timeScore = 60;
  } else if (minutes >= 480) { // 8-9 часов
    timeScore = 60;
  } else if (minutes >= 420) { // 7-8 часов
    timeScore = 55;
  } else if (minutes >= 360) { // 6-7 часов
    timeScore = 45;
  } else if (minutes >= 300) { // 5-6 часов
    timeScore = 30;
  } else if (minutes >= 240) { // 4-5 часов
    timeScore = 15;
  } else {
    timeScore = 5;
  }

  // Бонус/штраф за качество сна (-15 до +10)
  let qualityBonus = 0;
  switch (sleepQuality) {
    case 'excellent':
      qualityBonus = 10;
      break;
    case 'good':
      qualityBonus = 5;
      break;
    case 'poor':
      qualityBonus = -10;
      break;
    case 'very_poor':
      qualityBonus = -15;
      break;
    default:
      qualityBonus = 0;
  }

  // Бонус/штраф за восстановление (-20 до +15)
  let restBonus = 0;
  switch (sleepRest) {
    case 'fully':
      restBonus = 15;
      break;
    case 'enough':
      restBonus = 5;
      break;
    case 'not_enough':
      restBonus = -10;
      break;
    case 'very_tired':
      restBonus = -20;
      break;
    default:
      restBonus = 0;
  }

  // Итоговая оценка
  let rating = timeScore + qualityBonus + restBonus;

  // Ограничение 0-100
  rating = Math.max(0, Math.min(100, rating));

  return Math.round(rating);
}

/**
 * Получает текстовое описание оценки
 */
export function getSleepRatingLabel(rating: number): string {
  if (rating >= 90) return 'Отлично';
  if (rating >= 75) return 'Хорошо';
  if (rating >= 60) return 'Нормально';
  if (rating >= 40) return 'Плохо';
  return 'Очень плохо';
}

/**
 * Получает цвет оценки
 */
export function getSleepRatingColor(rating: number): string {
  if (rating >= 90) return '#22c55e'; // green
  if (rating >= 75) return '#84cc16'; // lime
  if (rating >= 60) return '#f59e0b'; // yellow
  if (rating >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

