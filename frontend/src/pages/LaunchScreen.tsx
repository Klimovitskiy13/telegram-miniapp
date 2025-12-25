import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTypewriter } from '../hooks/useTypewriter';
import { useTelegram } from '../hooks/useTelegram';
import { checkUser } from '../api/user';
import { getTelegramUser } from '../api/telegram';

export const LaunchScreen = () => {
  const navigate = useNavigate();
  const { isReady } = useTelegram();
  const [userChecked, setUserChecked] = useState(false);
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  
  const { displayedText, isTyping } = useTypewriter({
    text: 'NO LIMITS.',
    speed: 150,
    delay: 300,
  });

  // Проверяем/создаем пользователя при загрузке и проверяем статус онбординга
  useEffect(() => {
    if (!isReady) return;

    const checkUserData = async () => {
      try {
        // Получаем данные пользователя из Telegram
        const telegramUser = getTelegramUser();

        if (telegramUser) {
          // Проверяем/создаем пользователя в базе данных
          const response = await checkUser({
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
          });

          // Проверяем, завершен ли онбординг
          if (response.success && response.user?.onboarding?.isCompleted) {
            setIsOnboardingCompleted(true);
          }
        } else {
          // Если не в Telegram (режим разработки), используем тестовые данные
          console.warn('Telegram user not found, using dev mode');
        }

        setUserChecked(true);
      } catch (error) {
        console.error('Error checking user:', error);
        // Продолжаем даже при ошибке
        setUserChecked(true);
      }
    };

    checkUserData();
  }, [isReady]);

  // Переход после завершения анимации и проверки пользователя
  useEffect(() => {
    if (!isTyping && userChecked) {
      // Небольшая задержка перед переходом
      const timer = setTimeout(() => {
        // Если онбординг завершен, переходим на главный экран
        if (isOnboardingCompleted) {
          navigate('/main');
        } else {
          // Иначе переходим на онбординг
          navigate('/onboarding/1');
        }
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [isTyping, userChecked, isOnboardingCompleted, navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background touch-none">
      <div className="text-center px-4 w-full">
        <h1 className="text-5xl sm:text-6xl font-bold text-foreground select-none">
          {displayedText}
          {isTyping && (
            <span className="inline-block w-0.5 h-12 sm:h-14 bg-foreground ml-1 animate-pulse" />
          )}
        </h1>
      </div>
    </div>
  );
};

