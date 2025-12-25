/**
 * Экран анализа еды после подтверждения фото
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Heart, Check, Sunrise, Sun, Moon, Leaf, AlertTriangle, ChevronLeft } from 'lucide-react';
import { analyzeFoodImage } from '../api/gpt';
import { useTheme } from '../hooks/useTheme';
import { saveFoodEntry } from '../api/nutrition';
import { toggleFavorite } from '../api/favorites';
import { SaveDateBanner } from '../components/SaveDateBanner';
import { formatLocalISODate } from '../utils/selectedDate';

interface FoodAnalysisViewProps {
  image: File;
  onClose: () => void;
  selectedDate?: string; // YYYY-MM-DD. Если не передан — сохраняем на сегодня
  onGoToday?: () => void;
}

type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

interface NutritionData {
  foodName: string;
  portionSize: number;
  unit: 'г' | 'мл' | 'шт';
  calories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export const FoodAnalysisView = ({ image, onClose, selectedDate, onGoToday }: FoodAnalysisViewProps) => {
  const { isDark } = useTheme();
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [nutritionData, setNutritionData] = useState<NutritionData | null>(null);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [currentPortionSize, setCurrentPortionSize] = useState('100');
  const [currentPortionUnit, setCurrentPortionUnit] = useState<'г' | 'мл' | 'шт'>('г');
  const [selectedMealType, setSelectedMealType] = useState<MealType | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  // Свайп-закрытие (как в чате)
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analysisRunIdRef = useRef(0);

  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const backgroundColor = isDark ? '#1A1A1A' : '#F5F5F5';
  const textPrimaryColor = isDark ? '#FFFFFF' : '#212121';
  const textSecondaryColor = isDark ? '#BDBDBD' : '#757575';
  const cardBackgroundColor = isDark ? '#2C2C2C' : '#FFFFFF';

  // Создаем URL для изображения
  useEffect(() => {
    const url = URL.createObjectURL(image);
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [image]);

  // Запуск анализа
  const runAnalysis = useCallback(async () => {
    const runId = ++analysisRunIdRef.current;
    setIsAnalyzing(true);
    setAnalysisError(null);
    setNutritionData(null);
    setAnalysisProgress(0);

    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }

    try {
      // Сжимаем изображение перед отправкой
      const compressedImage = await compressImage(image);

      // Конвертируем сжатое изображение в base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          const base64Data = result.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(compressedImage);
      });

      // Запускаем таймер прогресса
      progressTimerRef.current = setInterval(() => {
        setAnalysisProgress((prev) => {
          if (prev < 0.85) return prev + 0.02;
          if (prev < 0.9) return prev + 0.01;
          return prev;
        });
      }, 300);

      // Отправляем запрос
      const result = await analyzeFoodImage(base64);

      if (analysisRunIdRef.current !== runId) return; // устаревший запуск

      // Останавливаем таймер
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      setAnalysisProgress(1.0);

      if (result.nutritionData) {
        setNutritionData(result.nutritionData);
        setCurrentPortionSize(String(Math.round(result.nutritionData.portionSize)));
        setCurrentPortionUnit(result.nutritionData.unit);
      } else {
        const parsed = parseNutritionFromText(result.response);
        if (parsed) {
          setNutritionData(parsed);
          setCurrentPortionSize(String(Math.round(parsed.portionSize)));
          setCurrentPortionUnit(parsed.unit);
        } else {
          throw new Error('Не удалось распарсить данные о питании');
        }
      }

      setIsAnalyzing(false);
    } catch (error: any) {
      if (analysisRunIdRef.current !== runId) return; // устаревший запуск

      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }

      console.error('Error analyzing food image:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Ошибка при анализе изображения';
      setAnalysisError(errorMessage);
      setIsAnalyzing(false);
    }
  }, [image]);

  useEffect(() => {
    setRetryCount(0);
    runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [image, runAnalysis]);

  const handleRetry = () => {
    setRetryCount((c) => c + 1);
    runAnalysis();
  };

  // Парсинг данных о питании из текста
  const parseNutritionFromText = (text: string): NutritionData | null => {
    let foodName = '';
    const nameMatch = text.match(/\*\*([^*]+)\*\*/);
    if (nameMatch) {
      foodName = nameMatch[1].trim();
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

    let calories: number | null = null;
    let protein: number | null = null;
    let fat: number | null = null;
    let carbs: number | null = null;

    const caloriesMatch = text.match(/\*\*Калории?\*\*[:\s]*(\d+\.?\d*)/i) || text.match(/(\d+\.?\d*)\s*(?:ккал|калори)/i);
    if (caloriesMatch) {
      calories = parseFloat(caloriesMatch[1]);
    }

    const proteinMatch = text.match(/\*\*Белк[а-я]*\*\*[:\s]*(\d+\.?\d*)/i) || text.match(/белк[а-я]*[:\s]*(\d+\.?\d*)/i);
    if (proteinMatch) {
      protein = parseFloat(proteinMatch[1]);
    }

    const fatMatch = text.match(/\*\*Жир[а-я]*\*\*[:\s]*(\d+\.?\d*)/i) || text.match(/жир[а-я]*[:\s]*(\d+\.?\d*)/i);
    if (fatMatch) {
      fat = parseFloat(fatMatch[1]);
    }

    const carbsMatch = text.match(/\*\*Углевод[а-я]*\*\*[:\s]*(\d+\.?\d*)/i) || text.match(/углевод[а-я]*[:\s]*(\d+\.?\d*)/i);
    if (carbsMatch) {
      carbs = parseFloat(carbsMatch[1]);
    }

    if (calories === null && protein === null && fat === null && carbs === null) {
      return null;
    }

    return {
      foodName: foodName || 'Продукт',
      portionSize,
      unit,
      calories,
      protein,
      fat,
      carbs,
    };
  };

  // Пересчет КБЖУ для новой порции
  const recalculatedNutrition = nutritionData ? (() => {
    const portion = parseFloat(currentPortionSize) || nutritionData.portionSize;
    const ratio = portion / nutritionData.portionSize;
    return {
      calories: nutritionData.calories ? Math.round(nutritionData.calories * ratio) : null,
      protein: nutritionData.protein ? parseFloat((nutritionData.protein * ratio).toFixed(1)) : null,
      fat: nutritionData.fat ? parseFloat((nutritionData.fat * ratio).toFixed(1)) : null,
      carbs: nutritionData.carbs ? parseFloat((nutritionData.carbs * ratio).toFixed(1)) : null,
    };
  })() : null;

  // Сжатие изображения
  const compressImage = async (file: File): Promise<File> => {
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
  };

  const mealTypeButtons = [
    { type: 'breakfast' as MealType, icon: Sunrise, label: 'Завтрак' },
    { type: 'lunch' as MealType, icon: Sun, label: 'Обед' },
    { type: 'dinner' as MealType, icon: Moon, label: 'Ужин' },
    { type: 'snack' as MealType, icon: Leaf, label: 'Перекус' },
  ];

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= 20) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      setIsSwiping(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (Math.abs(deltaX) > deltaY && deltaX > 50) {
      e.preventDefault();
      setIsSwiping(true);
      const adjustedDeltaX = deltaX - 50;
      const maxDistance = 400;
      const rawProgress = Math.min(adjustedDeltaX / maxDistance, 1);
      const easedProgress =
        rawProgress * rawProgress * rawProgress * (rawProgress * (rawProgress * 6 - 15) + 10);
      setSwipeProgress(easedProgress);
    } else if (deltaX < 0 || deltaX < 50) {
      setSwipeProgress(0);
      setIsSwiping(false);
      if (deltaX < 0) {
        touchStartRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (swipeProgress > 0.4) {
      onClose();
    } else {
      setSwipeProgress(0);
    }
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  return (
    <motion.div
      className="fixed inset-0 z-20"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        background: backgroundColor,
        transform: `translateX(${swipeProgress * 60}%)`,
        transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Иконка "<" слева (появляется при свайпе) */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 flex items-center justify-center z-30 pointer-events-none"
        style={{
          width: '60px',
          paddingTop: `calc(45px + env(safe-area-inset-top))`,
        }}
        animate={{
          opacity: swipeProgress > 0 ? Math.min(swipeProgress * 2, 1) : 0,
          x: swipeProgress > 0 ? 0 : -30,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <ChevronLeft size={24} className="text-foreground" />
      </motion.div>

      <div className="h-full overflow-y-auto">
        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center min-h-screen px-10 py-20">
            {/* Фото блюда */}
            <motion.div
              className="relative w-[240px] h-[240px] rounded-[24px] overflow-hidden mb-8"
              style={{
                boxShadow: '0 12px 24px rgba(0, 0, 0, 0.2)',
                border: `2px solid ${accentColor}80`,
              }}
            >
              <img
                src={imageUrl}
                alt="Food"
                className="w-full h-full object-cover"
              />
              
              {/* Анимация сканирующей линии */}
              <motion.div
                className="absolute left-0 right-0 h-[50px]"
                style={{
                  background: `linear-gradient(to bottom, transparent, ${accentColor}, transparent)`,
                  filter: 'blur(8px)',
                }}
                animate={{
                  y: [0, 240],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: 'linear',
                }}
              />
            </motion.div>

            {/* Текст */}
            <h2 className="text-[20px] font-semibold mb-8" style={{ color: textPrimaryColor }}>
              Анализируем блюдо...
            </h2>

            {/* Прогресс-бар */}
            <div className="w-full max-w-md mb-4">
              <div
                className="h-2 rounded-[4px] overflow-hidden"
                style={{ background: 'rgba(0, 0, 0, 0.2)' }}
              >
                <motion.div
                  className="h-full rounded-[4px]"
                  style={{ background: accentColor }}
                  initial={{ width: 0 }}
                  animate={{ width: `${analysisProgress * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Процент */}
            <p className="text-[16px] font-medium" style={{ color: textSecondaryColor }}>
              {Math.round(analysisProgress * 100)}%
            </p>
          </div>
        )}

        {analysisError && (
          <div className="flex flex-col items-center justify-center min-h-screen px-10 py-20">
            <AlertTriangle size={50} style={{ color: '#F44336' }} className="mb-6" />
            <h2 className="text-[20px] font-semibold mb-4" style={{ color: textPrimaryColor }}>
              Ошибка анализа
            </h2>
            <p className="text-[16px] text-center mb-8 px-10" style={{ color: textSecondaryColor }}>
              {retryCount >= 1
                ? 'Не получается распознать фото. Пожалуйста, пересними и попробуй снова.'
                : analysisError}
            </p>
            <div className="flex gap-4 w-full max-w-md px-10">
              {retryCount >= 1 ? (
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-[12px] text-[17px] font-semibold text-white"
                  style={{ background: accentColor }}
                >
                  Переснять
                </button>
              ) : (
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 rounded-[12px] text-[17px] font-semibold text-white"
                  style={{ background: accentColor }}
                >
                  Попробовать снова
                </button>
              )}
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-[12px] text-[17px] font-medium border"
                style={{
                  color: textPrimaryColor,
                  background: cardBackgroundColor,
                  borderColor: textSecondaryColor + '30',
                }}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}

        {!isAnalyzing && !analysisError && nutritionData && recalculatedNutrition && (
          <div
            className="px-5 pb-6"
            style={{
              // Явно опускаем весь контент результата (включая фото) ниже
              paddingTop: `calc(70px + env(safe-area-inset-top))`,
            }}
          >
            {/* Верхняя строка убрана: закрытие свайпом */}

            {/* Фото по центру */}
            <div className="flex justify-center mb-4">
              <div
                className="w-[140px] h-[140px] rounded-[16px] overflow-hidden"
                style={{
                  boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
                  border: `2px solid ${accentColor}80`,
                }}
              >
                <img
                  src={imageUrl}
                  alt={nutritionData.foodName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            {/* Название */}
            <h1
              className="text-[26px] font-bold text-center mb-6 line-clamp-2"
              style={{ color: textPrimaryColor }}
            >
              {nutritionData.foodName}
            </h1>

            {/* Размер порции */}
            <div className="mb-6">
              <p className="text-[14px] font-medium mb-2" style={{ color: textSecondaryColor }}>
                Размер порции
              </p>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={currentPortionSize}
                  onChange={(e) => setCurrentPortionSize(e.target.value)}
                  className="w-20 px-3 py-2 rounded-[12px] text-center text-[24px] font-bold focus:outline-none focus:ring-2"
                  style={{
                    color: accentColor,
                    background: accentColor + '1A',
                    fontSize: '16px', // Предотвращает зум на iOS
                    border: `1px solid ${accentColor}40`,
                  }}
                />
                <div className="flex-1 flex rounded-lg overflow-hidden border" style={{ borderColor: textSecondaryColor + '30' }}>
                  {(['г', 'мл', 'шт'] as ('г' | 'мл' | 'шт')[]).map((unitOption) => (
                    <button
                      key={unitOption}
                      onClick={() => setCurrentPortionUnit(unitOption)}
                      className={`flex-1 py-2 text-[14px] font-medium transition-colors ${
                        currentPortionUnit === unitOption ? 'text-white' : ''
                      }`}
                      style={{
                        background: currentPortionUnit === unitOption ? accentColor : cardBackgroundColor,
                        color: currentPortionUnit === unitOption ? 'white' : textPrimaryColor,
                      }}
                    >
                      {unitOption}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Калории */}
            {recalculatedNutrition.calories !== null && (
              <div
                className="w-full rounded-[16px] py-6 mb-4 text-center"
                style={{ background: cardBackgroundColor }}
              >
                <p className="text-[48px] font-bold mb-2" style={{ color: textPrimaryColor }}>
                  {recalculatedNutrition.calories}
                </p>
                <p className="text-[15px] font-medium" style={{ color: textSecondaryColor }}>
                  Калории
                </p>
              </div>
            )}

            {/* КБЖУ - всегда показываем три карточки */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {/* Белки */}
              <div
                className="rounded-[12px] py-4 text-center"
                style={{ background: cardBackgroundColor }}
              >
                <div className="flex items-baseline justify-center gap-1 mb-1.5">
                  <span className="text-[20px] font-bold" style={{ color: textPrimaryColor }}>
                    {recalculatedNutrition.protein !== null && recalculatedNutrition.protein !== undefined 
                      ? recalculatedNutrition.protein.toFixed(1) 
                      : '0.0'}
                  </span>
                  <span className="text-[13px]" style={{ color: textSecondaryColor }}>
                    г
                  </span>
                </div>
                <p className="text-[12px] font-medium" style={{ color: '#2196F3' }}>
                  Белки
                </p>
              </div>

              {/* Жиры */}
              <div
                className="rounded-[12px] py-4 text-center"
                style={{ background: cardBackgroundColor }}
              >
                <div className="flex items-baseline justify-center gap-1 mb-1.5">
                  <span className="text-[20px] font-bold" style={{ color: textPrimaryColor }}>
                    {recalculatedNutrition.fat !== null && recalculatedNutrition.fat !== undefined 
                      ? recalculatedNutrition.fat.toFixed(1) 
                      : '0.0'}
                  </span>
                  <span className="text-[13px]" style={{ color: textSecondaryColor }}>
                    г
                  </span>
                </div>
                <p className="text-[12px] font-medium" style={{ color: accentColor }}>
                  Жиры
                </p>
              </div>

              {/* Углеводы */}
              <div
                className="rounded-[12px] py-4 text-center"
                style={{ background: cardBackgroundColor }}
              >
                <div className="flex items-baseline justify-center gap-1 mb-1.5">
                  <span className="text-[20px] font-bold" style={{ color: textPrimaryColor }}>
                    {recalculatedNutrition.carbs !== null && recalculatedNutrition.carbs !== undefined 
                      ? recalculatedNutrition.carbs.toFixed(1) 
                      : '0.0'}
                  </span>
                  <span className="text-[13px]" style={{ color: textSecondaryColor }}>
                    г
                  </span>
                </div>
                <p className="text-[12px] font-medium" style={{ color: '#4CAF50' }}>
                  Углеводы
                </p>
              </div>
            </div>

            {/* Прием пищи */}
            <div className="mb-6">
              <p className="text-[14px] font-medium mb-3" style={{ color: textSecondaryColor }}>
                Прием пищи
              </p>
              <div className="grid grid-cols-2 gap-3">
                {mealTypeButtons.map(({ type, icon: Icon, label }) => {
                  const isSelected = selectedMealType === type;
                  return (
                    <button
                      key={type}
                      onClick={() => setSelectedMealType(isSelected ? null : type)}
                      className="flex items-center gap-2 h-[52px] rounded-[14px] text-[14px] font-medium transition-colors"
                      style={{
                        background: isSelected ? accentColor : cardBackgroundColor,
                        color: isSelected ? 'white' : textPrimaryColor,
                        border: isSelected ? 'none' : `1px solid ${textSecondaryColor}30`,
                      }}
                    >
                      <Icon size={16} className="ml-3" />
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Нижние действия: Избранное + Сохранить */}
            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!nutritionData || !recalculatedNutrition) return;
                  try {
                    const result = await toggleFavorite({
                      foodName: nutritionData.foodName,
                      portionSize: parseFloat(currentPortionSize) || nutritionData.portionSize,
                      unit: currentPortionUnit,
                      calories: recalculatedNutrition.calories,
                      protein: recalculatedNutrition.protein,
                      fat: recalculatedNutrition.fat,
                      carbs: recalculatedNutrition.carbs,
                      imageUrl,
                    });
                    setIsFavorite(result.favorite);
                  } catch (e) {
                    console.error('Failed to toggle favorite', e);
                    alert('Ошибка при сохранении в избранное');
                  }
                }}
                className="flex-1 py-4 rounded-[50px] text-[16px] font-semibold flex items-center justify-center gap-2 transition-opacity"
                style={{
                  background: cardBackgroundColor,
                  color: isFavorite ? accentColor : textPrimaryColor,
                  border: `1px solid ${isFavorite ? accentColor + '66' : textSecondaryColor + '30'}`,
                }}
              >
                <Heart size={18} fill={isFavorite ? accentColor : 'none'} />
                {isFavorite ? 'В избранном' : 'Избранное'}
              </button>

              <button
                onClick={async () => {
                  if (selectedMealType && recalculatedNutrition && nutritionData) {
                    try {
                      await saveFoodEntry({
                        mealType: selectedMealType,
                        foodName: nutritionData.foodName,
                        portionSize: parseFloat(currentPortionSize) || nutritionData.portionSize,
                        unit: currentPortionUnit,
                        calories: recalculatedNutrition.calories,
                        protein: recalculatedNutrition.protein,
                        fat: recalculatedNutrition.fat,
                        carbs: recalculatedNutrition.carbs,
                        imageUrl: imageUrl,
                        date: selectedDate,
                      });
                      window.dispatchEvent(new CustomEvent('nutrition-updated', { detail: { date: selectedDate } }));
                      onClose();
                    } catch (error) {
                      console.error('Error saving food entry:', error);
                      alert('Ошибка при сохранении блюда');
                    }
                  }
                }}
                disabled={!selectedMealType}
                className="flex-[1.2] py-4 rounded-[50px] text-[18px] font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
                style={{
                  background: selectedMealType ? accentColor : textSecondaryColor + '30',
                }}
              >
                <Check size={18} />
                {selectedDate && selectedDate !== formatLocalISODate()
                  ? `Сохранить • ${selectedDate}`
                  : 'Сохранить'}
              </button>
            </div>

            {/* Плашка "Запись в ..." под кнопкой сохранить */}
            {onGoToday && (
              <div className="mt-4">
                <SaveDateBanner selectedDateISO={selectedDate ?? formatLocalISODate()} onGoToday={onGoToday} />
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
};

