/**
 * Сервис для работы с Open Food Facts API
 */

import axios from 'axios';
import logger from '../utils/logger';

export interface FoodDatabaseResult {
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
  ingredients?: string[];
}

class FoodDatabaseService {
  private baseURL = 'https://world.openfoodfacts.org';

  private simplifyQuery(name: string): string[] {
    const original = name.trim();
    if (!original) return [];

    const cleaned = original
      .toLowerCase()
      .replace(/[^\p{L}\p{N}\s-]+/gu, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Убираем мусорные слова/уточнения (особенно для фруктов/сортов)
    const stop = new Set(['сорт', 'сорта', 'сортов', 'тип', 'вида', 'вид', 'набор', 'упаковка']);
    const tokens = cleaned.split(' ').filter(t => t && !stop.has(t));

    const first1 = tokens.slice(0, 1).join(' ');
    const first2 = tokens.slice(0, 2).join(' ');
    const first3 = tokens.slice(0, 3).join(' ');

    // Пробуем от более специфичного к более общему
    return [original, first3, first2, first1].filter((v, i, arr) => v && arr.indexOf(v) === i);
  }

  /**
   * Поиск продукта по названию
   */
  async searchProduct(productName: string): Promise<FoodDatabaseResult | null> {
    try {
      const queries = this.simplifyQuery(productName);
      logger.debug('Searching Open Food Facts', { productName, queries });

      let products: any[] | null = null;

      for (const q of queries) {
        const searchQuery = encodeURIComponent(q.trim());
        const url = `${this.baseURL}/cgi/search.pl?search_terms=${searchQuery}&search_simple=1&action=process&json=1&page_size=3&sort_by=popularity`;

        const response = await axios.get(url, {
          headers: {
            'User-Agent': 'NO LIMITS Backend - Food Analysis',
          },
          timeout: 12000,
        });

        const candidate = response.data?.products;
        if (candidate && Array.isArray(candidate) && candidate.length > 0) {
          products = candidate;
          logger.debug('Found products in Open Food Facts', { count: products.length, queryUsed: q });
          break;
        }
      }

      if (!products || products.length === 0) {
        logger.debug('No products found in Open Food Facts', { productName });
        return null;
      }

      // Ищем продукт с наиболее полными данными о КБЖУ
      let bestProduct: any = null;
      let bestScore = 0;

      for (const product of products) {
        const nutriments = product.nutriments || {};
        let score = 0;

        // Оцениваем полноту данных
        if (nutriments['energy-kcal_100g'] != null) score += 1;
        if (nutriments['proteins_100g'] != null) score += 1;
        if (nutriments['fat_100g'] != null) score += 1;
        if (nutriments['carbohydrates_100g'] != null) score += 1;

        // Бонус за совпадение названия
        const productNameLower = (product.product_name || '').toLowerCase();
        const searchNameLower = productName.toLowerCase();
        if (productNameLower.includes(searchNameLower) || searchNameLower.includes(productNameLower)) {
          score += 2;
        }

        if (score > bestScore) {
          bestScore = score;
          bestProduct = product;
        }
      }

      if (!bestProduct) {
        return null;
      }

      return this.parseProduct(bestProduct, productName);
    } catch (error: any) {
      logger.error('Error searching Open Food Facts', {
        error: error.message,
        productName,
      });
      return null;
    }
  }

  /**
   * Парсинг данных продукта из Open Food Facts
   */
  private parseProduct(product: any, originalName: string): FoodDatabaseResult {
    const productName = product.product_name || product.product_name_ru || originalName;

    // Размер порции (по умолчанию 100г/мл)
    let portionSize = 100;
    let unit: 'г' | 'мл' | 'шт' = 'г';

    // Пытаемся определить размер порции
    const servingSize = product.serving_size || product.quantity || product.product_quantity;
    if (servingSize) {
      const servingStr = String(servingSize).toLowerCase();
      
      // Ищем число в скобках типа "(150 g)"
      const bracketMatch = servingStr.match(/\((\d+\.?\d*)\s*(g|г|гр|грамм|ml|мл|мл\.|pcs|шт|piece|pieces)/i);
      if (bracketMatch) {
        portionSize = parseFloat(bracketMatch[1]);
        const unitStr = bracketMatch[2].toLowerCase();
        if (unitStr.includes('ml') || unitStr.includes('мл')) {
          unit = 'мл';
        } else if (unitStr.includes('pcs') || unitStr.includes('шт') || unitStr.includes('piece')) {
          unit = 'шт';
        } else {
          unit = 'г';
        }
      } else {
        // Ищем обычное число
        const numberMatch = servingStr.match(/(\d+\.?\d*)/);
        if (numberMatch) {
          portionSize = parseFloat(numberMatch[1]);
          
          if (servingStr.includes('pcs') || servingStr.includes('шт') || servingStr.includes('piece')) {
            unit = 'шт';
          } else if (servingStr.includes('ml') || servingStr.includes('мл')) {
            unit = 'мл';
          } else {
            unit = 'г';
          }
        }
      }
    }

    // КБЖУ на 100г/100мл
    const nutriments = product.nutriments || {};

    // Функция для извлечения числового значения
    const extractDouble = (value: any): number | null => {
      if (typeof value === 'number') return value;
      if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? null : parsed;
      }
      return null;
    };

    // Калории
    let calories: number | null = null;
    if (nutriments['energy-kcal_100g'] != null) {
      calories = extractDouble(nutriments['energy-kcal_100g']);
    } else if (nutriments['energy-kj_100g'] != null) {
      // Конвертируем кДж в ккал: 1 ккал = 4.184 кДж
      const kj = extractDouble(nutriments['energy-kj_100g']);
      if (kj != null) calories = kj / 4.184;
    } else if (nutriments['energy_100g'] != null) {
      const energy = extractDouble(nutriments['energy_100g']);
      if (energy != null) calories = energy / 4.184;
    }

    // Белки
    let protein = extractDouble(nutriments['proteins_100g']);

    // Жиры
    let fat = extractDouble(nutriments['fat_100g']);

    // Углеводы
    let carbs = extractDouble(nutriments['carbohydrates_100g']);

    // Пересчитываем КБЖУ на указанную порцию
    if (portionSize !== 100) {
      const multiplier = portionSize / 100.0;
      if (calories != null) calories = calories * multiplier;
      if (protein != null) protein = protein * multiplier;
      if (fat != null) fat = fat * multiplier;
      if (carbs != null) carbs = carbs * multiplier;
    }

    // Ингредиенты
    let ingredients: string[] | undefined;
    if (product.ingredients_text_ru) {
      ingredients = product.ingredients_text_ru.split(',').map((i: string) => i.trim());
    } else if (product.ingredients_text) {
      ingredients = product.ingredients_text.split(',').map((i: string) => i.trim());
    }

    return {
      foodName: productName,
      portionSize,
      unit,
      calories: calories != null ? Math.round(calories * 10) / 10 : null,
      protein: protein != null ? Math.round(protein * 10) / 10 : null,
      fat: fat != null ? Math.round(fat * 10) / 10 : null,
      carbs: carbs != null ? Math.round(carbs * 10) / 10 : null,
      ingredients,
    };
  }
}

// Экспортируем singleton экземпляр
export const foodDatabaseService = new FoodDatabaseService();

