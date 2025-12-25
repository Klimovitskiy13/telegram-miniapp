/**
 * Формула оценки тренировки (0-100)
 * Основана на типе, категории и длительности тренировки
 */

export interface WorkoutRatingInput {
  type: string;
  category: string;
  minutes: number;
}

/**
 * Рассчитывает оценку тренировки от 0 до 100
 */
export function calculateWorkoutRating({ type, category, minutes }: WorkoutRatingInput): number {
  // Базовый балл за длительность (0-50)
  let durationScore = 0;
  if (minutes >= 60) {
    durationScore = 50;
  } else if (minutes >= 45) {
    durationScore = 45;
  } else if (minutes >= 30) {
    durationScore = 35;
  } else if (minutes >= 20) {
    durationScore = 25;
  } else if (minutes >= 15) {
    durationScore = 15;
  } else if (minutes >= 10) {
    durationScore = 10;
  } else {
    durationScore = 5;
  }

  // Бонус за категорию тренировки (0-30)
  let categoryBonus = 0;
  const highIntensityCategories = ['Силовая', 'HIIT', 'Функциональная', 'Кроссфит'];
  const moderateCategories = ['Кардио', 'Смешанная', 'Плавание', 'Водные виды'];
  const lowCategories = ['Растяжка', 'Йога', 'Пилатес', 'Заминка', 'Кор'];

  if (highIntensityCategories.some(cat => category.includes(cat))) {
    categoryBonus = 30;
  } else if (moderateCategories.some(cat => category.includes(cat))) {
    categoryBonus = 20;
  } else if (lowCategories.some(cat => category.includes(cat))) {
    categoryBonus = 10;
  } else {
    categoryBonus = 15; // Среднее значение для неизвестных категорий
  }

  // Бонус за тип тренировки (0-20)
  let typeBonus = 0;
  const intenseTypes = ['Бег', 'ВИИТ', 'HIIT', 'Силовая', 'Функциональная'];
  const moderateTypes = ['Велосипед', 'Эллипсоид', 'Плавание', 'Ходьба'];
  
  if (intenseTypes.some(t => type.includes(t))) {
    typeBonus = 20;
  } else if (moderateTypes.some(t => type.includes(t))) {
    typeBonus = 15;
  } else {
    typeBonus = 10;
  }

  // Итоговая оценка
  let rating = durationScore + categoryBonus + typeBonus;

  // Ограничение 0-100
  rating = Math.max(0, Math.min(100, rating));

  return Math.round(rating);
}

/**
 * Получает текстовое описание оценки
 */
export function getWorkoutRatingLabel(rating: number): string {
  if (rating >= 90) return 'Отлично';
  if (rating >= 75) return 'Хорошо';
  if (rating >= 60) return 'Нормально';
  if (rating >= 40) return 'Слабо';
  return 'Очень слабо';
}

/**
 * Получает цвет оценки
 */
export function getWorkoutRatingColor(rating: number): string {
  if (rating >= 90) return '#22c55e'; // green
  if (rating >= 75) return '#84cc16'; // lime
  if (rating >= 60) return '#f59e0b'; // yellow
  if (rating >= 40) return '#f97316'; // orange
  return '#ef4444'; // red
}

