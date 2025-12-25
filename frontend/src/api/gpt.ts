import { apiClient } from './client';

interface ChatRequest {
  message: string;
  systemPrompt?: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
}

interface ChatResponse {
  response: string;
  nutritionData?: {
    foodName: string;
    portionSize: number;
    unit: 'г' | 'мл' | 'шт';
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
}

/**
 * Отправка сообщения в ChatGPT через API
 */
export const sendChatMessage = async (
  message: string,
  systemPrompt?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>
): Promise<ChatResponse> => {
  try {
    const response = await apiClient.post<ChatResponse>('/gpt/chat', {
      message,
      systemPrompt,
      conversationHistory,
    } as ChatRequest);

    return response.data;
  } catch (error: any) {
    console.error('Chat API Error:', error);
    throw new Error(error.response?.data?.error || 'Ошибка при отправке сообщения');
  }
};

/**
 * Анализ фото еды через GPT-4 Vision
 */
export const analyzeFoodImage = async (imageBase64: string): Promise<{
  response: string;
  nutritionData?: {
    foodName: string;
    portionSize: number;
    unit: 'г' | 'мл' | 'шт';
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  };
}> => {
  try {
    const response = await apiClient.post<ChatResponse>('/gpt/analyze-image', {
      imageBase64,
    });

    return {
      response: response.data.response,
      nutritionData: response.data.nutritionData,
    };
  } catch (error: any) {
    console.error('Image Analysis API Error:', error);
    throw new Error(error.response?.data?.error || 'Ошибка при анализе изображения');
  }
};

