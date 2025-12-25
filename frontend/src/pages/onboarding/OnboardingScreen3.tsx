import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Footprints, 
  Activity, 
  TrendingUp, 
  Zap, 
  Flame 
} from 'lucide-react';
import { ActivityCard } from '../../components/onboarding/ActivityCard';
import { OnboardingButton } from '../../components/onboarding/OnboardingButton';
import { ActivityLevel, ActivityCardData } from '../../types/onboarding';
import { checkUser, saveActivityLevel } from '../../api/user';
import { getTelegramUser } from '../../api/telegram';
import { recalculateAndSaveNutrition } from '../../utils/nutritionRecalculator';

const ACTIVITIES: ActivityCardData[] = [
  {
    title: 'Редко',
    subtitle: 'Дома, за компом, мало движений.\nМы начнём с малого — и будем рядом.',
    icon: Footprints, // иконка следов (ходьба)
    activityLevel: ActivityLevel.RARELY,
    borderColor: '#757575', // серый
    borderColorDark: '#757575',
  },
  {
    title: 'Иногда',
    subtitle: 'Прогулки, редкие тренировки.\nТы двигаешься — и это уже круто.',
    icon: TrendingUp, // иконка роста/прогресса (ходьба в движении)
    activityLevel: ActivityLevel.SOMETIMES,
    borderColor: '#2196F3', // синий
    borderColorDark: '#2196F3',
  },
  {
    title: 'Часто',
    subtitle: 'Тренировки 2–3 раза в неделю.\nТы в ритме — мы поддержим.',
    icon: Activity, // иконка активности (бег)
    activityLevel: ActivityLevel.OFTEN,
    borderColor: '#4CAF50', // зеленый
    borderColorDark: '#4CAF50',
  },
  {
    title: 'Постоянно',
    subtitle: 'Спорт почти каждый день.\nТы в потоке — мы адаптируемся.',
    icon: Zap, // иконка молнии (bolt.circle)
    activityLevel: ActivityLevel.CONSTANT,
    borderColor: '#FF9800', // оранжевый
    borderColorDark: '#FF9800',
  },
  {
    title: 'Интенсивно',
    subtitle: 'Постоянные интенсивные тренировки.\nТы — двигатель энергии — мы с тобой.',
    icon: Flame, // иконка пламени
    activityLevel: ActivityLevel.INTENSIVE,
    borderColor: '#F44336', // красный
    borderColorDark: '#F44336',
  },
];

export const OnboardingScreen3 = () => {
  const navigate = useNavigate();
  const [selectedActivity, setSelectedActivity] = useState<ActivityLevel | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // Загружаем сохраненный уровень активности при монтировании
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
            
            // Если есть сохраненный уровень активности, предвыбираем его
            if (response.user.onboarding?.activityLevel) {
              const savedActivity = response.user.onboarding.activityLevel as ActivityLevel;
              setSelectedActivity(savedActivity);
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleActivitySelect = (activityLevel: ActivityLevel) => {
    setSelectedActivity(activityLevel);
  };

  const handleContinue = async () => {
    if (!selectedActivity || !userId) return;

    // Легкий хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    try {
      // Сохраняем уровень активности через API
      await saveActivityLevel(userId, selectedActivity);
      
      // Пересчитываем и сохраняем данные питания
      await recalculateAndSaveNutrition(userId);
    } catch (error) {
      console.error('Error saving activity level:', error);
      // Продолжаем даже при ошибке сохранения
    }

    // Переход на следующий экран
    navigate('/onboarding/4');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center overflow-hidden">
      {/* Контент (скроллируемый) */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        {/* Верхний отступ с учетом safe area (увеличен для опускания контента) */}
        <div className="h-[calc(env(safe-area-inset-top)+120px)]" />
        
        {/* Заголовок */}
        <h1 className="text-[28px] font-bold text-foreground text-center px-2">
          Как ты двигаешься в мире?
        </h1>
        
        {/* Отступ после заголовка */}
        <div className="h-2" />
        
        {/* Подзаголовок */}
        <p 
          className="text-[17px] text-foreground text-center px-6"
          style={{ opacity: 0.75 }}
        >
          Мы адаптируемся к тебе — без давления, только помощь.
        </p>
        
        {/* Отступ перед карточками (увеличен для опускания контента) */}
        <div className="h-16" />
        
        {/* Карточки уровней активности (уменьшенные отступы) */}
        <div className="w-full px-6 flex flex-col gap-3 pb-4">
          {ACTIVITIES.map((activity) => (
            <ActivityCard
              key={activity.activityLevel}
              data={activity}
              isSelected={selectedActivity === activity.activityLevel}
              onClick={() => handleActivitySelect(activity.activityLevel)}
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
          disabled={!selectedActivity}
        >
          Продолжить →
        </OnboardingButton>
      </div>
    </div>
  );
};

