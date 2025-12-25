import { useState } from 'react';
import { motion } from 'framer-motion';
import { Footprints } from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { addSteps, decrementSteps } from '../../api/activity';

interface AddStepsModalProps {
  selectedDate: string; // YYYY-MM-DD
  onClose: () => void;
  initialSteps?: number; // For editing
  onSave?: (steps: number) => void; // For editing
}

export const AddStepsModal = ({ selectedDate, onClose, initialSteps, onSave }: AddStepsModalProps) => {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.92)' : 'rgba(255, 255, 255, 0.92)';
  const isEditing = !!initialSteps;

  const [steps, setSteps] = useState(initialSteps ? initialSteps.toString() : '3000');
  const [isSaving, setIsSaving] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const handleSave = async () => {
    const value = parseInt(steps, 10);
    if (!Number.isFinite(value) || value <= 0) {
      alert('Введи количество шагов');
      return;
    }
    try {
      setIsSaving(true);
      if (onSave) {
        await onSave(value);
      } else {
      await addSteps(value, selectedDate);
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
      }
      onClose();
    } catch (e) {
      console.error('Failed to save steps', e);
      alert('Ошибка при сохранении шагов');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveLast = async () => {
    try {
      setIsRemoving(true);
      await decrementSteps(selectedDate);
      window.dispatchEvent(new CustomEvent('activity-updated', { detail: { date: selectedDate } }));
    } catch (e) {
      console.error('Failed to decrement steps', e);
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
          <Footprints size={20} style={{ color: accentColor }} />
          <div className="text-[18px] font-semibold text-foreground">
            {isEditing ? 'Редактировать шаги' : 'Добавить шаги'}
          </div>
        </div>
        <div className="text-xs text-muted-foreground mb-4">За {selectedDate}</div>

        <div className="text-sm text-muted-foreground mb-2">Количество</div>
        <input
          type="number"
          value={steps}
          onChange={(e) => setSteps(e.target.value)}
          className="w-full px-4 py-3 rounded-2xl text-[18px] font-semibold"
          style={{ background: 'rgba(255,255,255,0.08)', color: 'var(--foreground)' }}
          inputMode="numeric"
        />

        <div className={`grid ${isEditing ? 'grid-cols-2' : 'grid-cols-2'} gap-3 mt-4`}>
          {!isEditing && (
          <button
            onClick={handleRemoveLast}
            disabled={isSaving || isRemoving}
            className="py-4 rounded-[50px] text-[16px] font-semibold text-foreground transition-opacity disabled:opacity-50"
            style={{ background: 'rgba(255,255,255,0.10)' }}
          >
            {isRemoving ? 'Удаляю…' : 'Удалить последнее'}
          </button>
          )}
          {isEditing && (
            <button
              onClick={onClose}
              disabled={isSaving}
              className="py-4 rounded-[50px] text-[16px] font-semibold text-foreground transition-opacity disabled:opacity-50"
              style={{ background: 'rgba(255,255,255,0.10)' }}
            >
              Отмена
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={isSaving || isRemoving}
            className="py-4 rounded-[50px] text-[18px] font-semibold text-white transition-opacity disabled:opacity-50"
            style={{ background: accentColor }}
          >
            {isSaving ? 'Сохраняю…' : 'Сохранить'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};


