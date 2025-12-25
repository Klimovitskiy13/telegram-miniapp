import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { CalendarView } from '../components/calendar/CalendarView';
import { TabBarView } from '../components/tabbar/TabBarView';
import { ProfileScreen } from './ProfileScreen';
import { ChatScreen } from './ChatScreen';
import { FoodAnalysisView } from './FoodAnalysisView';
import { NutritionScreen } from './NutritionScreen';
import { FavoritesScreen } from './FavoritesScreen';
import { formatLocalISODate, setStoredSelectedDateISO } from '../utils/selectedDate';
import { ActivityScreen } from './ActivityScreen';
import { AddStepsModal } from './modals/AddStepsModal';
import { AddSleepModal } from './modals/AddSleepModal';
import { AddWorkoutModal } from './modals/AddWorkoutModal';
import { HomeScreen } from './HomeScreen';
import { KnowledgeScreen } from './KnowledgeScreen';

export const MainScreen = () => {
  const [selectedTab, setSelectedTab] = useState(0);
  const [showChat, setShowChat] = useState(false);
  const [showFoodAnalysis, setShowFoodAnalysis] = useState(false);
  const [capturedImage, setCapturedImage] = useState<File | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showAddSteps, setShowAddSteps] = useState(false);
  const [showAddSleep, setShowAddSleep] = useState(false);
  const [showAddWorkout, setShowAddWorkout] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date());

  const selectedDateISO = useMemo(() => {
    const y = selectedDate.getFullYear();
    const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
    const d = String(selectedDate.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }, [selectedDate]);

  // Персистим выбранный день (используется как страховка в API),
  // но при возврате в приложение будем принудительно ставить "сегодня".
  useEffect(() => {
    setStoredSelectedDateISO(selectedDateISO);
  }, [selectedDateISO]);

  // При входе/возврате в приложение — всегда показываем сегодняшний день
  // Важно: НЕ мешаем пользователю вручную выбирать другие даты внутри сессии.
  useEffect(() => {
    const setToday = () => {
      const todayISO = formatLocalISODate();
      setSelectedDate((prev) => {
        const prevISO = formatLocalISODate(prev);
        if (prevISO === todayISO) return prev;
        return new Date(`${todayISO}T00:00:00`);
      });
      setStoredSelectedDateISO(todayISO);
    };

    // на первый рендер
    setToday();

    const onVisibility = () => {
      if (document.visibilityState === 'visible') setToday();
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  const handleProfileTap = () => {
    console.log('Profile tapped');
    // TODO: Открыть профиль
  };

  const handlePhotoKBJU = () => {
    // Открываем камеру для съемки фото еды
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment'; // Открываем камеру
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Открываем экран анализа еды
        setCapturedImage(file);
        setShowFoodAnalysis(true);
      }
    };
    input.click();
  };

  const handleTextKBJU = () => {
    setShowChat(true);
  };

  const handleFavorites = () => {
    setShowFavorites(true);
  };

  const handleAddSteps = () => {
    setShowAddSteps(true);
  };

  const handleAddSleep = () => {
    setShowAddSleep(true);
  };

  const handleAddWorkout = () => {
    setShowAddWorkout(true);
  };

  const handleCalendarExpandChange = () => {
    // Не нужно обновлять отступы - контент остается на месте
  };

  const tabBarHeight = 92;
  const calendarHeightCollapsed = 100; // Фиксированная высота свернутого календаря

  // Отступы для контента (content margins) - фиксированные
  const topMargin = calendarHeightCollapsed; // Всегда используем высоту свернутого календаря
  const bottomMargin = tabBarHeight;

  return (
    <div className="fixed inset-0 bg-background overflow-hidden">
      {/* Контент экранов - занимает весь экран, игнорирует safe area */}
      <div 
        className="absolute inset-0 overflow-y-auto"
        style={{
          // Игнорируем safe area - контент занимает весь экран
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        {/* Внутренний контейнер с отступами (content margins) */}
        <div
          style={{
            // Отступы применяются только к контенту внутри скролла
            paddingTop: `calc(${topMargin}px + env(safe-area-inset-top))`,
            paddingBottom: `calc(${bottomMargin}px + env(safe-area-inset-bottom))`,
            minHeight: '100%',
          }}
        >
          {/* Контент экранов */}
          {selectedTab === 0 && <HomeScreen selectedDate={selectedDateISO} />}
          {selectedTab === 1 && <NutritionScreen selectedDate={selectedDateISO} />}
          {selectedTab === 2 && (
            <ActivityScreen selectedDate={selectedDateISO} />
          )}
          {selectedTab === 3 && <KnowledgeScreen />}
          {selectedTab === 4 && <ProfileScreen />}
        </div>
      </div>

      {/* Чат (оверлей поверх всего, z-index: 20) */}
      {showChat && (
        <ChatScreen
          selectedDate={selectedDateISO}
          onGoToday={() => setSelectedDate(new Date())}
          onClose={() => setShowChat(false)}
        />
      )}

      {/* Экран анализа еды (оверлей поверх всего, z-index: 20) */}
      <AnimatePresence>
        {showFoodAnalysis && capturedImage && (
          <FoodAnalysisView
            key="food-analysis"
            image={capturedImage}
            selectedDate={selectedDateISO}
            onGoToday={() => setSelectedDate(new Date())}
            onClose={() => {
              setShowFoodAnalysis(false);
              setCapturedImage(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Избранное (оверлей, z-index: 20) */}
      <AnimatePresence>
        {showFavorites && (
          <FavoritesScreen
            selectedDate={selectedDateISO}
            onGoToday={() => setSelectedDate(new Date())}
            onClose={() => setShowFavorites(false)}
          />
        )}
      </AnimatePresence>

      {/* Добавить шаги */}
      <AnimatePresence>
        {showAddSteps && (
          <AddStepsModal
            selectedDate={selectedDateISO}
            onClose={() => setShowAddSteps(false)}
          />
        )}
      </AnimatePresence>

      {/* Добавить сон */}
      <AnimatePresence>
        {showAddSleep && (
          <AddSleepModal
            selectedDate={selectedDateISO}
            onClose={() => setShowAddSleep(false)}
          />
        )}
      </AnimatePresence>

      {/* Добавить тренировку */}
      <AnimatePresence>
        {showAddWorkout && (
          <AddWorkoutModal
            selectedDate={selectedDateISO}
            onClose={() => setShowAddWorkout(false)}
          />
        )}
      </AnimatePresence>

      {/* Календарь (оверлей сверху, z-index: 10) */}
      <CalendarView 
        onProfileTap={handleProfileTap}
        onExpandChange={handleCalendarExpandChange}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
      />

      {/* Таб-бар (оверлей снизу, z-index: 10) */}
      <TabBarView
        selectedTab={selectedTab}
        onTabChange={setSelectedTab}
        onPhotoKBJU={handlePhotoKBJU}
        onTextKBJU={handleTextKBJU}
        onFavorites={handleFavorites}
        onAddSteps={handleAddSteps}
        onAddSleep={handleAddSleep}
        onAddWorkout={handleAddWorkout}
      />
    </div>
  );
};

