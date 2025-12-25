/**
 * Экран избранного: быстрый выбор сохранённой еды и добавление в рацион
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, ChevronLeft } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { deleteFavorite, listFavorites, type FavoriteFood } from '../api/favorites';
import { saveFoodEntry } from '../api/nutrition';
import { MEAL_TYPE_LABELS, type MealType } from '../types/chat';
import { SaveDateBanner } from '../components/SaveDateBanner';

interface FavoritesScreenProps {
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onGoToday?: () => void;
}

export const FavoritesScreen = ({ onClose, selectedDate, onGoToday }: FavoritesScreenProps) => {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.8)' : 'rgba(255, 255, 255, 0.8)';

  const [items, setItems] = useState<FavoriteFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selected, setSelected] = useState<FavoriteFood | null>(null);

  // Swipe-to-close (как в ChatScreen)
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch.clientX <= 20) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      setIsSwiping(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);

    if (Math.abs(deltaX) > deltaY && deltaX > 50) {
      e.preventDefault();
      setIsSwiping(true);
      const adjusted = deltaX - 50;
      const maxDistance = 400;
      const raw = Math.min(adjusted / maxDistance, 1);
      const eased = raw * raw * raw * (raw * (raw * 6 - 15) + 10); // smootherstep
      setSwipeProgress(eased);
    } else if (deltaX < 0 || deltaX < 50) {
      setSwipeProgress(0);
      setIsSwiping(false);
      if (deltaX < 0) touchStartRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    if (swipeProgress > 0.4) {
      onClose();
    } else {
      setSwipeProgress(0);
    }
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setIsLoading(true);
        const data = await listFavorites();
        if (mounted) setItems(data);
      } catch (e) {
        console.error('Failed to load favorites', e);
      } finally {
        if (mounted) setIsLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm('Удалить из избранного?')) return;
    try {
      await deleteFavorite(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (selected?.id === id) setSelected(null);
    } catch (e) {
      console.error('Failed to delete favorite', e);
      alert('Ошибка при удалении из избранного');
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-30 bg-background"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeProgress * 60}%)`,
        transition: isSwiping ? 'none' : 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Иконка "<" слева (появляется при свайпе) */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 flex items-center justify-center z-30 pointer-events-none"
        style={{
          width: '60px',
          paddingTop: `calc(45px + env(safe-area-inset-top))`,
        }}
        animate={{
          opacity: swipeProgress > 0 ? Math.min(swipeProgress * 2, 1) : 0,
          x: swipeProgress > 0 ? 0 : -30,
        }}
        transition={{ duration: 0.15, ease: 'easeOut' }}
      >
        <ChevronLeft size={24} className="text-foreground" />
      </motion.div>

      {/* Заголовок (как в чате) */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{
          paddingTop: `calc(45px + env(safe-area-inset-top))`,
          background: isDark ? 'rgba(44, 44, 44, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex-1" />
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-semibold text-foreground">Избранное</h2>
          <p className="text-xs text-muted-foreground">Питание и здоровье</p>
        </div>
        <div className="flex-1" />
      </div>

      {onGoToday && <SaveDateBanner selectedDateISO={selectedDate} onGoToday={onGoToday} />}

      <div className="px-5 pb-6">
        <div className="text-xs text-muted-foreground mb-3">
          Быстро добавляй сохранённые блюда в рацион за <span className="text-foreground">{selectedDate}</span>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={idx}
                className="rounded-2xl p-4 animate-pulse"
                style={{ background: cardBg }}
              >
                <div className="h-4 w-40 rounded bg-white/10 mb-2" />
                <div className="h-3 w-28 rounded bg-white/5" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-muted-foreground py-10 text-center">Пока пусто</div>
        ) : (
          <div className="space-y-2">
            {items.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => setSelected(item)}
                className="w-full text-left rounded-2xl p-4 flex items-center justify-between"
                style={{
                  background: cardBg,
                  border: '1px solid rgba(255,255,255,0.08)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.18)',
                  backdropFilter: 'blur(16px)',
                }}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                whileTap={{ scale: 0.98 }}
              >
                <div>
                  <div className="text-[16px] font-semibold text-foreground">{item.foodName}</div>
                  <div className="text-[12px] text-muted-foreground mt-1">
                    {Math.round(item.portionSize)} {item.unit}
                    {item.calories != null ? ` • ${Math.round(item.calories)} ккал` : ''}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(item.id);
                  }}
                  className="p-2 rounded-xl transition-opacity"
                  style={{ background: 'rgba(255,255,255,0.06)' }}
                >
                  <Trash2 size={16} className="text-muted-foreground" />
                </button>
              </motion.button>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {selected && (
          <AddFavoriteModal
            item={selected}
            selectedDate={selectedDate}
            accentColor={accentColor}
            cardBg={cardBg}
            onClose={() => setSelected(null)}
            onSaved={() => {
              window.dispatchEvent(new CustomEvent('nutrition-updated', { detail: { date: selectedDate } }));
              setSelected(null);
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

interface AddFavoriteModalProps {
  item: FavoriteFood;
  selectedDate: string;
  accentColor: string;
  cardBg: string;
  onClose: () => void;
  onSaved: () => void;
}

const AddFavoriteModal = ({ item, selectedDate, accentColor, cardBg, onClose, onSaved }: AddFavoriteModalProps) => {
  const [portion, setPortion] = useState(String(Math.round(item.portionSize)));
  const [mealType, setMealType] = useState<MealType | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const recalculated = useMemo(() => {
    const p = parseFloat(portion);
    const base = item.portionSize || 1;
    const ratio = Number.isFinite(p) && p > 0 ? p / base : 1;
    const mul = (v: number | null) => (v == null ? null : Math.round(v * ratio * 10) / 10);
    return {
      portionSize: Number.isFinite(p) && p > 0 ? p : item.portionSize,
      calories: mul(item.calories),
      protein: mul(item.protein),
      fat: mul(item.fat),
      carbs: mul(item.carbs),
    };
  }, [portion, item]);

  const handleSave = async () => {
    if (!mealType) return;
    try {
      setIsSaving(true);
      await saveFoodEntry({
        mealType,
        foodName: item.foodName,
        portionSize: recalculated.portionSize,
        unit: item.unit,
        calories: recalculated.calories,
        protein: recalculated.protein,
        fat: recalculated.fat,
        carbs: recalculated.carbs,
        imageUrl: item.imageUrl,
        date: selectedDate,
      });
      onSaved();
    } catch (e) {
      console.error('Failed to save favorite to diary', e);
      alert('Ошибка при сохранении в рацион');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-40 flex items-end justify-center"
      style={{ background: 'rgba(0,0,0,0.45)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="w-full rounded-t-[28px] p-5"
        style={{ background: cardBg, paddingBottom: `calc(16px + env(safe-area-inset-bottom))` }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="text-[18px] font-semibold text-foreground">{item.foodName}</div>
          <div />
        </div>

        <div className="text-sm text-muted-foreground mb-3">Размер порции</div>
        <div className="flex items-center gap-3 mb-4">
          <input
            type="number"
            value={portion}
            onChange={(e) => setPortion(e.target.value)}
            className="w-24 px-3 py-2 rounded-xl text-lg font-bold text-center"
            style={{ background: 'rgba(255,255,255,0.10)', color: accentColor, fontSize: '16px' }}
          />
          <div className="px-3 py-2 rounded-xl text-sm text-muted-foreground" style={{ background: 'rgba(255,255,255,0.06)' }}>
            {item.unit}
          </div>
          <div className="ml-auto text-sm text-muted-foreground">
            {recalculated.calories != null ? `${Math.round(recalculated.calories)} ккал` : '— ккал'}
          </div>
        </div>

        <div className="text-sm text-muted-foreground mb-2">Приём пищи</div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((t) => (
            <button
              key={t}
              onClick={() => setMealType(mealType === t ? null : t)}
              className="px-3 py-2 rounded-xl text-sm font-medium"
              style={{
                background: mealType === t ? accentColor : 'rgba(255,255,255,0.06)',
                color: mealType === t ? '#fff' : 'var(--foreground)',
              }}
            >
              {MEAL_TYPE_LABELS[t]}
            </button>
          ))}
        </div>

        <button
          onClick={handleSave}
          disabled={!mealType || isSaving}
          className="w-full py-4 rounded-[50px] text-[18px] font-semibold text-white transition-opacity disabled:opacity-50"
          style={{ background: accentColor }}
        >
          {isSaving ? 'Сохраняю…' : 'Сохранить в рацион'}
        </button>
      </motion.div>
    </motion.div>
  );
};


