/**
 * Расчет базового метаболизма (BMR) по формуле Миффлина-Сан Жеора
 */

export interface BMRData {
  weight: number; // вес в кг
  height: number; // рост в см
  age: number; // возраст в годах
  gender: 'male' | 'female';
}

export function calculateBMR(data: BMRData): number | null {
  const { weight, height, age, gender } = data;

  // Проверка валидности данных
  if (weight <= 0 || height <= 0 || age <= 0) {
    return null;
  }

  // Формула Миффлина-Сан Жеора
  // Рост в формуле используется в см
  if (gender === 'male') {
    // Для мужчин: BMR = 10 × вес + 6.25 × рост - 5 × возраст + 5
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    // Для женщин: BMR = 10 × вес + 6.25 × рост - 5 × возраст - 161
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

