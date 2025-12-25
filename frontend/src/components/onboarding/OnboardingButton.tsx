import { useState } from 'react';
import { motion } from 'framer-motion';

interface OnboardingButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export const OnboardingButton = ({ onClick, disabled = false, children }: OnboardingButtonProps) => {
  const [didTap, setDidTap] = useState(false);

  const handleClick = () => {
    if (didTap || disabled) return;
    
    setDidTap(true);
    
    // Легкий хаптик (если доступен)
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    
    onClick();
  };

  return (
    <motion.button
      onClick={handleClick}
      disabled={didTap || disabled}
      className={`
        relative w-full h-14 rounded-[28px] overflow-hidden
        flex items-center justify-center
        font-medium text-lg text-white
        transition-all duration-300
        ${didTap || disabled ? 'opacity-60 scale-[0.98]' : 'opacity-100 scale-100'}
        active:scale-[0.98]
      `}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
    >
      {/* Glass material эффект - базовый слой */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5" />
      
      {/* Overlay с акцентным цветом */}
      <div 
        className="absolute inset-0 opacity-70"
        style={{ backgroundColor: 'hsl(var(--accent-onboarding))' }}
      />
      
      {/* Обводка */}
      <div 
        className="absolute inset-0 rounded-[28px] border opacity-70"
        style={{ 
          borderColor: 'hsl(var(--accent-onboarding))',
          borderWidth: '1px',
        }}
      />
      
      {/* Текст */}
      <span className="relative z-10 font-medium text-lg tracking-tight">
        {children}
      </span>
    </motion.button>
  );
};

