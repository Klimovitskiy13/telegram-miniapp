import { Router, Request, Response } from 'express';
import { findOrCreateUser, saveUserGoal, saveUserActivityLevel, saveUserProfile, saveUserNutritionData, saveUserNameAndPhoto, completeOnboarding, updateStepsGoal } from '../services/user.service';
import logger from '../utils/logger';
import { toDatabaseHttpError } from '../utils/prisma';
import { z } from 'zod';

const router = Router();

// Схема валидации для Telegram пользователя
const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

/**
 * POST /api/users/check
 * Проверяет/создает пользователя по данным Telegram
 */
router.post('/check', async (req: Request, res: Response) => {
  try {
    // Валидация входных данных
    const telegramUser = telegramUserSchema.parse(req.body);

    logger.info('User check request', {
      telegramId: telegramUser.id,
      username: telegramUser.username,
    });

    // Проверяем/создаем пользователя
    const user = await findOrCreateUser(telegramUser);

    logger.info('User check completed', {
      userId: user.id,
      telegramId: user.telegramId,
      hasOnboarding: !!user.onboarding,
    });

    return res.json({
      success: true,
      user,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid user data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid user data',
        details: error.errors,
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/check', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error checking user', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/users/goal
 * Сохраняет/обновляет цель пользователя
 */
router.post('/goal', async (req: Request, res: Response) => {
  try {
    const { userId, goal } = z.object({
      userId: z.number(),
      goal: z.string(),
    }).parse(req.body);

    logger.info('Save goal request', {
      userId,
      goal,
    });

    await saveUserGoal(userId, goal);

    logger.info('Goal saved successfully', {
      userId,
      goal,
    });

    return res.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid goal data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid goal data',
        details: error.errors,
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/goal', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error saving goal', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/users/activity-level
 * Сохраняет/обновляет уровень активности пользователя
 */
router.post('/activity-level', async (req: Request, res: Response) => {
  try {
    const { userId, activityLevel } = z.object({
      userId: z.number(),
      activityLevel: z.string(),
    }).parse(req.body);

    logger.info('Save activity level request', {
      userId,
      activityLevel,
    });

    await saveUserActivityLevel(userId, activityLevel);

    logger.info('Activity level saved successfully', {
      userId,
      activityLevel,
    });

    return res.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid activity level data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid activity level data',
        details: error.errors,
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/activity-level', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error saving activity level', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/users/profile
 * Сохраняет/обновляет профиль пользователя (пол, рост, вес, возраст)
 */
router.post('/profile', async (req: Request, res: Response) => {
  try {
    const { userId, gender, height, weight, age } = z.object({
      userId: z.number(),
      gender: z.string().nullable().optional(),
      height: z.number().nullable().optional(),
      weight: z.number().nullable().optional(),
      age: z.number().nullable().optional(),
    }).parse(req.body);

    logger.info('Save profile request', {
      userId,
      gender,
      height,
      weight,
      age,
    });

    await saveUserProfile(userId, {
      gender: gender ?? null,
      height: height ?? null,
      weight: weight ?? null,
      age: age ?? null,
    });

    logger.info('Profile saved successfully', {
      userId,
      gender,
      height,
      weight,
      age,
    });

    return res.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid profile data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid profile data',
        details: error.errors,
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/profile', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error saving profile', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/users/nutrition
 * Сохраняет/обновляет данные питания пользователя (BMR, AMR, калории, КБЖУ)
 */
router.post('/nutrition', async (req: Request, res: Response) => {
  try {
    const { userId, bmr, amr, recommendedCalories, protein, fat, carbs } = z.object({
      userId: z.number(),
      bmr: z.number().nullable().optional(),
      amr: z.number().nullable().optional(),
      recommendedCalories: z.number().nullable().optional(),
      protein: z.number().nullable().optional(),
      fat: z.number().nullable().optional(),
      carbs: z.number().nullable().optional(),
    }).parse(req.body);

    logger.info('Save nutrition data request', {
      userId,
      bmr,
      amr,
      recommendedCalories,
      protein,
      fat,
      carbs,
    });

    await saveUserNutritionData(userId, {
      bmr: bmr ?? null,
      amr: amr ?? null,
      recommendedCalories: recommendedCalories ?? null,
      protein: protein ?? null,
      fat: fat ?? null,
      carbs: carbs ?? null,
    });

    logger.info('Nutrition data saved successfully', {
      userId,
      bmr,
      amr,
      recommendedCalories,
      protein,
      fat,
      carbs,
    });

    return res.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid nutrition data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid nutrition data',
        details: error.errors,
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/nutrition', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error saving nutrition data', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/users/name-photo
 * Сохраняет/обновляет имя и фото пользователя
 */
router.post('/name-photo', async (req: Request, res: Response) => {
  try {
    const { userId, firstName, lastName, photoUrl } = z.object({
      userId: z.number(),
      firstName: z.string().nullable().optional(),
      lastName: z.string().nullable().optional(),
      photoUrl: z.string().nullable().optional(),
    }).parse(req.body);

    logger.info('Save name and photo request', {
      userId,
      firstName,
      lastName,
      photoUrl,
    });

    await saveUserNameAndPhoto(userId, {
      firstName: firstName ?? null,
      lastName: lastName ?? null,
      photoUrl: photoUrl ?? null,
    });

    logger.info('Name and photo saved successfully', {
      userId,
      firstName,
      lastName,
      photoUrl,
    });

    return res.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid name and photo data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid name and photo data',
        details: error.errors,
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/name-photo', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error saving name and photo', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/users/complete-onboarding
 * Устанавливает флаг завершения онбординга
 */
router.post('/complete-onboarding', async (req: Request, res: Response) => {
  try {
    const { userId } = z.object({
      userId: z.number(),
    }).parse(req.body);

    logger.info('Complete onboarding request', {
      userId,
    });

    await completeOnboarding(userId);

    logger.info('Onboarding completed successfully', {
      userId,
    });

    return res.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid complete onboarding data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/complete-onboarding', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error completing onboarding', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

/**
 * POST /api/users/steps-goal
 * Обновляет цель по шагам пользователя
 */
router.post('/steps-goal', async (req: Request, res: Response) => {
  try {
    const { userId, stepsGoal } = z.object({
      userId: z.number(),
      stepsGoal: z.number().int().positive(),
    }).parse(req.body);

    logger.info('Update steps goal request', {
      userId,
      stepsGoal,
    });

    await updateStepsGoal(userId, stepsGoal);

    logger.info('Steps goal updated successfully', {
      userId,
      stepsGoal,
    });

    return res.json({
      success: true,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      logger.warn('Invalid steps goal data', {
        errors: error.errors,
      });
      return res.status(400).json({
        success: false,
        error: 'Invalid steps goal data',
        details: error.errors,
      });
    }

    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in /api/users/steps-goal', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }

    logger.error('Error updating steps goal', {
      error: error.message,
      stack: error.stack,
    });

    return res.status(500).json({
      success: false,
      error: 'Internal server error',
    });
  }
});

export default router;

