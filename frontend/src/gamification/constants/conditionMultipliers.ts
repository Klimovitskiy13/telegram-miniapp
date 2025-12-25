// Множители влияния состояний на статы

import { ConditionLevel, PhysicalStat } from '../types';

export type MultiplierTable = Record<ConditionLevel, Record<PhysicalStat, number>>;

// Таблица влияния сонливости на статы
export const SLEEPINESS_MULTIPLIERS: MultiplierTable = {
  low: {
    strength: 1.05,
    endurance: 1.05,
    flexibility: 1.05,
    agility: 1.05,
    speed: 1.05,
    reflex: 1.05,
  },
  medium: {
    strength: 1.00,
    endurance: 1.00,
    flexibility: 1.00,
    agility: 1.00,
    speed: 0.95,
    reflex: 0.95,
  },
  high: {
    strength: 0.85,
    endurance: 0.85,
    flexibility: 0.95,
    agility: 0.90,
    speed: 0.80,
    reflex: 0.80,
  },
  critical: {
    strength: 0.70,
    endurance: 0.75,
    flexibility: 0.90,
    agility: 0.80,
    speed: 0.60,
    reflex: 0.60,
  },
};

// Таблица влияния голода на статы
export const HUNGER_MULTIPLIERS: MultiplierTable = {
  low: {
    strength: 1.05,
    endurance: 1.05,
    flexibility: 1.00,
    agility: 1.00,
    speed: 1.00,
    reflex: 1.00,
  },
  medium: {
    strength: 0.90,
    endurance: 0.90,
    flexibility: 0.95,
    agility: 0.95,
    speed: 0.95,
    reflex: 0.95,
  },
  high: {
    strength: 0.75,
    endurance: 0.75,
    flexibility: 0.90,
    agility: 0.85,
    speed: 0.85,
    reflex: 0.85,
  },
  critical: {
    strength: 0.50,
    endurance: 0.55,
    flexibility: 0.85,
    agility: 0.75,
    speed: 0.70,
    reflex: 0.70,
  },
};

// Таблица влияния жажды на статы
export const THIRST_MULTIPLIERS: MultiplierTable = {
  low: {
    strength: 1.00,
    endurance: 1.05,
    flexibility: 1.00,
    agility: 1.00,
    speed: 1.05,
    reflex: 1.00,
  },
  medium: {
    strength: 0.95,
    endurance: 0.90,
    flexibility: 0.98,
    agility: 0.95,
    speed: 0.90,
    reflex: 0.95,
  },
  high: {
    strength: 0.85,
    endurance: 0.75,
    flexibility: 0.95,
    agility: 0.85,
    speed: 0.75,
    reflex: 0.85,
  },
  critical: {
    strength: 0.70,
    endurance: 0.60,
    flexibility: 0.90,
    agility: 0.75,
    speed: 0.60,
    reflex: 0.70,
  },
};

