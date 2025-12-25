import { motion } from 'framer-motion';
import { GoalCardData } from '../../types/onboarding';
import { useTheme } from '../../hooks/useTheme';

interface GoalCardProps {
  data: GoalCardData;
  isSelected: boolean;
  onClick: () => void;
}

export const GoalCard = ({ data, isSelected, onClick }: GoalCardProps) => {
  const { isDark } = useTheme();
  const borderColor = isDark ? data.borderColorDark : data.borderColor;

  const handleClick = () => {
    // Легкий хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onClick();
  };

  return (
    <motion.div
      onClick={handleClick}
      className={`
        relative w-full rounded-[40px] overflow-hidden
        cursor-pointer
        ${isSelected ? 'scale-[1.02]' : 'scale-100'}
      `}
      whileTap={{ scale: 0.98 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 30,
      }}
      style={{
        borderWidth: isSelected ? '2px' : '1px',
        borderColor: isSelected 
          ? borderColor 
          : `${borderColor}4D`, // 30% opacity (4D в hex = ~30%)
      }}
    >
      {/* Glass material эффект - базовый слой */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5" />
      
      {/* Overlay с цветом границы (только если выбрана) */}
      {isSelected && (
        <div 
          className="absolute inset-0 opacity-15"
          style={{ backgroundColor: borderColor }}
        />
      )}
      
      {/* Контент */}
      <div className="relative z-10 py-4 px-5">
        <div className="flex flex-col items-center gap-2">
          {/* Верхняя строка: иконка и заголовок */}
          <div className="flex items-center gap-2 w-full">
            <data.icon 
              size={20} 
              className="flex-shrink-0"
              style={{ color: borderColor }}
            />
            <h3 className="text-[17px] font-semibold text-foreground text-center flex-1">
              {data.title}
            </h3>
          </div>
          
          {/* Подзаголовок */}
          <p 
            className="text-[16px] text-foreground text-center line-clamp-2 whitespace-pre-line"
            style={{ opacity: 0.85 }}
          >
            {data.subtitle}
          </p>
        </div>
      </div>
    </motion.div>
  );
};

