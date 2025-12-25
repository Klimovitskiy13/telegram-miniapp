import { User } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
}

interface GenderToggleProps {
  selectedGender: Gender | null;
  onChange: (gender: Gender) => void;
}

export const GenderToggle = ({ selectedGender, onChange }: GenderToggleProps) => {
  const { isDark } = useTheme();
  const toggleColor = isDark ? '#60519b' : '#ff541B';

  const handleChange = (gender: Gender) => {
    // Легкий хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onChange(gender);
  };

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
      <div className="relative z-10 flex items-center gap-4 px-5 py-4">
        {/* Иконка */}
        <User 
          size={28} 
          className="flex-shrink-0"
          style={{ color: '#EC4899' }} // розовый
        />
        
        {/* Segmented Control */}
        <div className="flex-1 flex gap-2">
          <button
            onClick={() => handleChange(Gender.MALE)}
            className={`
              flex-1 py-2 px-4 rounded-[20px] text-[15px] font-medium transition-all duration-300
              ${selectedGender === Gender.MALE
                ? 'text-white'
                : 'text-foreground opacity-60'
              }
            `}
            style={{
              backgroundColor: selectedGender === Gender.MALE ? toggleColor : 'transparent',
            }}
          >
            Мужской
          </button>
          <button
            onClick={() => handleChange(Gender.FEMALE)}
            className={`
              flex-1 py-2 px-4 rounded-[20px] text-[15px] font-medium transition-all duration-300
              ${selectedGender === Gender.FEMALE
                ? 'text-white'
                : 'text-foreground opacity-60'
              }
            `}
            style={{
              backgroundColor: selectedGender === Gender.FEMALE ? toggleColor : 'transparent',
            }}
          >
            Женский
          </button>
        </div>
      </div>
    </div>
  );
};

