import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Dumbbell, Search } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { addWorkout, decrementWorkout } from '../../api/activity';
import { WORKOUT_CATEGORIES } from '../../constants/workouts';

interface AddWorkoutModalProps {
  selectedDate: string; // YYYY-MM-DD
  onClose: () => void;
  initialType?: string; // For editing
  initialCategory?: string; // For editing
  initialMinutes?: number; // For editing
  onSave?: (type: string, category: string, minutes: number) => void; // For editing
}

type Step = 'pick' | 'time';

export const AddWorkoutModal = ({ 
  selectedDate, 
  onClose, 
  initialType, 
  initialCategory, 
  initialMinutes,
  onSave 
}: AddWorkoutModalProps) => {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.92)' : 'rgba(255, 255, 255, 0.92)';

  const isEditing = !!initialType;
  const [step, setStep] = useState<Step>(isEditing ? 'time' : 'pick');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<{ type: string; categoryTitle: string } | null>(
    isEditing && initialCategory ? { type: initialType || '', categoryTitle: initialCategory } : null
  );
  const [minutes, setMinutes] = useState(isEditing && initialMinutes ? initialMinutes.toString() : '45');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return WORKOUT_CATEGORIES;
    return WORKOUT_CATEGORIES.map((c) => ({
      ...c,
      items: c.items.filter((x) => x.toLowerCase().includes(q)),
    })).filter((c) => c.items.length > 0);
  }, [query]);

  const handlePick = (categoryTitle: string, type: string) => {
    setPicked({ categoryTitle, type });
    setStep('time');
    // легкий хаптик
    if ('vibrate' in navigator) navigator.vibrate(10);
  };

  const handleSave = async () => {
    if (!picked) return;
    const value = parseInt(minutes, 10);
    if (!Number.isFinite(value) || value <= 0) {
      alert('Введи время тренировки (в минутах)');
      return;
    }
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(picked.type, picked.categoryTitle, value);
      } else {
      await addWorkout(picked.type, picked.categoryTitle, value, selectedDate);
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
      }
      onClose();
    } catch (e) {
      console.error('Failed to save workout', e);
      alert('Ошибка при сохранении тренировки');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLast = async () => {
    try {
      setIsRemoving(true);
      await decrementWorkout(selectedDate);
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
    } catch (e) {
      console.error('Failed to decrement workout', e);
      alert('Нечего удалять');
    } finally {
      setIsRemoving(false);
    }
  };

  return (
    <motion.div
      className={`fixed inset-0 ${isEditing ? 'z-[60]' : 'z-40'} flex items-end justify-center`}
      style={{ background: isEditing ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.45)' }}
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
        <div className="flex items-center gap-2 mb-2">
          <Dumbbell size={20} style={{ color: accentColor }} />
          <div className="text-[18px] font-semibold text-foreground">
            {isEditing ? 'Редактировать тренировку' : 'Добавить тренировку'}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-4">За {selectedDate}</div>

        <AnimatePresence mode="wait">
          {step === 'pick' ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-sm text-muted-foreground mb-2">Какая тренировка?</div>

              <div
                className="flex items-center gap-2 px-4 py-3 rounded-2xl mb-3"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <Search size={16} className="text-muted-foreground" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Поиск"
                  className="w-full bg-transparent outline-none text-[14px] text-foreground placeholder:text-muted-foreground"
                />
              </div>

              <div className="max-h-[52vh] overflow-y-auto pr-1">
                {filtered.map((cat) => (
                  <div key={cat.id} className="mb-3">
                    <div className="text-xs text-muted-foreground mb-2">
                      {cat.emoji} {cat.title}
                    </div>
                    <div className="space-y-2">
                      {cat.items.map((item) => (
                        <button
                          key={`${cat.id}:${item}`}
                          onClick={() => handlePick(cat.title, item)}
                          className="w-full text-left px-4 py-3 rounded-2xl text-[14px] text-foreground"
                          style={{
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.06)',
                          }}
                        >
                          {item}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                {filtered.length === 0 && (
                  <div className="text-sm text-muted-foreground">Ничего не нашёл</div>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="time"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.18 }}
            >
              <div className="text-sm text-muted-foreground mb-2">Выбрано</div>
              <div
                className="px-4 py-3 rounded-2xl text-[14px] text-foreground mb-3"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                <div className="text-xs text-muted-foreground mb-1">{picked?.categoryTitle}</div>
                <div className="font-semibold">{picked?.type}</div>
              </div>

              <div className="text-sm text-muted-foreground mb-2">Время (мин)</div>
              <input
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl text-[18px] font-semibold"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--foreground)' }}
                inputMode="numeric"
              />

              <div className="grid grid-cols-2 gap-3 mt-4">
                <button
                  onClick={() => setStep('pick')}
                  disabled={isSaving || isRemoving}
                  className="py-4 rounded-[50px] text-[16px] font-semibold text-foreground transition-opacity disabled:opacity-50"
                  style={{ background: 'rgba(255,255,255,0.10)' }}
                >
                  Назад
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving || isRemoving}
                  className="py-4 rounded-[50px] text-[18px] font-semibold text-white transition-opacity disabled:opacity-50"
                  style={{ background: accentColor }}
                >
                  {isSaving ? 'Сохраняю…' : 'Сохранить'}
                </button>
              </div>

              {!isEditing && (
              <button
                onClick={handleRemoveLast}
                disabled={isSaving || isRemoving}
                className="w-full mt-3 py-3 rounded-[50px] text-[14px] font-semibold text-foreground transition-opacity disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.08)' }}
              >
                {isRemoving ? 'Удаляю…' : 'Удалить последнюю тренировку'}
              </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
};


