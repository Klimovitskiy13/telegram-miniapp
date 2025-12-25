/**
 * Главный координирующий калькулятор для расчета всех данных питания
 */

import { calculateBMR, BMRData } from './bmrCalculator';
import { calculateAMR, ActivityLevel } from './amrCalculator';
import { calculateRecommendedCalories, GoalType } from './calorieCalculator';
import { calculateMacros, MacroData } from './macroCalculator';

export interface NutritionData {
  bmr: number; // базовый метаболизм
  amr: number; // активный метаболизм
  recommendedCalories: number; // рекомендуемые калории
  macros: MacroData; // белки, жиры, углеводы
}

export interface UserProfile {
  weight?: number | null; // вес в кг
  height?: number | null; // рост в см
  age?: number | null; // возраст в годах
  gender?: 'male' | 'female' | null; // пол
  goal?: GoalType | null; // цель
  activityLevel?: ActivityLevel | null; // уровень активности
}

/**
 * Расчет полных данных питания на основе профиля пользователя
 */
export function calculateFullNutrition(profile: UserProfile): NutritionData | null {
  // Проверка обязательных данных
  if (!profile.weight || !profile.height || !profile.goal || !profile.activityLevel) {
    return null;
  }

  // Значения по умолчанию
  const age = profile.age ?? 25;
  const gender = profile.gender ?? 'male';

  // 1. Расчет BMR
  const bmrData: BMRData = {
    weight: profile.weight,
    height: profile.height,
    age,
    gender,
  };

  const bmr = calculateBMR(bmrData);
  if (!bmr || bmr <= 0) {
    return null;
  }

  // 2. Расчет AMR
  const amr = calculateAMR(bmr, profile.activityLevel);

  // 3. Расчет рекомендуемых калорий
  const recommendedCalories = calculateRecommendedCalories(amr, profile.goal);

  // 4. Расчет КБЖУ (нужен вес для расчета)
  const macros = calculateMacros(recommendedCalories, profile.goal, profile.weight);
  if (!macros) {
    return null;
  }

  return {
    bmr: Math.round(bmr),
    amr: Math.round(amr),
    recommendedCalories: Math.round(recommendedCalories),
    macros,
  };
}

