/**
 * API routes для AI комментариев
 */

import { Router } from 'express';
import { z } from 'zod';
import logger from '../utils/logger';
import { generateSleepComment, generateWorkoutComment, generateStepsComment } from '../services/ai.service';

const router = Router();

const commentRequestSchema = z.object({
  type: z.enum(['sleep', 'workout', 'steps']),
  data: z.any(),
  history7Days: z.array(z.any()).optional(),
  history14Days: z.array(z.any()).optional(),
  short: z.boolean().default(false),
});

router.post('/generate-comment', async (req, res) => {
  try {
    const { type, data, history7Days, history14Days, short } = commentRequestSchema.parse(req.body);

    let comment: string;

    if (type === 'sleep') {
      comment = await generateSleepComment(data, history7Days || [], history14Days || [], short);
    } else if (type === 'workout') {
      comment = await generateWorkoutComment(data, history7Days || [], history14Days || [], short);
    } else {
      comment = await generateStepsComment(data, history7Days || [], history14Days || [], short);
    }

    return res.json({ success: true, comment });
  } catch (error: any) {
    logger.error('Error generating AI comment', { error: error.message });
    return res.status(500).json({ error: 'Internal server error', message: error.message });
  }
});

export default router;

