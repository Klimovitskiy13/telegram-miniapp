import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Footprints, X, TrendingUp, Calendar, Target, Trash2, Sparkles, Edit } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { getStepsMonth, getSteps, deleteSteps, updateSteps, type StepsEntry } from '../../api/activity';
import { updateStepsGoal, checkUser } from '../../api/user';
import { getTelegramUser } from '../../api/telegram';
import { createModalCardStyle } from '../../utils/glassCardStyle';
import { generateDetailedComment } from '../../utils/aiComments';
import { AddStepsModal } from './AddStepsModal';

interface StepsStatsModalProps {
  selectedDate: string; // YYYY-MM-DD
  currentStepsGoal: number;
  onClose: () => void;
  onGoalUpdated: (newGoal: number) => void;
}

type Period = 'week' | 'month' | 'year';

export const StepsStatsModal = ({ selectedDate, currentStepsGoal, onClose, onGoalUpdated }: StepsStatsModalProps) => {
  const { isDark } = useTheme();
  const accentColor = '#3b82f6'; // Синий как в блоке шагов
  const cardStyle = useMemo(() => createModalCardStyle(isDark, accentColor), [isDark]);

  const [activePeriod, setActivePeriod] = useState<Period>('week');
  const [weekData, setWeekData] = useState<Record<string, number>>({});
  const [monthData, setMonthData] = useState<Record<string, number>>({});
  const [yearData, setYearData] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingGoal, setIsEditingGoal] = useState(false);
  const [newGoal, setNewGoal] = useState(currentStepsGoal.toString());
  const [isSavingGoal, setIsSavingGoal] = useState(false);
  const [stepsEntries, setStepsEntries] = useState<StepsEntry[]>([]);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [selectedBarDate, setSelectedBarDate] = useState<string | null>(null);
  const [detailedComment, setDetailedComment] = useState<string>('');
  const [isLoadingComment, setIsLoadingComment] = useState(false);
  const [history7Days, setHistory7Days] = useState<any[]>([]);
  const [history14Days, setHistory14Days] = useState<any[]>([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<StepsEntry | null>(null);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        // Загружаем данные за месяц
        const monthTotals = await getStepsMonth(year, month);
        setMonthData(monthTotals);

        // Загружаем данные за неделю (из месяца)
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7)); // Понедельник
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);

        const weekTotals: Record<string, number> = {};
        for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
          const iso = d.toISOString().split('T')[0];
          weekTotals[iso] = monthTotals[iso] || 0;
        }
        setWeekData(weekTotals);

        // Загружаем данные за год
        const yearTotals: Record<string, number> = {};
        const promises = [];
        for (let m = 1; m <= 12; m++) {
          promises.push(
            getStepsMonth(year, m).then((totals) => {
              Object.assign(yearTotals, totals);
            })
          );
        }
        await Promise.all(promises);
        setYearData(yearTotals);
      } catch (error) {
        console.error('Error loading steps data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

  // Подготовка данных для графиков
  const chartData = useMemo(() => {
    if (activePeriod === 'week') {
      const date = new Date(selectedDate);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      
      const bars = [];
      for (let i = 0; i < 7; i++) {
        const d = new Date(weekStart);
        d.setDate(weekStart.getDate() + i);
        const iso = d.toISOString().split('T')[0];
        const value = weekData[iso] || 0;
        const dayNames = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
        bars.push({
          label: dayNames[i],
          value,
          date: iso,
        });
      }
      return bars;
    } else if (activePeriod === 'month') {
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      const bars = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(year, month, day);
        const iso = d.toISOString().split('T')[0];
        const value = monthData[iso] || 0;
        bars.push({
          label: day.toString(),
          value,
          date: iso,
        });
      }
      return bars;
    } else {
      // Год - по месяцам
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      
      const bars = [];
      for (let m = 1; m <= 12; m++) {
        // Суммируем все дни месяца
        let monthTotal = 0;
        const daysInMonth = new Date(year, m, 0).getDate();
        for (let day = 1; day <= daysInMonth; day++) {
          const d = new Date(year, m - 1, day);
          const iso = d.toISOString().split('T')[0];
          monthTotal += yearData[iso] || 0;
        }
        bars.push({
          label: monthNames[m - 1],
          value: monthTotal,
          date: `${year}-${m.toString().padStart(2, '0')}`,
        });
      }
      return bars;
    }
  }, [activePeriod, weekData, monthData, yearData, selectedDate]);

  const chartMax = useMemo(() => {
    const maxValue = Math.max(...chartData.map((b) => b.value), currentStepsGoal);
    return maxValue > 0 ? maxValue : currentStepsGoal;
  }, [chartData, currentStepsGoal]);

  // Позиция линии цели в процентах от максимальной высоты графика
  const goalLinePosition = useMemo(() => {
    if (chartMax === 0) return 0;
    return (currentStepsGoal / chartMax) * 100;
  }, [chartMax, currentStepsGoal]);

  const handleSaveGoal = async () => {
    const value = parseInt(newGoal, 10);
    if (!Number.isFinite(value) || value <= 0) {
      alert('Введи корректную цель');
      return;
    }

    try {
      setIsSavingGoal(true);
      const telegramUser = getTelegramUser();
      if (!telegramUser) throw new Error('Telegram user not found');

      const response = await checkUser({
        id: telegramUser.id,
        first_name: telegramUser.first_name,
        last_name: telegramUser.last_name,
        username: telegramUser.username,
      });

      if (response.success && response.user) {
        await updateStepsGoal(response.user.id, value);
        onGoalUpdated(value);
        setIsEditingGoal(false);
      }
    } catch (error) {
      console.error('Failed to update steps goal', error);
      alert('Ошибка при сохранении цели');
    } finally {
      setIsSavingGoal(false);
    }
  };

  // Загрузка записей за выбранный день и истории для AI
  useEffect(() => {
    const loadEntries = async () => {
      setIsLoadingEntries(true);
      try {
        const stepsData = await getSteps(selectedDate);
        setStepsEntries(stepsData.entries || []);
      } catch (error) {
        console.error('Error loading steps entries', error);
      } finally {
        setIsLoadingEntries(false);
      }
    };

    loadEntries();
  }, [selectedDate]);

  // Загрузка истории для AI анализа
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const date = new Date(selectedDate);
        const history7: any[] = [];
        const history14: any[] = [];

        for (let i = 0; i < 14; i++) {
          const d = new Date(date);
          d.setDate(date.getDate() - i);
          const dateStr = d.toISOString().split('T')[0];
          try {
            const stepsData = await getSteps(dateStr);
            const total = stepsData.totalSteps || 0;
            if (i < 7) {
              history7.push({ date: dateStr, steps: total });
            }
            history14.push({ date: dateStr, steps: total });
          } catch (err) {
            // Игнорируем ошибки
          }
        }

        setHistory7Days(history7.reverse());
        setHistory14Days(history14.reverse());
      } catch (error) {
        console.error('Error loading steps history', error);
      }
    };

    if (stepsEntries.length > 0) {
      loadHistory();
    }
  }, [selectedDate, stepsEntries.length]);

  // Генерация AI комментария
  useEffect(() => {
    const generateComment = async () => {
      if (history7Days.length === 0 || history14Days.length === 0) return;

      setIsLoadingComment(true);
      try {
        const currentDayData = {
          date: selectedDate,
          steps: stepsEntries.reduce((sum, e) => sum + e.steps, 0),
        };
        const comment = await generateDetailedComment('steps', currentDayData, history7Days, history14Days);
        setDetailedComment(comment);
      } catch (error) {
        console.error('Error generating AI comment', error);
      } finally {
        setIsLoadingComment(false);
      }
    };

    if (history7Days.length > 0 && history14Days.length > 0) {
      generateComment();
    }
  }, [selectedDate, history7Days, history14Days, stepsEntries]);

  const handleDeleteSteps = async (id: string) => {
    if (!confirm('Удалить эту запись шагов?')) return;
    try {
      await deleteSteps(id);
      setStepsEntries(prev => prev.filter(e => e.id !== id));
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
      
      // Перезагружаем данные для обновления графика
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthTotals = await getStepsMonth(year, month);
      setMonthData(monthTotals);
      
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTotals: Record<string, number> = {};
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().split('T')[0];
        weekTotals[iso] = monthTotals[iso] || 0;
      }
      setWeekData(weekTotals);
      
      // Перезагружаем записи
      const stepsData = await getSteps(selectedDate);
      setStepsEntries(stepsData.entries || []);
    } catch (error) {
      console.error('Failed to delete steps entry', error);
      alert('Ошибка при удалении записи шагов');
    }
  };

  const handleEditSteps = (entry: StepsEntry) => {
    setEditingEntry(entry);
    setShowEditModal(true);
  };

  const handleSaveEditedSteps = async (updatedSteps: number) => {
    if (!editingEntry) return;
    try {
      await updateSteps(editingEntry.id, updatedSteps);
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
      setShowEditModal(false);
      setEditingEntry(null);
      
      // Перезагружаем данные для обновления графика
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthTotals = await getStepsMonth(year, month);
      setMonthData(monthTotals);
      
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - ((date.getDay() + 6) % 7));
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const weekTotals: Record<string, number> = {};
      for (let d = new Date(weekStart); d <= weekEnd; d.setDate(d.getDate() + 1)) {
        const iso = d.toISOString().split('T')[0];
        weekTotals[iso] = monthTotals[iso] || 0;
      }
      setWeekData(weekTotals);
      
      // Перезагружаем записи
      const stepsData = await getSteps(selectedDate);
      setStepsEntries(stepsData.entries || []);
    } catch (error) {
      console.error('Failed to update steps entry', error);
      alert('Ошибка при обновлении записи шагов.');
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const selectedDayData = useMemo(() => {
    if (!selectedBarDate) return null;
    const value = activePeriod === 'week' ? weekData[selectedBarDate] : activePeriod === 'month' ? monthData[selectedBarDate] : null;
    if (value === undefined || value === null) return null;
    return { date: selectedBarDate, value };
  }, [selectedBarDate, weekData, monthData, activePeriod]);

  const averageSteps = useMemo(() => {
    const data = activePeriod === 'week' ? weekData : activePeriod === 'month' ? monthData : yearData;
    const values = Object.values(data).filter(v => v > 0);
    if (values.length === 0) return 0;
    return Math.round(values.reduce((sum, v) => sum + v, 0) / values.length);
  }, [activePeriod, weekData, monthData, yearData]);

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-md mx-4 rounded-3xl p-6 max-h-[90vh] overflow-y-auto"
        style={cardStyle}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Footprints size={24} style={{ color: accentColor }} />
            <div className="text-xl font-bold text-foreground">Статистика шагов</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        {/* Period Tabs */}
        <div className="flex gap-2 mb-6">
          {(['week', 'month', 'year'] as Period[]).map((period) => (
            <button
              key={period}
              onClick={() => setActivePeriod(period)}
              className={`flex-1 py-2.5 px-4 rounded-2xl text-sm font-semibold transition-all ${
                activePeriod === period
                  ? 'text-white'
                  : 'text-foreground bg-black/5 hover:bg-black/10'
              }`}
              style={activePeriod === period ? { background: accentColor } : {}}
            >
              {period === 'week' ? 'Неделя' : period === 'month' ? 'Месяц' : 'Год'}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
        ) : (
          <>
            {/* Bar Chart */}
            <div className="mb-6 p-4 rounded-2xl bg-black/5 relative">
              {/* Target line with arrows */}
              <div 
                className="absolute left-4 right-4 flex items-center"
                style={{ 
                  bottom: `${(goalLinePosition / 100) * 160 + 40}px`,
                  top: 'auto'
                }}
              >
                {/* Left arrow */}
                <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
                  <path d="M0 4 L8 0 L8 8 Z" fill="currentColor" className="text-muted-foreground/40" />
                </svg>
                {/* Dashed line */}
                <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40 mx-2" />
                {/* Target label */}
                <div className={`px-2 py-0.5 rounded-md backdrop-blur-sm border flex-shrink-0 ${isDark ? 'bg-gray-700/50 border-gray-600/30' : 'bg-gray-200/80 border-gray-300/50'}`}>
                  <div className="text-[9px] text-muted-foreground whitespace-nowrap">
                    Цель: {currentStepsGoal.toLocaleString('ru-RU')}
                  </div>
                </div>
                {/* Dashed line */}
                <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40 mx-2" />
                {/* Right arrow */}
                <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
                  <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" className="text-muted-foreground/40" />
                </svg>
              </div>
              
              {/* Bars */}
              <div className={`flex items-end h-40 mt-8 ${activePeriod === 'month' ? 'overflow-x-auto pb-2 gap-0.5' : 'gap-2'}`}>
                {chartData.map((bar, idx) => {
                  // Для недели и месяца: если значение >= цели, столбец должен точно доходить до линии цели
                  let heightPx = 0;
                  if (activePeriod === 'week' || activePeriod === 'month') {
                    if (bar.value >= currentStepsGoal) {
                      // Если значение >= цели, столбец должен доходить до линии цели (или выше)
                      // Высота линии цели в пикселях от низа контейнера
                      const goalLineHeightPx = (goalLinePosition / 100) * 160;
                      // Если значение превышает цель, показываем реальную высоту
                      if (bar.value > currentStepsGoal) {
                        heightPx = Math.max((bar.value / chartMax) * 160, goalLineHeightPx);
                      } else {
                        // Если значение ровно равно цели, столбец точно доходит до линии
                        heightPx = goalLineHeightPx;
                      }
                    } else {
                      // Столбец пропорционален значению, но не доходит до цели
                      heightPx = chartMax > 0 ? (bar.value / chartMax) * 160 : 0;
                    }
                    heightPx = Math.max(heightPx, bar.value > 0 ? 4 : 0);
                  } else {
                    // Для года обычный расчет
                    const heightPercent = chartMax > 0 ? (bar.value / chartMax) * 100 : 0;
                    heightPx = Math.max((heightPercent / 100) * 160, bar.value > 0 ? 4 : 0);
                  }
                  
                  // Определяем выбранный день для недели и месяца
                  const isSelected = (activePeriod === 'week' || activePeriod === 'month') && bar.date === selectedDate;
                  const barWidth = activePeriod === 'week' ? 'flex-1' : activePeriod === 'month' ? 'w-2' : 'flex-1';
                  
                  // Для месяца показываем метки: 1, 5, 10, 15, 20, 25 и последний день месяца
                  const showLabel = activePeriod !== 'month' || (() => {
                    const dayNum = parseInt(bar.label, 10);
                    const lastDay = chartData.length;
                    return dayNum === 1 || dayNum === 5 || dayNum === 10 || dayNum === 15 || dayNum === 20 || dayNum === 25 || dayNum === lastDay;
                  })();
                  
                  return (
                    <div 
                      key={`bar-${bar.date}-${idx}`}
                      className={`${barWidth} flex flex-col items-center gap-2 min-w-0`}
                    >
                      <motion.div
                        className={`w-full transition-all cursor-pointer ${
                          isSelected || (selectedBarDate === bar.date)
                            ? 'bg-gradient-to-t from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/30' 
                            : 'bg-gradient-to-t from-gray-600/40 to-gray-500/30'
                        }`}
                        style={{ 
                          height: `${heightPx}px`,
                          minHeight: bar.value > 0 ? '4px' : '0px',
                          borderRadius: heightPx >= 4 ? '9999px 9999px 0 0' : '0',
                          overflow: 'hidden'
                        }}
                        initial={{ height: 0 }}
                        animate={{ height: heightPx }}
                        transition={{ duration: 0.5, delay: idx * 0.01 }}
                        onClick={() => {
                          if (activePeriod === 'week' || activePeriod === 'month') {
                            setSelectedBarDate(bar.date === selectedBarDate ? null : bar.date);
                          }
                        }}
                      />
                      {showLabel && (
                        <div className={`text-[9px] whitespace-nowrap ${isSelected ? 'text-blue-400 font-semibold' : 'text-muted-foreground'}`}>
                          {bar.label}
                        </div>
                      )}
                      {!showLabel && activePeriod === 'month' && (
                        <div className="text-[9px] text-transparent">
                          {bar.label}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              {activePeriod === 'month' && (
                <div className="text-[8px] text-muted-foreground text-center mt-2">
                  Прокрути для просмотра всех дней
                </div>
              )}
            </div>


            {/* Goal Section */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target size={18} className="text-blue-400" />
                  <div className="text-sm font-semibold text-foreground">Цель по шагам</div>
                </div>
                {!isEditingGoal && (
                  <button
                    onClick={() => setIsEditingGoal(true)}
                    className="text-xs text-blue-400 hover:text-blue-300"
                  >
                    Изменить
                  </button>
                )}
              </div>
              {isEditingGoal ? (
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={newGoal}
                    onChange={(e) => setNewGoal(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl text-base font-semibold"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'var(--foreground)' }}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveGoal}
                    disabled={isSavingGoal}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-50"
                    style={{ background: accentColor }}
                  >
                    {isSavingGoal ? '...' : 'OK'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditingGoal(false);
                      setNewGoal(currentStepsGoal.toString());
                    }}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-foreground bg-black/10"
                  >
                    Отмена
                  </button>
                </div>
              ) : (
                <div className="text-2xl font-bold text-foreground">
                  {currentStepsGoal.toLocaleString('ru-RU')} шагов
                </div>
              )}
            </div>

            {/* Статистика в письменном виде */}
            <div className="mb-6 p-4 rounded-xl bg-black/5">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={18} className="text-blue-400" />
                <div className="text-sm font-semibold text-foreground">
                  {activePeriod === 'week' ? 'Среднее за неделю' : activePeriod === 'month' ? 'Среднее за месяц' : 'Среднее за год'}
                </div>
              </div>
              <div className="text-lg font-bold text-foreground">
                {averageSteps.toLocaleString('ru-RU')} шагов
              </div>
            </div>

            {/* Данные за выбранный день на графике */}
            {selectedDayData && (
              <div className="mb-6 p-4 rounded-xl bg-blue-500/10 border border-blue-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={16} className="text-blue-400" />
                  <div className="text-sm font-semibold text-foreground">
                    {new Date(selectedDayData.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {selectedDayData.value.toLocaleString('ru-RU')} шагов
                </div>
              </div>
            )}

            {/* Записи за выбранный день */}
            <div className="mb-6">
              <div className="text-sm font-semibold text-foreground mb-3">Записи за {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
              {isLoadingEntries ? (
                <div className="text-center py-6 text-muted-foreground text-xs">Загрузка...</div>
              ) : stepsEntries.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground text-xs">Нет записей</div>
              ) : (
                <div className="space-y-2">
                  {stepsEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="p-3 rounded-xl bg-black/5 flex items-start justify-between gap-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Footprints size={14} className="text-blue-400" />
                          <div className="text-sm font-semibold text-foreground">
                            {entry.steps.toLocaleString('ru-RU')} шагов
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatTime(entry.createdAt)}
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleEditSteps(entry)}
                          className="p-1.5 rounded-lg hover:bg-blue-500/20 transition-colors flex-shrink-0"
                          title="Редактировать запись"
                        >
                          <Edit size={16} className="text-blue-400" />
                        </button>
                        <button
                          onClick={() => handleDeleteSteps(entry.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 transition-colors flex-shrink-0"
                          title="Удалить запись"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Подробный AI комментарий */}
            {stepsEntries.length > 0 && (
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-400/20">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-blue-400" />
                  <div className="text-sm font-semibold text-foreground">Анализ и рекомендации</div>
                </div>
                {isLoadingComment ? (
                  <div className="text-xs text-muted-foreground">Генерация анализа...</div>
                ) : detailedComment ? (
                  <div className="text-xs text-muted-foreground leading-relaxed">{detailedComment}</div>
                ) : (
                  <div className="text-xs text-muted-foreground">Продолжайте регулярную ходьбу для поддержания здоровья.</div>
                )}
              </div>
            )}
          </>
        )}
      </motion.div>

      {showEditModal && editingEntry && (
        <AddStepsModal
          selectedDate={selectedDate}
          onClose={() => {
            setShowEditModal(false);
            setEditingEntry(null);
          }}
          initialSteps={editingEntry.steps}
          onSave={(steps) => handleSaveEditedSteps(steps)}
        />
      )}
    </motion.div>
  );
};

