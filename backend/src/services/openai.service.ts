import OpenAI from 'openai';
import { env } from '../utils/env';
import logger from '../utils/logger';

/**
 * Сервис для работы с OpenAI API
 */
class OpenAIService {
  private client: OpenAI | null = null;
  private concurrencyMax: number;
  private active = 0;
  private queue: Array<() => void> = [];

  constructor() {
    this.concurrencyMax = Math.max(1, Number(process.env.OPENAI_CONCURRENCY ?? 4));
    if (env.OPENAI_API_KEY) {
      this.client = new OpenAI({
        apiKey: env.OPENAI_API_KEY,
      });
      logger.info('OpenAI service initialized');
    } else {
      logger.warn('⚠️  OPENAI_API_KEY не установлен');
    }
  }

  /**
   * Проверка доступности сервиса
   */
  isAvailable(): boolean {
    return this.client !== null;
  }

  /**
   * Отправка сообщения в ChatGPT
   */
  async chat(
    messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>,
    requestId?: string
  ) {
    if (!this.client) {
      throw new Error('OpenAI client не инициализирован');
    }

    try {
      logger.debug('Sending request to OpenAI', {
        requestId,
        messageCount: messages.length,
        model: 'gpt-4',
        concurrency: { active: this.active, max: this.concurrencyMax, queued: this.queue.length },
      });

      const response = await this.withLimit(() =>
        this.client!.chat.completions.create({
          model: 'gpt-4',
          messages: messages as any,
          temperature: 0.7,
          max_tokens: 1000,
        })
      );

      const content = response.choices[0]?.message?.content || '';
      
      logger.info('OpenAI API response received', {
        requestId,
        tokensUsed: response.usage?.total_tokens,
        responseLength: content.length,
      });

      return content;
    } catch (error: any) {
      logger.error('OpenAI API Error', {
        requestId,
        error: error.message,
        status: error.status,
        code: error.code,
      });
      throw error;
    }
  }

  /**
   * Быстрый запрос к ChatGPT
   */
  async quickChat(prompt: string, systemPrompt?: string) {
    const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: prompt });

    return this.chat(messages);
  }

  /**
   * Анализ фото еды через GPT-4 Vision
   */
  async analyzeFoodImage(imageBase64: string, requestId?: string): Promise<string> {
    if (!this.client) {
      throw new Error('OpenAI client не инициализирован');
    }

    try {
      logger.debug('Sending image analysis request to OpenAI', {
        requestId,
        imageSize: imageBase64.length,
        model: 'gpt-4o',
        concurrency: { active: this.active, max: this.concurrencyMax, queued: this.queue.length },
      });

      // Как в iOS-референсе: требуем СТРОГО JSON, иначе регексы будут ломаться.
      const systemPrompt = `Ты — эксперт по анализу блюд и питанию. Проанализируй изображение еды и верни ТОЛЬКО валидный JSON (без markdown, без пояснений).

Верни объект строго такого вида:
{
  "foodName": "строка (реальное название, не 'Название продукта')",
  "portionSize": число,
  "unit": "г" | "мл" | "шт",
  "calories": число,
  "protein": число,
  "fat": число,
  "carbs": число
}

Правила:
- Никогда не используй плейсхолдеры вроде "Название продукта" — пиши реальное название (например, "Банан", "Мандарины").
- Не возвращай null. Если нутриенты очень малы — верни 0.1, а не 0.
- Если на фото упаковка и видно КБЖУ — используй их. Иначе используй справочные значения.`;

      const response = await this.withLimit(() =>
        this.client!.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Верни ТОЛЬКО JSON-объект по схеме из system prompt.',
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${imageBase64}`,
                  },
                },
              ],
            },
          ],
          // Просим API гарантировать валидный JSON-объект
          response_format: { type: 'json_object' } as any,
          max_tokens: 1000,
          temperature: 0.0,
        })
      );

      const content = response.choices[0]?.message?.content || '';

      logger.info('OpenAI image analysis response received', {
        requestId,
        tokensUsed: response.usage?.total_tokens,
        responseLength: content.length,
      });

      return content;
    } catch (error: any) {
      logger.error('OpenAI Image Analysis Error', {
        requestId,
        error: error.message,
        status: error.status,
        code: error.code,
      });
      throw error;
    }
  }

  private async withLimit<T>(fn: () => Promise<T>): Promise<T> {
    if (this.active >= this.concurrencyMax) {
      await new Promise<void>((resolve) => this.queue.push(resolve));
    }
    this.active += 1;
    try {
      return await fn();
    } finally {
      this.active -= 1;
      const next = this.queue.shift();
      if (next) next();
    }
  }
}

// Экспортируем singleton экземпляр
export const openAIService = new OpenAIService();

