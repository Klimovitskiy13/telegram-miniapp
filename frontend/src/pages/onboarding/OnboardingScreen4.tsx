import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Ruler, Scale, Calendar } from 'lucide-react';
import { GenderToggle, Gender } from '../../components/onboarding/GenderToggle';
import { InputField } from '../../components/onboarding/InputField';
import { OnboardingButton } from '../../components/onboarding/OnboardingButton';
import { checkUser, saveProfile } from '../../api/user';
import { getTelegramUser } from '../../api/telegram';
import { recalculateAndSaveNutrition } from '../../utils/nutritionRecalculator';

export const OnboardingScreen4 = () => {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<number | null>(null);
  const [gender, setGender] = useState<Gender | null>(null);
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [age, setAge] = useState('');

  // Загружаем сохраненные данные профиля при монтировании
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
            
            // Если есть сохраненные данные профиля, предзаполняем поля
            if (response.user.onboarding) {
              const onboarding = response.user.onboarding;
              
              if (onboarding.gender) {
                setGender(onboarding.gender as Gender);
              }
              if (onboarding.height) {
                setHeight(onboarding.height.toString());
              }
              if (onboarding.weight) {
                setWeight(onboarding.weight.toString());
              }
              if (onboarding.age) {
                setAge(onboarding.age.toString());
              }
            }
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };

    loadUserData();
  }, []);

  const handleContinue = async () => {
    if (!userId) return;

    // Легкий хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }

    try {
      // Сохраняем профиль через API
      await saveProfile(userId, {
        gender: gender ?? null,
        height: height ? parseInt(height, 10) : null,
        weight: weight ? parseFloat(weight) : null,
        age: age ? parseInt(age, 10) : null,
      });
      
      // Пересчитываем и сохраняем данные питания
      await recalculateAndSaveNutrition(userId);
    } catch (error) {
      console.error('Error saving profile:', error);
      // Продолжаем даже при ошибке сохранения
    }

    // Переход на следующий экран
    navigate('/onboarding/5');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center overflow-hidden">
      {/* Контент (скроллируемый) */}
      <div className="flex-1 w-full overflow-y-auto flex flex-col items-center">
        {/* Верхний отступ с учетом safe area (увеличен для опускания контента) */}
        <div className="h-[calc(env(safe-area-inset-top)+120px)]" />
        
        {/* Заголовок */}
        <h1 className="text-[28px] font-bold text-foreground text-center px-6">
          Расскажи о себе
        </h1>
        
        {/* Отступ после заголовка - 16pt */}
        <div className="h-4" />
        
        {/* Подзаголовок */}
        <p 
          className="text-[17px] text-foreground text-center px-6"
          style={{ opacity: 0.75 }}
        >
          Это поможет нам адаптировать программу под тебя.
          {'\n'}
          Введи свои данные ниже.
        </p>
        
        {/* Отступ перед полями */}
        <div className="h-8" />
        
        {/* Блок полей ввода */}
        <div className="w-full px-6 flex flex-col gap-6 pb-4">
          {/* GenderToggle */}
          <GenderToggle
            selectedGender={gender}
            onChange={setGender}
          />
          
          {/* InputField для роста */}
          <InputField
            icon={Ruler}
            iconColor="#2196F3" // синий
            value={height}
            onChange={setHeight}
            placeholder="Введите рост в см"
            label="Это поможет нам понять твой ритм"
          />
          
          {/* InputField для веса */}
          <InputField
            icon={Scale}
            iconColor="#4CAF50" // зеленый
            value={weight}
            onChange={setWeight}
            placeholder="Введите вес в кг"
            label="Чтобы быть точнее — без давления"
          />
          
          {/* InputField для возраста */}
          <InputField
            icon={Calendar}
            iconColor="#9C27B0" // фиолетовый
            value={age}
            onChange={setAge}
            placeholder="Введите возраст"
            label="Чтобы адаптироваться к твоей энергии"
          />
        </div>
        
        {/* Отступ снизу для скролла */}
        <div className="h-4" />
      </div>
      
      {/* Кнопка "Запустить энергию →" (фиксированная внизу, как на экране 1) */}
      <div className="w-full px-6 pb-5 flex-shrink-0">
        <OnboardingButton onClick={handleContinue}>
          Запустить энергию →
        </OnboardingButton>
      </div>
    </div>
  );
};

