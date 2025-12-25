import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';
const BOT_TOKEN = import.meta.env.VITE_BOT_TOKEN;

// Создаем базовый экземпляр axios
export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Интерцептор для добавления токена авторизации
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Токен истек или невалиден
      localStorage.removeItem('auth_token');
      // Можно добавить редирект на страницу входа
    }
    return Promise.reject(error);
  }
);

// Экспортируем BOT_TOKEN для использования в компонентах
export const getBotToken = () => BOT_TOKEN;

// Экспортируем API_URL
export const getApiUrl = () => API_URL;
export { API_URL };

