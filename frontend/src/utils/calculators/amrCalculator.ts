/**
 * Расчет активного метаболизма (AMR) с учетом уровня активности
 */

export type ActivityLevel = 'rarely' | 'sometimes' | 'often' | 'constant' | 'intensive';

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  rarely: 1.2,      // Дома, за компом, мало движений
  sometimes: 1.375, // Прогулки, редкие тренировки
  often: 1.55,      // Тренировки 2–3 раза в неделю
  constant: 1.725,  // Спорт почти каждый день
  intensive: 1.9,   // Постоянные интенсивные тренировки
};

/**
 * Расчет AMR: AMR = BMR × коэффициент активности
 */
export function calculateAMR(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel];
  return bmr * multiplier;
}

