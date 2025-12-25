import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Leaf, Scale, Flame } from 'lucide-react';
import { GoalCard } from '../../components/onboarding/GoalCard';
import { OnboardingButton } from '../../components/onboarding/OnboardingButton';
import { GoalType, GoalCardData } from '../../types/onboarding';
import { checkUser, saveGoal } from '../../api/user';
import { getTelegramUser } from '../../api/telegram';
import { recalculateAndSaveNutrition } from '../../utils/nutritionRecalculator';

const GOALS: GoalCardData[] = [
  {
    title: 'Лёгкость',
    subtitle: 'Чувствовать тело свободно.\nДышать глубже. Жить легко.',
    icon: Leaf,
    goalType: GoalType.LOSE_WEIGHT,
    borderColor: '#4CAF50', // зеленый
    borderColorDark: '#4CAF50',
  },
  {
    title: 'Баланс',
    subtitle: 'Не страдать, не жертвовать.\nЖить — и быть в форме.',
    icon: Scale,
    goalType: GoalType.MAINTAIN,
    borderColor: '#2196F3', // синий
    borderColorDark: '#2196F3',
  },
  {
    title: 'Сила',
    subtitle: 'Набрать мощь. Укрепить тело.\nЧувствовать себя хозяином.',
    icon: Flame,
    goalType: GoalType.GAIN_MUSCLE,
    borderColor: '#F44336', // красный
    borderColorDark: '#F44336',
  },
];

export const OnboardingScreen2 = () => {
  const navigate = useNavigate();
  const [selectedGoal, setSelectedGoal] = useState<GoalType | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Загружаем сохраненную цель при монтировании
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const telegramUser = getTelegramUser();
        if (telegramUser) {
          const response = await checkUser({
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
          });

          if (response.success && response.user) {
            setUserId(response.user.id);
            
            // Если есть сохраненная цель, предвыбираем её
            if (response.user.onboarding?.goal) {
              const savedGoal = response.user.onboarding.goal as GoalType;
              setSelectedGoal(savedGoal);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleGoalSelect = (goalType: GoalType) => {
    setSelectedGoal(goalType);
  };

  const handleContinue = async () => {
    if (!selectedGoal || !userId) return;

    // Средний хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(20);
    }

    try {
      // Сохраняем цель через API
      await saveGoal(userId, selectedGoal);
      
      // Пересчитываем и сохраняем данные питания
      await recalculateAndSaveNutrition(userId);
    } catch (error) {
      console.error('Error saving goal:', error);
      // Продолжаем даже при ошибке сохранения
    }

    // Переход на следующий экран
    navigate('/onboarding/3');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center overflow-hidden">
      {/* Контент (скроллируемый) */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        {/* Верхний отступ с учетом safe area (увеличен для опускания контента) */}
        <div className="h-[calc(env(safe-area-inset-top)+120px)]" />
        
        {/* Заголовок */}
        <h1 className="text-[28px] font-bold text-foreground text-center px-2">
          Какая твоя главная цель?
        </h1>
        
        {/* Отступ после заголовка */}
        <div className="h-2.5" />
        
        {/* Подзаголовок */}
        <p 
          className="text-[17px] text-foreground text-center px-6"
          style={{ opacity: 0.75 }}
        >
          Выбери то, что резонирует с тобой прямо сейчас.
        </p>
        
        {/* Отступ перед карточками (увеличен для опускания контента) */}
        <div className="h-16" />
        
        {/* Карточки целей */}
        <div className="w-full px-6 flex flex-col gap-[18px] pb-4">
          {GOALS.map((goal) => (
            <GoalCard
              key={goal.goalType}
              data={goal}
              isSelected={selectedGoal === goal.goalType}
              onClick={() => handleGoalSelect(goal.goalType)}
            />
          ))}
        </div>
        
        {/* Отступ снизу для скролла */}
        <div className="h-4" />
      </div>
      
      {/* Кнопка "Продолжить →" (фиксированная внизу, как на экране 1) */}
      <div className="w-full px-6 pb-5 flex-shrink-0">
        <OnboardingButton 
          onClick={handleContinue}
          disabled={!selectedGoal}
        >
          Продолжить →
        </OnboardingButton>
      </div>
    </div>
  );
};

