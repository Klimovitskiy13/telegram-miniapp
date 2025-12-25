import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Moon, X, TrendingUp, Calendar, Trash2, Clock, Sparkles, Edit } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { getSleepMonth, getSleep, deleteSleep, updateSleep, type SleepEntry } from '../../api/activity';
import { getTelegramUser } from '../../api/telegram';
import { createModalCardStyle } from '../../utils/glassCardStyle';
import { generateDetailedComment } from '../../utils/aiComments';

interface SleepStatsModalProps {
  selectedDate: string; // YYYY-MM-DD
  currentSleepGoal: number; // минут в день
  onClose: () => void;
}

type Period = 'week' | 'month' | 'year';

export const SleepStatsModal = ({ selectedDate, currentSleepGoal, onClose }: SleepStatsModalProps) => {
  const { isDark } = useTheme();
  const accentColor = '#673AB7';
  const cardStyle = useMemo(() => createModalCardStyle(isDark, accentColor), [isDark]);

  const [activePeriod, setActivePeriod] = useState<Period>('week');
  const [weekData, setWeekData] = useState<Record<string, number>>({});
  const [monthData, setMonthData] = useState<Record<string, number>>({});
  const [yearData, setYearData] = useState<Record<string, number>>({});
  const [sleepEntries, setSleepEntries] = useState<SleepEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);
  const [selectedBarDate, setSelectedBarDate] = useState<string | null>(null);
  const [detailedComment, setDetailedComment] = useState<string>('');
  const [isLoadingComment, setIsLoadingComment] = useState(false);
  const [history7Days, setHistory7Days] = useState<any[]>([]);
  const [history14Days, setHistory14Days] = useState<any[]>([]);
  const [editingEntry, setEditingEntry] = useState<SleepEntry | null>(null);

  // Загрузка записей за выбранный день и истории для AI
  useEffect(() => {
    const loadEntries = async () => {
      setIsLoadingEntries(true);
      try {
        const sleepData = await getSleep(selectedDate);
        setSleepEntries(sleepData.entries || []);

        // Загружаем историю за 7 и 14 дней для AI анализа
        const today = new Date(selectedDate);
        const history7: any[] = [];
        const history14: any[] = [];

        for (let i = 1; i <= 14; i++) {
          const date = new Date(today);
          date.setDate(today.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          try {
            const dayData = await getSleep(dateStr);
            const dayTotal = dayData.totalMinutes || 0;
            const dayEntry = dayData.entries?.[0];
            
            const historyEntry = {
              date: dateStr,
              minutes: dayTotal,
              sleepQuality: dayEntry?.sleepQuality || null,
              sleepRest: dayEntry?.sleepRest || null,
            };

            if (i <= 7) {
              history7.push(historyEntry);
            }
            history14.push(historyEntry);
          } catch (err) {
            // Игнорируем ошибки для прошлых дат
          }
        }

        setHistory7Days(history7.reverse());
        setHistory14Days(history14.reverse());

        // Генерируем подробный комментарий
        if (sleepData.entries && sleepData.entries.length > 0) {
          const latestEntry = sleepData.entries[sleepData.entries.length - 1];
          setIsLoadingComment(true);
          generateDetailedComment(
            'sleep',
            {
              minutes: latestEntry.minutes,
              sleepQuality: latestEntry.sleepQuality,
              sleepRest: latestEntry.sleepRest,
            },
            history7,
            history14
          )
            .then(setDetailedComment)
            .catch(() => setDetailedComment(''))
            .finally(() => setIsLoadingComment(false));
        }
      } catch (error) {
        console.error('Error loading sleep entries', error);
      } finally {
        setIsLoadingEntries(false);
      }
    };
    loadEntries();
  }, [selectedDate]);

  // Загрузка данных
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth() + 1;

        const monthTotals = await getSleepMonth(year, month);
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

        const yearTotals: Record<string, number> = {};
        const promises = [];
        for (let m = 1; m <= 12; m++) {
          promises.push(
            getSleepMonth(year, m).then((totals) => {
              Object.assign(yearTotals, totals);
            })
          );
        }
        await Promise.all(promises);
        setYearData(yearTotals);
      } catch (error) {
        console.error('Error loading sleep data', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [selectedDate]);

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
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const monthNames = ['Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн', 'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'];
      
      const bars = [];
      for (let m = 1; m <= 12; m++) {
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
    const maxValue = Math.max(...chartData.map((b) => b.value), currentSleepGoal);
    return maxValue > 0 ? maxValue : currentSleepGoal;
  }, [chartData, currentSleepGoal]);

  const goalLinePosition = useMemo(() => {
    if (chartMax === 0) return 0;
    return (currentSleepGoal / chartMax) * 100;
  }, [chartMax, currentSleepGoal]);

  const averageSleep = useMemo(() => {
    const values = chartData.map(b => b.value).filter(v => v > 0);
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Math.round(sum / values.length);
  }, [chartData]);

  const selectedDayData = useMemo(() => {
    if (!selectedBarDate) return null;
    const bar = chartData.find(b => b.date === selectedBarDate);
    return bar ? { date: bar.date, value: bar.value } : null;
  }, [selectedBarDate, chartData]);

  const formatSleepTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}ч ${mins}м`;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  };

  const getSleepQualityLabel = (quality: string | null) => {
    switch (quality) {
      case 'excellent': return 'Отлично';
      case 'good': return 'Нормально';
      case 'poor': return 'Плохо';
      case 'very_poor': return 'Очень плохо';
      default: return '—';
    }
  };

  const getSleepRestLabel = (rest: string | null) => {
    switch (rest) {
      case 'fully': return 'Полностью';
      case 'enough': return 'Достаточно';
      case 'not_enough': return 'Недоспал';
      case 'very_tired': return 'Сильно недоспал';
      default: return '—';
    }
  };

  const handleDeleteSleep = async (id: string) => {
    if (!confirm('Удалить эту запись сна?')) return;
    try {
      await deleteSleep(id);
      setSleepEntries(prev => prev.filter(e => e.id !== id));
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
      
      // Перезагружаем данные для обновления графика
      const date = new Date(selectedDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthTotals = await getSleepMonth(year, month);
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
      const sleepData = await getSleep(selectedDate);
      setSleepEntries(sleepData.entries || []);
    } catch (error) {
      console.error('Failed to delete sleep entry', error);
      alert('Ошибка при удалении записи сна');
    }
  };

  const handleEditSleep = (entry: SleepEntry) => {
    setEditingEntry(entry);
  };

  const handleSaveEdit = async () => {
    if (!editingEntry) return;
    setEditingEntry(null);
    
    // Перезагружаем данные для обновления графика
    const date = new Date(selectedDate);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const monthTotals = await getSleepMonth(year, month);
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
    
    const sleepData = await getSleep(selectedDate);
    setSleepEntries(sleepData.entries || []);
    window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
  };

  return (
    <>
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
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Moon size={24} style={{ color: accentColor }} />
              <div className="text-xl font-bold text-foreground">Сон</div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/10 transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

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
            <div className="mb-6 p-4 rounded-2xl bg-black/5 relative">
              <div 
                className="absolute left-4 right-4 flex items-center"
                style={{ 
                  bottom: `${(goalLinePosition / 100) * 160 + 40}px`,
                  top: 'auto'
                }}
              >
                <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
                  <path d="M0 4 L8 0 L8 8 Z" fill="currentColor" className="text-muted-foreground/40" />
                </svg>
                <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40 mx-2" />
                <div className={`px-2 py-0.5 rounded-md backdrop-blur-sm border flex-shrink-0 ${isDark ? 'bg-gray-700/50 border-gray-600/30' : 'bg-gray-200/80 border-gray-300/50'}`}>
                  <div className="text-[9px] text-muted-foreground whitespace-nowrap">
                    Цель: {formatSleepTime(currentSleepGoal)}
                  </div>
                </div>
                <div className="flex-1 h-px border-t border-dashed border-muted-foreground/40 mx-2" />
                <svg width="8" height="8" viewBox="0 0 8 8" className="flex-shrink-0">
                  <path d="M0 0 L8 4 L0 8 Z" fill="currentColor" className="text-muted-foreground/40" />
                </svg>
              </div>
              
              <div className={`flex items-end h-40 mt-8 ${activePeriod === 'month' ? 'overflow-x-auto pb-2 gap-0.5' : 'gap-2'}`}>
                {chartData.map((bar, idx) => {
                  let heightPx = 0;
                  if (activePeriod === 'week' || activePeriod === 'month') {
                    if (bar.value >= currentSleepGoal) {
                      const goalLineHeightPx = (goalLinePosition / 100) * 160;
                      if (bar.value > currentSleepGoal) {
                        heightPx = Math.max((bar.value / chartMax) * 160, goalLineHeightPx);
                      } else {
                        heightPx = goalLineHeightPx;
                      }
                    } else {
                      heightPx = chartMax > 0 ? (bar.value / chartMax) * 160 : 0;
                    }
                    heightPx = Math.max(heightPx, bar.value > 0 ? 4 : 0);
                  } else {
                    const heightPercent = chartMax > 0 ? (bar.value / chartMax) * 100 : 0;
                    heightPx = Math.max((heightPercent / 100) * 160, bar.value > 0 ? 4 : 0);
                  }
                  
                  const isSelected = (activePeriod === 'week' || activePeriod === 'month') && bar.date === selectedDate;
                    const isBarSelected = selectedBarDate === bar.date;
                  const barWidth = activePeriod === 'week' ? 'flex-1' : activePeriod === 'month' ? 'w-2' : 'flex-1';
                  
                  const showLabel = activePeriod !== 'month' || (() => {
                    const dayNum = parseInt(bar.label, 10);
                    const lastDay = chartData.length;
                    return dayNum === 1 || dayNum === 5 || dayNum === 10 || dayNum === 15 || dayNum === 20 || dayNum === 25 || dayNum === lastDay;
                  })();
                  
                  return (
                    <div 
                      key={`bar-${bar.date}-${idx}`}
                        className={`${barWidth} flex flex-col items-center gap-2 min-w-0 cursor-pointer`}
                        onClick={() => {
                          if (bar.value > 0 && (activePeriod === 'week' || activePeriod === 'month')) {
                            setSelectedBarDate(selectedBarDate === bar.date ? null : bar.date);
                          }
                        }}
                    >
                      <motion.div
                        className={`w-full transition-all ${
                            isBarSelected
                              ? 'bg-gradient-to-t from-purple-500 to-pink-400 shadow-lg shadow-purple-500/30 ring-2 ring-purple-400' 
                              : isSelected 
                            ? 'bg-gradient-to-t from-purple-500 to-pink-400 shadow-lg shadow-purple-500/30' 
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
                      />
                      {showLabel && (
                        <div className={`text-[9px] whitespace-nowrap ${isSelected ? 'text-purple-400 font-semibold' : 'text-muted-foreground'}`}>
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

              <div className="mb-6 p-4 rounded-xl bg-black/5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={18} className="text-purple-400" />
                  <div className="text-sm font-semibold text-foreground">
                    {activePeriod === 'week' ? 'Среднее за неделю' : activePeriod === 'month' ? 'Среднее за месяц' : 'Среднее за год'}
                  </div>
                </div>
                <div className="text-lg font-bold text-foreground">
                  {formatSleepTime(averageSleep)}
                </div>
              </div>

              {selectedDayData && (
                <div className="mb-6 p-4 rounded-xl bg-purple-500/10 border border-purple-400/30">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar size={16} className="text-purple-400" />
                    <div className="text-sm font-semibold text-foreground">
                      {new Date(selectedDayData.date).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </div>
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {formatSleepTime(selectedDayData.value)}
                  </div>
                </div>
              )}

              <div className="mb-6">
                <div className="text-sm font-semibold text-foreground mb-3">Записи за {new Date(selectedDate).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}</div>
                {isLoadingEntries ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">Загрузка...</div>
                ) : sleepEntries.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs">Нет записей</div>
                ) : (
                  <div className="space-y-2">
                    {sleepEntries.map((entry) => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-xl bg-black/5 flex items-start justify-between gap-3"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Clock size={14} className="text-purple-400" />
                            <div className="text-sm font-semibold text-foreground">
                              {formatSleepTime(entry.minutes)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {formatTime(entry.createdAt)}
                            </div>
                          </div>
                          <div className="space-y-0.5 text-xs text-muted-foreground">
                            <div>Как спалось: {getSleepQualityLabel(entry.sleepQuality)}</div>
                            <div>Выспался ли: {getSleepRestLabel(entry.sleepRest)}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleEditSleep(entry)}
                            className="p-1.5 rounded-lg hover:bg-purple-500/20 transition-colors flex-shrink-0"
                            title="Редактировать запись"
                          >
                            <Edit size={16} className="text-purple-400" />
                          </button>
                          <button
                            onClick={() => handleDeleteSleep(entry.id)}
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

              {sleepEntries.length > 0 && (
                <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-400/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-purple-400" />
                    <div className="text-sm font-semibold text-foreground">Анализ и рекомендации</div>
                  </div>
                  {isLoadingComment ? (
                    <div className="text-xs text-muted-foreground">Генерация анализа...</div>
                  ) : detailedComment ? (
                    <div className="text-xs text-muted-foreground leading-relaxed">{detailedComment}</div>
                  ) : (
                    <div className="text-xs text-muted-foreground">Продолжайте следить за режимом сна для лучшего восстановления.</div>
                  )}
            </div>
              )}
          </>
        )}
        </motion.div>
      </motion.div>

      {editingEntry && (
        <EditSleepModal
          entry={editingEntry}
          selectedDate={selectedDate}
          onClose={() => setEditingEntry(null)}
          onSave={handleSaveEdit}
        />
      )}
    </>
  );
};

interface EditSleepModalProps {
  entry: SleepEntry;
  selectedDate: string;
  onClose: () => void;
  onSave: () => void;
}

const EditSleepModal = ({ entry, selectedDate, onClose, onSave }: EditSleepModalProps) => {
  const { isDark } = useTheme();
  const accentColor = '#673AB7';
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  
  const [hours, setHours] = useState(Math.floor(entry.minutes / 60).toString());
  const [minutes, setMinutes] = useState((entry.minutes % 60).toString());
  const [sleepQuality, setSleepQuality] = useState<string>(entry.sleepQuality || '');
  const [sleepRest, setSleepRest] = useState<string>(entry.sleepRest || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!hours || !minutes) return;
    const totalMinutes = parseInt(hours) * 60 + parseInt(minutes);
    if (totalMinutes <= 0) return;

    setIsSaving(true);
    try {
      await updateSleep(
        entry.id,
        totalMinutes,
        undefined,
        sleepQuality || undefined,
        sleepRest || undefined
      );
      onSave();
      onClose();
    } catch (error) {
      console.error('Failed to update sleep', error);
      alert('Ошибка при сохранении изменений');
    } finally {
      setIsSaving(false);
    }
  };

  const canSave = hours && minutes && sleepQuality && sleepRest;

  return (
    <motion.div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full max-w-sm mx-4 rounded-3xl p-6"
        style={{ background: cardBg, backdropFilter: 'blur(20px)' }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-bold text-foreground">Редактировать сон</div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-black/10">
            <X size={20} className="text-foreground" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-foreground mb-2 block">Время сна</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0"
                max="24"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/10 border border-purple-400/30 text-foreground text-center"
                placeholder="ч"
              />
              <span className="text-foreground">:</span>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-black/10 border border-purple-400/30 text-foreground text-center"
                placeholder="м"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-foreground mb-2 block">Как спалось?</label>
            <div className="grid grid-cols-2 gap-2">
              {['excellent', 'good', 'poor', 'very_poor'].map((q) => (
                <button
                  key={q}
                  onClick={() => setSleepQuality(q)}
                  className={`px-3 py-2 rounded-xl text-xs transition-all ${
                    sleepQuality === q
                      ? 'text-white'
                      : 'text-foreground bg-black/10'
                  }`}
                  style={sleepQuality === q ? { background: accentColor } : {}}
                >
                  {q === 'excellent' ? 'Отлично' : q === 'good' ? 'Нормально' : q === 'poor' ? 'Плохо' : 'Очень плохо'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-foreground mb-2 block">Выспался ли?</label>
            <div className="grid grid-cols-2 gap-2">
              {['fully', 'enough', 'not_enough', 'very_tired'].map((r) => (
                <button
                  key={r}
                  onClick={() => setSleepRest(r)}
                  className={`px-3 py-2 rounded-xl text-xs transition-all ${
                    sleepRest === r
                      ? 'text-white'
                      : 'text-foreground bg-black/10'
                  }`}
                  style={sleepRest === r ? { background: accentColor } : {}}
                >
                  {r === 'fully' ? 'Полностью' : r === 'enough' ? 'Достаточно' : r === 'not_enough' ? 'Недоспал' : 'Сильно недоспал'}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave || isSaving}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${
              canSave && !isSaving
                ? 'text-white'
                : 'text-muted-foreground bg-black/10'
            }`}
            style={canSave && !isSaving ? { background: accentColor } : {}}
          >
            {isSaving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};
