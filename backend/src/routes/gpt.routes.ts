import { Router, Request, Response } from 'express';
import { randomUUID } from 'crypto';
import { openAIService } from '../services/openai.service';
import { foodDatabaseService } from '../services/food-database.service';
import logger from '../utils/logger';

const router = Router();

/**
 * POST /api/gpt/chat
 * Отправка сообщения в ChatGPT
 */
router.post('/chat', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  
  try {
    const { message, systemPrompt, conversationHistory } = req.body;

    logger.info('GPT chat request received', {
      requestId,
      messageLength: message?.length,
      hasSystemPrompt: !!systemPrompt,
      historyLength: conversationHistory?.length || 0,
      ip: req.ip,
    });

    if (!message || typeof message !== 'string') {
      logger.warn('GPT chat request validation failed', {
        hasMessage: !!message,
        messageType: typeof message,
      });
      return res.status(400).json({ error: 'Сообщение обязательно' });
    }

    if (!openAIService.isAvailable()) {
      logger.error('OpenAI service unavailable');
      return res.status(503).json({ error: 'OpenAI сервис недоступен' });
    }

    // Если есть история разговора, используем её
    let response: string;
    if (conversationHistory && Array.isArray(conversationHistory) && conversationHistory.length > 0) {
      const messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }> = [];
      
      if (systemPrompt) {
        messages.push({ role: 'system', content: systemPrompt });
      }
      
      // Добавляем историю (последние 10 сообщений)
      const recentHistory = conversationHistory.slice(-10);
      messages.push(...recentHistory);
      
      // Добавляем текущее сообщение
      messages.push({ role: 'user', content: message });
      
      response = await openAIService.chat(messages, requestId);
    } else {
      response = await openAIService.quickChat(message, systemPrompt);
    }
    const duration = Date.now() - startTime;

    logger.info('GPT chat request completed', {
      requestId,
      duration: `${duration}ms`,
      responseLength: response.length,
    });

    // Debug: логируем сырой ответ (обрезаем, чтобы не захламлять логи)
    logger.debug('OpenAI raw chat response', {
      response: response.substring(0, 500),
      fullLength: response.length,
    });

    // Пытаемся извлечь структурированные данные КБЖУ из ответа (если это запрос про питание)
    const parsed = parseOpenAIResponse(response);
    const nutritionData = parsed?.result ?? undefined;

    logger.debug('Parsed chat nutritionData', {
      requestId,
      parseMethod: parsed?.method ?? 'none',
      nutritionData,
    });

    return res.json({ response, nutritionData });
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('GPT API Error', {
      requestId,
      error: error.message,
      status: error.status,
      duration: `${duration}ms`,
      stack: error.stack,
    });
    
    return res.status(500).json({ 
      error: 'Ошибка при обращении к OpenAI API',
      message: error.message 
    });
  }
});

/**
 * POST /api/gpt/analyze-image
 * Анализ фото еды через GPT-4 Vision
 */
router.post('/analyze-image', async (req: Request, res: Response) => {
  const startTime = Date.now();
  const requestId = randomUUID();
  
  try {
    const { imageBase64 } = req.body;

    logger.info('GPT image analysis request received', {
      requestId,
      imageSize: imageBase64?.length || 0,
      ip: req.ip,
    });

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      logger.warn('GPT image analysis request validation failed', {
        hasImage: !!imageBase64,
        imageType: typeof imageBase64,
      });
      return res.status(400).json({ error: 'Изображение обязательно' });
    }

    if (!openAIService.isAvailable()) {
      logger.error('OpenAI service unavailable');
      return res.status(503).json({ error: 'OpenAI сервис недоступен' });
    }

    // Анализируем через OpenAI
    const openAIResponse = await openAIService.analyzeFoodImage(imageBase64, requestId);
    
    // Логируем полный ответ от OpenAI для отладки
    logger.debug('OpenAI raw response', { 
      requestId,
      response: openAIResponse.substring(0, 500),
      fullLength: openAIResponse.length 
    });
    
    // Парсим результат от OpenAI (сначала JSON, потом fallback-regex)
    const parsed = parseOpenAIResponse(openAIResponse);
    const openAIResult = parsed?.result ?? null;
    
    // Логируем результат парсинга
    logger.debug('Parsed OpenAI result', { 
      requestId,
      parseMethod: parsed?.method ?? 'none',
      openAIResult,
      hasCalories: openAIResult?.calories !== null,
      hasProtein: openAIResult?.protein !== null,
      hasFat: openAIResult?.fat !== null,
      hasCarbs: openAIResult?.carbs !== null,
    });
    
        let finalResult = openAIResult;
    
    // Если получили результат от OpenAI, ищем в Open Food Facts для уточнения
    if (openAIResult) {
      logger.info('OpenAI analysis completed, searching Open Food Facts', {
        requestId,
        foodName: openAIResult.foodName,
      });
      
      const dbResult = await foodDatabaseService.searchProduct(openAIResult.foodName);
      
          if (dbResult) {
            // Если у OpenAI нет БЖУ (null/0), а база даёт данные — предпочитаем базу
            const openAIHasBadMacros =
              (openAIResult.protein == null && openAIResult.fat == null && openAIResult.carbs == null) ||
              ((openAIResult.protein ?? 0) === 0 && (openAIResult.fat ?? 0) === 0 && (openAIResult.carbs ?? 0) === 0);

            const dbScore =
              (dbResult.calories != null ? 1 : 0) +
              (dbResult.protein != null ? 1 : 0) +
              (dbResult.fat != null ? 1 : 0) +
              (dbResult.carbs != null ? 1 : 0);

            // Определяем, использовать ли данные из базы (бренды/совпадение) ИЛИ если OpenAI "пустой" по БЖУ
            const shouldUseDatabase = openAIHasBadMacros && dbScore >= 3
              ? true
              : shouldUseDatabaseResult(openAIResult, dbResult);

            if (shouldUseDatabase) {
          logger.info('Using Open Food Facts data', {
            foodName: dbResult.foodName,
          });
          
          // Используем данные из базы, но сохраняем название от OpenAI
          finalResult = {
            ...dbResult,
            foodName: openAIResult.foodName, // Сохраняем название от OpenAI
          };
        } else {
          logger.info('Using OpenAI data (general dish or no match)', {
            foodName: openAIResult.foodName,
          });
        }
      }
    }
    
    const duration = Date.now() - startTime;

    logger.info('GPT image analysis request completed', {
      requestId,
      duration: `${duration}ms`,
      responseLength: openAIResponse.length,
      hasResult: !!finalResult,
    });

    // Возвращаем результат в формате, который ожидает фронтенд
    if (finalResult) {
        return res.json({ 
        response: formatNutritionResponse(finalResult),
        nutritionData: finalResult,
      });
    } else {
        return res.json({ response: openAIResponse });
    }
  } catch (error: any) {
    const duration = Date.now() - startTime;
    
    logger.error('GPT Image Analysis API Error', {
      requestId,
      error: error.message,
      status: error.status,
      duration: `${duration}ms`,
      stack: error.stack,
    });
    
      return res.status(500).json({ 
      error: 'Ошибка при анализе изображения',
      message: error.message 
    });
  }
});

/**
 * Парсинг ответа от OpenAI
 */
function parseOpenAIResponse(response: string): { method: 'json' | 'regex'; result: {
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
} } | null {
  try {
    const trimmed = response.trim();

    // 1) JSON-first (как iOS-референс)
    if (trimmed.startsWith('{')) {
      try {
        const obj = JSON.parse(trimmed) as any;
        const foodName = String(obj.foodName ?? '').trim();
        const unit = (String(obj.unit ?? 'г') as any) as 'г' | 'мл' | 'шт';
        const portionSize = Number(obj.portionSize);
        const calories = Number(obj.calories);
        const protein = Number(obj.protein);
        const fat = Number(obj.fat);
        const carbs = Number(obj.carbs);

        const safeNum = (v: number): number | null => (Number.isFinite(v) ? v : null);
        const safeUnit: 'г' | 'мл' | 'шт' = unit === 'мл' || unit === 'шт' ? unit : 'г';

        if (foodName && Number.isFinite(portionSize)) {
          return {
            method: 'json',
            result: {
              foodName,
              portionSize: portionSize > 0 ? Math.round(portionSize) : 100,
              unit: safeUnit,
              calories: safeNum(calories),
              protein: safeNum(protein),
              fat: safeNum(fat),
              carbs: safeNum(carbs),
            },
          };
        }
      } catch (e) {
        logger.debug('JSON parse failed, fallback to regex', { error: (e as any)?.message });
      }
    }

    // 2) Fallback regex (старый путь)
    const normalized = response
      // На всякий случай нормализуем неразрывные пробелы
      .replace(/\u00A0/g, ' ')
      // Приводим десятичные с запятой к точке для parseFloat
      .replace(/(\d),(\d)/g, '$1.$2');

    const parseNum = (raw?: string | null): number | null => {
      if (!raw) return null;
      const value = parseFloat(String(raw).replace(',', '.'));
      return Number.isFinite(value) ? value : null;
    };

    // Извлекаем название продукта
    let foodName = '';
    const nameMatch = normalized.match(/\*\*([^*]+)\*\*/);
    if (nameMatch) {
      foodName = nameMatch[1].trim();
    } else {
      const firstLine = normalized.split('\n')[0]?.trim() || '';
      foodName = firstLine.replace(/\*\*/g, '').trim();
    }

    // Парсим размер порции
    let portionSize = 100;
    let unit: 'г' | 'мл' | 'шт' = 'г';
    const portionMatch = normalized.match(/Размер порции[:\s]*(\d+)\s*(г|мл|шт)/i);
    if (portionMatch) {
      portionSize = parseInt(portionMatch[1], 10);
      const unitStr = portionMatch[2].toLowerCase();
      if (unitStr.includes('мл')) {
        unit = 'мл';
      } else if (unitStr.includes('шт')) {
        unit = 'шт';
      } else {
        unit = 'г';
      }
    }

    // Парсим КБЖУ
    let calories: number | null = null;
    let protein: number | null = null;
    let fat: number | null = null;
    let carbs: number | null = null;

    // Калории (учитываем формат **Калории:** 508 ккал — двоеточие внутри жирного)
    const caloriesPatterns = [
      /\*\*Калории?\*\*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:ккал|калори)?/i, // **Калории**: 508
      /\*\*Калории?:\*\*\s*(\d+(?:[.,]\d+)?)\s*(?:ккал|калори)?/i,   // **Калории:** 508
      /Калории?[:\s\*]*(\d+(?:[.,]\d+)?)\s*(?:ккал|калори)?/i,      // Калории:** 508
      /(\d+(?:[.,]\d+)?)\s*(?:ккал|калори)/i,
      /калори[ия]*[:\s\*]*(\d+(?:[.,]\d+)?)/i,
    ];
    for (const pattern of caloriesPatterns) {
      const match = normalized.match(pattern);
      if (match) {
        calories = parseNum(match[1]);
        logger.debug('Calories parsed', { value: calories, pattern: pattern.toString() });
        break;
      }
    }

    // Белки - улучшенные паттерны
    const proteinPatterns = [
      /\*\*Белк[а-я]*\*\*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i, // **Белки**: 26
      /\*\*Белк[а-я]*:\*\*\s*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,   // **Белки:** 26
      /Белк[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,       // Белки:** 26
      /белк[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,
      /белк[а-я]*[:\s\*]+(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,
      /белк[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)/i,
    ];
    for (const pattern of proteinPatterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        const value = parseNum(match[1]);
        if (value != null) {
          protein = value;
          logger.debug('Protein parsed', { value, pattern: pattern.toString() });
          break;
        }
      }
    }

    // Жиры - улучшенные паттерны
    const fatPatterns = [
      /\*\*Жир[а-я]*\*\*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i, // **Жиры**: 25
      /\*\*Жир[а-я]*:\*\*\s*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,   // **Жиры:** 25
      /Жир[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,       // Жиры:** 25
      /жир[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,
      /жир[а-я]*[:\s\*]+(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,
      /жир[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)/i,
    ];
    for (const pattern of fatPatterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        const value = parseNum(match[1]);
        if (value != null) {
          fat = value;
          logger.debug('Fat parsed', { value, pattern: pattern.toString() });
          break;
        }
      }
    }

    // Углеводы - улучшенные паттерны
    const carbsPatterns = [
      /\*\*Углевод[а-я]*\*\*[:\s]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i, // **Углеводы**: 43
      /\*\*Углевод[а-я]*:\*\*\s*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,   // **Углеводы:** 43
      /Углевод[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,       // Углеводы:** 43
      /углевод[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,
      /углевод[а-я]*[:\s\*]+(\d+(?:[.,]\d+)?)\s*(?:г|g)?/i,
      /углевод[а-я]*[:\s\*]*(\d+(?:[.,]\d+)?)/i,
    ];
    for (const pattern of carbsPatterns) {
      const match = normalized.match(pattern);
      if (match && match[1]) {
        const value = parseNum(match[1]);
        if (value != null) {
          carbs = value;
          logger.debug('Carbs parsed', { value, pattern: pattern.toString() });
          break;
        }
      }
    }

    if (calories === null && protein === null && fat === null && carbs === null) {
      return null;
    }

    // Фоллбек: если калории есть, но БЖУ не распарсились/все нули — восстанавливаем хотя бы углеводы.
    // (Иначе фронт вообще не покажет БЖУ и ты снова увидишь "0 г".)
    if (calories != null) {
      const p = protein ?? 0;
      const f = fat ?? 0;
      const c = carbs ?? 0;

      const allMissing = protein == null && fat == null && carbs == null;
      const allZero = p === 0 && f === 0 && c === 0;

      if (allMissing || allZero) {
        protein = protein ?? 0;
        fat = fat ?? 0;
        // считаем, что всё из углеводов (для большинства фруктов/напитков это лучше чем нули)
        carbs = Math.max(0, calories / 4);
      } else {
        if (protein == null) protein = 0;
        if (fat == null) fat = 0;
        if (carbs == null) {
          const remaining = calories - (protein * 4 + fat * 9);
          carbs = Math.max(0, remaining / 4);
        }
      }
    }

    const round1 = (v: number | null) => (v == null ? null : Math.round(v * 10) / 10);

    return {
      method: 'regex',
      result: {
        foodName: foodName || 'Продукт',
        portionSize,
        unit,
        calories: round1(calories),
        protein: round1(protein),
        fat: round1(fat),
        carbs: round1(carbs),
      },
    };
  } catch (error) {
    logger.error('Error parsing OpenAI response', { error });
    return null;
  }
}

/**
 * Определяет, использовать ли данные из базы данных
 */
function shouldUseDatabaseResult(
  openAIResult: { foodName: string },
  dbResult: { foodName: string }
): boolean {
  const openAIName = openAIResult.foodName.toLowerCase();
  const dbName = dbResult.foodName.toLowerCase();

  // Проверяем, есть ли бренд в названии из базы
  const hasBrandInDB = dbName.includes('adrenaline') ||
                       dbName.includes('exponenta') ||
                       dbName.includes('даниссимо') ||
                       dbName.includes('доширак') ||
                       dbName.includes('чан') ||
                       dbName.includes('со вкусом') ||
                       dbName.includes('high-pro') ||
                       dbName.includes('vitaminpower');

  // Проверяем, есть ли бренд в названии от OpenAI
  const hasBrandInOpenAI = openAIName.includes('adrenaline') ||
                           openAIName.includes('exponenta') ||
                           openAIName.includes('даниссимо') ||
                           openAIName.includes('доширак') ||
                           openAIName.includes('чан') ||
                           openAIName.includes('со вкусом') ||
                           openAIName.includes('high-pro') ||
                           openAIName.includes('vitaminpower');

  // Проверяем, является ли это общим блюдом
  const isGeneralDish = !hasBrandInOpenAI && (
    openAIName.includes('бургер') ||
    openAIName.includes('рамен') ||
    openAIName.includes('пирог') ||
    openAIName.includes('салат') ||
    openAIName.includes('суп') ||
    openAIName.includes('паста')
  );

  // Проверяем схожесть названий
  const namesSimilar = openAIName.includes(dbName.split(' ')[0] || '') ||
                       dbName.includes(openAIName.split(' ')[0] || '');

  // Используем базу только если:
  // 1. Есть бренд в базе И (есть бренд в OpenAI ИЛИ названия похожи)
  // 2. Или названия очень похожи (не общее блюдо)
  return hasBrandInDB && (hasBrandInOpenAI || (!isGeneralDish && namesSimilar));
}

/**
 * Форматирует данные о питании в текстовый формат для фронтенда
 */
function formatNutritionResponse(data: {
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}): string {
  let result = `**${data.foodName}**\n\n`;
  result += `Размер порции: ${Math.round(data.portionSize)} ${data.unit}\n\n`;
  
  if (data.calories !== null) {
    result += `**Калории:** ${data.calories} ккал\n`;
  }
  if (data.protein !== null) {
    result += `**Белки:** ${data.protein} г\n`;
  }
  if (data.fat !== null) {
    result += `**Жиры:** ${data.fat} г\n`;
  }
  if (data.carbs !== null) {
    result += `**Углеводы:** ${data.carbs} г`;
  }
  
  return result;
}

export default router;

