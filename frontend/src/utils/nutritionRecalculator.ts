/**
 * Утилита для пересчета и сохранения данных питания при изменении параметров пользователя
 */

import { checkUser, saveNutritionData } from '../api/user';
import { getTelegramUser } from '../api/telegram';
import { calculateFullNutrition, UserProfile } from './calculators/nutritionCalculator';
import { GoalType } from './calculators/calorieCalculator';
import { ActivityLevel } from './calculators/amrCalculator';

/**
 * Пересчитывает и сохраняет данные питания для пользователя
 * Вызывается при изменении любого параметра (цель, активность, профиль)
 */
export async function recalculateAndSaveNutrition(userId: number): Promise<void> {
  try {
    // Получаем актуальные данные пользователя
    const telegramUser = getTelegramUser();
    if (!telegramUser) {
      console.warn('Telegram user not found, cannot recalculate nutrition');
      return;
    }

    const response = await checkUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    if (!response.success || !response.user || !response.user.onboarding) {
      console.warn('User data not found, cannot recalculate nutrition');
      return;
    }

    const onboarding = response.user.onboarding;

    // Проверяем, что есть все необходимые данные для расчета
    if (
      !onboarding.weight ||
      !onboarding.height ||
      !onboarding.goal ||
      !onboarding.activityLevel
    ) {
      // Не все данные есть, расчет невозможен
      return;
    }

    // Формируем профиль пользователя
    const profile: UserProfile = {
      weight: onboarding.weight,
      height: onboarding.height,
      age: onboarding.age ?? null,
      gender: (onboarding.gender as 'male' | 'female') ?? null,
      goal: onboarding.goal as GoalType,
      activityLevel: onboarding.activityLevel as ActivityLevel,
    };

    // Рассчитываем данные питания
    const calculated = calculateFullNutrition(profile);
    if (!calculated) {
      console.warn('Failed to calculate nutrition data');
      return;
    }

    // Сохраняем рассчитанные данные в базу
    await saveNutritionData(userId, {
      bmr: calculated.bmr,
      amr: calculated.amr,
      recommendedCalories: calculated.recommendedCalories,
      protein: calculated.macros.protein,
      fat: calculated.macros.fat,
      carbs: calculated.macros.carbs,
    });

    console.log('Nutrition data recalculated and saved', calculated);
  } catch (error) {
    console.error('Error recalculating nutrition data:', error);
    // Не прерываем выполнение, просто логируем ошибку
  }
}

