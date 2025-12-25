import { useState, useRef, useEffect } from 'react';
import { LucideIcon } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface InputFieldProps {
  icon: LucideIcon;
  iconColor: string; // CSS color
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label?: string; // Подпись под полем
  type?: 'text' | 'number'; // Тип поля ввода
}

export const InputField = ({ 
  icon: Icon, 
  iconColor, 
  value, 
  onChange, 
  placeholder,
  label,
  type = 'number'
}: InputFieldProps) => {
  const { isDark } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleColor = isDark ? '#60519b' : '#ff541B';
  const borderColor = isFocused ? toggleColor : `${toggleColor}4D`; // 100% или 30% opacity
  const borderWidth = isFocused ? '2px' : '1px';

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = () => {
    setIsFocused(false);
  };

  // Скрытие клавиатуры при клике вне поля
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        inputRef.current.blur();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div className="w-full">
      {/* Поле ввода */}
      <div
        ref={inputRef}
        className="relative w-full rounded-[40px] overflow-hidden transition-all duration-100"
        style={{
          borderWidth,
          borderColor,
        }}
      >
        {/* Glass material эффект - базовый слой */}
        <div className="absolute inset-0 backdrop-blur-xl bg-white/10 dark:bg-white/5" />
        
        {/* Контент */}
        <div className="relative z-10 flex items-center gap-4 px-5 py-4">
          {/* Иконка */}
          <Icon 
            size={24} 
            className="flex-shrink-0"
            style={{ color: iconColor }}
          />
          
          {/* Input */}
          <input
            type={type}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder={placeholder}
            className="flex-1 bg-transparent text-[18px] font-medium text-foreground placeholder:text-foreground/40 outline-none"
            inputMode={type === 'number' ? 'numeric' : 'text'}
            autoCapitalize="off"
            autoCorrect="off"
          />
        </div>
      </div>
      
      {/* Подпись */}
      {label && (
        <p 
          className="text-[12px] text-foreground mt-2 px-1"
          style={{ opacity: 0.6 }}
        >
          {label}
        </p>
      )}
    </div>
  );
};

