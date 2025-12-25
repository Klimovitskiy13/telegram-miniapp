/**
 * Хук для управления чатом
 */

import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, FoodAnalysisResult } from '../types/chat';
import { sendChatMessage, analyzeFoodImage } from '../api/gpt';

const CHAT_HISTORY_KEY = 'ChatHistory';
const HAS_SHOWN_WELCOME_KEY = 'ChatHasShownWelcome';

const WELCOME_MESSAGE = `Привет! 👋
Я — твой персональный AI-ассистент по питанию и здоровью. 🥦

**Что я умею:**
• ⚖️ **Расчёт КБЖУ** — просто напиши продукт и количество.
• 🍲 **Рецепты с КБЖУ** — спроси рецепт любого блюда, и я покажу состав и калорийность.
• 🧺 **Рецепты по продуктам** — напиши, что есть дома, и я предложу варианты блюд.
• 📗 **Сохранение** — добавлю блюдо в рацион (завтрак, обед, ужин или перекус).
• ⭐ **Избранное** — сохраню понравившиеся блюда для быстрого доступа.

**Примеры запросов:**
«3 банана» — покажу КБЖУ.
«Рецепт борща» — дам рецепт с калорийностью.
«У меня есть яйца и молоко, что приготовить на завтрак?» — подберу рецепты.
«Что ты умеешь?» — расскажу обо всех возможностях.

Чем помочь? 🙂`;

const SYSTEM_PROMPT = `Ты — специализированный AI-ассистент по питанию и здоровью. Твоя задача — помогать пользователю с вопросами о еде, калориях, КБЖУ, рецептах и питании.

КРИТИЧЕСКИ ВАЖНО - ФОРМАТИРОВАНИЕ ОТВЕТОВ:

1. НОРМАЛИЗАЦИЯ ТЕКСТА:
- Пользователь может писать с ошибками, разными форматами (400 гр, 400 г, грам 400, 400грамм)
- Сначала ПРИВЕДИ текст к единому формату: исправь ошибки, приведи единицы измерения к стандарту (г, мл, шт)
- Распознай названия блюд и продуктов даже с опечатками
- Определи количество и единицы измерения из любого формата

2. ОПРЕДЕЛЕНИЕ ТИПА ЗАПРОСА:

А) ЗАПРОС КБЖУ (например: "3 банана", "200г курицы", "яблоко", "банан, яблоко, 200г курицы"):
- Если пользователь указал несколько блюд через запятую - обработай КАЖДОЕ отдельно
- Нормализуй запрос
- Определи КБЖУ для указанного количества
- ОБЯЗАТЕЛЬНО используй ТОЧНЫЙ формат (БЕЗ дополнительного текста, только структурированные данные):
  **Название продукта**
  
  Размер порции: [число] [г/мл/шт]
  
  **Калории:** [число] ккал
  **Белки:** [число] г
  **Жиры:** [число] г
  **Углеводы:** [число] г

КРИТИЧЕСКИ ВАЖНО: Всегда указывай точные числа для БЖУ (белки, жиры, углеводы) - НЕ 0, если продукт содержит эти макронутриенты. Формат должен быть ТОЧНО таким: **Белки:** [число] г (с двоеточием и пробелом после него).
- Если несколько блюд - верни данные для каждого блюда в таком же формате, разделенные пустой строкой

Б) ЗАПРОС РЕЦЕПТА (например: "рецепт борща", "как приготовить омлет"):
- Дай подробный рецепт с ингредиентами и граммовками
- В конце ОБЯЗАТЕЛЬНО укажи КБЖУ в формате:
  
  КБЖУ на 1 порцию (приблизительно):
  **Калории:** [число] ккал
  **Белки:** [число] г
  **Жиры:** [число] г
  **Углеводы:** [число] г

В) ПОМОЩЬ С БЛЮДАМИ (например: "у меня есть яйца и молоко, что приготовить на завтрак"):
- Предложи рецепты из имеющихся продуктов
- Для каждого рецепта укажи КБЖУ в том же формате

Г) НЕ ПРО ЕДУ:
- Если запрос не связан с едой/питанием, вежливо сообщи: "Я специализируюсь только на вопросах питания, калориях, рецептах и здоровом образе жизни. Могу помочь с этим!"

3. ПРАВИЛА ФОРМАТИРОВАНИЯ:
- НИКОГДА не используй символы # в начале строк
- НИКОГДА не дублируй слова (например: "Размер порцииРазмер порции" - НЕПРАВИЛЬНО)
- Используй **жирный текст** для выделения (двойные звездочки)
- Используй четкую структуру с переносами строк
- Всегда указывай точные числа для КБЖУ (не диапазоны)
- Размер порции указывай в формате: "Размер порции: 200 г" (не "Размер порцииРазмер порции: 200 г")

4. ОТВЕТЫ НА ВОПРОСЫ О ВОЗМОЖНОСТЯХ:
- Если пользователь спрашивает "что ты умеешь", "какие функции", "помощь" - расскажи о всех возможностях кратко и структурированно

Отвечай дружелюбно, структурированно, лаконично и профессионально. Всегда используй точные числа для КБЖУ.`;

export const useChat = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Загрузка истории чата
  useEffect(() => {
    const loadChatHistory = () => {
      try {
        const saved = localStorage.getItem(CHAT_HISTORY_KEY);
        if (saved) {
          const parsed = JSON.parse(saved) as ChatMessage[];
          if (parsed.length > 0) {
            setMessages(parsed);
            return;
          }
        }
        
        // Если истории нет, показываем приветственное сообщение
        const welcome: ChatMessage = {
          id: Date.now().toString(),
          text: WELCOME_MESSAGE,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([welcome]);
        saveChatHistory([welcome]);
      } catch (error) {
        console.error('Error loading chat history:', error);
        const welcome: ChatMessage = {
          id: Date.now().toString(),
          text: WELCOME_MESSAGE,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages([welcome]);
      }
    };

    loadChatHistory();
  }, []);

  // Сохранение истории
  const saveChatHistory = useCallback((msgs: ChatMessage[]) => {
    try {
      localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(msgs));
      localStorage.setItem(HAS_SHOWN_WELCOME_KEY, 'true');
    } catch (error) {
      console.error('Error saving chat history:', error);
    }
  }, []);

  // Нормализация запроса
  const normalizeFoodRequest = useCallback((request: string): string => {
    const trimmed = request.trim();
    
    // Проверяем, является ли это запросом на расчет КБЖУ
    const isKBRURequest = !trimmed.toLowerCase().includes('рецепт') &&
                         !trimmed.toLowerCase().includes('как приготовить') &&
                         !trimmed.toLowerCase().includes('что приготовить') &&
                         !trimmed.toLowerCase().includes('что можно') &&
                         !trimmed.toLowerCase().includes('помощь') &&
                         !trimmed.toLowerCase().includes('что ты умеешь');
    
    if (isKBRURequest) {
      let normalized = trimmed;
      
      // Нормализуем единицы измерения
      normalized = normalized.replace(/грамм/gi, 'г');
      normalized = normalized.replace(/грам/gi, 'г');
      normalized = normalized.replace(/граммов/gi, 'г');
      normalized = normalized.replace(/грамма/gi, 'г');
      normalized = normalized.replace(/миллилитр/gi, 'мл');
      normalized = normalized.replace(/миллилитров/gi, 'мл');
      normalized = normalized.replace(/штук/gi, 'шт');
      normalized = normalized.replace(/штуки/gi, 'шт');
      
      // Если нет количества и единиц - добавляем стандартную порцию
      const hasQuantity = /\d+/.test(normalized);
      const hasUnit = /(г|мл|шт)/.test(normalized);
      
      if (!hasQuantity && !hasUnit) {
        const lowercased = normalized.toLowerCase();
        
        // Фрукты, овощи - обычно поштучно
        if (lowercased.includes('банан') || lowercased.includes('яблоко') || 
            lowercased.includes('апельсин') || lowercased.includes('груша') ||
            lowercased.includes('яйцо') || lowercased.includes('яйца')) {
          normalized = `1 ${normalized}`;
        }
        // Блюда - стандартная порция
        else if (lowercased.includes('паста') || lowercased.includes('карбонара') ||
                 lowercased.includes('борщ') || lowercased.includes('суп') ||
                 lowercased.includes('салат') || lowercased.includes('омлет')) {
          normalized = `${normalized} (стандартная порция)`;
        }
        // Остальное - по умолчанию 100г
        else {
          normalized = `100 г ${normalized}`;
        }
      }
      
      // Формируем запрос для OpenAI
      return `Определи КБЖУ для: ${normalized}. Верни только структурированные данные в формате:
**Название продукта**

Размер порции: [число] [г/мл/шт]

**Калории:** [число] ккал
**Белки:** [число] г
**Жиры:** [число] г
**Углеводы:** [число] г`;
    }
    
    return trimmed;
  }, []);

  // Сжатие изображения
  const compressImage = useCallback(async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const maxWidth = 1200;
          const maxHeight = 1200;
          
          let width = img.width;
          let height = img.height;
          
          // Масштабируем, если изображение слишком большое
          if (width > maxWidth || height > maxHeight) {
            if (width > height) {
              height = (height * maxWidth) / width;
              width = maxWidth;
            } else {
              width = (width * maxHeight) / height;
              height = maxHeight;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('Не удалось создать контекст canvas'));
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Не удалось сжать изображение'));
                return;
              }
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            },
            'image/jpeg',
            0.8 // Качество 80%
          );
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }, []);

  // Парсинг КБЖУ из ответа
  const parseFoodResponse = useCallback((response: string): FoodAnalysisResult | null => {
    // Проверяем, содержит ли ответ структурированные данные КБЖУ
    const hasKBRU = /\d+\s*(ккал|калори)/i.test(response) ||
                    /белки[:\s]*\d+/i.test(response) ||
                    /жиры[:\s]*\d+/i.test(response) ||
                    /углеводы[:\s]*\d+/i.test(response);
    
    if (!hasKBRU) {
      return null;
    }
    
    // Извлекаем название продукта
    let foodName = '';
    const nameMatch = response.match(/\*\*([^*]+)\*\*/);
    if (nameMatch) {
      foodName = nameMatch[1].trim();
    } else {
      const firstLine = response.split('\n')[0]?.trim() || '';
      foodName = firstLine.replace(/\*\*/g, '').trim();
    }
    
    // Парсим размер порции
    let portionSize = 100;
    let unit: 'г' | 'мл' | 'шт' = 'г';
    const portionMatch = response.match(/Размер порции[:\s]*(\d+)\s*(г|мл|шт)/i);
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
    
    // Калории (поддерживаем формат с **жирным текстом**)
    const caloriesPatterns = [
      /\*\*Калории?\*\*[:\s]*(\d+\.?\d*)\s*(?:ккал|калори)?/i,
      /(\d+\.?\d*)\s*(?:ккал|калори)/i,
      /калори[ия]*[:\s]*(\d+\.?\d*)/i,
    ];
    for (const pattern of caloriesPatterns) {
      const match = response.match(pattern);
      if (match) {
        calories = parseFloat(match[1]);
        break;
      }
    }
    
    // Белки (поддерживаем формат с **жирным текстом** и с "г" в конце)
    const proteinPatterns = [
      /\*\*Белк[а-я]*\*\*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /белк[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /белк[а-я]*[:\s]*(\d+\.?\d*)/i,
    ];
    for (const pattern of proteinPatterns) {
      const match = response.match(pattern);
      if (match) {
        protein = parseFloat(match[1]);
        break;
      }
    }
    
    // Жиры (поддерживаем формат с **жирным текстом** и с "г" в конце)
    const fatPatterns = [
      /\*\*Жир[а-я]*\*\*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /жир[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /жир[а-я]*[:\s]*(\d+\.?\d*)/i,
    ];
    for (const pattern of fatPatterns) {
      const match = response.match(pattern);
      if (match) {
        fat = parseFloat(match[1]);
        break;
      }
    }
    
    // Углеводы (поддерживаем формат с **жирным текстом** и с "г" в конце)
    const carbsPatterns = [
      /\*\*Углевод[а-я]*\*\*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /углевод[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /углевод[а-я]*[:\s]*(\d+\.?\d*)/i,
    ];
    for (const pattern of carbsPatterns) {
      const match = response.match(pattern);
      if (match) {
        carbs = parseFloat(match[1]);
        break;
      }
    }
    
    // Если хотя бы калории найдены - создаем результат
    if (calories === null && protein === null && fat === null && carbs === null) {
      return null;
    }
    
    return {
      foodName: foodName || 'Продукт',
      portionSize,
      unit,
      calories: calories ?? null,
      protein: protein ?? null,
      fat: fat ?? null,
      carbs: carbs ?? null,
      ingredients: null,
    };
  }, []);

  // Отправка сообщения
  const sendMessage = useCallback(async () => {
    const trimmed = inputText.trim();
    if (!trimmed || isLoading) return;
    
    // Создаем сообщение пользователя
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: trimmed,
      isUser: true,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);
    setErrorMessage(null);
    saveChatHistory(newMessages);
    
    try {
      // Нормализуем запрос
      const normalizedMessage = normalizeFoodRequest(trimmed);
      
      // Формируем историю разговора (последние 10 сообщений)
      const conversationHistory = newMessages
        .slice(-10)
        .map(msg => ({
          role: msg.isUser ? 'user' as const : 'assistant' as const,
          content: msg.text,
        }));
      
      // Отправляем в OpenAI с историей
      const chatResult = await sendChatMessage(normalizedMessage, SYSTEM_PROMPT, conversationHistory);
      const response = chatResult.response;
      const nutritionData = chatResult.nutritionData;

      // Подробное логирование (без лишнего шума: режем строку)
      console.log('🧠 Chat API result:', {
        responsePreview: response?.substring?.(0, 200),
        nutritionData,
      });
      
      // Используем nutritionData из API, если есть, иначе парсим текст
      const nutritionDataValid = !!nutritionData?.foodName && Number.isFinite(nutritionData?.portionSize);

      const foodResult = nutritionDataValid ? {
        foodName: nutritionData.foodName,
        portionSize: nutritionData.portionSize,
        unit: nutritionData.unit,
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        fat: nutritionData.fat,
        carbs: nutritionData.carbs,
        ingredients: null,
      } : parseFoodResponse(response);
      
      if (foodResult) {
        // Если это запрос КБЖУ - форматируем ответ
        // Проверяем на null/undefined, но показываем 0 если значение есть
        const formattedText = `**${foodResult.foodName}**

Размер порции: ${Math.round(foodResult.portionSize)} ${foodResult.unit}

${foodResult.calories !== null && foodResult.calories !== undefined ? `**Калории:** ${foodResult.calories} ккал\n` : ''}${foodResult.protein !== null && foodResult.protein !== undefined ? `**Белки:** ${foodResult.protein} г\n` : ''}${foodResult.fat !== null && foodResult.fat !== undefined ? `**Жиры:** ${foodResult.fat} г\n` : ''}${foodResult.carbs !== null && foodResult.carbs !== undefined ? `**Углеводы:** ${foodResult.carbs} г` : ''}`;
        
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: formattedText,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          nutritionData: {
            foodName: foodResult.foodName,
            portionSize: foodResult.portionSize,
            unit: foodResult.unit,
            calories: foodResult.calories ?? null,
            protein: foodResult.protein ?? null,
            fat: foodResult.fat ?? null,
            carbs: foodResult.carbs ?? null,
          },
        };
        
        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);
      } else {
        // Обычный текстовый ответ
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        };
        
        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      setErrorMessage(error.message || 'Произошла ошибка');
      
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Извини, произошла ошибка. Попробуй еще раз.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };
      
      const updatedMessages = [...newMessages, errorMsg];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  }, [inputText, messages, isLoading, normalizeFoodRequest, parseFoodResponse, saveChatHistory]);

  // Анализ фото
  const analyzePhoto = useCallback(async (imageFile: File) => {
    try {
      // Сжимаем изображение перед отправкой
      const compressedImage = await compressImage(imageFile);
      
      // Конвертируем сжатое изображение в base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          // Убираем префикс data:image/...;base64,
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedImage);
      });

      // Добавляем сообщение пользователя с фото
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        text: '📷 [Фото отправлено]',
        isUser: true,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        imageData: base64,
      };

      const newMessages = [...messages, userMessage];
      setMessages(newMessages);
      setIsLoading(true);
      setErrorMessage(null);
      saveChatHistory(newMessages);

      // Анализируем фото
      const analysisResult = await analyzeFoodImage(base64);
      const response = analysisResult.response;
      const nutritionData = analysisResult.nutritionData;

      // Используем данные о питании из ответа, если они есть, иначе парсим
      let foodResult = nutritionData ? {
        foodName: nutritionData.foodName,
        portionSize: nutritionData.portionSize,
        unit: nutritionData.unit,
        calories: nutritionData.calories,
        protein: nutritionData.protein,
        fat: nutritionData.fat,
        carbs: nutritionData.carbs,
        ingredients: null,
      } : parseFoodResponse(response);

      if (foodResult) {
        // Если это запрос КБЖУ - форматируем ответ
        // Проверяем на null/undefined, но показываем 0 если значение есть
        const formattedText = `**${foodResult.foodName}**

Размер порции: ${Math.round(foodResult.portionSize)} ${foodResult.unit}

${foodResult.calories !== null && foodResult.calories !== undefined ? `**Калории:** ${foodResult.calories} ккал\n` : ''}${foodResult.protein !== null && foodResult.protein !== undefined ? `**Белки:** ${foodResult.protein} г\n` : ''}${foodResult.fat !== null && foodResult.fat !== undefined ? `**Жиры:** ${foodResult.fat} г\n` : ''}${foodResult.carbs !== null && foodResult.carbs !== undefined ? `**Углеводы:** ${foodResult.carbs} г` : ''}`;

        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: formattedText,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          // Сохраняем nutritionData из API, если есть
          nutritionData: nutritionData || (foodResult ? {
            foodName: foodResult.foodName,
            portionSize: foodResult.portionSize,
            unit: foodResult.unit,
            calories: foodResult.calories ?? null,
            protein: foodResult.protein ?? null,
            fat: foodResult.fat ?? null,
            carbs: foodResult.carbs ?? null,
          } : undefined),
        };

        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);
      } else {
        // Обычный текстовый ответ
        const aiMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          text: response,
          isUser: false,
          timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        };

        const updatedMessages = [...newMessages, aiMessage];
        setMessages(updatedMessages);
        saveChatHistory(updatedMessages);
      }
    } catch (error: any) {
      console.error('Error analyzing photo:', error);
      setErrorMessage(error.message || 'Произошла ошибка при анализе фото');

      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: 'Извини, не удалось проанализировать фото. Попробуй еще раз.',
        isUser: false,
        timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
      };

      const updatedMessages = [...messages, errorMsg];
      setMessages(updatedMessages);
      saveChatHistory(updatedMessages);
    } finally {
      setIsLoading(false);
    }
  }, [messages, parseFoodResponse, saveChatHistory, compressImage]);

  // Очистка чата
  const clearChat = useCallback(() => {
    const welcome: ChatMessage = {
      id: Date.now().toString(),
      text: WELCOME_MESSAGE,
      isUser: false,
      timestamp: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages([welcome]);
    localStorage.removeItem(CHAT_HISTORY_KEY);
    localStorage.removeItem(HAS_SHOWN_WELCOME_KEY);
    saveChatHistory([welcome]);
  }, [saveChatHistory]);

  return {
    messages,
    inputText,
    setInputText,
    isLoading,
    errorMessage,
    sendMessage,
    analyzePhoto,
    clearChat,
  };
};

