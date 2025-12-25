/**
 * Типы для чата
 */

export interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  imageData?: string | null; // Base64 строка для фото
  nutritionData?: {
    foodName: string;
    portionSize: number;
    unit: 'г' | 'мл' | 'шт';
    calories: number | null;
    protein: number | null;
    fat: number | null;
    carbs: number | null;
  }; // Данные о питании из API
}

export interface FoodAnalysisResult {
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories?: number | null;
  protein?: number | null;
  fat?: number | null;
  carbs?: number | null;
  ingredients?: string[] | null;
}

export interface ParsedNutritionData {
  foodName: string;
  originalPortionSize: number;
  portionUnit: 'г' | 'мл' | 'шт';
  calories: number;
  protein: number;
  fat: number;
  carbs: number;
}

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Завтрак',
  lunch: 'Обед',
  dinner: 'Ужин',
  snack: 'Перекус',
};

