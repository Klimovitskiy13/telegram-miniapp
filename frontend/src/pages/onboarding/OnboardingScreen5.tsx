import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Zap, Target, UtensilsCrossed } from 'lucide-react';
import { EnergyBlock } from '../../components/onboarding/EnergyBlock';
import { OnboardingButton } from '../../components/onboarding/OnboardingButton';
import { checkUser, saveNutritionData, completeOnboarding } from '../../api/user';
import { getTelegramUser } from '../../api/telegram';
import { calculateFullNutrition, UserProfile } from '../../utils/calculators/nutritionCalculator';
import { GoalType } from '../../utils/calculators/calorieCalculator';
import { ActivityLevel } from '../../utils/calculators/amrCalculator';

export const OnboardingScreen5 = () => {
  const navigate = useNavigate();
  const [nutritionData, setNutritionData] = useState<{
    bmr: number;
    amr: number;
    recommendedCalories: number;
    macros: { protein: number; fat: number; carbs: number };
  } | null>(null);

  // Загружаем данные пользователя и рассчитываем питание
  useEffect(() => {
    const loadAndCalculateNutritionData = async () => {
      try {
        const telegramUser = getTelegramUser();
        if (telegramUser) {
          const response = await checkUser({
            id: telegramUser.id,
            first_name: telegramUser.first_name,
            last_name: telegramUser.last_name,
            username: telegramUser.username,
          });

          if (response.success && response.user && response.user.onboarding) {
            const onboarding = response.user.onboarding;

            // Если есть сохраненные данные питания, используем их
            if (
              onboarding.bmr &&
              onboarding.amr &&
              onboarding.recommendedCalories &&
              onboarding.protein &&
              onboarding.fat &&
              onboarding.carbs
            ) {
              setNutritionData({
                bmr: onboarding.bmr,
                amr: onboarding.amr,
                recommendedCalories: onboarding.recommendedCalories,
                macros: {
                  protein: onboarding.protein,
                  fat: onboarding.fat,
                  carbs: onboarding.carbs,
                },
              });
            } else {
              // Если данных нет, рассчитываем их
              const profile: UserProfile = {
                weight: onboarding.weight ?? null,
                height: onboarding.height ?? null,
                age: onboarding.age ?? null,
                gender: (onboarding.gender as 'male' | 'female') ?? null,
                goal: (onboarding.goal as GoalType) ?? null,
                activityLevel: (onboarding.activityLevel as ActivityLevel) ?? null,
              };

              // Рассчитываем данные питания
              const calculated = calculateFullNutrition(profile);
              if (calculated && response.user.id) {
                setNutritionData(calculated);
                
                // Сохраняем рассчитанные данные в базу
                try {
                  await saveNutritionData(response.user.id, {
                    bmr: calculated.bmr,
                    amr: calculated.amr,
                    recommendedCalories: calculated.recommendedCalories,
                    protein: calculated.macros.protein,
                    fat: calculated.macros.fat,
                    carbs: calculated.macros.carbs,
                  });
                } catch (error) {
                  console.error('Error saving nutrition data:', error);
                }
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading and calculating nutrition data:', error);
      }
    };

    loadAndCalculateNutritionData();
  }, []);

  // Значения по умолчанию, если данные не рассчитаны
  const basalEnergy = nutritionData?.bmr ?? 1800;
  const dailyEnergy = nutritionData?.amr ?? 2200;
  const powerZoneEnergy = nutritionData?.recommendedCalories ?? 2500;
  const proteinGrams = nutritionData?.macros.protein ?? 120;
  const fatGrams = nutritionData?.macros.fat ?? 80;
  const carbsGrams = nutritionData?.macros.carbs ?? 200;

  const handleStart = async () => {
    // Легкий хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    try {
      // Получаем userId из данных пользователя
      const telegramUser = getTelegramUser();
      if (telegramUser) {
        const response = await checkUser({
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
        });

        if (response.success && response.user) {
          // Устанавливаем флаг завершения онбординга
          await completeOnboarding(response.user.id);
        }
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      // Продолжаем даже при ошибке
    }

    // Переход на главный экран
    navigate('/main');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center overflow-hidden">
      {/* Контент (скроллируемый) */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        {/* Верхний отступ с учетом safe area (увеличен для опускания контента) */}
        <div className="h-[calc(env(safe-area-inset-top)+120px)]" />
        
        {/* Заголовок */}
        <h1 className="text-[28px] font-bold text-foreground text-center px-6">
          Ты в движении.
        </h1>
        
        {/* Отступ после заголовка - 12pt */}
        <div className="h-3" />
        
        {/* Подзаголовок */}
        <p 
          className="text-[17px] text-foreground text-center px-6"
          style={{ opacity: 0.75 }}
        >
          Мы рассчитали твой ритм энергии — чтобы ты мог двигаться, есть и жить без рамок.
          {'\n'}
          Это не правила. Это — твой старт.
        </p>
        
        {/* Отступ перед блоками */}
        <div className="h-8" />
        
        {/* Блоки энергии */}
        <div className="w-full px-6 flex flex-col gap-4 pb-4">
          {/* Блок 1: Твоя базовая энергия */}
          <EnergyBlock
            icon={Flame}
            iconColor="#FF9800" // оранжевый
            title="Твоя базовая энергия"
            value={`~${basalEnergy} ккал`}
            description={'Столько твоё тело тратит на "быть живым": дыхание, сон, восстановление.'}
          />
          
          {/* Блок 2: Твой ритм дня */}
          <EnergyBlock
            icon={Zap}
            iconColor="#FFC107" // желтый
            title="Твой ритм дня"
            value={`~${dailyEnergy} ккал`}
            description="С учётом движения — столько нужно, чтобы чувствовать себя легко и свободно."
          />
          
          {/* Блок 3: Твоя зона силы */}
          <EnergyBlock
            icon={Target}
            iconColor="#F44336" // красный
            title="Твоя зона силы"
            value={`~${powerZoneEnergy} ккал`}
            description="Чтобы расти, двигаться, чувствовать себя ярко — добавь немного топлива."
          />
          
          {/* Блок 4: Твои ориентиры */}
          <EnergyBlock
            icon={UtensilsCrossed}
            iconColor="#757575" // серый
            title="Твои ориентиры"
            value={`Б ${proteinGrams}г / Ж ${fatGrams}г / У ${carbsGrams}г`}
            description="Примерный баланс — меняй под своё настроение и аппетит."
          />
        </div>
        
        {/* Отступ снизу для скролла */}
        <div className="h-4" />
      </div>
      
      {/* Кнопка "Начать движение →" (фиксированная внизу, как на экране 1) */}
      <div className="w-full px-6 pb-5 flex-shrink-0">
        <OnboardingButton onClick={handleStart}>
          Начать движение →
        </OnboardingButton>
      </div>
    </div>
  );
};

