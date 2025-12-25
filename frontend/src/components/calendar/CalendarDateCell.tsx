import { motion } from 'framer-motion';
import { useTheme } from '../../hooks/useTheme';
import { DEFAULT_STEPS_GOAL } from '../../constants/health';

interface CalendarDateCellProps {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isFuture?: boolean;
  steps?: number; // реальные шаги за день (если нет - 0)
  onClick: () => void;
}

// Заглушки ТОЛЬКО для второго круга (калории/баланс). Круг шагов - реальные данные.
const getMockData = (_date: Date) => {
  // Заглушка: случайные данные для демонстрации
  return {
    caloriesEaten: Math.floor(Math.random() * 3000), // 0-3000 ккал
    caloriesBurned: Math.floor(Math.random() * 2500), // 0-2500 ккал
    goal: 'lose_weight' as 'lose_weight' | 'gain_muscle' | 'maintain', // Заглушка цели
  };
};

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

// Красивый плавный цвет по проценту выполнения (0..100):
// 0% -> красный, 50% -> оранжевый, 100% -> зелёный
const getStepsGradientColor = (percent: number): string => {
  const p = clamp(percent, 0, 100);
  const hue = p < 50 ? (p / 50) * 40 : 40 + ((p - 50) / 50) * 80; // 0..40..120
  return `hsl(${hue} 85% 55%)`;
};

// Определение цвета для калорий (в зависимости от цели)
const getCaloriesColor = (
  eaten: number,
  burned: number,
  goal: 'lose_weight' | 'gain_muscle' | 'maintain'
): { eaten: string; burned: string } => {
  const diff = eaten - burned;

  if (goal === 'lose_weight') {
    // Похудение: нужно есть меньше, чем тратить
    if (diff > 0) {
      // Съел больше, чем потратил - плохо
      if (diff > 500) return { eaten: '#F44336', burned: '#F44336' }; // Красный
      return { eaten: '#FF9800', burned: '#FF9800' }; // Оранжевый
    } else {
      // Съел меньше, чем потратил - хорошо
      return { eaten: '#4CAF50', burned: '#4CAF50' }; // Зеленый
    }
  } else if (goal === 'gain_muscle') {
    // Набор массы: нужно есть больше, чем тратить
    if (diff > 0) {
      // Съел больше, чем потратил - хорошо
      return { eaten: '#4CAF50', burned: '#4CAF50' }; // Зеленый
    } else {
      // Съел меньше, чем потратил - плохо
      if (Math.abs(diff) > 500) return { eaten: '#F44336', burned: '#F44336' }; // Красный
      return { eaten: '#FF9800', burned: '#FF9800' }; // Оранжевый
    }
  } else {
    // Поддержание: нужно баланс
    const absDiff = Math.abs(diff);
    if (absDiff <= 200) {
      return { eaten: '#4CAF50', burned: '#4CAF50' }; // Зеленый
    } else if (absDiff <= 500) {
      return { eaten: '#FF9800', burned: '#FF9800' }; // Оранжевый
    } else {
      return { eaten: '#F44336', burned: '#F44336' }; // Красный
    }
  }
};

export const CalendarDateCell = ({ date, isToday, isSelected, isFuture = false, steps = 0, onClick }: CalendarDateCellProps) => {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  
  // Если дата в будущем, показываем серые круги без данных
  if (isFuture) {
    return (
      <motion.button
        onClick={onClick}
        className="w-10 h-10 rounded-full flex items-center justify-center relative"
        whileTap={{ scale: 0.9 }}
        disabled
      >
        {/* Серые круги для будущих дат (2 круга) */}
        <svg 
          className="absolute inset-0 w-10 h-10" 
          viewBox="0 0 40 40"
          style={{ overflow: 'visible' }}
        >
          <circle
            cx="20"
            cy="20"
            r={18}
            fill="none"
            stroke="rgba(128, 128, 128, 0.2)"
            strokeWidth={2.5}
          />
          <circle
            cx="20"
            cy="20"
            r={13}
            fill="none"
            stroke="rgba(128, 128, 128, 0.2)"
            strokeWidth={2.5}
          />
        </svg>
        
        {/* Число серым цветом */}
        <span className="text-[16px] font-medium relative z-10 text-muted-foreground opacity-50">
          {date.getDate()}
        </span>
      </motion.button>
    );
  }
  
  const mockData = getMockData(date);
  const stepsPercent = Math.min((steps / DEFAULT_STEPS_GOAL) * 100, 100);
  const stepsColor = getStepsGradientColor(stepsPercent);
  const caloriesColors = getCaloriesColor(
    mockData.caloriesEaten,
    mockData.caloriesBurned,
    mockData.goal
  );

  // Для внутреннего кольца используем средний цвет между съеденными и потраченными калориями
  // Если цвета одинаковые (оба зеленые/оранжевые/красные), используем этот цвет
  // Иначе используем более "плохой" цвет (красный > оранжевый > зеленый)
  const getCaloriesRingColor = (): string => {
    if (caloriesColors.eaten === caloriesColors.burned) {
      return caloriesColors.eaten;
    }
    // Если цвета разные, выбираем более "плохой"
    if (caloriesColors.eaten === '#F44336' || caloriesColors.burned === '#F44336') {
      return '#F44336'; // Красный
    }
    if (caloriesColors.eaten === '#FF9800' || caloriesColors.burned === '#FF9800') {
      return '#FF9800'; // Оранжевый
    }
    return '#4CAF50'; // Зеленый
  };
  
  const caloriesRingColor = getCaloriesRingColor();
  
  // Процент для внутреннего кольца - баланс между съеденными и потраченными
  // Показываем, насколько хорошо сбалансированы калории
  const getCaloriesBalancePercent = (): number => {
    const diff = Math.abs(mockData.caloriesEaten - mockData.caloriesBurned);
    const maxCalories = Math.max(mockData.caloriesEaten, mockData.caloriesBurned, 2500);
    // Чем меньше разница, тем больше процент (лучше баланс)
    const balancePercent = Math.max(0, 100 - (diff / maxCalories) * 100);
    return balancePercent;
  };
  
  const caloriesBalancePercent = getCaloriesBalancePercent();

  // Размеры колец (увеличиваем viewBox, чтобы внешний круг не обрезался)
  const outerRadius = 18; // Внешнее кольцо (шаги) - уменьшил, чтобы не обрезалось
  const innerRadius = 13; // Внутреннее кольцо (баланс калорий)
  const strokeWidth = 2.5;
  const viewBoxSize = 40; // Размер viewBox
  const center = viewBoxSize / 2; // Центр

  return (
    <motion.button
      onClick={onClick}
      className="w-10 h-10 rounded-full flex items-center justify-center relative"
      whileTap={{ scale: 0.9 }}
    >
      {/* Фон для выбранной даты */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: accentColor }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 300 }}
        />
      )}

      {/* Внешнее кольцо - шаги */}
      <svg 
        className="absolute inset-0 w-10 h-10 transform -rotate-90" 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ overflow: 'visible' }}
      >
        {/* Фон кольца */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Заполненное кольцо */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius}
          fill="none"
          stroke={stepsColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${2 * Math.PI * outerRadius}`}
          strokeDashoffset={`${2 * Math.PI * outerRadius * (1 - stepsPercent / 100)}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Внутреннее кольцо - баланс калорий (связь между съеденными и потраченными) */}
      <svg 
        className="absolute inset-0 w-10 h-10 transform -rotate-90" 
        viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`}
        style={{ overflow: 'visible' }}
      >
        {/* Фон кольца */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth={strokeWidth}
        />
        {/* Заполненное кольцо */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius}
          fill="none"
          stroke={caloriesRingColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${2 * Math.PI * innerRadius}`}
          strokeDashoffset={`${2 * Math.PI * innerRadius * (1 - caloriesBalancePercent / 100)}`}
          strokeLinecap="round"
        />
      </svg>

      {/* Число */}
      <span
        className={`text-[16px] font-medium relative z-10 ${
          isSelected
            ? 'text-white'
            : isToday
            ? ''
            : 'text-foreground'
        }`}
        style={
          isToday && !isSelected
            ? { color: accentColor, fontWeight: 'bold' }
            : {}
        }
      >
        {date.getDate()}
      </span>
    </motion.button>
  );
};

