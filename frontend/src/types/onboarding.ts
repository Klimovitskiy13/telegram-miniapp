import { LucideIcon } from 'lucide-react';

export enum GoalType {
  LOSE_WEIGHT = 'lose_weight',
  MAINTAIN = 'maintain',
  GAIN_MUSCLE = 'gain_muscle',
}

export enum ActivityLevel {
  RARELY = 'rarely',
  SOMETIMES = 'sometimes',
  OFTEN = 'often',
  CONSTANT = 'constant',
  INTENSIVE = 'intensive',
}

export interface GoalCardData {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  goalType: GoalType;
  borderColor: string; // CSS color для светлой темы
  borderColorDark: string; // CSS color для темной темы
}

export interface ActivityCardData {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  activityLevel: ActivityLevel;
  borderColor: string; // CSS color для светлой темы
  borderColorDark: string; // CSS color для темной темы
}

