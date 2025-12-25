// Расчет уровней и XP

import { Stats } from '../types';

/**
 * Рассчитывает максимальное здоровье на основе уровня
 */
export function calculateMaxHealth(level: number): number {
  // МаксHP = 100 + (Уровень − 1) × 5
  return 100 + (level - 1) * 5;
}

/**
 * Рассчитывает необходимый XP для достижения уровня
 */
export function calculateXPForLevel(level: number): number {
  // XP_needed(n) = 100 × (n − 1)²
  if (level <= 1) {
    return 0;
  }
  return 100 * Math.pow(level - 1, 2);
}

/**
 * Рассчитывает текущий уровень на основе накопленного XP
 */
export function calculateLevelFromXP(totalXP: number): number {
  let level = 1;
  
  while (totalXP >= calculateXPForLevel(level + 1)) {
    level++;
    
    // Защита от бесконечного цикла
    if (level > 100) {
      break;
    }
  }
  
  return level;
}

/**
 * Рассчитывает прогресс до следующего уровня (0-1)
 */
export function calculateLevelProgress(currentXP: number, currentLevel: number): number {
  const xpForCurrentLevel = calculateXPForLevel(currentLevel);
  const xpForNextLevel = calculateXPForLevel(currentLevel + 1);
  
  if (xpForNextLevel === xpForCurrentLevel) {
    return 1;
  }
  
  const progress = (currentXP - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel);
  return Math.max(0, Math.min(1, progress));
}

/**
 * Проверяет, нужно ли повысить уровень, и возвращает новый уровень и здоровье
 */
export function checkLevelUp(
  currentLevel: number,
  currentXP: number,
  currentHealth: number
): { level: number; health: number; leveledUp: boolean } {
  const newLevel = calculateLevelFromXP(currentXP);
  
  if (newLevel > currentLevel) {
    const newMaxHealth = calculateMaxHealth(newLevel);
    // При повышении уровня даем небольшой хил (+10, но не выше нового максHP)
    const newHealth = Math.min(newMaxHealth, currentHealth + 10);
    
    return {
      level: newLevel,
      health: newHealth,
      leveledUp: true,
    };
  }
  
  return {
    level: currentLevel,
    health: currentHealth,
    leveledUp: false,
  };
}

/**
 * Создает начальные статы для нового пользователя
 */
export function createInitialStats(): Stats {
  return {
    strength: 0,
    endurance: 0,
    flexibility: 0,
    agility: 0,
    speed: 0,
    reflex: 0,
    hunger: 0,
    thirst: 0,
    sleepiness: 0,
    energy: 0,
    health: 100,
    maxHealth: 100,
    level: 1,
    xp: 0,
  };
}

