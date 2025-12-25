import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  UtensilsCrossed, 
  Activity, 
  User, 
  Plus, 
  X, 
  Camera, 
  MessageCircle, 
  Star, 
  Footprints, 
  Moon, 
  Dumbbell,
  BookOpen
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';

interface TabBarViewProps {
  selectedTab: number;
  onTabChange: (tab: number) => void;
  onPhotoKBJU?: () => void;
  onTextKBJU?: () => void;
  onFavorites?: () => void;
  onAddSteps?: () => void;
  onAddSleep?: () => void;
  onAddWorkout?: () => void;
}

export const TabBarView = ({ 
  selectedTab, 
  onTabChange,
  onPhotoKBJU,
  onTextKBJU,
  onFavorites,
  onAddSteps,
  onAddSleep,
  onAddWorkout,
}: TabBarViewProps) => {
  const { isDark } = useTheme();
  const [isMenuExpanded, setIsMenuExpanded] = useState(false);

  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';

  const tabs = [
    { id: 0, icon: Home, name: 'Главная' },
    { id: 1, icon: UtensilsCrossed, name: 'Питание' },
    { id: 2, icon: Activity, name: 'Активность' },
    { id: 3, icon: BookOpen, name: 'Знания' },
    { id: 4, icon: User, name: 'Профиль' },
  ];

  const menuButtons = [
    { 
      id: 'photo-kbju', 
      icon: Camera, 
      color: '#2196F3', 
      label: 'Камера AI',
      delay: 0.1,
      onTap: onPhotoKBJU,
    },
    { 
      id: 'text-kbju', 
      icon: MessageCircle, 
      color: '#9C27B0', 
      label: 'Чат-AI',
      delay: 0.2,
      onTap: onTextKBJU,
    },
    { 
      id: 'favorites', 
      icon: Star, 
      color: '#FFC107', 
      label: 'Избранное',
      delay: 0.3,
      onTap: onFavorites,
    },
    { 
      id: 'add-steps', 
      icon: Footprints, 
      color: '#4CAF50', 
      label: 'Добавить шаги',
      delay: 0.4,
      onTap: onAddSteps,
    },
    { 
      id: 'add-sleep', 
      icon: Moon, 
      color: '#673AB7', 
      label: 'Добавить сон',
      delay: 0.5,
      onTap: onAddSleep,
    },
    { 
      id: 'add-workout', 
      icon: Dumbbell, 
      color: '#F44336', 
      label: 'Добавить тренировку',
      delay: 0.6,
      onTap: onAddWorkout,
    },
  ];

  const handleTabClick = (tabId: number) => {
    // Легкий хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    onTabChange(tabId);
  };

  const handleMenuToggle = () => {
    // Легкий хаптик
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    setIsMenuExpanded(!isMenuExpanded);
  };

  const handleMenuButtonClick = (onTap?: () => void) => {
    setIsMenuExpanded(false);
    if (onTap) {
      onTap();
    }
  };

  return (
    <>
      {/* Раскрывающееся меню над таб-баром */}
      <AnimatePresence>
        {isMenuExpanded && (
          <motion.div
            className="absolute bottom-[92px] left-2 right-2 z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{
              paddingBottom: `max(env(safe-area-inset-bottom), 12px)`,
            }}
          >
            {/* Glass material фон для меню */}
            <div 
              className="rounded-[30px] p-3"
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '0.5px solid rgba(255, 255, 255, 0.2)',
              }}
            >
              {/* Сетка кнопок меню: 2 строки по 3 кнопки */}
              <div className="grid grid-cols-3 gap-2">
                {menuButtons.map((button) => {
                  const Icon = button.icon;
                  return (
                    <motion.button
                      key={button.id}
                      onClick={() => handleMenuButtonClick(button.onTap)}
                      className="relative flex flex-col items-center gap-1 px-2 py-1.5"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ 
                        delay: button.delay,
                        type: 'spring',
                        stiffness: 300,
                        damping: 30,
                      }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {/* Иконка - черная на светлой теме, белая на темной */}
                      <Icon 
                        size={18} 
                        style={{ color: isDark ? '#ffffff' : '#000000' }}
                      />
                      
                      {/* Текст - короткая надпись под иконкой */}
                      <span className="text-[9px] font-medium text-foreground text-center leading-tight">
                        {button.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Таб-бар */}
      <div 
        className="absolute bottom-0 left-0 right-0 px-2"
        style={{ 
          zIndex: 10,
          paddingBottom: `max(env(safe-area-inset-bottom), 12px)`,
        }}
      >
        <div className="relative h-[92px] flex items-center justify-between px-5 pb-2">
        {/* Левая группа: основная навигация */}
        <div 
          className="flex items-center gap-0 px-4 py-3 rounded-[50px]"
          style={{
            background: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)',
            backdropFilter: 'blur(20px)',
            border: isDark ? '0.5px solid rgba(255, 255, 255, 0.2)' : '0.5px solid rgba(0, 0, 0, 0.1)',
          }}
        >
          {tabs.map((tab) => {
            const isSelected = selectedTab === tab.id;
            const Icon = tab.icon;

            return (
              <motion.button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className="relative flex items-center gap-2 px-3 py-2.5 rounded-full"
                whileTap={{ scale: 0.95 }}
                animate={{
                  paddingLeft: isSelected ? '12px' : '10px',
                  paddingRight: isSelected ? '12px' : '10px',
                }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              >
                {/* Фон для выбранной вкладки */}
                {isSelected && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    style={{
                      backgroundColor: `${accentColor}24`, // 14% opacity
                      border: `0.6px solid ${accentColor}59`, // 35% opacity
                    }}
                    layoutId="activeTab"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}

                {/* Иконка - только контур окрашивается, черные части становятся цветными */}
                <Icon
                  size={18}
                  className="relative z-10"
                  style={{
                    color: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                    stroke: isSelected ? accentColor : (isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
                    fill: 'none',
                  }}
                />

                {/* Текст (только если выбрана) */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.span
                      className="relative z-10 text-[14px] font-semibold text-foreground"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {tab.name}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>

        {/* Правая группа: кнопка меню */}
        <div className="relative">
          {/* Кнопка плюс/крестик */}
          <motion.button
            onClick={handleMenuToggle}
            className="w-11 h-11 rounded-full flex items-center justify-center relative"
            style={{
              background: `rgba(255, 255, 255, 0.1)`,
              backdropFilter: 'blur(20px)',
              border: `1px solid rgba(255, 255, 255, 0.2)`,
              backgroundColor: `${accentColor}99`, // 60% opacity
            }}
            whileTap={{ scale: 0.9 }}
            animate={{
              rotate: isMenuExpanded ? 45 : 0,
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <AnimatePresence mode="wait">
              {isMenuExpanded ? (
                <motion.div
                  key="close"
                  initial={{ opacity: 0, rotate: -45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: 45 }}
                >
                  <X size={18} className="text-white font-bold" />
                </motion.div>
              ) : (
                <motion.div
                  key="plus"
                  initial={{ opacity: 0, rotate: 45 }}
                  animate={{ opacity: 1, rotate: 0 }}
                  exit={{ opacity: 0, rotate: -45 }}
                >
                  <Plus size={18} className="text-white font-bold" />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>
      </div>
    </div>
    </>
  );
};

