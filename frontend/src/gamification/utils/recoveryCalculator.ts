/**
 * Калькулятор восстановления (0-100)
 * 
 * Формула восстановления:
 * Восстановление = Сон(0-100) - Нагрузка_вчера - Усталость_7дней
 * Итог ограничивается диапазоном 0-100
 */

export interface RecoveryInput {
  // Сон
  sleepMinutes: number; // Длительность сна в минутах
  sleepQuality?: string | null; // 'excellent' | 'good' | 'poor' | 'very_poor'
  sleepRest?: string | null; // 'fully' | 'enough' | 'not_enough' | 'very_tired'
  
  // Нагрузка (вчера)
  workouts: Array<{
    type: string;
    category: string;
    minutes: number;
  }>;
  
  // Усталость за 7 дней (суммарная нагрузка за неделю)
  fatigue7Days?: number; // Суммарные минуты тренировок за 7 дней
  
  // Активность
  steps: number; // Количество шагов за день
  
  // Питание
  mealsSkipped: boolean; // Пропущены ли приемы пищи
  mealAfterWorkout: boolean; // Был ли прием пищи после тренировки
  
  // Вода
  waterDeficit: boolean; // Явный недобор воды
  waterNormal3Days: boolean; // Норма воды 3+ дня подряд
}

export interface RecoveryBreakdown {
  sleep: number; // 0-100 (новая шкала)
  workload: number; // Нагрузка_вчера (штраф)
  fatigue: number; // Усталость_7дней (штраф)
  total: number; // 0-100
  status: 'recovered' | 'normal' | 'on_edge' | 'not_recovered';
}

/**
 * Рассчитывает базовые баллы за длительность сна (0-70)
 * Плато оптимума: 7:00-8:30 = 70 баллов
 */
function getDurationBase(minutes: number): number {
  if (minutes < 270) return 0;      // <4:30
  if (minutes < 300) return 10;     // 4:30-4:59
  if (minutes < 330) return 20;     // 5:00-5:29
  if (minutes < 360) return 30;     // 5:30-5:59
  if (minutes < 390) return 45;     // 6:00-6:29
  if (minutes < 420) return 60;     // 6:30-6:59
  if (minutes < 510) return 70;     // 7:00-8:30 (оптимум, плато)
  if (minutes < 570) return 65;     // 8:30-9:29
  if (minutes < 600) return 60;     // 9:30-9:59
  return 55;                         // >=10:00
}

/**
 * Рассчитывает баллы за качество сна (±15)
 */
function calculateSleepQualityScore(sleepQuality?: string | null): number {
  switch (sleepQuality) {
    case 'excellent': return 15;    // Отлично
    case 'good': return 0;           // Нормально
    case 'poor': return -15;         // Плохо
    case 'very_poor': return -20;    // Очень плохо
    default: return 0;
  }
}

/**
 * Рассчитывает баллы за субъективное восстановление (±15)
 */
function calculateSleepRestScore(sleepRest?: string | null): number {
  switch (sleepRest) {
    case 'fully': return 15;         // Полностью
    case 'enough': return 0;         // Достаточно
    case 'not_enough': return -15;    // Недоспал
    case 'very_tired': return -25;   // Сильно недоспал
    default: return 0;
  }
}

/**
 * Рассчитывает баллы за сон (0-100)
 * База длительности (0-70) + Как спалось (±15) + Выспался (±15)
 */
function calculateSleepScore(
  sleepMinutes: number,
  sleepQuality?: string | null,
  sleepRest?: string | null
): number {
  const base = getDurationBase(sleepMinutes);
  const qualityScore = calculateSleepQualityScore(sleepQuality);
  const restScore = calculateSleepRestScore(sleepRest);
  
  const total = base + qualityScore + restScore;
  return Math.max(0, Math.min(100, total));
}

/**
 * Рассчитывает штраф за нагрузку вчера (вычитается из сна)
 * Чем больше и тяжелее тренировки, тем больше штраф
 */
function calculateWorkloadPenalty(
  workouts: Array<{ type: string; category: string; minutes: number }>
): number {
  if (workouts.length === 0) {
    return 0;
  }
  
  let totalPenalty = 0;
  
  for (const workout of workouts) {
    const category = workout.category.toLowerCase();
    const type = workout.type.toLowerCase();
    const minutes = workout.minutes;
    
    let penalty = 0;
    
    // Силовая тренировка
    if (category.includes('силов') || type.includes('силов')) {
      penalty = minutes > 45 ? 15 : minutes > 30 ? 12 : 8;
    }
    // ВИИТ / HIIT
    else if (type.includes('виит') || type.includes('hiit')) {
      penalty = minutes > 20 ? 18 : 12;
    }
    // Кардио (бег, велосипед, эллипс)
    else if (category.includes('кардио') || type.includes('бег') || type.includes('велосипед') || type.includes('эллипс')) {
      penalty = minutes > 60 ? 10 : minutes > 30 ? 7 : 4;
    }
    // Прогулка / ходьба
    else if (type.includes('ходьб') || type.includes('прогулк')) {
      penalty = 0; // Не штрафуется
    }
    // Растяжка / йога / пилатес
    else if (type.includes('растяжк') || type.includes('йог') || type.includes('пилатес') || type.includes('дыхани')) {
      penalty = 0; // Не штрафуется
    }
    // Остальные тренировки
    else {
      penalty = minutes > 45 ? 8 : minutes > 30 ? 5 : 3;
    }
    
    totalPenalty += penalty;
  }
  
  // Ограничиваем максимальный штраф
  return Math.min(30, totalPenalty);
}

/**
 * Рассчитывает штраф за усталость за 7 дней (вычитается из сна)
 * Чем больше суммарная нагрузка за неделю, тем больше штраф
 */
function calculateFatiguePenalty(fatigue7Days: number = 0): number {
  // Если нет данных об усталости, возвращаем 0
  if (!fatigue7Days || fatigue7Days === 0) {
    return 0;
  }
  
  // Штраф рассчитывается на основе суммарных минут тренировок за 7 дней
  // 0-60 минут: 0 штраф
  // 60-120 минут: 0-5 штраф
  // 120-180 минут: 5-10 штраф
  // 180-240 минут: 10-15 штраф
  // 240+ минут: 15-20 штраф
  
  if (fatigue7Days < 60) return 0;
  if (fatigue7Days < 120) return Math.round((fatigue7Days - 60) / 12); // 0-5
  if (fatigue7Days < 180) return 5 + Math.round((fatigue7Days - 120) / 12); // 5-10
  if (fatigue7Days < 240) return 10 + Math.round((fatigue7Days - 180) / 12); // 10-15
  return Math.min(20, 15 + Math.round((fatigue7Days - 240) / 24)); // 15-20
}

/**
 * Определяет статус восстановления по баллам
 */
function getRecoveryStatus(total: number): 'recovered' | 'normal' | 'on_edge' | 'not_recovered' {
  if (total >= 80) return 'recovered';
  if (total >= 60) return 'normal';
  if (total >= 40) return 'on_edge';
  return 'not_recovered';
}

/**
 * Рассчитывает полное восстановление (0-100)
 * Формула: Восстановление = Сон(0-100) - Нагрузка_вчера - Усталость_7дней
 */
export function calculateRecovery(input: RecoveryInput): RecoveryBreakdown {
  // 1. Сон (0-100) - новая шкала
  const sleep = calculateSleepScore(
    input.sleepMinutes,
    input.sleepQuality,
    input.sleepRest
  );
  
  // 2. Нагрузка вчера (штраф, вычитается из сна)
  const workload = calculateWorkloadPenalty(input.workouts);
  
  // 3. Усталость за 7 дней (штраф, вычитается из сна)
  const fatigue = calculateFatiguePenalty(input.fatigue7Days);
  
  // Итоговая формула: Восстановление = Сон - Нагрузка - Усталость
  const total = Math.max(0, Math.min(100, sleep - workload - fatigue));
  
  return {
    sleep,
    workload,
    fatigue,
    total,
    status: getRecoveryStatus(total),
  };
}

