/**
 * API routes для шагов и сна
 */

import { Router } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';
import { findOrCreateUser } from '../services/user.service';
import { toDatabaseHttpError } from '../utils/prisma';
import {
  addSleep,
  addSteps,
  addWorkout,
  deleteLastStepsEntry,
  deleteLastSleepEntry,
  deleteLastWorkoutEntry,
  deleteSleepEntry,
  deleteStepsEntry,
  deleteWorkoutEntry,
  updateSleepEntry,
  updateWorkoutEntry,
  updateStepsEntry,
  getSleepDay,
  getSleepMonth,
  getStepsDay,
  getStepsMonth,
  getWorkoutsDay,
  getWorkoutsMonth,
  getWorkoutsUntilDate,
} from '../services/activity.service';

const router = Router();

const telegramUserSchema = z.object({
  id: z.number(),
  first_name: z.string(),
  last_name: z.string().optional(),
  username: z.string().optional(),
});

// Steps
router.post('/steps', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { steps, date, source } = z
      .object({
        steps: z.number().int().positive(),
        date: z.string().optional(),
        source: z.string().optional(),
      })
      .parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const entry = await addSteps(user.id, { steps, date, source });
    const day = await getStepsDay(user.id, date);
    return res.json({ success: true, entry, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/activity/steps', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/activity/steps', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/steps', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

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

    const date = req.query.date as string | undefined;
    const day = await getStepsDay(user.id, date);
    return res.json({ success: true, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/activity/steps', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/activity/steps', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/steps/month', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

    const { year, month } = z
      .object({
        year: z.string(),
        month: z.string(),
      })
      .parse(req.query);

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

    const totalsByDate = await getStepsMonth(user.id, parseInt(year, 10), parseInt(month, 10));
    return res.json({ success: true, totalsByDate });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/activity/steps/month', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/activity/steps/month', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/workouts/month', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

    const { year, month } = z
      .object({
        year: z.string(),
        month: z.string(),
      })
      .parse(req.query);

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

    const totalsByDate = await getWorkoutsMonth(user.id, parseInt(year, 10), parseInt(month, 10));
    return res.json({ success: true, totalsByDate });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/activity/workouts/month', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/activity/workouts/month', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/sleep/month', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

    const { year, month } = z
      .object({
        year: z.string(),
        month: z.string(),
      })
      .parse(req.query);

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

    const totalsByDate = await getSleepMonth(user.id, parseInt(year, 10), parseInt(month, 10));
    return res.json({ success: true, totalsByDate });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/activity/sleep/month', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/activity/sleep/month', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/steps/decrement', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { date } = z.object({ date: z.string().optional() }).parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    await deleteLastStepsEntry(user.id, date);
    const day = await getStepsDay(user.id, date);
    return res.json({ success: true, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/activity/steps/decrement', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/activity/steps/decrement', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.put('/steps/:id', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { steps } = z
      .object({
        steps: z.number().int().positive().optional(),
      })
      .parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const entry = await updateStepsEntry(user.id, req.params.id, { steps });
    const day = await getStepsDay(user.id, entry.date.toISOString().split('T')[0]);
    return res.json({ success: true, entry, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in PUT /api/activity/steps/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in PUT /api/activity/steps/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/steps/:id', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

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

    await deleteStepsEntry(user.id, req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in DELETE /api/activity/steps/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in DELETE /api/activity/steps/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Sleep
router.post('/sleep', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { minutes, date, quality, sleepQuality, sleepRest } = z
      .object({
        minutes: z.number().int().positive(),
        date: z.string().optional(),
        quality: z.number().int().min(1).max(5).optional(),
        sleepQuality: z.enum(['excellent', 'good', 'poor', 'very_poor']).optional(),
        sleepRest: z.enum(['fully', 'enough', 'not_enough', 'very_tired']).optional(),
      })
      .parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const entry = await addSleep(user.id, { minutes, date, quality, sleepQuality, sleepRest });
    const day = await getSleepDay(user.id, date);
    return res.json({ success: true, entry, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/activity/sleep', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/activity/sleep', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/sleep', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

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

    const date = req.query.date as string | undefined;
    const day = await getSleepDay(user.id, date);
    return res.json({ success: true, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/activity/sleep', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/activity/sleep', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.put('/sleep/:id', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { minutes, quality, sleepQuality, sleepRest } = z
      .object({
        minutes: z.number().int().positive().optional(),
        quality: z.number().int().min(1).max(5).optional(),
        sleepQuality: z.enum(['excellent', 'good', 'poor', 'very_poor']).optional(),
        sleepRest: z.enum(['fully', 'enough', 'not_enough', 'very_tired']).optional(),
      })
      .parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const entry = await updateSleepEntry(user.id, req.params.id, {
      minutes,
      quality,
      sleepQuality,
      sleepRest,
    });
    const day = await getSleepDay(user.id, entry.date.toISOString().split('T')[0]);
    return res.json({ success: true, entry, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in PUT /api/activity/sleep/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in PUT /api/activity/sleep/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/sleep/:id', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

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

    await deleteSleepEntry(user.id, req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in DELETE /api/activity/sleep/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in DELETE /api/activity/sleep/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/sleep/decrement', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { date } = z.object({ date: z.string().optional() }).parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    await deleteLastSleepEntry(user.id, date);
    const day = await getSleepDay(user.id, date);
    return res.json({ success: true, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/activity/sleep/decrement', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/activity/sleep/decrement', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

// Workouts
router.post('/workouts', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { type, category, minutes, date } = z
      .object({
        type: z.string().min(1),
        category: z.string().min(1),
        minutes: z.number().int().positive(),
        date: z.string().optional(),
      })
      .parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const entry = await addWorkout(user.id, { type, category, minutes, date });
    const day = await getWorkoutsDay(user.id, date);
    return res.json({ success: true, entry, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/activity/workouts', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/activity/workouts', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.get('/workouts', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

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

    const date = req.query.date as string | undefined;
    const day = await getWorkoutsDay(user.id, date);
    return res.json({ success: true, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in GET /api/activity/workouts', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in GET /api/activity/workouts', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.post('/workouts/decrement', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { date } = z.object({ date: z.string().optional() }).parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    await deleteLastWorkoutEntry(user.id, date);
    const day = await getWorkoutsDay(user.id, date);
    return res.json({ success: true, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in POST /api/activity/workouts/decrement', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in POST /api/activity/workouts/decrement', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.put('/workouts/:id', async (req, res) => {
  try {
    const telegramUser = telegramUserSchema.parse(req.body.telegramUser || req.body);
    const { type, category, minutes } = z
      .object({
        type: z.string().optional(),
        category: z.string().optional(),
        minutes: z.number().int().positive().optional(),
      })
      .parse(req.body);

    const user = await findOrCreateUser({
      id: telegramUser.id,
      first_name: telegramUser.first_name,
      last_name: telegramUser.last_name,
      username: telegramUser.username,
    });

    const entry = await updateWorkoutEntry(user.id, req.params.id, {
      type,
      category,
      minutes,
    });
    const day = await getWorkoutsDay(user.id, entry.date.toISOString().split('T')[0]);
    return res.json({ success: true, entry, ...day });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in PUT /api/activity/workouts/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in PUT /api/activity/workouts/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

router.delete('/workouts/:id', async (req, res) => {
  try {
    const telegramUserId = req.query.telegramUserId;
    const telegramUserName = req.query.telegramUserName;
    if (!telegramUserId) return res.status(400).json({ error: 'telegramUserId is required' });

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

    await deleteWorkoutEntry(user.id, req.params.id);
    return res.json({ success: true });
  } catch (error: any) {
    const dbErr = toDatabaseHttpError(error);
    if (dbErr) {
      logger.error('Database error in DELETE /api/activity/workouts/:id', { error: error.message });
      return res.status(dbErr.status).json(dbErr.body);
    }
    logger.error('Error in DELETE /api/activity/workouts/:id', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;


