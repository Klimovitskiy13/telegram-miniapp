/**
 * API routes для избранных продуктов
 */

import { Router } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';
import { findOrCreateUser } from '../services/user.service';
import { deleteFavorite, listFavorites, toggleFavorite } from '../services/favorites.service';
import { toDatabaseHttpError } from '../utils/prisma';

const router = Router();

const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

const favoriteSchema = z.object({
  foodName: z.string().min(1),
  portionSize: z.number().positive(),
  unit: z.enum(['г', 'мл', 'шт']),
  calories: z.number().nullable().optional(),
  protein: z.number().nullable().optional(),
  fat: z.number().nullable().optional(),
  carbs: z.number().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

/**
 * GET /api/favorites
 */
router.get('/', async (req, res) => {
  try {
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

    const items = await listFavorites(user.id);
    return res.json({ success: true, items });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/favorites', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/favorites', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * POST /api/favorites/toggle
 */
router.post('/toggle', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const favorite = favoriteSchema.parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const result = await toggleFavorite(user.id, favorite);
    return res.json({ success: true, ...result });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/favorites/toggle', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/favorites/toggle', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

/**
 * DELETE /api/favorites/:id
 */
router.delete('/:id', async (req, res) => {
  try {
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

    const { id } = req.params;
    const result = await deleteFavorite(user.id, id);
    return res.json(result);
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in DELETE /api/favorites/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in DELETE /api/favorites/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;


