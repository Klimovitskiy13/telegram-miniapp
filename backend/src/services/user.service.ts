import { randomUUID } from 'crypto';
import { prisma } from '../utils/prisma';
import logger from '../utils/logger';

interface TelegramUserData {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface UserWithOnboarding {
  id: number;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  stepsGoal: number;
  onboarding: {
    isCompleted: boolean;
    goal: string | null;
    activityLevel: string | null;
    gender: string | null;
    height: number | null;
    weight: number | null;
    age: number | null;
    bmr: number | null;
    amr: number | null;
    recommendedCalories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  } | null;
}

/**
 * Проверяет существование пользователя по telegramId и создает нового, если не найден
 */
export async function findOrCreateUser(telegramUser: TelegramUserData): Promise<UserWithOnboarding> {
  try {
    const telegramId = telegramUser.id.toString();

    // Ищем существующего пользователя
    let user = await prisma.users.findUnique({
      where: { telegramId },
      include: {
        onboarding_data: true,
      },
    });

    // Если пользователь не найден, создаем нового
    if (!user) {
      logger.info('Creating new user', {
        telegramId,
      });

      user = await prisma.users.create({
        data: {
          telegramId,
        },
        include: {
          onboarding_data: true,
        },
      });

      logger.info('User created successfully', {
        userId: user.id,
        telegramId,
      });
    }

    // Формируем ответ
    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      stepsGoal: user.stepsGoal,
      onboarding: user.onboarding_data
        ? {
            isCompleted: user.onboarding_data.isCompleted,
            goal: user.onboarding_data.goal,
            activityLevel: user.onboarding_data.activityLevel,
            gender: user.onboarding_data.gender,
            height: user.onboarding_data.height,
            weight: user.onboarding_data.weight,
            age: user.onboarding_data.age,
            bmr: user.onboarding_data.bmr,
            amr: user.onboarding_data.amr,
            recommendedCalories: user.onboarding_data.recommendedCalories,
            protein: user.onboarding_data.protein,
            fat: user.onboarding_data.fat,
            carbs: user.onboarding_data.carbs,
          }
        : null,
    };
  } catch (error: any) {
    logger.error('Error in findOrCreateUser', {
      error: error.message,
      stack: error.stack,
      telegramId: telegramUser.id,
    });
    throw error;
  }
}

/**
 * Получает пользователя по telegramId
 */
export async function getUserByTelegramId(telegramId: string): Promise<UserWithOnboarding | null> {
  try {
    const user = await prisma.users.findUnique({
      where: { telegramId },
      include: {
        onboarding_data: true,
      },
    });

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      telegramId: user.telegramId,
      firstName: user.firstName,
      lastName: user.lastName,
      photoUrl: user.photoUrl,
      stepsGoal: user.stepsGoal,
      onboarding: user.onboarding_data
        ? {
            isCompleted: user.onboarding_data.isCompleted,
            goal: user.onboarding_data.goal,
            activityLevel: user.onboarding_data.activityLevel,
            gender: user.onboarding_data.gender,
            height: user.onboarding_data.height,
            weight: user.onboarding_data.weight,
            age: user.onboarding_data.age,
            bmr: user.onboarding_data.bmr,
            amr: user.onboarding_data.amr,
            recommendedCalories: user.onboarding_data.recommendedCalories,
            protein: user.onboarding_data.protein,
            fat: user.onboarding_data.fat,
            carbs: user.onboarding_data.carbs,
          }
        : null,
    };
  } catch (error: any) {
    logger.error('Error in getUserByTelegramId', {
      error: error.message,
      telegramId,
    });
    throw error;
  }
}

/**
 * Сохраняет или обновляет цель пользователя
 */
export async function saveUserGoal(userId: number, goal: string): Promise<void> {
  try {
    // Проверяем, существует ли запись онбординга
    const existingOnboarding = await prisma.onboarding_data.findUnique({
      where: { userId },
    });

    if (existingOnboarding) {
      // Обновляем существующую запись
      await prisma.onboarding_data.update({
        where: { userId },
        data: {
          goal,
          updatedAt: new Date(),
        },
      });

      logger.info('User goal updated', {
        userId,
        goal,
      });
    } else {
      // Создаем новую запись онбординга
      await prisma.onboarding_data.create({
        data: {
          id: randomUUID(),
          userId,
          goal,
        },
      });

      logger.info('User goal created', {
        userId,
        goal,
      });
    }
  } catch (error: any) {
    logger.error('Error saving user goal', {
      error: error.message,
      stack: error.stack,
      userId,
      goal,
    });
    throw error;
  }
}

/**
 * Сохраняет или обновляет уровень активности пользователя
 */
export async function saveUserActivityLevel(userId: number, activityLevel: string): Promise<void> {
  try {
    // Проверяем, существует ли запись онбординга
    const existingOnboarding = await prisma.onboarding_data.findUnique({
      where: { userId },
    });

    if (existingOnboarding) {
      // Обновляем существующую запись
      await prisma.onboarding_data.update({
        where: { userId },
        data: {
          activityLevel,
          updatedAt: new Date(),
        },
      });

      logger.info('User activity level updated', {
        userId,
        activityLevel,
      });
    } else {
      // Создаем новую запись онбординга
      await prisma.onboarding_data.create({
        data: {
          id: randomUUID(),
          userId,
          activityLevel,
        },
      });

      logger.info('User activity level created', {
        userId,
        activityLevel,
      });
    }
  } catch (error: any) {
    logger.error('Error saving user activity level', {
      error: error.message,
      stack: error.stack,
      userId,
      activityLevel,
    });
    throw error;
  }
}

/**
 * Сохраняет или обновляет профиль пользователя (пол, рост, вес, возраст)
 */
export async function saveUserProfile(
  userId: number,
  profile: {
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
    age?: number | null;
  }
): Promise<void> {
  try {
    // Проверяем, существует ли запись онбординга
    const existingOnboarding = await prisma.onboarding_data.findUnique({
      where: { userId },
    });

    if (existingOnboarding) {
      // Обновляем существующую запись
      await prisma.onboarding_data.update({
        where: { userId },
        data: {
          gender: profile.gender ?? undefined,
          height: profile.height ?? undefined,
          weight: profile.weight ?? undefined,
          age: profile.age ?? undefined,
          updatedAt: new Date(),
        },
      });

      logger.info('User profile updated', {
        userId,
        profile,
      });
    } else {
      // Создаем новую запись онбординга
      await prisma.onboarding_data.create({
        data: {
          id: randomUUID(),
          userId,
          gender: profile.gender ?? undefined,
          height: profile.height ?? undefined,
          weight: profile.weight ?? undefined,
          age: profile.age ?? undefined,
        },
      });

      logger.info('User profile created', {
        userId,
        profile,
      });
    }
  } catch (error: any) {
    logger.error('Error saving user profile', {
      error: error.message,
      stack: error.stack,
      userId,
      profile,
    });
    throw error;
  }
}

/**
 * Сохраняет или обновляет данные питания пользователя (BMR, AMR, калории, КБЖУ)
 */
export async function saveUserNutritionData(
  userId: number,
  nutritionData: {
    bmr?: number | null;
    amr?: number | null;
    recommendedCalories?: number | null;
    protein?: number | null;
    fat?: number | null;
    carbs?: number | null;
  }
): Promise<void> {
  try {
    // Проверяем, существует ли запись онбординга
    const existingOnboarding = await prisma.onboarding_data.findUnique({
      where: { userId },
    });

    if (existingOnboarding) {
      // Обновляем существующую запись
      await prisma.onboarding_data.update({
        where: { userId },
        data: {
          bmr: nutritionData.bmr ?? undefined,
          amr: nutritionData.amr ?? undefined,
          recommendedCalories: nutritionData.recommendedCalories ?? undefined,
          protein: nutritionData.protein ?? undefined,
          fat: nutritionData.fat ?? undefined,
          carbs: nutritionData.carbs ?? undefined,
          updatedAt: new Date(),
        },
      });

      logger.info('User nutrition data updated', {
        userId,
        nutritionData,
      });
    } else {
      // Создаем новую запись онбординга
      await prisma.onboarding_data.create({
        data: {
          id: randomUUID(),
          userId,
          bmr: nutritionData.bmr ?? undefined,
          amr: nutritionData.amr ?? undefined,
          recommendedCalories: nutritionData.recommendedCalories ?? undefined,
          protein: nutritionData.protein ?? undefined,
          fat: nutritionData.fat ?? undefined,
          carbs: nutritionData.carbs ?? undefined,
        },
      });

      logger.info('User nutrition data created', {
        userId,
        nutritionData,
      });
    }
  } catch (error: any) {
      logger.error('Error saving user nutrition data', {
      error: error.message,
      stack: error.stack,
      userId,
      nutritionData,
    });
    throw error;
  }
}

/**
 * Сохраняет или обновляет имя и фото пользователя
 */
export async function saveUserNameAndPhoto(
  userId: number,
  data: {
    firstName?: string | null;
    lastName?: string | null;
    photoUrl?: string | null;
  }
): Promise<void> {
  try {
    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.firstName !== undefined) {
      updateData.firstName = data.firstName;
    }
    if (data.lastName !== undefined) {
      updateData.lastName = data.lastName;
    }
    if (data.photoUrl !== undefined) {
      updateData.photoUrl = data.photoUrl;
    }

    await prisma.users.update({
      where: { id: userId },
      data: updateData,
    });

    logger.info('User name and photo updated', {
      userId,
      data,
    });
  } catch (error: any) {
    logger.error('Error saving user name and photo', {
      error: error.message,
      stack: error.stack,
      userId,
      data,
    });
    throw error;
  }
}

/**
 * Устанавливает флаг завершения онбординга
 */
export async function completeOnboarding(userId: number): Promise<void> {
  try {
    // Проверяем, существует ли запись онбординга
    const existingOnboarding = await prisma.onboarding_data.findUnique({
      where: { userId },
    });

    if (existingOnboarding) {
      // Обновляем существующую запись
      await prisma.onboarding_data.update({
        where: { userId },
        data: {
          isCompleted: true,
          updatedAt: new Date(),
        },
      });

      logger.info('Onboarding completed', {
        userId,
      });
    } else {
      // Создаем новую запись онбординга с isCompleted = true
      await prisma.onboarding_data.create({
        data: {
          id: randomUUID(),
          userId,
          isCompleted: true,
        },
      });

      logger.info('Onboarding completed (new record)', {
        userId,
      });
    }
  } catch (error: any) {
    logger.error('Error completing onboarding', {
      error: error.message,
      stack: error.stack,
      userId,
    });
    throw error;
  }
}

/**
 * Обновляет цель по шагам пользователя
 */
export async function updateStepsGoal(userId: number, stepsGoal: number): Promise<void> {
  try {
    await prisma.users.update({
      where: { id: userId },
      data: {
        stepsGoal,
        updatedAt: new Date(),
      },
    });

    logger.info('User steps goal updated', {
      userId,
      stepsGoal,
    });
  } catch (error: any) {
    logger.error('Error updating user steps goal', {
      error: error.message,
      stack: error.stack,
      userId,
      stepsGoal,
    });
    throw error;
  }
}

