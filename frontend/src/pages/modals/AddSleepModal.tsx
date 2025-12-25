import { useMemo, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sparkles } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { addSleep, getSleepMonth } from '../../api/activity';

interface AddSleepModalProps {
  selectedDate: string; // YYYY-MM-DD
  onClose: () => void;
}

export const AddSleepModal = ({ selectedDate, onClose, initialMinutes, initialSleepQuality, initialSleepRest, onSave }: AddSleepModalProps) => {
  const isEditing = !!initialMinutes;
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.92)' : 'rgba(255, 255, 255, 0.92)';

  // Цвета для градиентов и акцентов
  const primaryColor = isDark ? '#8B5CF6' : '#FF6B35';
  const secondaryColor = isDark ? '#673AB7' : '#FF8C42';
  const lightColor = isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 107, 53, 0.2)';
  const mediumColor = isDark ? 'rgba(139, 92, 246, 0.3)' : 'rgba(255, 107, 53, 0.3)';
  const darkColor = isDark ? 'rgba(139, 92, 246, 0.4)' : 'rgba(255, 107, 53, 0.4)';

  const [hours, setHours] = useState(initialMinutes ? Math.floor(initialMinutes / 60).toString() : '7');
  const [minutes, setMinutes] = useState(initialMinutes ? (initialMinutes % 60).toString() : '30');
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingAverage, setIsLoadingAverage] = useState(true);
  
  // Вопросы о качестве сна
  const [sleepQuality, setSleepQuality] = useState<string>(initialSleepQuality || ''); // Как спалось?
  const [sleepRest, setSleepRest] = useState<string>(initialSleepRest || ''); // Выспался ли?

  // Загрузка среднего времени сна из истории
  useEffect(() => {
    const loadAverageSleep = async () => {
      try {
        setIsLoadingAverage(true);
        const today = new Date();
        const lastMonth = new Date(today);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        
        // Получаем данные за последний месяц
        const sleepData = await getSleepMonth(today.getFullYear(), today.getMonth() + 1);
        const lastMonthData = await getSleepMonth(lastMonth.getFullYear(), lastMonth.getMonth() + 1);
        
        // Объединяем данные
        const allSleepMinutes = [
          ...Object.values(sleepData),
          ...Object.values(lastMonthData),
        ].filter((minutes) => minutes > 0);
        
        if (allSleepMinutes.length > 0) {
          // Вычисляем среднее время сна
          const averageMinutes = Math.round(
            allSleepMinutes.reduce((sum, min) => sum + min, 0) / allSleepMinutes.length
          );
          
          const avgHours = Math.floor(averageMinutes / 60);
          const avgMinutes = averageMinutes % 60;
          
          // Устанавливаем среднее значение
          setHours(avgHours.toString());
          setMinutes(avgMinutes.toString());
        }
      } catch (error) {
        console.error('Error loading average sleep:', error);
        // Оставляем значения по умолчанию
      } finally {
        setIsLoadingAverage(false);
      }
    };
    
    loadAverageSleep();
  }, []);

  // Refs для полей ввода и контейнера прокрутки
  const hoursInputRef = useRef<HTMLInputElement>(null);
  const minutesInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Автоматическая прокрутка к активному полю при фокусе
  useEffect(() => {
    const handleFocus = (e: FocusEvent) => {
      const target = e.target as HTMLInputElement;
      if (target && scrollContainerRef.current) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300); // Небольшая задержка для появления клавиатуры
      }
    };

    const hoursInput = hoursInputRef.current;
    const minutesInput = minutesInputRef.current;

    hoursInput?.addEventListener('focus', handleFocus);
    minutesInput?.addEventListener('focus', handleFocus);

    return () => {
      hoursInput?.removeEventListener('focus', handleFocus);
      minutesInput?.removeEventListener('focus', handleFocus);
    };
  }, []);

  const totalMinutes = useMemo(() => {
    const h = parseInt(hours, 10);
    const m = parseInt(minutes, 10);
    const hh = Number.isFinite(h) ? h : 0;
    const mm = Number.isFinite(m) ? m : 0;
    return Math.max(0, hh * 60 + mm);
  }, [hours, minutes]);

  // Проверка, можно ли сохранить (все поля заполнены)
  const canSave = useMemo(() => {
    return totalMinutes > 0 && sleepQuality !== '' && sleepRest !== '';
  }, [totalMinutes, sleepQuality, sleepRest]);

  const handleSave = async () => {
    if (!canSave) {
      return;
    }
    try {
      setIsSaving(true);
      if (onSave) {
        // Редактирование
        await onSave(totalMinutes, sleepQuality, sleepRest);
      } else {
        // Добавление нового
        await addSleep(totalMinutes, selectedDate, undefined, sleepQuality, sleepRest);
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
      }
      onClose();
    } catch (e) {
      console.error('Failed to save sleep', e);
      alert('Ошибка при сохранении сна');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className={`fixed inset-0 ${isEditing ? 'z-[60]' : 'z-40'} flex items-end justify-center`}
      style={{ background: isEditing ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full rounded-t-[28px] overflow-hidden flex flex-col"
        style={{ 
          background: cardBg,
          maxHeight: '90vh',
        }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Прокручиваемый контейнер */}
        <div
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-5"
          style={{ paddingBottom: `calc(16px + env(safe-area-inset-bottom))` }}
        >
        {/* Заголовок с градиентом */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-1">
            <div 
              className="p-1.5 rounded-xl"
              style={{ 
                background: isDark 
                  ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.2), rgba(103, 58, 183, 0.3))'
                  : 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 140, 66, 0.2))'
              }}
            >
              <Moon size={18} style={{ color: primaryColor }} />
            </div>
            <div className="flex-1">
              <div className="text-base font-bold text-foreground">Добавить сон</div>
              <div className="text-[10px] text-muted-foreground">За {selectedDate}</div>
            </div>
            {isLoadingAverage && (
              <Sparkles size={12} className="text-muted-foreground animate-pulse" />
            )}
          </div>
        </div>

        {/* Время сна - улучшенный дизайн */}
        <div className="mb-4">
          <div 
            className="p-3 rounded-xl mb-3"
            style={{ 
              background: isDark 
                ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(103, 58, 183, 0.1))'
                : 'linear-gradient(135deg, rgba(255, 107, 53, 0.1), rgba(255, 140, 66, 0.08))',
              border: `1px solid ${isDark ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255, 107, 53, 0.2)'}`
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">⏰</span>
                <span className="text-xs font-semibold text-foreground">Время сна</span>
              </div>
              <div 
                className="px-2 py-0.5 rounded-full text-xs font-bold"
                style={{ 
                  background: mediumColor,
                  color: primaryColor
                }}
              >
                {hours}ч {minutes}мин
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
          <div>
                <div className="text-[10px] text-muted-foreground mb-1 font-medium">Часы</div>
            <input
                  ref={hoursInputRef}
              type="number"
              value={hours}
              onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-base font-bold text-center transition-all"
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: 'var(--foreground)',
                    border: `2px solid ${mediumColor}`
                  }}
              inputMode="numeric"
                  min="0"
                  max="24"
            />
          </div>
          <div>
                <div className="text-[10px] text-muted-foreground mb-1 font-medium">Минуты</div>
            <input
                  ref={minutesInputRef}
              type="number"
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg text-base font-bold text-center transition-all"
                  style={{ 
                    background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    color: 'var(--foreground)',
                    border: `2px solid ${mediumColor}`
                  }}
              inputMode="numeric"
                  min="0"
                  max="59"
                />
              </div>
            </div>
            {isLoadingAverage && (
              <div className="text-[10px] text-muted-foreground mt-1.5 flex items-center gap-1">
                <Sparkles size={10} />
                <span>Анализирую историю...</span>
              </div>
            )}
          </div>
        </div>

        {/* Вопрос 1: Как спалось? */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">📊</span>
            <span className="text-sm font-bold text-foreground">Как спалось?</span>
          </div>
          <div className="space-y-1.5">
            {[
              { value: 'excellent', label: 'Отлично — крепко, проснулся бодрым', emoji: '✨' },
              { value: 'good', label: 'Нормально — 1-2 пробуждения', emoji: '😊' },
              { value: 'poor', label: 'Плохо — много прерываний', emoji: '😴' },
              { value: 'very_poor', label: 'Очень плохо — поверхностный сон', emoji: '😫' },
            ].map((option) => (
              <motion.label
                key={option.value}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                style={{
                  background: sleepQuality === option.value 
                    ? (isDark 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(103, 58, 183, 0.2))'
                        : 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 140, 66, 0.12))')
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                  border: sleepQuality === option.value 
                    ? `1.5px solid ${darkColor}`
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name="sleepQuality"
                  value={option.value}
                  checked={sleepQuality === option.value}
                  onChange={(e) => setSleepQuality(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: accentColor }}
                />
                <span className="text-xs mr-1.5">{option.emoji}</span>
                <span className="text-xs text-foreground flex-1 font-medium">{option.label}</span>
              </motion.label>
            ))}
          </div>
        </div>

        {/* Вопрос 2: Выспался ли? */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-sm">😴</span>
            <span className="text-sm font-bold text-foreground">Выспался ли?</span>
          </div>
          <div className="space-y-1.5">
            {[
              { value: 'fully', label: 'Полностью — энергии много', emoji: '⚡' },
              { value: 'enough', label: 'Достаточно — форма нормальная', emoji: '👍' },
              { value: 'not_enough', label: 'Недоспал — усталость чувствуется', emoji: '😔' },
              { value: 'very_tired', label: 'Сильно недоспал — разбит', emoji: '💤' },
            ].map((option) => (
              <motion.label
                key={option.value}
                className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                style={{
                  background: sleepRest === option.value 
                    ? (isDark 
                        ? 'linear-gradient(135deg, rgba(139, 92, 246, 0.25), rgba(103, 58, 183, 0.2))'
                        : 'linear-gradient(135deg, rgba(255, 107, 53, 0.15), rgba(255, 140, 66, 0.12))')
                    : (isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'),
                  border: sleepRest === option.value 
                    ? `1.5px solid ${darkColor}`
                    : `1px solid ${isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'}`,
                }}
                whileTap={{ scale: 0.98 }}
              >
                <input
                  type="radio"
                  name="sleepRest"
                  value={option.value}
                  checked={sleepRest === option.value}
                  onChange={(e) => setSleepRest(e.target.value)}
                  className="w-4 h-4"
                  style={{ accentColor: accentColor }}
                />
                <span className="text-xs mr-1.5">{option.emoji}</span>
                <span className="text-xs text-foreground flex-1 font-medium">{option.label}</span>
              </motion.label>
            ))}
          </div>
        </div>

        </div>

        {/* Кнопка сохранить - фиксированная внизу */}
        <div className="p-5 pt-0" style={{ paddingBottom: `calc(12px + env(safe-area-inset-bottom))` }}>
        <button
          onClick={handleSave}
            disabled={!canSave || isSaving}
            className="w-full py-3 rounded-[50px] text-base font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: canSave ? accentColor : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)') }}
        >
          {isSaving ? 'Сохраняю…' : 'Сохранить'}
        </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


