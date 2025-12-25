/**
 * Расчет макронутриентов (белки, жиры, углеводы) в граммах
 */

import { GoalType } from './calorieCalculator';

export interface MacroData {
  protein: number; // белки в граммах
  fat: number; // жиры в граммах
  carbs: number; // углеводы в граммах
}

// Коэффициенты белка на 1 кг веса по целям
const PROTEIN_PER_KG: Record<GoalType, number> = {
  lose_weight: 2.0,   // 2г на 1 кг веса
  maintain: 1.6,      // 1.6г на 1 кг веса
  gain_muscle: 1.8,   // 1.8г на 1 кг веса
};

// Жиры: всегда 1г на 1 кг веса
const FAT_PER_KG = 1.0;

// Калорийность макронутриентов
const PROTEIN_CALORIES_PER_GRAM = 4; // белки: 4 ккал/г
const FAT_CALORIES_PER_GRAM = 9;     // жиры: 9 ккал/г
const CARB_CALORIES_PER_GRAM = 4;    // углеводы: 4 ккал/г

/**
 * Расчет КБЖУ на основе калорий, цели и веса
 */
export function calculateMacros(calories: number, goal: GoalType, weight: number): MacroData | null {
  if (calories <= 0 || weight <= 0) {
    return null;
  }

  // Белки (г) = вес × коэффициент_белка
  const protein = weight * PROTEIN_PER_KG[goal];

  // Жиры (г) = вес × 1г
  const fat = weight * FAT_PER_KG;

  // Калории от белков и жиров
  const proteinCalories = protein * PROTEIN_CALORIES_PER_GRAM;
  const fatCalories = fat * FAT_CALORIES_PER_GRAM;

  // Остаток калорий для углеводов
  const remainingCalories = calories - proteinCalories - fatCalories;

  // Углеводы (г) = остаток_калорий / 4
  const carbs = remainingCalories / CARB_CALORIES_PER_GRAM;

  // Проверка на отрицательные углеводы (если калорий недостаточно)
  if (carbs < 0) {
    return null;
  }

  return {
    protein: Math.round(protein),
    fat: Math.round(fat),
    carbs: Math.round(carbs),
  };
}

