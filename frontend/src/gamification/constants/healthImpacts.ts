// Влияние физиологии на здоровье за день

import { ConditionLevel } from '../types';

export interface HealthImpactRange {
  min: number;
  max: number;
}

export type HealthImpactTable = Record<ConditionLevel, HealthImpactRange>;

// Влияние голода на здоровье за день
export const HUNGER_HEALTH_IMPACTS: HealthImpactTable = {
  low: { min: 5, max: 5 },
  medium: { min: -3, max: 0 },
  high: { min: -10, max: -5 },
  critical: { min: -20, max: -10 },
};

// Влияние сонливости на здоровье за день
export const SLEEPINESS_HEALTH_IMPACTS: HealthImpactTable = {
  low: { min: 5, max: 5 },
  medium: { min: -3, max: 0 },
  high: { min: -10, max: -5 },
  critical: { min: -25, max: -10 },
};

// Влияние жажды на здоровье за день
export const THIRST_HEALTH_IMPACTS: HealthImpactTable = {
  low: { min: 3, max: 3 },
  medium: { min: -2, max: 0 },
  high: { min: -7, max: -3 },
  critical: { min: -15, max: -7 },
};

// Влияние энергии на здоровье за день
export const ENERGY_HEALTH_IMPACTS: HealthImpactTable = {
  low: { min: 5, max: 10 },
  medium: { min: 0, max: 0 },
  high: { min: -25, max: -10 },
  critical: { min: -25, max: -10 },
};

