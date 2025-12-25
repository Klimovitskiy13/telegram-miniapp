/**
 * Расчет рекомендуемых калорий с учетом цели
 */

export type GoalType = 'lose_weight' | 'maintain' | 'gain_muscle';

/**
 * Расчет рекомендуемых калорий: AMR × коэффициент цели
 */
export function calculateRecommendedCalories(amr: number, goal: GoalType): number {
  switch (goal) {
    case 'lose_weight':
      // Дефицит 10%
      return amr * 0.9;
    case 'maintain':
      // Без изменений
      return amr;
    case 'gain_muscle':
      // Профицит 15%
      return amr * 1.15;
    default:
      return amr;
  }
}

