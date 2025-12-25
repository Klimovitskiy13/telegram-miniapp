// Базовые типы для системы геймификации

export type PhysicalStat = 
  | 'strength'      // Сила
  | 'endurance'     // Выносливость
  | 'flexibility'   // Гибкость
  | 'agility'       // Ловкость
  | 'speed'         // Скорость
  | 'reflex';       // Рефлекс

export type PhysiologicalStat =
  | 'hunger'        // Голод
  | 'thirst'        // Жажда
  | 'sleepiness'    // Сонливость
  | 'energy';       // Энергия

export type ConditionLevel = 'low' | 'medium' | 'high' | 'critical';

export interface Stats {
  // Физические статы (стартуют с 0)
  strength: number;
  endurance: number;
  flexibility: number;
  agility: number;
  speed: number;
  reflex: number;
  
  // Физиологические статы (стартуют с 0)
  hunger: number;
  thirst: number;
  sleepiness: number;
  energy: number;
  
  // Здоровье (стартует с 100)
  health: number;
  maxHealth: number;
  
  // Уровень и опыт
  level: number;
  xp: number;
}

export interface ConditionState {
  hunger: ConditionLevel;
  sleepiness: ConditionLevel;
  thirst: ConditionLevel;
  energy: ConditionLevel;
}

export interface WorkoutEffect {
  // Изменения физических статов
  strength: number;
  endurance: number;
  flexibility: number;
  agility: number;
  speed: number;
  reflex: number;
  
  // Изменения физиологических статов
  hunger: number;
  thirst: number;
  sleepiness: number;
  energy: number;
  
  // Изменение здоровья
  health: number;
  
  // Опыт
  xp: number;
}

export interface HealthImpact {
  hunger: number;
  sleepiness: number;
  thirst: number;
  energy: number;
  total: number;
}

export interface WorkoutConfig {
  type: string;
  category: string;
  duration: number; // в минутах
}

