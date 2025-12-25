/**
 * Компонент для отображения сообщения в чате
 */

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, Check } from 'lucide-react';
import { ChatMessage, ParsedNutritionData, MealType, MEAL_TYPE_LABELS } from '../../types/chat';
import { useTheme } from '../../hooks/useTheme';
import { saveFoodEntry } from '../../api/nutrition';
import { toggleFavorite } from '../../api/favorites';
import { formatLocalISODate } from '../../utils/selectedDate';

interface MessageBubbleProps {
  message: ChatMessage;
  selectedDate?: string; // YYYY-MM-DD
}

export const MessageBubble = ({ message, selectedDate }: MessageBubbleProps) => {
  const { isDark } = useTheme();
  const [showActionButtons, setShowActionButtons] = useState(false);
  const [parsedNutrition, setParsedNutrition] = useState<ParsedNutritionData | null>(null);
  const [currentPortionSize, setCurrentPortionSize] = useState('100');
  const [currentPortionUnit, setCurrentPortionUnit] = useState<'г' | 'мл' | 'шт'>('г');
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.8)' : 'rgba(255, 255, 255, 0.8)';
  const todayISO = formatLocalISODate();

  // Проверка наличия КБЖУ в сообщении
  useEffect(() => {
    if (message.isUser) return;

    // Сначала проверяем, есть ли nutritionData в сообщении (из API)
    if (message.nutritionData) {
      setShowActionButtons(true);
      const nutrition: ParsedNutritionData = {
        foodName: message.nutritionData.foodName,
        originalPortionSize: message.nutritionData.portionSize,
        portionUnit: message.nutritionData.unit,
        calories: message.nutritionData.calories ?? 0,
        protein: message.nutritionData.protein ?? 0,
        fat: message.nutritionData.fat ?? 0,
        carbs: message.nutritionData.carbs ?? 0,
      };
      setParsedNutrition(nutrition);
      setCurrentPortionSize(String(Math.round(nutrition.originalPortionSize)));
      setCurrentPortionUnit(nutrition.portionUnit);
      return;
    }

    // Если нет nutritionData, парсим из текста
    const text = message.text;
    const hasKBRU = /\d+\s*(ккал|калори)/i.test(text) ||
                  /белки[:\s]*\d+/i.test(text) ||
                  /жиры[:\s]*\d+/i.test(text) ||
                  /углеводы[:\s]*\d+/i.test(text);

    if (hasKBRU) {
      setShowActionButtons(true);
      const nutrition = parseNutritionData(text);
      if (nutrition) {
        setParsedNutrition(nutrition);
        setCurrentPortionSize(String(Math.round(nutrition.originalPortionSize)));
        setCurrentPortionUnit(nutrition.portionUnit);
      }
    }
  }, [message]);

  // Парсинг КБЖУ из текста
  const parseNutritionData = (text: string): ParsedNutritionData | null => {
    // Логируем для отладки
    console.log('🔍 Parsing nutrition data from text:', text.substring(0, 300));
    
    let foodName = '';
    const nameMatch = text.match(/\*\*([^*]+)\*\*/);
    if (nameMatch) {
      foodName = nameMatch[1].trim();
    } else {
      const firstLine = text.split('\n')[0]?.trim() || '';
      foodName = firstLine.replace(/\*\*/g, '').trim();
    }

    let portionSize = 100;
    let unit: 'г' | 'мл' | 'шт' = 'г';
    const portionMatch = text.match(/Размер порции[:\s]*(\d+)\s*(г|мл|шт)/i);
    if (portionMatch) {
      portionSize = parseInt(portionMatch[1], 10);
      const unitStr = portionMatch[2].toLowerCase();
      if (unitStr.includes('мл')) {
        unit = 'мл';
      } else if (unitStr.includes('шт')) {
        unit = 'шт';
      }
    }

    let calories = 0;
    let protein = 0;
    let fat = 0;
    let carbs = 0;

    // Калории (поддерживаем разные форматы)
    const caloriesPatterns = [
      /\*\*Калории?\*\*[:\s]*(\d+\.?\d*)\s*(?:ккал|калори)?/i,
      /Калории?[:\s]*(\d+\.?\d*)\s*(?:ккал|калори)?/i,
      /(\d+\.?\d*)\s*(?:ккал|калори)/i,
      /калори[ия]*[:\s]*(\d+\.?\d*)/i,
    ];
    for (const pattern of caloriesPatterns) {
      const match = text.match(pattern);
      if (match) {
        calories = parseFloat(match[1]);
        console.log('✅ Calories found:', calories, 'with pattern:', pattern);
        break;
      }
    }

    // Белки (более гибкие паттерны)
    const proteinPatterns = [
      /\*\*Белк[а-я]*\*\*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /Белк[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /белк[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /белк[а-я]*[:\s]*(\d+\.?\d*)/i,
      /белк[а-я]*[:\s]+(\d+\.?\d*)/i, // С пробелом после слова
    ];
    for (const pattern of proteinPatterns) {
      const match = text.match(pattern);
      if (match) {
        protein = parseFloat(match[1]);
        console.log('✅ Protein found:', protein, 'with pattern:', pattern);
        break;
      }
    }

    // Жиры (более гибкие паттерны)
    const fatPatterns = [
      /\*\*Жир[а-я]*\*\*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /Жир[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /жир[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /жир[а-я]*[:\s]*(\d+\.?\d*)/i,
      /жир[а-я]*[:\s]+(\d+\.?\d*)/i, // С пробелом после слова
    ];
    for (const pattern of fatPatterns) {
      const match = text.match(pattern);
      if (match) {
        fat = parseFloat(match[1]);
        console.log('✅ Fat found:', fat, 'with pattern:', pattern);
        break;
      }
    }

    // Углеводы (более гибкие паттерны)
    const carbsPatterns = [
      /\*\*Углевод[а-я]*\*\*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /Углевод[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /углевод[а-я]*[:\s]*(\d+\.?\d*)\s*(?:г|g)?/i,
      /углевод[а-я]*[:\s]*(\d+\.?\d*)/i,
      /углевод[а-я]*[:\s]+(\d+\.?\d*)/i, // С пробелом после слова
    ];
    for (const pattern of carbsPatterns) {
      const match = text.match(pattern);
      if (match) {
        carbs = parseFloat(match[1]);
        console.log('✅ Carbs found:', carbs, 'with pattern:', pattern);
        break;
      }
    }

    // Логируем результаты парсинга
    console.log('📊 Parsed nutrition data:', {
      foodName,
      portionSize,
      unit,
      calories,
      protein,
      fat,
      carbs,
    });

    // Если все значения 0, но калории найдены - это валидные данные (например, чай)
    // Возвращаем null только если вообще ничего не найдено
    if (calories === 0 && protein === 0 && fat === 0 && carbs === 0) {
      // Проверяем, были ли попытки парсинга
      const hasAnyMatch = text.match(/калори|белк|жир|углевод/i);
      if (!hasAnyMatch) {
        console.log('⚠️ No nutrition data found, returning null');
        return null;
      }
      // Если есть совпадения, но все 0 - это валидные данные
      console.log('✅ Nutrition data found, but all values are 0 (valid for some products)');
    }

    return {
      foodName: foodName || 'Продукт',
      originalPortionSize: portionSize,
      portionUnit: unit,
      calories,
      protein,
      fat,
      carbs,
    };
  };

  // Форматирование текста (убираем markdown для отображения)
  const formatText = (text: string): string => {
    if (showActionButtons) {
      // Если есть КБЖУ, показываем только название продукта
      const nameMatch = text.match(/\*\*([^*]+)\*\*/);
      if (nameMatch) {
        return nameMatch[1].trim();
      }
      return text.split('\n')[0]?.trim() || text;
    }
    return text.replace(/\*\*/g, '').replace(/^#+\s*/gm, '');
  };

  // Пересчет КБЖУ для новой порции
  const recalculatedNutrition = parsedNutrition ? (() => {
    const portion = parseFloat(currentPortionSize) || parsedNutrition.originalPortionSize;
    const ratio = portion / parsedNutrition.originalPortionSize;
    return {
      calories: Math.round(parsedNutrition.calories * ratio),
      protein: parseFloat((parsedNutrition.protein * ratio).toFixed(1)),
      fat: parseFloat((parsedNutrition.fat * ratio).toFixed(1)),
      carbs: parseFloat((parsedNutrition.carbs * ratio).toFixed(1)),
    };
  })() : null;

  if (message.isUser) {
    return (
      <div className="flex justify-end">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-[80%] rounded-2xl px-4 py-3"
          style={{ background: accentColor }}
        >
          {/* Показываем фото, если оно есть */}
          {message.imageData && (
            <img
              src={`data:image/jpeg;base64,${message.imageData}`}
              alt="Фото еды"
              className="w-48 h-48 object-cover rounded-xl mb-2"
            />
          )}
          
          {/* Показываем текст, если он не пустой или если нет фото */}
          {(!message.imageData || message.text !== '📷 [Фото отправлено]') && (
            <p className="text-white text-base leading-relaxed whitespace-pre-wrap">
              {message.text}
            </p>
          )}
          
          <p className="text-white/70 text-xs mt-1">{message.timestamp}</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-[80%]"
      >
        {/* Аватар AI */}
        <div className="flex items-start gap-2 mb-1">
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
            style={{ background: accentColor }}
          >
            AI
          </div>
          <span className="text-sm font-medium" style={{ color: accentColor }}>
            AI Ассистент
          </span>
        </div>

        {/* Сообщение */}
        <div
          className="rounded-2xl px-4 py-3"
          style={{
            background: cardBg,
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <p className="text-foreground text-base leading-relaxed whitespace-pre-wrap">
            {formatText(message.text)}
          </p>

          {/* UI для КБЖУ */}
          {showActionButtons && parsedNutrition && !isSaved && (
            <div className="mt-4 space-y-4">
              {/* Изменение размера порции */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Размер порции</p>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={currentPortionSize}
                    onChange={(e) => setCurrentPortionSize(e.target.value)}
                    className="w-20 px-3 py-2 rounded-lg text-lg font-bold text-center"
                    style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      color: accentColor,
                      border: 'none',
                      fontSize: '18px',
                    }}
                  />
                  <div className="flex gap-1 rounded-lg overflow-hidden" style={{ background: 'rgba(255, 255, 255, 0.1)' }}>
                    {(['г', 'мл', 'шт'] as const).map((unit) => (
                      <button
                        key={unit}
                        onClick={() => setCurrentPortionUnit(unit)}
                        className={`px-3 py-1 text-sm font-medium transition-colors ${
                          currentPortionUnit === unit
                            ? 'text-white'
                            : 'text-muted-foreground'
                        }`}
                        style={{
                          background: currentPortionUnit === unit ? accentColor : 'transparent',
                        }}
                      >
                        {unit}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Отображение КБЖУ */}
                {recalculatedNutrition && (
                  <div className="mt-4 space-y-3">
                    {/* Калории (большая карточка) */}
                    <div
                      className="rounded-2xl p-6 text-center"
                      style={{ background: cardBg }}
                    >
                      <p className="text-5xl font-bold text-foreground mb-1">
                        {recalculatedNutrition.calories}
                      </p>
                      <p className="text-sm font-medium text-muted-foreground">Калории</p>
                    </div>

                    {/* КБЖУ (три карточки) */}
                    <div className="grid grid-cols-3 gap-3">
                      <MacroCard
                        value={recalculatedNutrition.protein || 0}
                        unit="г"
                        label="Белки"
                        color="#2196F3"
                      />
                      <MacroCard
                        value={recalculatedNutrition.fat || 0}
                        unit="г"
                        label="Жиры"
                        color={accentColor}
                      />
                      <MacroCard
                        value={recalculatedNutrition.carbs || 0}
                        unit="г"
                        label="Углеводы"
                        color="#4CAF50"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Выбор приема пищи */}
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Прием пищи</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => (
                    <button
                      key={mealType}
                      onClick={() => setSelectedMealType(selectedMealType === mealType ? null : mealType)}
                      className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        selectedMealType === mealType
                          ? 'text-white'
                          : 'text-foreground'
                      }`}
                      style={{
                        background: selectedMealType === mealType ? accentColor : cardBg,
                        border: `1px solid ${selectedMealType === mealType ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                      }}
                    >
                      {MEAL_TYPE_LABELS[mealType]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Кнопки действий */}
              <div className="flex gap-3">
                <button
                  onClick={async () => {
                    if (!parsedNutrition || !recalculatedNutrition) return;
                    try {
                      const result = await toggleFavorite({
                        foodName: parsedNutrition.foodName,
                        portionSize: parseFloat(currentPortionSize) || parsedNutrition.originalPortionSize,
                        unit: currentPortionUnit,
                        calories: recalculatedNutrition.calories,
                        protein: recalculatedNutrition.protein,
                        fat: recalculatedNutrition.fat,
                        carbs: recalculatedNutrition.carbs,
                      });
                      setIsFavorite(result.favorite);
                    } catch (e) {
                      console.error('Failed to toggle favorite', e);
                      alert('Ошибка при сохранении в избранное');
                    }
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                  style={{
                    background: cardBg,
                    border: `1px solid ${isFavorite ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                    color: isFavorite ? accentColor : 'var(--foreground)',
                  }}
                >
                  <Heart size={16} fill={isFavorite ? accentColor : 'none'} />
                  Избранное
                </button>
                <button
                  onClick={async () => {
                    if (selectedMealType && recalculatedNutrition && parsedNutrition) {
                      try {
                        await saveFoodEntry({
                          mealType: selectedMealType,
                          foodName: parsedNutrition.foodName,
                          portionSize: parseFloat(currentPortionSize) || parsedNutrition.originalPortionSize,
                          unit: currentPortionUnit,
                          calories: recalculatedNutrition.calories,
                          protein: recalculatedNutrition.protein,
                          fat: recalculatedNutrition.fat,
                          carbs: recalculatedNutrition.carbs,
                          date: selectedDate,
                        });
                        setIsSaved(true);
                        // Отправляем событие для обновления экрана питания
                        window.dispatchEvent(new CustomEvent('nutrition-updated', { detail: { date: selectedDate } }));
                      } catch (error) {
                        console.error('Error saving food entry:', error);
                        alert('Ошибка при сохранении блюда');
                      }
                    }
                  }}
                  disabled={!selectedMealType}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-50"
                  style={{
                    background: selectedMealType ? accentColor : 'rgba(255, 255, 255, 0.1)',
                  }}
                >
                  <Check size={16} />
                  {selectedDate && selectedDate !== todayISO ? `Сохранить • ${selectedDate}` : 'Сохранить в рацион'}
                </button>
              </div>
            </div>
          )}

          {/* После сохранения - только избранное */}
          {showActionButtons && isSaved && (
            <div className="mt-4">
              <button
                onClick={async () => {
                  if (!parsedNutrition || !recalculatedNutrition) return;
                  try {
                    const result = await toggleFavorite({
                      foodName: parsedNutrition.foodName,
                      portionSize: parseFloat(currentPortionSize) || parsedNutrition.originalPortionSize,
                      unit: currentPortionUnit,
                      calories: recalculatedNutrition.calories,
                      protein: recalculatedNutrition.protein,
                      fat: recalculatedNutrition.fat,
                      carbs: recalculatedNutrition.carbs,
                    });
                    setIsFavorite(result.favorite);
                  } catch (e) {
                    console.error('Failed to toggle favorite', e);
                    alert('Ошибка при сохранении в избранное');
                  }
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
                style={{
                  background: cardBg,
                  border: `1px solid ${isFavorite ? accentColor : 'rgba(255, 255, 255, 0.1)'}`,
                  color: isFavorite ? accentColor : 'var(--foreground)',
                }}
              >
                <Heart size={16} fill={isFavorite ? accentColor : 'none'} />
                Избранное
              </button>
            </div>
          )}

          <p className="text-muted-foreground text-xs mt-2">{message.timestamp}</p>
        </div>
      </motion.div>
    </div>
  );
};

// Компонент для отображения макронутриента
const MacroCard = ({ value, unit, label, color }: { value: number; unit: string; label: string; color: string }) => {
  // Форматируем значение: если 0, показываем 0.0, иначе с одним знаком после запятой
  const formattedValue = value === 0 ? '0.0' : value.toFixed(1);
  const { isDark } = useTheme();
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.8)' : 'rgba(255, 255, 255, 0.8)';

  return (
    <div
      className="rounded-xl py-4 text-center"
      style={{ background: cardBg }}
    >
      <div className="flex items-baseline justify-center gap-1 mb-1.5">
        <p className="text-[20px] font-bold text-foreground">{formattedValue}</p>
        <p className="text-[13px] text-muted-foreground">{unit}</p>
      </div>
      <p className="text-[12px] font-medium" style={{ color }}>{label}</p>
    </div>
  );
};

