import { apiClient } from './client';

export interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

export interface UserOnboarding {
  isCompleted: boolean;
  goal: string | null;
  activityLevel: string | null;
  gender: string | null;
  height: number | null;
  weight: number | null;
  age: number | null;
  bmr: number | null;
  amr: number | null;
  recommendedCalories: number | null;
  protein: number | null;
  fat: number | null;
  carbs: number | null;
}

export interface User {
  id: number;
  telegramId: string;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  stepsGoal: number;
  onboarding: UserOnboarding | null;
}

export interface CheckUserResponse {
  success: boolean;
  user: User;
  error?: string;
}

/**
 * Проверяет/создает пользователя по данным Telegram
 */
export async function checkUser(telegramUser: TelegramUser): Promise<CheckUserResponse> {
  const response = await apiClient.post<CheckUserResponse>('/users/check', telegramUser);
  return response.data;
}

/**
 * Сохраняет/обновляет цель пользователя
 */
export async function saveGoal(userId: number, goal: string): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/users/goal', {
    userId,
    goal,
  });
  return response.data;
}

/**
 * Сохраняет/обновляет уровень активности пользователя
 */
export async function saveActivityLevel(userId: number, activityLevel: string): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/users/activity-level', {
    userId,
    activityLevel,
  });
  return response.data;
}

/**
 * Сохраняет/обновляет профиль пользователя (пол, рост, вес, возраст)
 */
export async function saveProfile(
  userId: number,
  profile: {
    gender?: string | null;
    height?: number | null;
    weight?: number | null;
    age?: number | null;
  }
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/users/profile', {
    userId,
    gender: profile.gender ?? null,
    height: profile.height ?? null,
    weight: profile.weight ?? null,
    age: profile.age ?? null,
  });
  return response.data;
}

/**
 * Сохраняет/обновляет данные питания пользователя (BMR, AMR, калории, КБЖУ)
 */
export async function saveNutritionData(
  userId: number,
  nutritionData: {
    bmr?: number | null;
    amr?: number | null;
    recommendedCalories?: number | null;
    protein?: number | null;
    fat?: number | null;
    carbs?: number | null;
  }
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/users/nutrition', {
    userId,
    bmr: nutritionData.bmr ?? null,
    amr: nutritionData.amr ?? null,
    recommendedCalories: nutritionData.recommendedCalories ?? null,
    protein: nutritionData.protein ?? null,
    fat: nutritionData.fat ?? null,
    carbs: nutritionData.carbs ?? null,
  });
  return response.data;
}

/**
 * Сохраняет/обновляет имя и фото пользователя
 */
export async function saveUserNameAndPhoto(
  userId: number,
  data: {
    firstName?: string | null;
    lastName?: string | null;
    photoUrl?: string | null;
  }
): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/users/name-photo', {
    userId,
    firstName: data.firstName ?? null,
    lastName: data.lastName ?? null,
    photoUrl: data.photoUrl ?? null,
  });
  return response.data;
}

/**
 * Устанавливает флаг завершения онбординга
 */
export async function completeOnboarding(userId: number): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/users/complete-onboarding', {
    userId,
  });
  return response.data;
}

/**
 * Обновляет цель по шагам пользователя
 */
export async function updateStepsGoal(userId: number, stepsGoal: number): Promise<{ success: boolean }> {
  const response = await apiClient.post<{ success: boolean }>('/users/steps-goal', {
    userId,
    stepsGoal,
  });
  return response.data;
}

export interface GamificationStats {
  id: string;
  userId: number;
  strength: number;
  endurance: number;
  flexibility: number;
  agility: number;
  speed: number;
  reflex: number;
  hunger: number;
  thirst: number;
  sleepiness: number;
  energy: number;
  health: number;
  maxHealth: number;
  level: number;
  xp: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Получает статистику геймификации пользователя
 */
export async function getGamificationStats(userId: number): Promise<{ success: boolean; stats: GamificationStats }> {
  const response = await apiClient.get<{ success: boolean; stats: GamificationStats }>('/users/gamification-stats', {
    params: { userId },
  });
  return response.data;
}

/**
 * Обновляет статистику геймификации пользователя
 */
export async function updateGamificationStats(
  userId: number,
  stats: Partial<GamificationStats>
): Promise<{ success: boolean; stats: GamificationStats }> {
  const response = await apiClient.post<{ success: boolean; stats: GamificationStats }>('/users/gamification-stats', {
    userId,
    ...stats,
  });
  return response.data;
}

