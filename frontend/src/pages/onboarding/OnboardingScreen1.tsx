import { useNavigate } from 'react-router-dom';
import { OnboardingButton } from '../../components/onboarding/OnboardingButton';

export const OnboardingScreen1 = () => {
  const navigate = useNavigate();

  const handleNext = () => {
    // Переход на следующий экран онбординга
    navigate('/onboarding/2');
  };

  return (
    <div className="fixed inset-0 bg-background flex flex-col items-center overflow-hidden">
      {/* Верхний отступ - 20% высоты экрана */}
      <div className="h-[20vh]" />
      
      {/* Заголовок "NO LIMITS." */}
      <h1 className="text-[34px] font-bold text-foreground text-center px-4">
        NO LIMITS.
      </h1>
      
      {/* Отступ после заголовка - 24pt */}
      <div className="h-6" />
      
      {/* Текстовый блок */}
      <div className="flex flex-col items-center gap-2.5 px-4">
        {/* Текст 1: "Ты уже свободен." */}
        <p className="text-[20px] font-medium text-foreground text-center">
          Ты уже свободен.
        </p>
        
        {/* Текст 2: "Просто ещё не начал это чувствовать." */}
        <p 
          className="text-[17px] text-foreground text-center"
          style={{ opacity: 0.9 }}
        >
          Просто ещё не начал это чувствовать.
        </p>
      </div>
      
      {/* Растягивающийся спейсер */}
      <div className="flex-1" />
      
      {/* Кнопка "Начать движение →" */}
      <div className="w-full px-6 pb-5">
        <OnboardingButton onClick={handleNext}>
          Начать движение →
        </OnboardingButton>
      </div>
    </div>
  );
};

