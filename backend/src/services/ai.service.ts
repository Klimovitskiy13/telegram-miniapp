/**
 * Сервис для генерации AI комментариев через OpenAI
 */

import logger from '../utils/logger';
import { openAIService } from './openai.service';

const FALLBACK_SLEEP_COMMENTS_SHORT = [
  'Хороший сон важен для восстановления организма.',
  'Качественный отдых помогает поддерживать здоровье.',
  'Регулярный сон улучшает память и концентрацию.',
  'Достаточный сон способствует укреплению иммунитета.',
];

const FALLBACK_SLEEP_COMMENTS_DETAILED = [
  'Продолжайте следить за режимом сна. Регулярный качественный отдых - основа здоровья.',
  'Старайтесь ложиться спать в одно и то же время. Это поможет улучшить качество сна.',
  'Обратите внимание на условия сна: темнота, тишина и комфортная температура.',
];

const FALLBACK_WORKOUT_COMMENTS_SHORT = [
  'Отличная тренировка! Продолжайте в том же духе.',
  'Регулярные тренировки укрепляют здоровье.',
  'Физическая активность улучшает настроение.',
];

const FALLBACK_WORKOUT_COMMENTS_DETAILED = [
  'Отличная работа! Продолжайте тренироваться регулярно для лучших результатов.',
  'Разнообразие тренировок поможет развить разные группы мышц.',
  'Не забывайте про восстановление между тренировками.',
];

const FALLBACK_STEPS_COMMENTS_SHORT = [
  'Хорошая активность! Шаги помогают поддерживать форму.',
  'Регулярная ходьба укрепляет сердечно-сосудистую систему.',
  'Активность в течение дня улучшает самочувствие.',
];

const FALLBACK_STEPS_COMMENTS_DETAILED = [
  'Продолжайте быть активными! Регулярная ходьба - отличный способ поддерживать здоровье.',
  'Старайтесь делать больше шагов каждый день для улучшения выносливости.',
  'Ходьба помогает поддерживать здоровый вес и укрепляет сердце.',
];

async function generateCommentWithOpenAI(
  prompt: string,
  short: boolean
): Promise<string | null> {
  if (!openAIService.isAvailable()) return null;

  try {
    const systemPrompt = short
      ? 'Ты помощник для фитнес-приложения. Дай короткий позитивный комментарий (до 15 слов) на русском языке.'
      : 'Ты помощник для фитнес-приложения. Дай подробный анализ и рекомендации (до 50 слов) на русском языке. Будь конкретным и полезным.';

    const response = await openAIService.quickChat(prompt, systemPrompt);
    return response?.trim() || null;
  } catch (error: any) {
    logger.error('OpenAI API error', { error: error.message });
    return null;
  }
}

export async function generateSleepComment(
  data: any,
  history7Days: any[],
  history14Days: any[],
  short: boolean
): Promise<string> {
  const { minutes, sleepQuality, sleepRest } = data;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (short) {
    const prompt = `Пользователь спал ${hours}ч ${mins}м. Качество: ${sleepQuality || 'не указано'}, Выспался: ${sleepRest || 'не указано'}. Дай короткий позитивный комментарий.`;
    const comment = await generateCommentWithOpenAI(prompt, true);
    if (comment) return comment;
    return FALLBACK_SLEEP_COMMENTS_SHORT[Math.floor(Math.random() * FALLBACK_SLEEP_COMMENTS_SHORT.length)];
  }

  // Подробный комментарий с анализом истории
  const avg7Days = history7Days.length > 0
    ? Math.round(history7Days.reduce((sum, d) => sum + (d.minutes || 0), 0) / history7Days.length / 60 * 10) / 10
    : 0;
  const avg14Days = history14Days.length > 0
    ? Math.round(history14Days.reduce((sum, d) => sum + (d.minutes || 0), 0) / history14Days.length / 60 * 10) / 10
    : 0;

  const prompt = `Пользователь спит в среднем ${avg7Days}ч за последние 7 дней и ${avg14Days}ч за последние 14 дней. Сегодня спал ${hours}ч ${mins}м. Качество: ${sleepQuality || 'не указано'}, Выспался: ${sleepRest || 'не указано'}. Проанализируй сон и дай рекомендации.`;
  
  const comment = await generateCommentWithOpenAI(prompt, false);
  if (comment) return comment;
  
  return FALLBACK_SLEEP_COMMENTS_DETAILED[Math.floor(Math.random() * FALLBACK_SLEEP_COMMENTS_DETAILED.length)];
}

export async function generateWorkoutComment(
  data: any,
  history7Days: any[],
  history14Days: any[],
  short: boolean
): Promise<string> {
  const { type, category, minutes } = data;

  if (short) {
    const prompt = `Пользователь выполнил тренировку: ${type} (${category}), ${minutes} минут. Дай короткий позитивный комментарий.`;
    const comment = await generateCommentWithOpenAI(prompt, true);
    if (comment) return comment;
    return FALLBACK_WORKOUT_COMMENTS_SHORT[Math.floor(Math.random() * FALLBACK_WORKOUT_COMMENTS_SHORT.length)];
  }

  const total7Days = history7Days.reduce((sum, d) => sum + (d.minutes || 0), 0);
  const total14Days = history14Days.reduce((sum, d) => sum + (d.minutes || 0), 0);

  const prompt = `Пользователь тренировался ${total7Days} минут за последние 7 дней и ${total14Days} минут за последние 14 дней. Сегодня: ${type} (${category}), ${minutes} минут. Проанализируй тренировки и дай рекомендации.`;
  
  const comment = await generateCommentWithOpenAI(prompt, false);
  if (comment) return comment;
  
  return FALLBACK_WORKOUT_COMMENTS_DETAILED[Math.floor(Math.random() * FALLBACK_WORKOUT_COMMENTS_DETAILED.length)];
}

export async function generateStepsComment(
  data: any,
  history7Days: any[],
  history14Days: any[],
  short: boolean
): Promise<string> {
  const { steps } = data;

  if (short) {
    const prompt = `Пользователь прошел ${steps} шагов. Дай короткий позитивный комментарий.`;
    const comment = await generateCommentWithOpenAI(prompt, true);
    if (comment) return comment;
    return FALLBACK_STEPS_COMMENTS_SHORT[Math.floor(Math.random() * FALLBACK_STEPS_COMMENTS_SHORT.length)];
  }

  const avg7Days = history7Days.length > 0
    ? Math.round(history7Days.reduce((sum, d) => sum + (d.steps || 0), 0) / history7Days.length)
    : 0;
  const avg14Days = history14Days.length > 0
    ? Math.round(history14Days.reduce((sum, d) => sum + (d.steps || 0), 0) / history14Days.length)
    : 0;

  const prompt = `Пользователь в среднем проходит ${avg7Days} шагов за последние 7 дней и ${avg14Days} шагов за последние 14 дней. Сегодня: ${steps} шагов. Проанализируй активность и дай рекомендации.`;
  
  const comment = await generateCommentWithOpenAI(prompt, false);
  if (comment) return comment;
  
  return FALLBACK_STEPS_COMMENTS_DETAILED[Math.floor(Math.random() * FALLBACK_STEPS_COMMENTS_DETAILED.length)];
}

