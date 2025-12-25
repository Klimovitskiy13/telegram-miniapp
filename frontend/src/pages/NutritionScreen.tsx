/**
 * Экран питания с дневником, графиками и отслеживанием воды
 */

import { CSSProperties, useRef, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, 
  Droplet, 
  Trash2,
  Info,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { checkUser } from '../api/user';
import { getTelegramUser } from '../api/telegram';
import { 
  getDailyNutritionStats, 
  getWaterEntries, 
  saveWaterEntry,
  decrementWater,
  deleteFoodEntry,
  type FoodEntry,
  type DailyNutritionStats 
} from '../api/nutrition';
import { MEAL_TYPE_LABELS, MealType } from '../types/chat';
import { formatLocalISODate } from '../utils/selectedDate';
import { createGlassCardStyle } from '../utils/glassCardStyle';

interface NutritionScreenProps {
  selectedDate?: string; // YYYY-MM-DD
}

export const NutritionScreen = ({ selectedDate: propsSelectedDate }: NutritionScreenProps) => {
  const { isDark } = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [stats, setStats] = useState<DailyNutritionStats | null>(null);
  const [waterData, setWaterData] = useState<{ entries: any[]; totalAmount: number } | null>(null);
  // Дата приходит с календаря (YYYY-MM-DD)
  const selectedDate = propsSelectedDate ?? formatLocalISODate();
  const [isLoading, setIsLoading] = useState(true); // только первый заход
  const [isRefreshing, setIsRefreshing] = useState(false); // смена дня/тихий рефреш
  const hasLoadedOnceRef = useRef(false);
  const [showMacroInfo, setShowMacroInfo] = useState<{ type: 'calories' | 'protein' | 'fat' | 'carbs' } | null>(null);

  const accentColor = isDark ? '#8B5CF6' : '#FF541B';
  const cardStyle = useMemo(() => createGlassCardStyle(isDark, accentColor), [isDark, accentColor]);

  // Загрузка данных
  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Слушаем события обновления питания
  useEffect(() => {
    const handleNutritionUpdate = (e: Event) => {
      const ce = e as CustomEvent<{ date?: string }>;
      // Если событие про другую дату — игнорим
      if (ce.detail?.date && ce.detail.date !== selectedDate) {
        return;
      }
      // Обновляем только статистику, без показа "Загрузка"
      refreshStats();
      // Вода тоже могла поменяться (например, добавили стакан на текущий день)
      getWaterEntries(selectedDate)
        .then(setWaterData)
        .catch(() => null);
    };

    window.addEventListener('nutrition-updated', handleNutritionUpdate);
    return () => {
      window.removeEventListener('nutrition-updated', handleNutritionUpdate);
    };
  }, [selectedDate]);

  const loadData = async () => {
    try {
      if (!hasLoadedOnceRef.current) setIsLoading(true);
      else setIsRefreshing(true);
      
      // Загружаем данные пользователя
      const telegramUser = getTelegramUser();
      if (telegramUser) {
        try {
          const userResponse = await checkUser({
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
          });
          setUserData(userResponse.user);
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      }

      // Загружаем статистику питания
      await refreshStats();

      // Загружаем данные о воде
      try {
        const waterDataResponse = await getWaterEntries(selectedDate);
        setWaterData(waterDataResponse);
      } catch (error) {
        console.error('Error loading water data:', error);
        setWaterData({ entries: [], totalAmount: 0 });
      }
    } catch (error) {
      console.error('Error loading nutrition data:', error);
    } finally {
      hasLoadedOnceRef.current = true;
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // Обновление только статистики (без показа "Загрузка")
  const refreshStats = async () => {
    try {
      const statsData = await getDailyNutritionStats(selectedDate);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading nutrition stats:', error);
      // Устанавливаем пустую статистику при ошибке
      setStats({
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        breakfast: [],
        lunch: [],
        dinner: [],
        snack: [],
      });
    }
  };

  // Расчет нормы воды (30 мл на 1 кг веса)
  const calculateWaterGoal = () => {
    if (!userData?.onboarding?.weight) return 2000; // По умолчанию 2 литра
    return Math.round(userData.onboarding.weight * 30);
  };

  const waterGoal = calculateWaterGoal();
  const waterProgress = waterData ? (waterData.totalAmount / waterGoal) * 100 : 0;

  // Обработчик добавления воды (стакан 250 мл)
  const handleAddWater = async () => {
    try {
      await saveWaterEntry(250, selectedDate);
      // Оптимистичное обновление - обновляем только воду
      const waterDataResponse = await getWaterEntries(selectedDate);
      setWaterData(waterDataResponse);
    } catch (error) {
      console.error('Error adding water:', error);
      alert('Ошибка при добавлении воды');
    }
  };

  const handleDecrementWater = async () => {
    try {
      const result = await decrementWater(selectedDate);
      setWaterData(result);
    } catch (error) {
      console.error('Error decrementing water:', error);
      alert('Нечего уменьшать');
    }
  };

  // Обработчик удаления блюда
  const handleDeleteFood = async (entryId: string) => {
    if (!confirm('Удалить это блюдо из дневника?')) return;
    
    try {
      await deleteFoodEntry(entryId);
      // Оптимистичное обновление - обновляем только статистику
      await refreshStats();
    } catch (error) {
      console.error('Error deleting food entry:', error);
      alert('Ошибка при удалении блюда');
    }
  };

  // Получение рекомендуемых значений из профиля
  const recommendedCalories = userData?.onboarding?.recommendedCalories || 0;
  const recommendedProtein = userData?.onboarding?.protein || 0;
  const recommendedFat = userData?.onboarding?.fat || 0;
  const recommendedCarbs = userData?.onboarding?.carbs || 0;

  // Текущие значения
  const currentCalories = stats?.calories || 0;
  const currentProtein = stats?.protein || 0;
  const currentFat = stats?.fat || 0;
  const currentCarbs = stats?.carbs || 0;

  // Прогресс (в процентах)
  const caloriesProgress = recommendedCalories > 0 ? (currentCalories / recommendedCalories) * 100 : 0;
  const proteinProgress = recommendedProtein > 0 ? (currentProtein / recommendedProtein) * 100 : 0;
  const fatProgress = recommendedFat > 0 ? (currentFat / recommendedFat) * 100 : 0;
  const carbsProgress = recommendedCarbs > 0 ? (currentCarbs / recommendedCarbs) * 100 : 0;

  const showSkeleton = isLoading || isRefreshing;

  // Стиль для блока питания (красный акцент)
  const nutritionAccentColor = '#ef4444'; // Красный
  const nutritionCardStyle = useMemo(() => createGlassCardStyle(isDark, nutritionAccentColor), [isDark]);
  
  // Стиль для блока воды (голубой акцент)
  const waterAccentColor = '#3b82f6'; // Голубой
  const waterCardStyle = useMemo(() => createGlassCardStyle(isDark, waterAccentColor), [isDark]);

  return (
    <div className="p-6 space-y-4">
      {/* Блок питания */}
      <motion.div
        className="relative rounded-3xl p-4 w-full"
        style={{ ...nutritionCardStyle, minHeight: '280px', overflow: 'visible' }}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        {/* Заголовок */}
        <div className="flex items-center gap-2 mb-4">
          <Flame size={18} style={{ color: nutritionAccentColor }} />
          <div className="text-sm font-semibold text-foreground">Калории</div>
        </div>

        {/* Большой полукруглый прогресс-бар по центру */}
        <div className="relative flex items-center justify-center mb-5 overflow-visible" style={{ height: '120px' }}>
          <svg width="280" height="140" viewBox="0 0 280 140" className="w-full max-w-[280px]" style={{ overflow: 'visible' }}>
            {/* Фоновый полукруг */}
            <path
              d="M 20 120 A 120 120 0 0 1 260 120"
              stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)"}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
            />
            {/* Полукруглый прогресс-бар */}
            {currentCalories > 0 && (
              <motion.path
                d="M 20 120 A 120 120 0 0 1 260 120"
                stroke="url(#caloriesGradient)"
                strokeWidth="12"
                fill="none"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: Math.min(caloriesProgress / 100, 1) }}
                transition={{ duration: 0.8 }}
              />
            )}
            {/* Метки по краям */}
            <text x="20" y="135" fontSize="10" fill={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"} textAnchor="start">
              0
            </text>
            <text x="260" y="135" fontSize="10" fill={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.4)"} textAnchor="end">
              {showSkeleton ? '—' : Math.round(recommendedCalories).toLocaleString('ru-RU')}
            </text>
            <defs>
              <linearGradient id="caloriesGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={nutritionAccentColor} />
                <stop offset="100%" stopColor="#f87171" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Текст по центру полукруга */}
          <div className="absolute inset-0 flex flex-col items-center justify-center" style={{ bottom: '25px' }}>
            <div className="text-4xl font-bold text-foreground">
              {showSkeleton ? '—' : `${Math.round(currentCalories).toLocaleString('ru-RU')}`}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {showSkeleton ? '—' : `Kcal`}
            </div>
            <div className="text-[10px] text-muted-foreground mt-1.5">
              {showSkeleton ? '—' : `${Math.max(0, Math.round(recommendedCalories - currentCalories)).toLocaleString('ru-RU')} осталось`}
            </div>
          </div>
        </div>

        {/* Разделительная линия */}
        <div className="h-0.5 w-full relative mb-4">
          <div
            className="h-full w-full"
            style={{
              background: isDark 
                ? 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)'
                : 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.15) 80%, transparent 100%)',
            }}
          />
        </div>

        {/* БЖУ */}
        <div className="space-y-3">
          {/* Белки */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                <span className="text-[10px] text-muted-foreground">Белки</span>
              </div>
              <span className="text-[10px] font-semibold text-foreground">
                {showSkeleton ? '—' : `${Math.round(currentProtein)} / ${Math.round(recommendedProtein)}г`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-black/10">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-400"
                initial={{ width: 0 }}
                animate={{ width: showSkeleton ? '40%' : `${Math.min(proteinProgress, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Жиры */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: accentColor }} />
                <span className="text-[10px] text-muted-foreground">Жиры</span>
              </div>
              <span className="text-[10px] font-semibold text-foreground">
                {showSkeleton ? '—' : `${Math.round(currentFat)} / ${Math.round(recommendedFat)}г`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-black/10">
              <motion.div
                className="h-full"
                style={{ background: `linear-gradient(to right, ${accentColor}, ${isDark ? '#FF6B35' : '#FF8A65'})` }}
                initial={{ width: 0 }}
                animate={{ width: showSkeleton ? '40%' : `${Math.min(fatProgress, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          {/* Углеводы */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
                <span className="text-[10px] text-muted-foreground">Углеводы</span>
              </div>
              <span className="text-[10px] font-semibold text-foreground">
                {showSkeleton ? '—' : `${Math.round(currentCarbs)} / ${Math.round(recommendedCarbs)}г`}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-black/10">
              <motion.div
                className="h-full bg-gradient-to-r from-green-500 to-emerald-400"
                initial={{ width: 0 }}
                animate={{ width: showSkeleton ? '40%' : `${Math.min(carbsProgress, 100)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Блок воды */}
      <WaterTracker
        current={waterData?.totalAmount || 0}
        goal={waterGoal}
        progress={waterProgress}
        onAddWater={handleAddWater}
        onDecrementWater={handleDecrementWater}
        accentColor={waterAccentColor}
        cardStyle={waterCardStyle}
        isSkeleton={showSkeleton}
      />

      {/* Дневник питания */}
      <FoodDiary
        stats={stats}
        onDeleteFood={handleDeleteFood}
        accentColor={accentColor}
        cardStyle={cardStyle}
      />

      {/* Блок совета от AI */}
      <AITipCard
        stats={stats}
        recommendedCalories={recommendedCalories}
        accentColor={accentColor}
        cardStyle={cardStyle}
      />

      {/* Модальное окно с описанием КБЖУ */}
      <AnimatePresence>
        {showMacroInfo && (
          <MacroInfoModal
            type={showMacroInfo.type}
            onClose={() => setShowMacroInfo(null)}
            accentColor={accentColor}
            cardStyle={cardStyle}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Компонент карточки питания
interface NutritionCardProps {
  icon: any;
  label: string;
  current: number;
  recommended: number;
  progress: number;
  unit: string;
  color: string;
  cardStyle: CSSProperties;
  onClick: () => void;
  compact?: boolean;
  isSkeleton?: boolean;
}

const NutritionCard = ({ 
  icon: Icon, 
  label, 
  current, 
  recommended, 
  progress, 
  unit, 
  color, 
  cardStyle,
  onClick,
  compact = false,
  isSkeleton = false,
}: NutritionCardProps) => {
  const { isDark } = useTheme();
  const progressColor = progress > 100 ? '#F44336' : progress > 80 ? '#FF9800' : color;

  return (
    <motion.div
      onClick={onClick}
      className={`relative rounded-3xl p-4 cursor-pointer overflow-hidden ${compact ? '' : 'p-6'}`}
      style={cardStyle}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={compact ? 18 : 24} style={{ color }} />
          <span className={`font-semibold ${compact ? 'text-sm' : 'text-base'}`} style={{ color }}>
            {label}
          </span>
        </div>
        <Info size={16} className="text-muted-foreground" />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline gap-2">
          {isSkeleton ? (
            <div className="flex items-center gap-2 w-full">
              <div className={`rounded-lg animate-pulse`} style={{ width: compact ? 46 : 84, height: compact ? 28 : 42, background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }} />
              <div className="rounded-lg animate-pulse" style={{ width: 110, height: 16, background: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }} />
            </div>
          ) : (
            <>
              <span className={`font-bold ${compact ? 'text-2xl' : 'text-4xl'}`} style={{ color: progressColor }}>
                {Math.round(current)}
              </span>
              <span className="text-sm text-muted-foreground">/ {Math.round(recommended)} {unit}</span>
            </>
          )}
        </div>

        {/* Прогресс-бар */}
        <div className="relative h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)', boxShadow: `0 0 18px ${color}33` }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: progressColor }}
            initial={{ width: 0 }}
            animate={{ width: isSkeleton ? '40%' : `${Math.min(progress, 100)}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>
    </motion.div>
  );
};

// Компонент отслеживания воды
interface WaterTrackerProps {
  current: number;
  goal: number;
  progress: number;
  onAddWater: () => void;
  onDecrementWater: () => void;
  accentColor: string;
  cardStyle: CSSProperties;
  isSkeleton?: boolean;
}

const WaterTracker = ({ current, goal, progress, onAddWater, onDecrementWater, accentColor, cardStyle, isSkeleton = false }: WaterTrackerProps) => {
  const { isDark } = useTheme();

  return (
    <motion.div
      className="relative rounded-3xl p-4 w-full"
      style={{ ...cardStyle, minHeight: '200px', overflow: 'visible' }}
      initial={{ opacity: 0, y: 12, scale: 0.99 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
    >
      {/* Заголовок */}
      <div className="flex items-center gap-2 mb-3">
        <Droplet size={16} style={{ color: accentColor }} />
        <div className="text-xs font-semibold text-foreground">Вода</div>
      </div>

      {/* Стакан с водой */}
      <div className="relative flex items-center justify-center mb-4 overflow-visible" style={{ height: '100px' }}>
        <div className="relative flex items-center gap-4">
          {/* SVG стакан */}
          <svg width="80" height="100" viewBox="0 0 120 160" className="flex-shrink-0">
            <defs>
              <linearGradient id={`waterGradient-${current}`} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#60a5fa" stopOpacity="0.8" />
              </linearGradient>
              <filter id={`waterBlur-${current}`}>
                <feGaussianBlur in="SourceGraphic" stdDeviation="1" />
              </filter>
              <clipPath id={`glassClip-${current}`}>
                <path d="M 30 20 L 30 140 L 90 140 L 90 20 L 85 20 Q 85 15 60 15 Q 35 15 35 20 Z" />
              </clipPath>
            </defs>
            
            {/* Вода в стакане */}
            {(() => {
              const waterHeight = Math.max(Math.min(progress / 100, 1) * 120, current > 0 ? 2 : 0);
              const waterY = 140 - waterHeight;
              return (
                <>
                  {/* Уровень воды */}
                  {waterHeight > 0 && (
                    <motion.rect
                      x="30"
                      y={waterY}
                      width="60"
                      height={waterHeight}
                      fill={`url(#waterGradient-${current})`}
                      clipPath={`url(#glassClip-${current})`}
                      initial={{ y: 140, height: 0 }}
                      animate={{ 
                        y: waterY,
                        height: waterHeight
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                      rx="2"
                      filter={`url(#waterBlur-${current})`}
                    />
                  )}
                  {/* Верхняя линия воды с легкой волной */}
                  {waterHeight > 0 && (
                    <motion.path
                      d={`M 30 ${waterY} Q 38 ${waterY - 2} 60 ${waterY} Q 82 ${waterY + 2} 90 ${waterY}`}
                      stroke={isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.3)"}
                      strokeWidth="1.5"
                      fill="none"
                      clipPath={`url(#glassClip-${current})`}
                      initial={{ pathLength: 0 }}
                      animate={{ 
                        pathLength: 1,
                        d: `M 30 ${waterY} Q 38 ${waterY - 2} 60 ${waterY} Q 82 ${waterY + 2} 90 ${waterY}`
                      }}
                      transition={{ duration: 0.6, ease: "easeOut" }}
                    />
                  )}
                </>
              );
            })()}
            
            {/* Контур стакана (поверх воды) */}
            <path
              d="M 30 20 L 30 140 L 90 140 L 90 20 L 85 20 Q 85 15 60 15 Q 35 15 35 20 Z"
              fill="none"
              stroke={isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)"}
              strokeWidth="2"
              strokeLinecap="round"
            />
            
            {/* Метки на стакане */}
            <text x="95" y="25" fontSize="8" fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"} textAnchor="start">
              {isSkeleton ? '—' : `${Math.round(goal).toLocaleString('ru-RU')}`}
            </text>
            <text x="95" y="140" fontSize="8" fill={isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.35)"} textAnchor="start">
              0
            </text>
          </svg>
          
          {/* Текст рядом со стаканом */}
          <div className="flex flex-col">
            <div className="text-2xl font-bold text-foreground">
              {isSkeleton ? '—' : `${Math.round(current).toLocaleString('ru-RU')}`}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              {isSkeleton ? '—' : `мл`}
            </div>
            <div className="text-[9px] text-muted-foreground mt-1">
              {isSkeleton ? '—' : `${Math.max(0, Math.round(goal - current)).toLocaleString('ru-RU')} осталось`}
            </div>
          </div>
        </div>
      </div>

      {/* Разделительная линия */}
      <div className="h-0.5 w-full relative mb-3">
        <div
          className="h-full w-full"
          style={{
            background: isDark 
              ? 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)'
              : 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.15) 80%, transparent 100%)',
          }}
        />
      </div>

      {/* Кнопки + / - */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={onDecrementWater}
          disabled={isSkeleton || current <= 0}
          className="py-2 rounded-xl text-xs font-semibold text-foreground flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
          style={{ background: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }}
        >
          − 250 мл
        </button>
        <button
          onClick={onAddWater}
          disabled={isSkeleton}
          className="py-2 rounded-xl text-xs font-semibold text-white flex items-center justify-center gap-2 transition-opacity disabled:opacity-50"
          style={{ background: accentColor, boxShadow: `0 10px 30px -10px ${accentColor}70` }}
        >
          + 250 мл
        </button>
      </div>
    </motion.div>
  );
};

// Компонент дневника питания
interface FoodDiaryProps {
  stats: DailyNutritionStats | null;
  onDeleteFood: (entryId: string) => void;
  accentColor: string;
  cardStyle: CSSProperties;
}

const FoodDiary = ({ stats, onDeleteFood, cardStyle }: FoodDiaryProps) => {
  const mealTypes: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-foreground">Дневник питания</h2>
      
      {mealTypes.map((mealType) => {
        const entries = stats?.[mealType] || [];
        const mealCalories = entries.reduce((sum, e) => sum + (e.calories || 0), 0);

        return (
          <div key={mealType} className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-foreground">
                {MEAL_TYPE_LABELS[mealType]}
              </h3>
              {mealCalories > 0 && (
                <span className="text-sm text-muted-foreground">
                  {Math.round(mealCalories)} ккал
                </span>
              )}
            </div>

            {entries.length === 0 ? (
              <div className="text-sm text-muted-foreground py-4 text-center rounded-xl" style={cardStyle}>
                Нет записей
              </div>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <FoodEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={() => onDeleteFood(entry.id)}
                    cardStyle={cardStyle}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// Компонент карточки блюда
interface FoodEntryCardProps {
  entry: FoodEntry;
  onDelete: () => void;
  cardStyle: CSSProperties;
}

const FoodEntryCard = ({ entry, onDelete, cardStyle }: FoodEntryCardProps) => {
  return (
    <motion.div
      className="relative rounded-2xl p-4 flex items-center justify-between overflow-hidden"
      style={cardStyle}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div className="flex-1">
        <h4 className="font-semibold text-foreground mb-1">{entry.foodName}</h4>
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <span>{Math.round(entry.portionSize)} {entry.unit}</span>
          {entry.calories && <span>• {Math.round(entry.calories)} ккал</span>}
          {entry.protein && <span>• Б: {entry.protein.toFixed(1)}г</span>}
          {entry.fat && <span>• Ж: {entry.fat.toFixed(1)}г</span>}
          {entry.carbs && <span>• У: {entry.carbs.toFixed(1)}г</span>}
        </div>
      </div>
      <button
        onClick={onDelete}
        className="p-2 rounded-lg hover:bg-white/10 transition-colors"
      >
        <Trash2 size={18} className="text-muted-foreground" />
      </button>
    </motion.div>
  );
};

// Компонент совета от AI
interface AITipCardProps {
  stats: DailyNutritionStats | null;
  recommendedCalories: number;
  accentColor: string;
  cardStyle: CSSProperties;
}

const AITipCard = ({ stats, recommendedCalories, accentColor, cardStyle }: AITipCardProps) => {
  const currentCalories = stats?.calories || 0;
  const diff = currentCalories - recommendedCalories;
  
  let tip = '';
  if (diff < -200) {
    tip = '💡 Вы еще не достигли своей нормы калорий. Добавьте полезный перекус!';
  } else if (diff > 200) {
    tip = '💡 Вы превысили норму калорий. Попробуйте добавить больше активности или скорректировать следующий прием пищи.';
  } else {
    tip = '💡 Отличный баланс! Вы на правильном пути к достижению своей цели.';
  }

  return (
    <motion.div
      className="relative rounded-3xl p-6 overflow-hidden"
      style={cardStyle}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={24} style={{ color: accentColor }} />
        <span className="font-semibold text-base" style={{ color: accentColor }}>
          Совет от AI
        </span>
      </div>
      <p className="text-sm text-foreground leading-relaxed">{tip}</p>
    </motion.div>
  );
};

// Модальное окно с описанием КБЖУ
interface MacroInfoModalProps {
  type: 'calories' | 'protein' | 'fat' | 'carbs';
  onClose: () => void;
  accentColor: string;
  cardStyle: CSSProperties;
}

const MacroInfoModal = ({ type, onClose, accentColor, cardStyle }: MacroInfoModalProps) => {

  const info = {
    calories: {
      title: 'Калории',
      description: 'Калории — это единица измерения энергии, которую мы получаем из пищи. Они необходимы для поддержания жизнедеятельности организма, работы органов и выполнения физических действий.',
      color: accentColor,
    },
    protein: {
      title: 'Белки',
      description: 'Белки — это строительный материал для мышц, костей, кожи и других тканей. Они также участвуют в производстве гормонов, ферментов и антител. Рекомендуется потреблять 1.6-2 г белка на 1 кг веса тела.',
      color: '#2196F3',
    },
    fat: {
      title: 'Жиры',
      description: 'Жиры необходимы для усвоения жирорастворимых витаминов (A, D, E, K), производства гормонов и поддержания здоровья кожи и волос. Они также являются источником энергии. Рекомендуется потреблять 1 г жира на 1 кг веса тела.',
      color: accentColor,
    },
    carbs: {
      title: 'Углеводы',
      description: 'Углеводы — основной источник энергии для организма. Они обеспечивают работу мозга, мышц и других органов. Сложные углеводы (крупы, овощи) предпочтительнее простых (сахар, сладости).',
      color: '#4CAF50',
    },
  };

  const currentInfo = info[type];

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative rounded-3xl p-6 max-w-md w-full overflow-hidden"
        style={cardStyle}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-xl font-bold" style={{ color: currentInfo.color }}>
            {currentInfo.title}
          </h3>
        </div>
        <p className="text-sm text-foreground leading-relaxed mb-6">
          {currentInfo.description}
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-base font-semibold text-white"
          style={{ background: currentInfo.color }}
        >
          Понятно
        </button>
      </motion.div>
    </motion.div>
  );
};


