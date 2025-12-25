import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays } from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { formatLocalISODate } from '../utils/selectedDate';

interface SaveDateBannerProps {
  selectedDateISO?: string; // YYYY-MM-DD
  onGoToday: () => void;
}

const formatHuman = (iso: string) => {
  const [y, m, d] = iso.split('-').map((x) => parseInt(x, 10));
  const dt = new Date(y, m - 1, d);
  const fmt = new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short' });
  return fmt.format(dt).replace('.', '');
};

export const SaveDateBanner = ({ selectedDateISO, onGoToday }: SaveDateBannerProps) => {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const cardBg = isDark ? 'rgba(44, 44, 44, 0.90)' : 'rgba(255, 255, 255, 0.90)';

  const todayISO = useMemo(() => formatLocalISODate(), []);
  const iso = selectedDateISO ?? todayISO;

  if (iso === todayISO) return null;

  return (
    <motion.div
      className="mx-5 mt-3 rounded-2xl px-4 py-3 flex items-center justify-between"
      style={{
        background: cardBg,
        border: `1px solid ${accentColor}33`,
        backdropFilter: 'blur(16px)',
      }}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <div className="flex items-center gap-2">
        <CalendarDays size={16} style={{ color: accentColor }} />
        <div className="text-[13px] text-foreground/90">
          Запись в: <span className="font-semibold">{formatHuman(iso)}</span>
        </div>
      </div>
      <button
        onClick={onGoToday}
        className="px-3 py-2 rounded-xl text-[13px] font-semibold text-white"
        style={{ background: accentColor }}
      >
        Сегодня
      </button>
    </motion.div>
  );
};


