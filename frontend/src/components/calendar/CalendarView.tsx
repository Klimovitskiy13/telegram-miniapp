import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { CalendarDateCell } from './CalendarDateCell';
import { getStepsMonth } from '../../api/activity';
import { CSSProperties } from 'react';

interface CalendarViewProps {
  onProfileTap?: () => void;
  onExpandChange?: (isExpanded: boolean, height?: number) => void;
  selectedDate?: Date;
  onDateChange?: (date: Date) => void;
}

export const CalendarView = ({ onExpandChange, selectedDate: selectedDateProp, onDateChange }: CalendarViewProps) => {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(selectedDateProp ?? new Date());
  const [stepsByDate, setStepsByDate] = useState<Record<string, number>>({});

  // Синхронизация контролируемой даты
  useEffect(() => {
    if (selectedDateProp) {
      setSelectedDate(selectedDateProp);
      // Если месяц другой — переключаем календарь на этот месяц
      if (
        selectedDateProp.getMonth() !== currentDate.getMonth() ||
        selectedDateProp.getFullYear() !== currentDate.getFullYear()
      ) {
        setCurrentDate(new Date(selectedDateProp.getFullYear(), selectedDateProp.getMonth(), 1));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDateProp?.getTime()]);

  const handleToggleExpand = () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onExpandChange) {
      onExpandChange(newExpanded, newExpanded ? expandedHeight : 100);
    }
  };

  const accentColor = isDark ? '#8B5CF6' : '#FF541B';
  const glassStyle = createCalendarGlassStyle(isDark, accentColor);

  const monthNames = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
  ];

  const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  // В свернутом виде показываем выбранную дату, в развернутом - текущий месяц
  const displayDate = isExpanded ? currentDate : selectedDate;
  const displayMonth = displayDate.getMonth();
  const displayDayNumber = displayDate.getDate();
  
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  // Получаем первый день месяца и количество дней
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();
  const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Понедельник = 0

  // Вычисляем количество строк в календаре
  const totalCells = startingDayOfWeek + daysInMonth;
  const rowsCount = Math.ceil(totalCells / 7);

  // Генерируем массив дней месяца
  const days = [];
  // Пустые ячейки для выравнивания
  for (let i = 0; i < startingDayOfWeek; i++) {
    days.push(null);
  }
  // Дни месяца
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(new Date(currentYear, currentMonth, i));
  }

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    onDateChange?.(date);
    // Если выбранная дата в другом месяце, переключаемся на этот месяц
    if (date.getMonth() !== currentDate.getMonth() || date.getFullYear() !== currentDate.getFullYear()) {
      setCurrentDate(new Date(date.getFullYear(), date.getMonth(), 1));
    }
    // Сворачиваем календарь после выбора
    setIsExpanded(false);
    if (onExpandChange) {
      onExpandChange(false, 100);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const formatISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Реальные шаги: подгружаем агрегаты только в развернутом календаре
  useEffect(() => {
    let mounted = true;
    if (!isExpanded) return;
    (async () => {
      try {
        const totals = await getStepsMonth(currentYear, currentMonth + 1);
        if (mounted) setStepsByDate(totals);
      } catch (e) {
        console.error('Failed to load steps month', e);
        if (mounted) setStepsByDate({});
      }
    })();
    return () => {
      mounted = false;
    };
  }, [isExpanded, currentYear, currentMonth]);

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck.getTime() === today.getTime();
  };

  const isSelected = (date: Date | null) => {
    if (!date) return false;
    const selected = new Date(selectedDate);
    selected.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck.getTime() === selected.getTime();
  };

  const isFuture = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const dateToCheck = new Date(date);
    dateToCheck.setHours(0, 0, 0, 0);
    return dateToCheck.getTime() > today.getTime();
  };

  // Вычисляем динамическую высоту календаря в развернутом виде
  // Базовая высота: заголовок + дни недели + отступы
  const baseHeight = 100; // Высота заголовка и дней недели
  const rowHeight = 48; // Высота одной строки календаря (40px ячейка + 8px gap)
  const expandedHeight = baseHeight + (rowsCount * rowHeight) + 20; // +20px для нижних отступов
  
  // Вычисляем динамическое значение bottom для фона
  // Фон должен покрывать весь календарь, но не опускаться слишком низко
  // Используем небольшое отрицательное значение для скругления углов
  const backgroundBottom = isExpanded ? '-10px' : '-10px';

  return (
    <motion.div
      className="absolute top-0 left-0 right-0"
      style={{ 
        zIndex: 10,
        height: isExpanded ? `${expandedHeight}px` : '100px',
      }}
      animate={{
        height: isExpanded ? expandedHeight : 100,
      }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Glass material фон - это элемент, который отвечает за фон календаря */}
      <motion.div 
        className="absolute rounded-[30px] overflow-hidden"
        style={{
          top: '0px',
          left: '0px',
          right: '0px',
          ...glassStyle.surface,
        }}
        animate={{
          bottom: backgroundBottom,
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      />
      
      {/* Обводка */}
      <motion.div 
        className="absolute border rounded-[30px]"
        style={{
          top: '0px', // Совпадает с фоном
          left: '0px', // Всегда без отступов по бокам
          right: '0px', // Всегда без отступов по бокам
          borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.06)',
          borderWidth: '0.5px',
        }}
        animate={{
          bottom: backgroundBottom, // Совпадает с фоном
        }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 30,
        }}
      />

      {/* Контент */}
      <div className="relative z-10 pt-2 pb-2">
        {/* Верхняя строка: стрелка влево + число + месяц + стрелка + стрелка вправо */}
        <div 
          className="flex items-center justify-center px-5 pb-3"
          style={{
            paddingTop: `calc(45px + env(safe-area-inset-top))`,
          }}
        >
          {/* Стрелка влево (только в развернутом виде) */}
          {isExpanded && (
            <motion.button
              onClick={handlePreviousMonth}
              className="p-2 rounded-full hover:bg-white/10 mr-2"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft size={20} className="text-foreground" />
            </motion.button>
          )}

          {/* Кнопка числа + месяца + стрелка */}
          <motion.button
            onClick={handleToggleExpand}
            className="flex items-center gap-2"
            whileTap={{ scale: 0.95 }}
          >
            {/* Число */}
            <span 
              className="text-[22px] font-semibold"
              style={{ color: accentColor }}
            >
              {displayDayNumber}
            </span>
            
            {/* Месяц */}
            <span className="text-[22px] font-semibold text-foreground">
              {monthNames[displayMonth]}
            </span>
            
            {/* Стрелка вниз/вверх */}
            <AnimatePresence mode="wait">
              {isExpanded ? (
                <motion.div
                  key="up"
                  initial={{ rotate: -180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 180, opacity: 0 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <ChevronUp 
                    size={20} 
                    className="text-foreground"
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="down"
                  initial={{ rotate: 180, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -180, opacity: 0 }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  <ChevronDown 
                    size={20} 
                    className="text-foreground"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>

          {/* Стрелка вправо (только в развернутом виде) */}
          {isExpanded && (
            <motion.button
              onClick={handleNextMonth}
              className="p-2 rounded-full hover:bg-white/10 ml-2"
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight size={20} className="text-foreground" />
            </motion.button>
          )}
        </div>

        {/* Дни недели и сетка месяца (только развернуто) */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Дни недели */}
              <div className="flex px-5 pb-2">
                {dayNames.map((day) => (
                  <div
                    key={day}
                    className="flex-1 text-center text-[12px] font-medium text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Сетка месяца */}
              <div className="grid grid-cols-7 gap-2 px-5 pb-3">
                {days.map((date, index) => {
                  if (!date) {
                    return <div key={`empty-${index}`} className="h-10" />;
                  }

                  const isDateToday = isToday(date);
                  const isDateSelected = isSelected(date);
                  const isDateFuture = isFuture(date);

                  return (
                    <CalendarDateCell
                      key={date.toISOString()}
                      date={date}
                      isToday={isDateToday}
                      isSelected={isDateSelected}
                      isFuture={isDateFuture}
                      steps={stepsByDate[formatISO(date)] ?? 0}
                      onClick={() => handleDateSelect(date)}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const createCalendarGlassStyle = (isDark: boolean, accentColor: string): {
  surface: CSSProperties;
} => {
  const glow = `${accentColor}55`;
  const leftShade = isDark ? 'rgba(0,0,0,0.3)' : 'rgba(0,0,0,0.06)';
  const surfaceBase = isDark ? 'rgba(18,18,20,0.9)' : 'rgba(255,255,255,0.9)';

  const surface: CSSProperties = {
    background: `
      radial-gradient(90% 140% at 110% 50%, ${glow} 0%, transparent 60%),
      linear-gradient(115deg, ${leftShade} 0%, transparent 46%),
      ${surfaceBase}
    `,
    boxShadow: `
      0 18px 54px -32px ${glow},
      inset -10px 0 38px -28px ${glow},
      inset 8px 0 22px -20px rgba(0,0,0,0.18),
      inset 0 1px 0 rgba(255,255,255,0.04)
    `,
    backdropFilter: 'blur(12px)',
    WebkitBackdropFilter: 'blur(12px)',
  };

  return { surface };
};

