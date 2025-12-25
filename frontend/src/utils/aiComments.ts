/**
 * Утилиты для генерации AI комментариев
 */

const FALLBACK_SLEEP_COMMENTS = [
  'Хороший сон важен для восстановления организма.',
  'Качественный отдых помогает поддерживать здоровье.',
  'Регулярный сон улучшает память и концентрацию.',
  'Достаточный сон способствует укреплению иммунитета.',
  'Хороший сон помогает поддерживать эмоциональное равновесие.',
];

const FALLBACK_WORKOUT_COMMENTS = [
  'Отличная тренировка! Продолжайте в том же духе.',
  'Регулярные тренировки укрепляют здоровье.',
  'Физическая активность улучшает настроение.',
  'Тренировки помогают поддерживать форму.',
  'Активный образ жизни способствует долголетию.',
];

const FALLBACK_STEPS_COMMENTS = [
  'Хорошая активность! Шаги помогают поддерживать форму.',
  'Регулярная ходьба укрепляет сердечно-сосудистую систему.',
  'Активность в течение дня улучшает самочувствие.',
  'Ходьба помогает поддерживать здоровый вес.',
  'Ежедневные шаги способствуют общему здоровью.',
];

/**
 * Генерирует короткий комментарий для маленького блока
 */
export async function generateShortComment(
  type: 'sleep' | 'workout' | 'steps',
  data: any
): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, data, short: true }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.comment || getFallbackComment(type);
    }
  } catch (error) {
    console.error('Error generating AI comment:', error);
  }

  return getFallbackComment(type);
}

/**
 * Генерирует подробный комментарий с анализом
 */
export async function generateDetailedComment(
  type: 'sleep' | 'workout' | 'steps',
  data: any,
  history7Days: any[],
  history14Days: any[]
): Promise<string> {
  try {
    const response = await fetch('/api/ai/generate-comment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        data,
        history7Days,
        history14Days,
        short: false,
      }),
    });

    if (response.ok) {
      const result = await response.json();
      return result.comment || getFallbackComment(type);
    }
  } catch (error) {
    console.error('Error generating detailed AI comment:', error);
  }

  return getFallbackComment(type);
}

function getFallbackComment(type: 'sleep' | 'workout' | 'steps'): string {
  const comments =
    type === 'sleep'
      ? FALLBACK_SLEEP_COMMENTS
      : type === 'workout'
      ? FALLBACK_WORKOUT_COMMENTS
      : FALLBACK_STEPS_COMMENTS;
  return comments[Math.floor(Math.random() * comments.length)];
}

