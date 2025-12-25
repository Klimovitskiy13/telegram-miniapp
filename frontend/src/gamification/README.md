# Система геймификации

Система геймификации для отслеживания прогресса пользователя через тренировки, сон, питание и воду.

## Структура

```
gamification/
├── types.ts                    # Базовые типы
├── constants/
│   ├── conditionMultipliers.ts # Множители влияния состояний на статы
│   ├── healthImpacts.ts        # Влияние физиологии на здоровье
│   └── workoutEffects.ts      # Базовые эффекты тренировок
├── utils/
│   ├── conditionEvaluator.ts   # Оценка состояний (голод, сон, жажда, энергия)
│   ├── healthCalculator.ts    # Расчет влияния на здоровье
│   ├── workoutCalculator.ts    # Расчет эффектов тренировок
│   └── levelCalculator.ts      # Расчет уровней и XP
└── index.ts                    # Главный экспорт
```

## Основные концепции

### Статы

**Физические статы** (стартуют с 0):
- Сила (strength)
- Выносливость (endurance)
- Гибкость (flexibility)
- Ловкость (agility)
- Скорость (speed)
- Рефлекс (reflex)

**Физиологические статы** (стартуют с 0):
- Голод (hunger)
- Жажда (thirst)
- Сонливость (sleepiness)
- Энергия (energy)

**Здоровье**:
- Стартует с 100
- Максимальное здоровье = 100 + (Уровень - 1) × 5

### Уровни

- Уровни: 1-100
- Старт: Уровень 1, Здоровье 100
- XP для уровня n: `100 × (n - 1)²`
- При повышении уровня: +5 к максимальному здоровью, +10 к текущему здоровью

### Состояния

Каждое состояние имеет 4 уровня:
- **low** - хорошее состояние
- **medium** - среднее состояние
- **high** - плохое состояние
- **critical** - критическое состояние

**Особенность энергии**: 
- `low` = высокая энергия (хорошо)
- `high` = низкая энергия (плохо)

## Примеры использования

### 1. Оценка состояний

```typescript
import { evaluateHunger, evaluateSleepiness, evaluateThirst, evaluateEnergy } from './gamification';

// Оценка голода
const hunger = evaluateHunger(
  2000,  // целевые калории
  1800,  // фактически съедено
  0      // дней подряд с дефицитом >500
); // вернет 'medium'

// Оценка сонливости
const sleepiness = evaluateSleepiness(
  420,   // минут сна (7 часов)
  4,     // качество сна (1-5)
  0      // дней подряд с недосыпом
); // вернет 'low'

// Оценка жажды
const thirst = evaluateThirst(
  2000,  // целевое количество воды (мл)
  1800,  // фактически выпито
  0      // дней подряд с <70% нормы
); // вернет 'medium'

// Оценка энергии
const energy = evaluateEnergy({
  hunger,
  sleepiness,
  thirst
}); // вернет 'low' (высокая энергия)
```

### 2. Расчет влияния на здоровье

```typescript
import { calculateDailyHealthImpact, applyHealthChange } from './gamification';

const healthImpact = calculateDailyHealthImpact(
  'low',      // голод
  'low',      // сонливость
  'medium',   // жажда
  'low'       // энергия
);

// healthImpact = {
//   hunger: 5,
//   sleepiness: 5,
//   thirst: -1,
//   energy: 7.5,
//   total: 16.5
// }

const newHealth = applyHealthChange(
  80,         // текущее здоровье
  100,        // максимальное здоровье
  healthImpact.total
); // вернет 96.5 (ограничено максимумом 100)
```

### 3. Расчет эффектов тренировки

```typescript
import { calculateWorkoutEffect, applyWorkoutEffect } from './gamification';

const workoutEffect = calculateWorkoutEffect(
  'Бег (на улице / в зале / на беговой дорожке)',
  30,         // минут
  'low',      // сонливость
  'low',      // голод
  'low'       // жажда
);

// workoutEffect = {
//   strength: 2,
//   endurance: 8,
//   flexibility: 1,
//   agility: 2,
//   speed: 5,
//   reflex: 2,
//   hunger: -5,
//   thirst: -5,
//   sleepiness: -6,
//   energy: -10,
//   health: 3,
//   xp: 40
// }

const updatedStats = applyWorkoutEffect(currentStats, workoutEffect);
```

### 4. Работа с уровнями

```typescript
import {
  calculateMaxHealth,
  calculateXPForLevel,
  calculateLevelFromXP,
  checkLevelUp,
  createInitialStats
} from './gamification';

// Создание начальных статов
const stats = createInitialStats();

// Расчет максимального здоровья для уровня
const maxHealth = calculateMaxHealth(5); // вернет 120

// Расчет необходимого XP для уровня
const xpNeeded = calculateXPForLevel(3); // вернет 400

// Расчет уровня на основе XP
const level = calculateLevelFromXP(450); // вернет 3

// Проверка повышения уровня
const result = checkLevelUp(2, 450, 100);
// result = { level: 3, health: 110, leveledUp: true }
```

## Поддерживаемые тренировки (кардио)

- Ходьба (на улице / в зале)
- Бег (на улице / в зале / на беговой дорожке)
- Велосипед (на улице / в зале)
- Эллипсоид
- Эргометр (Гребля в зале)
- Степпер (Лестница)
- Хайкинг (Пеший туризм)
- ВИИТ (Высокоинтенсивная интервальная тренировка / HIIT)
- Скакалка

## Логика работы

1. **Ежедневный цикл**:
   - Оцениваются состояния (голод, сон, жажда, энергия)
   - Рассчитывается влияние на здоровье
   - Применяются изменения к здоровью

2. **Тренировка**:
   - Берется базовый эффект тренировки
   - Применяются множители состояний к физическим статам
   - Рассчитывается XP с учетом множителя состояния
   - Применяются изменения к статам пользователя

3. **Повышение уровня**:
   - XP накапливается от тренировок
   - При достижении порога уровня происходит повышение
   - Увеличивается максимальное здоровье
   - Дается небольшой бонус к текущему здоровью

