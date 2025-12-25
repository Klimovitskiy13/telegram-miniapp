/**
 * API routes для дневника питания
 */

import { Router } from 'express';
import {
  saveFoodEntry,
  getFoodEntries,
  deleteFoodEntry,
  saveWaterEntry,
  getWaterEntries,
  deleteLastWaterEntry,
  getDailyNutritionStats,
} from '../services/nutrition.service';
import { findOrCreateUser } from '../services/user.service';
import logger from '../utils/logger';
import { toDatabaseHttpError } from '../utils/prisma';
import { z } from 'zod';

// Схема валидации для Telegram пользователя
const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

const router = Router();

/**
 * POST /api/nutrition/food
 * Сохранение блюда в дневник
 */
router.post('/food', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const { mealType, foodName, portionSize, unit, calories, protein, fat, carbs, imageUrl, date } = req.body;

    if (!mealType || !foodName || !portionSize || !unit) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const entry = await saveFoodEntry(user.id, {
      mealType,
      foodName,
      portionSize,
      unit,
      calories: calories ?? null,
      protein: protein ?? null,
      fat: fat ?? null,
      carbs: carbs ?? null,
      imageUrl: imageUrl ?? null,
      date: date ?? undefined,
    });

    return res.json({ success: true, entry });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/nutrition/food', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/nutrition/food', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/nutrition/food
 * Получение блюд за день
 */
router.get('/food', async (req, res) => {
  try {
    // Для GET запросов получаем telegramUser из query параметров
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    
    if (!telegramUserId) {
      return res.status(400).json({ error: 'telegramUserId is required' });
    }

    const telegramUser = telegramUserSchema.parse({
      id: parseInt(telegramUserId as string, 10),
      first_name: (telegramUserName as string) || 'User',
    });

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const { date } = req.query;

    const entries = await getFoodEntries(user.id, date as string | undefined);

    return res.json({ success: true, entries });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/nutrition/food', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/nutrition/food', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /api/nutrition/food/:id
 * Удаление блюда из дневника
 */
router.delete('/food/:id', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const { id } = req.params;

    const result = await deleteFoodEntry(user.id, id);

    return res.json(result);
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in DELETE /api/nutrition/food/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in DELETE /api/nutrition/food/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/nutrition/water
 * Сохранение воды
 */
router.post('/water', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const { amount, date } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    const entry = await saveWaterEntry(user.id, {
      amount,
      date: date ?? undefined,
    });

    return res.json({ success: true, entry });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/nutrition/water', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/nutrition/water', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/nutrition/water
 * Получение воды за день
 */
router.get('/water', async (req, res) => {
  try {
    // Для GET запросов получаем telegramUser из query параметров
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    
    if (!telegramUserId) {
      return res.status(400).json({ error: 'telegramUserId is required' });
    }

    const telegramUser = telegramUserSchema.parse({
      id: parseInt(telegramUserId as string, 10),
      first_name: (telegramUserName as string) || 'User',
    });

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const { date } = req.query;

    const result = await getWaterEntries(user.id, date as string | undefined);

    return res.json({ success: true, ...result });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/nutrition/water', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/nutrition/water', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/nutrition/water/decrement
 * Уменьшить воду (удалить последнюю запись за день)
 */
router.post('/water/decrement', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const { date } = req.body;

    await deleteLastWaterEntry(user.id, date ?? undefined);
    const result = await getWaterEntries(user.id, date ?? undefined);

    return res.json({ success: true, ...result });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/nutrition/water/decrement', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/nutrition/water/decrement', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * GET /api/nutrition/stats
 * Получение статистики питания за день
 */
router.get('/stats', async (req, res) => {
  try {
    // Для GET запросов получаем telegramUser из query параметров
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    
    if (!telegramUserId) {
      return res.status(400).json({ error: 'telegramUserId is required' });
    }

    const telegramUser = telegramUserSchema.parse({
      id: parseInt(telegramUserId as string, 10),
      first_name: (telegramUserName as string) || 'User',
    });

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const { date } = req.query;

    const stats = await getDailyNutritionStats(user.id, date as string | undefined);

    return res.json({ success: true, stats });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/nutrition/stats', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/nutrition/stats', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;

