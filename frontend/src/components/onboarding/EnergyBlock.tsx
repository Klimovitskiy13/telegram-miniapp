import { LucideIcon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface EnergyBlockProps {
  icon: LucideIcon;
  iconColor: string; // CSS color
  title: string;
  value: string;
  description: string;
}

export const EnergyBlock = ({ 
  icon: Icon, 
  iconColor, 
  title, 
  value, 
  description 
}: EnergyBlockProps) => {
  const { isDark } = useTheme();
  const toggleColor = isDark ? '#60519b' : '#ff541B';

  return (
    <div
      className="relative w-full rounded-[40px] overflow-hidden"
      style={{
        borderWidth: '1px',
        borderColor: `${toggleColor}4D`, // 30% opacity
      }}
    >
      {/* Glass material эффект - базовый слой */}
      <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5" />
      
      {/* Контент */}
      <div className="relative z-10 px-5 py-4">
        <div className="flex flex-col gap-2">
          {/* Верхняя строка: иконка и заголовок */}
          <div className="flex items-center gap-2">
            <Icon 
              size={22} 
              className="flex-shrink-0"
              style={{ color: iconColor }}
            />
            <h3 className="text-[15px] font-medium text-foreground">
              {title}
            </h3>
          </div>
          
          {/* Значение (оранжевый цвет) */}
          <p 
            className="text-[15px] font-bold text-center"
            style={{ color: '#FF9800' }} // оранжевый фиксированный
          >
            {value}
          </p>
          
          {/* Описание */}
          <p 
            className="text-[11px] text-foreground text-center"
            style={{ opacity: 0.6 }}
          >
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

