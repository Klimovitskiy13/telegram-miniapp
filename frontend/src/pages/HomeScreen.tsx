/**
 * Главный экран (дашборд) с блоками Daily Balance, Steps и Workout
 */

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Footprints, Zap, Target, Scale } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { getDailyNutritionStats, getFoodEntries, getWaterEntries } from '../api/nutrition';
import { getSteps, getWorkouts, getSleep, getWorkoutsUntilDate } from '../api/activity';
import { checkUser, updateGamificationStats, getGamificationStats } from '../api/user';
import { getTelegramUser } from '../api/telegram';
import { createGlassCardStyle } from '../utils/glassCardStyle';
import { GamificationBlock } from '../components/gamification/GamificationBlock';
import {
  evaluateHunger,
  evaluateSleepiness,
  evaluateThirst,
  evaluateEnergy,
  calculateDailyHealthImpact,
  calculateWorkoutEffect,
  applyWorkoutEffect,
} from '../gamification';
import {
  calculateMaxHealth,
  calculateXPForLevel,
  createInitialStats,
  checkLevelUp,
  calculateRecovery,
  type RecoveryBreakdown,
} from '../gamification';

interface HomeScreenProps {
  selectedDate: string; // YYYY-MM-DD
}

export const HomeScreen = ({ selectedDate }: HomeScreenProps) => {
  const { isDark } = useTheme();
  
  const [caloriesGoal, setCaloriesGoal] = useState<number>(2100);
  const [caloriesFood, setCaloriesFood] = useState<number>(0);
  const [caloriesExercise, setCaloriesExercise] = useState<number>(0);
  const [stepsTotal, setStepsTotal] = useState<number>(0);
  const [stepsGoal, setStepsGoal] = useState<number>(10000);
  const [workoutMinutes, setWorkoutMinutes] = useState<number>(0);
  const [workoutGoal, setWorkoutGoal] = useState<number>(60);
  const [isLoading, setIsLoading] = useState(true);
  
  // Данные геймификации
  const [gamificationStats, setGamificationStats] = useState({
    level: 1,
    health: 100,
    maxHealth: 100,
    xp: 0,
    // Физические статы
    strength: 0,
    endurance: 0,
    flexibility: 0,
    agility: 0,
    speed: 0,
    reflex: 0,
    // Физиологические статы
    hunger: 0,
    thirst: 0,
    sleepiness: 0,
    energy: 0,
  });
  const [recovery, setRecovery] = useState<RecoveryBreakdown | undefined>(undefined);

  // Загрузка данных
  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      try {
        setIsLoading(true);
        
        // Загружаем данные пользователя для целей
        const telegramUser = getTelegramUser();
        let isOnboardingDay = false;
        if (telegramUser) {
          try {
            const userResponse = await checkUser({
              id: telegramUser.id,
              first_name: telegramUser.first_name,
              last_name: telegramUser.last_name,
              username: telegramUser.username,
            });
            if (mounted && userResponse.success && userResponse.user) {
              const recommendedCalories = userResponse.user.onboarding?.recommendedCalories || 2100;
              setCaloriesGoal(recommendedCalories);
              setStepsGoal(userResponse.user.stepsGoal || 10000);
              // workoutGoal пока не в типе User, используем дефолт
              setWorkoutGoal(60);
              
              // Проверяем, является ли выбранная дата днем онбординга
              // Если онбординг не завершен И выбранная дата = сегодня, то это день онбординга
              // TODO: когда будет createdAt в User, сравнивать selectedDate с createdAt
              const isOnboardingCompleted = userResponse.user.onboarding?.isCompleted ?? false;
              const today = new Date().toISOString().split('T')[0];
              isOnboardingDay = !isOnboardingCompleted && selectedDate === today;
            }
          } catch (err) {
            console.error('Error loading user data:', err);
          }
        }

        // Загружаем данные питания
        try {
          const nutritionStats = await getDailyNutritionStats(selectedDate);
          if (mounted) setCaloriesFood(nutritionStats.calories || 0);
        } catch (err) {
          console.error('Error loading nutrition data:', err);
          if (mounted) setCaloriesFood(0);
        }

        // Загружаем шаги
        let stepsTotalValue = 0;
        try {
          const stepsData = await getSteps(selectedDate);
          stepsTotalValue = stepsData.totalSteps || 0;
          if (mounted) setStepsTotal(stepsTotalValue);
        } catch (err) {
          console.error('Error loading steps data:', err);
          if (mounted) setStepsTotal(0);
        }

        // Загружаем тренировки
        try {
          const workoutsData = await getWorkouts(selectedDate);
          if (mounted) {
            setWorkoutMinutes(workoutsData.totalMinutes || 0);
            // Упражнения сжигают калории (примерно 5-10 ккал/мин в зависимости от интенсивности)
            // Используем среднее значение 7 ккал/мин
            setCaloriesExercise(Math.round((workoutsData.totalMinutes || 0) * 7));
          }
        } catch (err) {
          console.error('Error loading workouts data:', err);
          if (mounted) {
            setWorkoutMinutes(0);
            setCaloriesExercise(0);
          }
        }

        // Загружаем сон для расчета геймификации и восстановления
        let sleepMinutes = 0;
        let sleepQuality: string | null = null;
        let sleepRest: string | null = null;
        try {
          const sleepData = await getSleep(selectedDate);
          if (mounted) {
            sleepMinutes = sleepData.totalMinutes || 0;
            // Берем данные из первой записи сна за день
            if (sleepData.entries && sleepData.entries.length > 0) {
              sleepQuality = sleepData.entries[0].sleepQuality || null;
              sleepRest = sleepData.entries[0].sleepRest || null;
            }
          }
        } catch (err) {
          console.error('Error loading sleep data:', err);
        }
        
        // Загружаем данные для расчета восстановления
        let workoutsForRecovery: Array<{ type: string; category: string; minutes: number }> = [];
        let foodEntriesForRecovery: Array<{ mealType: string; createdAt: string }> = [];
        let waterTotal = 0;
        let waterNormal3Days = false; // TODO: проверить последние 3 дня
        
        try {
          const workoutsData = await getWorkouts(selectedDate);
          workoutsForRecovery = workoutsData.entries || [];
        } catch (err) {
          console.error('Error loading workouts for recovery:', err);
        }
        
        try {
          const foodEntries = await getFoodEntries(selectedDate);
          foodEntriesForRecovery = foodEntries.map(entry => ({
            mealType: entry.mealType,
            createdAt: entry.createdAt,
          }));
        } catch (err) {
          console.error('Error loading food entries for recovery:', err);
        }
        
        try {
          const waterData = await getWaterEntries(selectedDate);
          waterTotal = waterData.totalAmount || 0;
          // TODO: проверить последние 3 дня для waterNormal3Days
        } catch (err) {
          console.error('Error loading water data for recovery:', err);
        }
        
        // Рассчитываем восстановление
        let recoveryBreakdown: RecoveryBreakdown | undefined = undefined;
        if (mounted) {
          try {
            // Рассчитываем усталость за 7 дней (суммарные минуты тренировок)
            let fatigue7Days = 0;
            try {
              const today = new Date(selectedDate);
              const weekStart = new Date(today);
              weekStart.setDate(today.getDate() - 6); // Последние 7 дней включая сегодня
              
              for (let d = new Date(weekStart); d <= today; d.setDate(d.getDate() + 1)) {
                const dateStr = d.toISOString().split('T')[0];
                try {
                  const dayWorkouts = await getWorkouts(dateStr);
                  if (dayWorkouts.entries) {
                    fatigue7Days += dayWorkouts.entries.reduce((sum, w) => sum + w.minutes, 0);
                  }
                } catch (err) {
                  // Игнорируем ошибки для отдельных дней
                }
              }
            } catch (err) {
              console.error('Error calculating fatigue7Days:', err);
            }
            
            // Проверяем пропущены ли приемы пищи (если нет завтрака, обеда или ужина)
            const hasBreakfast = foodEntriesForRecovery.some(e => e.mealType === 'breakfast');
            const hasLunch = foodEntriesForRecovery.some(e => e.mealType === 'lunch');
            const hasDinner = foodEntriesForRecovery.some(e => e.mealType === 'dinner');
            const mealsSkipped = !hasBreakfast || !hasLunch || !hasDinner;
            
            // Проверяем был ли прием пищи после тренировки
            // Простая проверка: если есть тренировки и есть приемы пищи после времени тренировок
            let mealAfterWorkout = false;
            if (workoutsForRecovery.length > 0 && foodEntriesForRecovery.length > 0) {
              // Предполагаем, что тренировки были до 20:00, а приемы пищи после - это ужин или снэк после 18:00
              const workoutTime = new Date(selectedDate + 'T18:00:00').getTime();
              mealAfterWorkout = foodEntriesForRecovery.some(entry => {
                const mealTime = new Date(entry.createdAt).getTime();
                return mealTime > workoutTime;
              });
            }
            
            // Проверяем недобор воды (простая проверка: < 1.5 литра)
            const waterDeficit = waterTotal < 1500;
            
            recoveryBreakdown = calculateRecovery({
              sleepMinutes,
              sleepQuality,
              sleepRest,
              workouts: workoutsForRecovery,
              fatigue7Days, // Передаем усталость за 7 дней
              steps: stepsTotalValue, // Используем локальную переменную вместо state
              mealsSkipped,
              mealAfterWorkout,
              waterDeficit,
              waterNormal3Days, // TODO: реализовать проверку 3+ дней
            });
            
            // Отладка: выводим данные для проверки
            console.log('Recovery calculation:', {
              sleepMinutes,
              sleepQuality,
              sleepRest,
              workoutsCount: workoutsForRecovery.length,
              steps: stepsTotalValue,
              mealsSkipped,
              mealAfterWorkout,
              waterDeficit,
              recovery: recoveryBreakdown,
            });
          } catch (err) {
            console.error('Error calculating recovery:', err);
          }
        }

        // Рассчитываем геймификацию
        if (mounted) {
          // ВАЖНО: Пересчитываем статы с нуля на основе всех тренировок до выбранной даты включительно
          // Это гарантирует правильность при любых изменениях в прошлых днях
          
          let currentStats = createInitialStats();
          
          try {
            const telegramUser = getTelegramUser();
            if (telegramUser) {
              const userResponse = await checkUser({
                id: telegramUser.id,
                first_name: telegramUser.first_name,
                last_name: telegramUser.last_name,
                username: telegramUser.username,
              });
              
              if (userResponse.success && userResponse.user) {
                // ВАЖНО: Статы всегда пересчитываются с нуля на основе всех тренировок до ТЕКУЩЕЙ даты (сегодня),
                // а не до выбранной даты. Это гарантирует, что уровень не упадет
                // при добавлении тренировок в прошлых днях.
                // НЕ загружаем сохраненные статы - пересчитываем все с нуля!
                const today = new Date().toISOString().split('T')[0];
                const allWorkoutsUntilDate = await getWorkoutsUntilDate(today);
                
                console.log('Loaded workouts for recalculation:', {
                  count: allWorkoutsUntilDate.length,
                  workouts: allWorkoutsUntilDate.map(w => ({
                    type: w.type,
                    minutes: w.minutes,
                    date: w.date,
                  })),
                });
                
                // Группируем тренировки по датам для расчета состояний
                const workoutsByDate = new Map<string, typeof allWorkoutsUntilDate>();
                for (const workout of allWorkoutsUntilDate) {
                  const workoutDate = workout.date.split('T')[0];
                  if (!workoutsByDate.has(workoutDate)) {
                    workoutsByDate.set(workoutDate, []);
                  }
                  workoutsByDate.get(workoutDate)!.push(workout);
                }
                
                // Пересчитываем статы с нуля, применяя тренировки по порядку дат
                const sortedDates = Array.from(workoutsByDate.keys()).sort();
                
                console.log('Recalculating stats from scratch, dates:', sortedDates);
                
                for (const workoutDate of sortedDates) {
                  const dayWorkouts = workoutsByDate.get(workoutDate)!;
                  
                  console.log(`Processing ${workoutDate}, workouts:`, dayWorkouts.length);
                  
                  // TODO: Загружать реальные данные о сне, питании и воде для каждой даты
                  // Пока используем данные текущего дня для всех тренировок
                  const dayHunger = evaluateHunger(caloriesGoal, caloriesFood, 0);
                  const daySleepiness = evaluateSleepiness(sleepMinutes);
                  const dayThirst = evaluateThirst(2000, 1800, 0);
                  
                  // Применяем эффекты всех тренировок этого дня
                  for (const workout of dayWorkouts) {
                    const workoutEffect = calculateWorkoutEffect(
                      workout.type,
                      workout.minutes,
                      daySleepiness,
                      dayHunger,
                      dayThirst
                    );
                    
                    console.log('Workout effect:', {
                      type: workout.type,
                      minutes: workout.minutes,
                      effect: workoutEffect,
                    });
                    
                    if (workoutEffect) {
                      const beforeStats = { ...currentStats };
                      const updatedStats = applyWorkoutEffect(
                        {
                          strength: currentStats.strength,
                          endurance: currentStats.endurance,
                          flexibility: currentStats.flexibility,
                          agility: currentStats.agility,
                          speed: currentStats.speed,
                          reflex: currentStats.reflex,
                          hunger: currentStats.hunger,
                          thirst: currentStats.thirst,
                          sleepiness: currentStats.sleepiness,
                          energy: currentStats.energy,
                          health: currentStats.health,
                          maxHealth: currentStats.maxHealth,
                        },
                        workoutEffect
                      );
                      
                      currentStats = {
                        ...currentStats,
                        ...updatedStats,
                      };
                      
                      currentStats.xp += workoutEffect.xp;
                      
                      console.log('Stats updated:', {
                        before: {
                          strength: beforeStats.strength,
                          hunger: beforeStats.hunger,
                          thirst: beforeStats.thirst,
                          sleepiness: beforeStats.sleepiness,
                          energy: beforeStats.energy,
                          xp: beforeStats.xp,
                        },
                        after: {
                          strength: currentStats.strength,
                          hunger: currentStats.hunger,
                          thirst: currentStats.thirst,
                          sleepiness: currentStats.sleepiness,
                          energy: currentStats.energy,
                          xp: currentStats.xp,
                        },
                        effectApplied: {
                          hunger: workoutEffect.hunger,
                          thirst: workoutEffect.thirst,
                          sleepiness: workoutEffect.sleepiness,
                          energy: workoutEffect.energy,
                        },
                      });
                    } else {
                      console.warn('No workout effect for:', workout.type, workout.minutes);
                    }
                  }
                }
                
                // Проверяем повышение уровня после всех тренировок
                let levelCheck = checkLevelUp(currentStats.level, currentStats.xp, currentStats.health);
                while (levelCheck.leveledUp) {
                  currentStats.level = levelCheck.level;
                  currentStats.health = levelCheck.health;
                  currentStats.maxHealth = calculateMaxHealth(levelCheck.level);
                  levelCheck = checkLevelUp(currentStats.level, currentStats.xp, currentStats.health);
                }
                
                // Сохраняем пересчитанные статы
                console.log('Saving recalculated stats:', {
                  level: currentStats.level,
                  xp: currentStats.xp,
                  strength: currentStats.strength,
                  health: currentStats.health,
                  maxHealth: currentStats.maxHealth,
                });
                
                await updateGamificationStats(userResponse.user.id, {
                  strength: currentStats.strength,
                  endurance: currentStats.endurance,
                  flexibility: currentStats.flexibility,
                  agility: currentStats.agility,
                  speed: currentStats.speed,
                  reflex: currentStats.reflex,
                  hunger: currentStats.hunger,
                  thirst: currentStats.thirst,
                  sleepiness: currentStats.sleepiness,
                  energy: currentStats.energy,
                  health: currentStats.health,
                  maxHealth: currentStats.maxHealth,
                  level: currentStats.level,
                  xp: currentStats.xp,
                });
                
                console.log('Stats saved successfully');
              }
            }
          } catch (error) {
            console.error('Error recalculating gamification stats:', error);
            // Используем начальные значения при ошибке
          }
          
          // Применяем восстановление здоровья (если это текущий день и есть данные восстановления)
          const today = new Date().toISOString().split('T')[0];
          if (!isOnboardingDay && selectedDate === today && recoveryBreakdown) {
            // Используем восстановление для изменения здоровья (упрощенная логика)
            // TODO: можно добавить более сложную логику влияния восстановления на здоровье
          }
          
          if (isOnboardingDay) {
            // День онбординга: здоровье = 100
            currentStats.health = 100;
          }
          
          setGamificationStats({
            level: currentStats.level,
            health: currentStats.health,
            maxHealth: currentStats.maxHealth,
            xp: currentStats.xp,
            strength: currentStats.strength,
            endurance: currentStats.endurance,
            flexibility: currentStats.flexibility,
            agility: currentStats.agility,
            speed: currentStats.speed,
            reflex: currentStats.reflex,
            hunger: currentStats.hunger,
            thirst: currentStats.thirst,
            sleepiness: currentStats.sleepiness,
            energy: currentStats.energy,
          });
          
          setRecovery(recoveryBreakdown);
        }
      } catch (error) {
        console.error('Error loading home screen data:', error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadData();

    // Обработчик события обновления активности (сон, тренировки, шаги)
    const handleActivityUpdate = (event: Event) => {
      const customEvent = event as CustomEvent<{ date?: string }>;
      if (customEvent.detail?.date && customEvent.detail.date !== selectedDate) return;
      // Небольшая задержка чтобы данные успели сохраниться в базу
      setTimeout(() => {
        console.log('Activity updated, reloading data...');
        loadData();
      }, 300);
    };

    window.addEventListener('activity-updated', handleActivityUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('activity-updated', handleActivityUpdate);
    };
  }, [selectedDate]);

  // Расчет баланса калорий
  const caloriesBalance = caloriesGoal - caloriesFood + caloriesExercise;
  const caloriesProgress = caloriesGoal > 0 ? Math.min((caloriesFood / caloriesGoal) * 100, 100) : 0;
  const stepsProgress = stepsGoal > 0 ? Math.min((stepsTotal / stepsGoal) * 100, 100) : 0;
  const workoutProgress = workoutGoal > 0 ? Math.min((workoutMinutes / workoutGoal) * 100, 100) : 0;

  // Стили карточек
  const balanceCardStyle = useMemo(() => createGlassCardStyle(isDark, '#f97316'), [isDark]);
  const stepsCardStyle = useMemo(() => createGlassCardStyle(isDark, '#3b82f6'), [isDark]);
  const workoutCardStyle = useMemo(() => createGlassCardStyle(isDark, '#22c55e'), [isDark]);

  const ringRadius = 58; // радиус для круга
  const ringCircumference = 2 * Math.PI * ringRadius;
  const balanceDash = (caloriesProgress / 100) * ringCircumference;

  // XP для следующего уровня
  const xpForNextLevel = useMemo(() => {
    return calculateXPForLevel(gamificationStats.level + 1);
  }, [gamificationStats.level]);

  return (
    <div className="p-6 space-y-4">
      {/* Блок геймификации - большой */}
      <GamificationBlock
        level={gamificationStats.level}
        health={gamificationStats.health}
        maxHealth={gamificationStats.maxHealth}
        xp={gamificationStats.xp}
        xpForNextLevel={xpForNextLevel}
        recovery={recovery}
        isLoading={isLoading}
        stats={{
          strength: gamificationStats.strength,
          endurance: gamificationStats.endurance,
          flexibility: gamificationStats.flexibility,
          agility: gamificationStats.agility,
          speed: gamificationStats.speed,
          reflex: gamificationStats.reflex,
          hunger: gamificationStats.hunger,
          thirst: gamificationStats.thirst,
          sleepiness: gamificationStats.sleepiness,
          energy: gamificationStats.energy,
        }}
      />

      {/* Блок Daily Balance - большой */}
      <motion.div
        className="relative rounded-3xl p-6 overflow-hidden"
        style={balanceCardStyle}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
      >
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <Scale size={20} style={{ color: '#f97316' }} />
            <div className="text-lg font-bold text-foreground">Ваш дневной баланс</div>
          </div>
          <div className="text-sm text-muted-foreground">Цель - Еда + Упражнения</div>
        </div>

        <div className="flex items-center gap-4">
          {/* Левая часть - значения */}
          <div className="flex-1 space-y-4">
            <div className="flex items-center gap-3">
              <Target size={20} style={{ color: '#f97316' }} />
              <div>
                <div className="text-xs text-muted-foreground">Цель</div>
                <div className="text-lg font-bold text-foreground">
                  {isLoading ? '—' : caloriesGoal.toLocaleString('ru-RU')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Flame size={20} style={{ color: '#3b82f6' }} />
              <div>
                <div className="text-xs text-muted-foreground">Еда</div>
                <div className="text-lg font-bold text-foreground">
                  {isLoading ? '—' : caloriesFood.toLocaleString('ru-RU')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Zap size={20} style={{ color: '#FF9800' }} />
              <div>
                <div className="text-xs text-muted-foreground">Упражнения</div>
                <div className="text-lg font-bold text-foreground">
                  {isLoading ? '—' : caloriesExercise.toLocaleString('ru-RU')}
                </div>
              </div>
            </div>
          </div>

          {/* Правая часть - круговой прогресс */}
          <div className="relative w-36 h-36 flex-shrink-0">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 140 140">
              <defs>
                <linearGradient id="balanceGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
              </defs>
              {/* Фоновый круг */}
              <circle
                cx="70"
                cy="70"
                r="58"
                fill="none"
                stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}
                strokeWidth="10"
              />
              {/* Прогресс с градиентом */}
              <circle
                cx="70"
                cy="70"
                r="58"
                fill="none"
                stroke="url(#balanceGradient)"
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${balanceDash} ${ringCircumference}`}
                style={{ transition: 'stroke-dasharray 0.8s ease-out' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <div className="text-3xl font-bold text-foreground">
                {isLoading ? '—' : Math.max(0, caloriesBalance).toLocaleString('ru-RU')}
              </div>
              <div className="text-xs text-muted-foreground mt-1">ккал</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Два квадратных блока снизу */}
      <div className="grid grid-cols-2 gap-4">
        {/* Блок Steps Count */}
        <motion.div
          className="relative rounded-3xl p-5 overflow-hidden aspect-square"
          style={stepsCardStyle}
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <div className="mb-4">
            <div className="text-sm font-bold text-foreground mb-1">Количество шагов</div>
            <div className="flex items-center gap-2 mt-2">
              <Footprints size={18} style={{ color: '#3b82f6' }} />
              <div className="text-xl font-bold text-foreground">
                {isLoading ? '—' : stepsTotal.toLocaleString('ru-RU')}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mb-3">
            Цель: {stepsGoal.toLocaleString('ru-RU')} шагов
          </div>
          {/* Прогресс-бар */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #3b82f6, #22d3ee)' }}
              initial={{ width: 0 }}
              animate={{ width: `${stepsProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Блок Workout Time */}
        <motion.div
          className="relative rounded-3xl p-5 overflow-hidden aspect-square"
          style={workoutCardStyle}
          initial={{ opacity: 0, y: 12, scale: 0.99 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <div className="mb-4">
            <div className="text-sm font-bold text-foreground mb-1">Время тренировки</div>
            <div className="flex items-center gap-2 mt-2">
              <Zap size={18} style={{ color: '#22c55e' }} />
              <div className="text-xl font-bold text-foreground">
                {isLoading ? '—' : `${workoutMinutes} мин`}
              </div>
            </div>
          </div>
          <div className="text-[10px] text-muted-foreground mb-3">
            Длительность сегодня
          </div>
          {/* Прогресс-бар */}
          <div className="h-2 rounded-full overflow-hidden" style={{ background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' }}>
            <motion.div
              className="h-full rounded-full"
              style={{ background: 'linear-gradient(to right, #22c55e, #10b981)' }}
              initial={{ width: 0 }}
              animate={{ width: `${workoutProgress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
