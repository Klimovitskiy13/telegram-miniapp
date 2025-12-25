/**
 * Экран активности: шаги и сон за выбранный день календаря
 */

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Footprints, Moon, Dumbbell, Calendar, BookOpen, Heart, Layers, Zap, Grip, Target, Headphones, Circle } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { getSleep, getSteps, getStepsMonth, getWorkouts } from '../api/activity';
import { formatLocalISODate } from '../utils/selectedDate';
import { calculateSleepRating, getSleepRatingColor } from '../utils/sleepRating';
import { calculateWorkoutRating, getWorkoutRatingColor } from '../utils/workoutRating';
import { generateShortComment } from '../utils/aiComments';
import { checkUser } from '../api/user';
import { getTelegramUser } from '../api/telegram';
import { StepsStatsModal } from './modals/StepsStatsModal';
import { WorkoutsStatsModal } from './modals/WorkoutsStatsModal';
import { SleepStatsModal } from './modals/SleepStatsModal';
import { createGlassCardStyle } from '../utils/glassCardStyle';

interface ActivityScreenProps {
  selectedDate: string; // YYYY-MM-DD
}

export const ActivityScreen = ({ selectedDate }: ActivityScreenProps) => {
  const { isDark } = useTheme();

  const [stepsTotal, setStepsTotal] = useState<number>(0);
  const [sleepMinutes, setSleepMinutes] = useState<number>(0);
  const [sleepRating, setSleepRating] = useState<number | null>(null);
  const [sleepComment, setSleepComment] = useState<string>('');
  const [workoutMinutes, setWorkoutMinutes] = useState<number>(0);
  const [workoutRating, setWorkoutRating] = useState<number | null>(null);
  const [workoutComment, setWorkoutComment] = useState<string>('');
  const [isRefreshing, setIsRefreshing] = useState(true);
  const [stepsByDate, setStepsByDate] = useState<Record<string, number>>({});
  const [stepsGoal, setStepsGoal] = useState<number>(13000);
  const [showStepsModal, setShowStepsModal] = useState(false);
  const [showWorkoutsModal, setShowWorkoutsModal] = useState(false);
  const [showSleepModal, setShowSleepModal] = useState(false);
  const [showWorkoutPlanModal, setShowWorkoutPlanModal] = useState(false);
  const [showExercisesModal, setShowExercisesModal] = useState(false);
  const stepsCardStyle = useMemo(() => createGlassCardStyle(isDark, '#3b82f6'), [isDark]);
  const workoutsCardStyle = useMemo(() => createGlassCardStyle(isDark, '#22c55e'), [isDark]);
  const sleepCardStyle = useMemo(() => createGlassCardStyle(isDark, '#673AB7'), [isDark]);
  const workoutPlanCardStyle = useMemo(() => createGlassCardStyle(isDark, '#f97316'), [isDark]);
  const exercisesCardStyle = useMemo(() => createGlassCardStyle(isDark, '#ec4899'), [isDark]);

  const loadStepsWeek = async (dateISO: string, currentSteps?: number) => {
    const date = parseISODateSafe(dateISO);
    const start = new Date(date);
    start.setDate(date.getDate() - 6);

    const monthsToFetch = new Set<string>();
    const addMonthKey = (d: Date) => monthsToFetch.add(`${d.getFullYear()}-${d.getMonth() + 1}`);
    addMonthKey(date);
    addMonthKey(start);

    const monthTotalsEntries = await Promise.all(
      Array.from(monthsToFetch).map(async (key) => {
        const [year, month] = key.split('-').map((v) => parseInt(v, 10));
        const totals = await getStepsMonth(year, month);
        return totals;
      }),
    );

    setStepsByDate((prev) => {
      const merged: Record<string, number> = { ...prev };
      monthTotalsEntries.forEach((totals) => {
        Object.entries(totals).forEach(([k, v]) => {
          merged[k] = v;
        });
      });
      // для выбранного дня используем актуальные шаги, если они переданы
      if (currentSteps !== undefined) {
        merged[dateISO] = currentSteps;
      } else if (merged[dateISO] === undefined) {
        merged[dateISO] = 0;
      }
      return merged;
    });
  };

  // Загрузка stepsGoal из пользователя
  useEffect(() => {
    const loadStepsGoal = async () => {
      try {
        const telegramUser = getTelegramUser();
        if (!telegramUser) return;

        const response = await checkUser({
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
        });

        if (response.success && response.user) {
          setStepsGoal(response.user.stepsGoal || 13000);
        }
      } catch (error) {
        console.error('Failed to load steps goal', error);
      }
    };

    loadStepsGoal();
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsRefreshing(true);
        const [steps, sleep, workoutsRes] = await Promise.all([
          getSteps(selectedDate),
          getSleep(selectedDate),
          getWorkouts(selectedDate),
        ]);
        if (!mounted) return;
        setStepsTotal(steps.totalSteps);
        setSleepMinutes(sleep.totalMinutes);
        
        // Рассчитываем оценку сна и генерируем комментарий
        if (sleep.entries && sleep.entries.length > 0) {
          const latestEntry = sleep.entries[sleep.entries.length - 1];
          const rating = calculateSleepRating({
            minutes: latestEntry.minutes,
            sleepQuality: latestEntry.sleepQuality,
            sleepRest: latestEntry.sleepRest,
          });
          setSleepRating(rating);
          
          // Генерируем короткий комментарий
          generateShortComment('sleep', {
            minutes: latestEntry.minutes,
            sleepQuality: latestEntry.sleepQuality,
            sleepRest: latestEntry.sleepRest,
          }).then(setSleepComment);
        } else {
          setSleepRating(null);
          setSleepComment('');
        }
        
        setWorkoutMinutes(workoutsRes.totalMinutes);
        await loadStepsWeek(selectedDate, steps.totalSteps);
      } catch (e) {
        console.error('Failed to load activity', e);
      } finally {
        if (mounted) setIsRefreshing(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [selectedDate]);

  // Обновление от модалок (через событие)
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<{ date?: string }>;
      if (ce.detail?.date && ce.detail.date !== selectedDate) return;
      // тихий рефреш
      Promise.all([getSteps(selectedDate), getSleep(selectedDate), getWorkouts(selectedDate)])
        .then(([steps, sleep, workoutsRes]) => {
          setStepsTotal(steps.totalSteps);
          setSleepMinutes(sleep.totalMinutes);
          
          // Рассчитываем оценку сна и генерируем комментарий
          if (sleep.entries && sleep.entries.length > 0) {
            const latestEntry = sleep.entries[sleep.entries.length - 1];
            const rating = calculateSleepRating({
              minutes: latestEntry.minutes,
              sleepQuality: latestEntry.sleepQuality,
              sleepRest: latestEntry.sleepRest,
            });
            setSleepRating(rating);
            
            // Генерируем короткий комментарий
            generateShortComment('sleep', {
              minutes: latestEntry.minutes,
              sleepQuality: latestEntry.sleepQuality,
              sleepRest: latestEntry.sleepRest,
            }).then(setSleepComment);
          } else {
            setSleepRating(null);
            setSleepComment('');
          }
          
          setWorkoutMinutes(workoutsRes.totalMinutes);
          
          // Рассчитываем оценку тренировки и генерируем комментарий
          if (workoutsRes.entries && workoutsRes.entries.length > 0) {
            const latestEntry = workoutsRes.entries[workoutsRes.entries.length - 1];
            const rating = calculateWorkoutRating({
              type: latestEntry.type,
              category: latestEntry.category,
              minutes: latestEntry.minutes,
            });
            setWorkoutRating(rating);
            
            // Генерируем короткий комментарий
            generateShortComment('workout', {
              type: latestEntry.type,
              category: latestEntry.category,
              minutes: latestEntry.minutes,
            }).then(setWorkoutComment);
          } else {
            setWorkoutRating(null);
            setWorkoutComment('');
          }
          
          return loadStepsWeek(selectedDate, steps.totalSteps);
        })
        .catch(() => null);
    };
    window.addEventListener('activity-updated', handler);
    return () => window.removeEventListener('activity-updated', handler);
  }, [selectedDate]);

  const stepsProgress = useMemo(() => Math.min((stepsTotal / stepsGoal) * 100, 100), [stepsTotal]);
  const sleepGoal = 8 * 60; // 8 часов, потом сделаем настраиваемым
  const workoutGoal = 60; // 60 минут в день
  const stepsWeek = useMemo(
    () => buildStepsBars(selectedDate, stepsByDate, stepsTotal),
    [selectedDate, stepsByDate, stepsTotal],
  );
  const stepsWeekMax = useMemo(
    () => Math.max(...stepsWeek.map((b) => b.value), stepsGoal),
    [stepsWeek, stepsGoal],
  );

  const skeleton = isRefreshing;

  return (
    <div className="p-6 space-y-4">
      <div className="grid grid-cols-2 gap-4">
      <motion.div
          className="relative overflow-hidden rounded-3xl p-2.5 aspect-square cursor-pointer"
          style={stepsCardStyle}
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          onClick={() => setShowStepsModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex items-start justify-between mb-1.5">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Footprints size={14} className="text-blue-400" />
                <div className="text-sm font-semibold text-foreground">Шаги</div>
              </div>
              <div className="text-lg font-bold text-foreground">
                {skeleton ? '—' : stepsTotal.toLocaleString('ru-RU')}
              </div>
            </div>
            <div className="relative">
              <svg width="40" height="40">
                <circle cx="20" cy="20" r="16" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} strokeWidth="3" fill="none" />
                <motion.circle
                  cx="20"
                  cy="20"
                  r="16"
                  stroke="url(#waterGradient)"
                  strokeWidth="3"
                  fill="none"
                  strokeLinecap="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: stepsProgress / 100 }}
                  transition={{ duration: 0.8 }}
                  style={{ rotate: '-90deg', originX: '20px', originY: '20px' }}
                />
                <defs>
                  <linearGradient id="waterGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#22d3ee" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-[9px] font-semibold text-foreground">{Math.round(stepsProgress)}%</div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] mb-1">
            <span className="text-muted-foreground">Цель</span>
            <span className="text-foreground font-semibold">{stepsGoal.toLocaleString('ru-RU')}</span>
          </div>
          <div className="h-0.5 w-full relative mb-2">
            <div
              className="h-full w-full"
              style={{
                background: isDark 
                  ? 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)'
                  : 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.25) 50%, rgba(0,0,0,0.15) 80%, transparent 100%)',
              }}
          />
        </div>

          <div className="h-16 grid grid-cols-7 gap-1 items-end">
            {stepsWeek.map((bar, idx) => {
              const heightPercent = (bar.value / stepsWeekMax) * 100;
              const heightPx = Math.max((heightPercent / 100) * 64, bar.value > 0 ? 8 : 0); // h-16 = 64px
              const isSelected = bar.isSelected ?? false;
              return (
                <div key={`${bar.label}-${idx}`} className="flex flex-col items-center gap-0.5">
                  <div
                    className="w-3/4 rounded-full bg-gradient-to-t from-blue-600 to-cyan-400 transition-all"
                    style={{ height: `${heightPx}px`, opacity: isSelected ? 1 : 0.4 }}
                  />
                  <div className={`text-[7px] ${isSelected ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>
                    {bar.label}
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>

      <motion.div
          className="relative overflow-hidden rounded-3xl p-4 w-full"
          style={workoutsCardStyle}
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          onClick={() => setShowWorkoutsModal(true)}
          whileHover={{ scale: 1.01 }}
          whileTap={{ scale: 0.99 }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 cursor-pointer">
              <div className="flex items-center gap-2 mb-1">
                <Dumbbell size={18} className="text-green-400" />
                <div className="text-sm font-semibold text-foreground">Тренировки</div>
              </div>
              <div className="text-lg font-bold text-foreground">
                {skeleton ? '—' : workoutMinutes > 0 ? `${workoutMinutes} мин` : '—'}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-[9px] text-muted-foreground">Цель</div>
                <div className="text-sm font-semibold text-foreground">{workoutGoal} мин</div>
              </div>
              <div className="relative">
                {/* Workout Rating Circle */}
                {workoutRating !== null && (
                  <svg width="48" height="48">
                    <circle cx="24" cy="24" r="20" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} strokeWidth="4" fill="none" />
                    <motion.circle
                      cx="24"
                      cy="24"
                      r="20"
                      stroke={getWorkoutRatingColor(workoutRating)}
                      strokeWidth="4"
                      fill="none"
                      strokeLinecap="round"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: workoutRating / 100 }}
                      transition={{ duration: 0.8 }}
                      style={{ rotate: '-90deg', originX: '24px', originY: '24px' }}
                />
                  </svg>
                )}
                {workoutRating !== null && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-[9px] font-semibold text-foreground">
                      {workoutRating}%
                    </div>
                  </div>
                )}
              </div>
            </div>
              </div>
          <div className="h-0.5 w-full relative mb-3">
                <div
                  className="h-full w-full"
                  style={{
                background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)',
                  }}
          />
        </div>
          {workoutMinutes > 0 && workoutComment ? (
            <div className="text-[8px] text-muted-foreground leading-tight">
              {workoutComment}
                </div>
          ) : workoutMinutes > 0 ? (
            <div className="text-[8px] text-muted-foreground">
              Регулярные тренировки укрепляют тело и дух
                </div>
          ) : (
            <div className="flex items-center justify-center h-12">
              <div className="text-center">
                <Dumbbell size={24} className="text-green-400/60 mx-auto mb-1" />
                <div className="text-[8px] text-muted-foreground">Добавь тренировку</div>
              </div>
            </div>
          )}
      </motion.div>
      </div>

      <motion.div
        className="relative overflow-hidden rounded-3xl p-4 w-full"
        style={{ ...sleepCardStyle, height: '160px' }}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 cursor-pointer" onClick={() => setShowSleepModal(true)}>
            <div className="flex items-center gap-2 mb-1">
              <Moon size={18} className="text-purple-400" />
              <div className="text-sm font-semibold text-foreground">Сон</div>
            </div>
            <div className="text-lg font-bold text-foreground">
              {skeleton ? '—' : `${Math.round(sleepMinutes / 60)}ч ${sleepMinutes % 60}м`}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[9px] text-muted-foreground">Цель</div>
              <div className="text-sm font-semibold text-foreground">8ч</div>
            </div>
            <div className="relative">
              <svg width="48" height="48">
                <circle cx="24" cy="24" r="20" stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"} strokeWidth="4" fill="none" />
                {sleepRating !== null && (
                  <motion.circle
                    cx="24"
                    cy="24"
                    r="20"
                    stroke={getSleepRatingColor(sleepRating)}
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    animate={{ pathLength: sleepRating / 100 }}
                    transition={{ duration: 0.8 }}
                    style={{ rotate: '-90deg', originX: '24px', originY: '24px' }}
                  />
                )}
              </svg>
              {sleepRating !== null && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-[9px] font-semibold text-foreground" style={{ color: getSleepRatingColor(sleepRating) }}>
                    {sleepRating}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="h-0.5 w-full relative mb-3">
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)',
            }}
          />
              </div>
        {sleepMinutes > 0 && sleepComment ? (
          <div className="text-[8px] text-muted-foreground leading-tight">
            {sleepComment}
          </div>
        ) : sleepMinutes > 0 ? (
          <div className="text-[8px] text-muted-foreground">
            Хороший сон важен для восстановления
              </div>
        ) : (
          <div className="flex items-center justify-center h-12">
            <div className="text-center">
              <Moon size={24} className="text-purple-400/60 mx-auto mb-1" />
              <div className="text-[8px] text-muted-foreground">Добавь данные о сне</div>
            </div>
          </div>
          )}
      </motion.div>

      {/* Блок "План тренировок" */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-5 w-full cursor-pointer"
        style={{ ...workoutPlanCardStyle, minHeight: '180px' }}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.3 }}
        onClick={() => setShowWorkoutPlanModal(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Calendar size={20} className="text-orange-400" />
              <div className="text-base font-semibold text-foreground">План тренировок</div>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Создавай и отслеживай свои планы тренировок
            </div>
          </div>
        </div>

        <div className="h-0.5 w-full relative mb-4">
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)',
            }}
          />
        </div>

        <div className="flex items-center justify-center gap-3">
          <div className="flex flex-col items-center gap-2">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-500/20 to-orange-400/20 flex items-center justify-center">
              <Calendar size={28} className="text-orange-400 opacity-70" />
            </div>
            <div className="text-[10px] text-muted-foreground text-center px-2">
              Просмотр и создание планов
            </div>
          </div>
        </div>
      </motion.div>

      {/* Блок "Упражнения" */}
      <motion.div
        className="relative overflow-hidden rounded-3xl p-5 w-full cursor-pointer"
        style={{ ...exercisesCardStyle, minHeight: '180px' }}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.4 }}
        onClick={() => setShowExercisesModal(true)}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen size={20} className="text-pink-400" />
              <div className="text-base font-semibold text-foreground">Упражнения</div>
            </div>
            <div className="text-sm text-muted-foreground mb-3">
              Библиотека упражнений на все группы мышц
            </div>
          </div>
        </div>

        <div className="h-0.5 w-full relative mb-4">
          <div
            className="h-full w-full"
            style={{
              background: 'linear-gradient(to right, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)',
            }}
          />
        </div>

        <div className="grid grid-cols-4 gap-2.5">
          {[
            { name: 'Грудь', icon: Heart },
            { name: 'Спина', icon: Layers },
            { name: 'Ноги', icon: Footprints },
            { name: 'Плечи', icon: Zap },
            { name: 'Руки', icon: Grip },
            { name: 'Пресс', icon: Target },
            { name: 'Бицепс', icon: Grip },
            { name: 'Трицепс', icon: Grip },
            { name: 'Квадрицепс', icon: Footprints },
            { name: 'Икры', icon: Footprints },
            { name: 'Ягодицы', icon: Target },
            { name: 'Шея', icon: Headphones },
          ].map((muscleGroup, idx) => {
            const Icon = muscleGroup.icon;
            return (
              <div key={idx} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-400/20 flex items-center justify-center">
                  <Icon size={16} className="text-pink-400 opacity-70" />
                </div>
                <div className="text-[8px] text-muted-foreground text-center leading-tight">
                  {muscleGroup.name}
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      <AnimatePresence>
        {showStepsModal && (
          <StepsStatsModal
            selectedDate={selectedDate}
            currentStepsGoal={stepsGoal}
            onClose={() => setShowStepsModal(false)}
            onGoalUpdated={(newGoal) => {
              setStepsGoal(newGoal);
              window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
            }}
          />
        )}
        {showWorkoutsModal && (
          <WorkoutsStatsModal
            selectedDate={selectedDate}
            currentWorkoutGoal={workoutGoal}
            onClose={() => setShowWorkoutsModal(false)}
          />
        )}
        {showSleepModal && (
          <SleepStatsModal
            selectedDate={selectedDate}
            currentSleepGoal={sleepGoal}
            onClose={() => setShowSleepModal(false)}
          />
        )}
        {showWorkoutPlanModal && (
          <WorkoutPlanModal
            selectedDate={selectedDate}
            onClose={() => setShowWorkoutPlanModal(false)}
          />
        )}
        {showExercisesModal && (
          <ExercisesModal
            onClose={() => setShowExercisesModal(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

// Модалка планов тренировок
interface WorkoutPlanModalProps {
  selectedDate: string;
  onClose: () => void;
}

const WorkoutPlanModal = ({ onClose }: WorkoutPlanModalProps) => {
  const { isDark } = useTheme();
  const cardStyle = useMemo(() => createGlassCardStyle(isDark, '#f97316'), [isDark]);

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
        className="relative rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        style={cardStyle}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <Calendar size={24} className="text-orange-400" />
          <h3 className="text-xl font-bold text-foreground">План тренировок</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Здесь будет функционал для создания и просмотра планов тренировок.
        </p>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-base font-semibold"
          style={{ background: '#f97316', color: '#ffffff' }}
        >
          Закрыть
        </button>
      </motion.div>
    </motion.div>
  );
};

// Модалка упражнений
interface ExercisesModalProps {
  onClose: () => void;
}

const ExercisesModal = ({ onClose }: ExercisesModalProps) => {
  const { isDark } = useTheme();
  const cardStyle = useMemo(() => createGlassCardStyle(isDark, '#ec4899'), [isDark]);

  const muscleGroups = [
    { name: 'Грудь', icon: Heart },
    { name: 'Спина', icon: Layers },
    { name: 'Ноги', icon: Footprints },
    { name: 'Плечи', icon: Zap },
    { name: 'Руки', icon: Grip },
    { name: 'Пресс', icon: Target },
    { name: 'Бицепс', icon: Grip },
    { name: 'Трицепс', icon: Grip },
    { name: 'Квадрицепс', icon: Footprints },
    { name: 'Икры', icon: Footprints },
    { name: 'Ягодицы', icon: Circle },
    { name: 'Шея', icon: Headphones },
  ];

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
        className="relative rounded-3xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
        style={cardStyle}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 mb-4">
          <BookOpen size={24} className="text-pink-400" />
          <h3 className="text-xl font-bold text-foreground">Библиотека упражнений</h3>
        </div>
        <p className="text-sm text-muted-foreground mb-6">
          Выберите группу мышц для просмотра упражнений:
        </p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {muscleGroups.map((group, idx) => {
            const Icon = group.icon;
            return (
              <motion.button
                key={idx}
                className="flex flex-col items-center gap-2 p-3 rounded-xl bg-gradient-to-br from-pink-500/10 to-pink-400/10 hover:from-pink-500/20 hover:to-pink-400/20 transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  // TODO: Открыть список упражнений для этой группы мышц
                  console.log(`Open exercises for ${group.name}`);
                }}
              >
                <Icon size={24} className="text-pink-400" />
                <span className="text-xs text-foreground font-medium">{group.name}</span>
              </motion.button>
            );
          })}
        </div>
        <button
          onClick={onClose}
          className="w-full py-3 rounded-xl text-base font-semibold"
          style={{ background: '#ec4899', color: '#ffffff' }}
        >
          Закрыть
        </button>
      </motion.div>
    </motion.div>
  );
};

const buildStepsBars = (isoDate: string, stepsByDate: Record<string, number>, selectedSteps: number) => {
  const date = parseISODateSafe(isoDate);
  // старт недели с понедельника
  const dayOfWeek = (date.getDay() + 6) % 7; // 0 = пн, 6 = вс
  const start = new Date(date);
  start.setDate(date.getDate() - dayOfWeek);

  const days: { label: string; value: number; isSelected: boolean }[] = [];
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  for (let i = 0; i < 7; i += 1) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const iso = formatLocalISODate(d);
    const label = weekDays[i];
    const isSelected = iso === isoDate;
    // Для выбранного дня всегда используем актуальные шаги
    let value = isSelected ? selectedSteps : (stepsByDate[iso] ?? 0);
    // Если в stepsByDate есть более свежие данные для выбранного дня, используем их
    if (isSelected && stepsByDate[iso] !== undefined) {
      value = Math.max(value, stepsByDate[iso]);
    }
    days.push({ label, value, isSelected });
  }

  return days;
};

const parseISODateSafe = (iso: string) => {
  const [y, m, d] = iso.split('-').map((v) => parseInt(v, 10));
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  return new Date(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate());
};
