/**
 * Блок геймификации - верхняя часть: восстановление здоровья (полукруглый прогресс-бар)
 * Нижняя часть: геймификация (уровень, здоровье, XP)
 */

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Heart, Zap, Shield, TrendingUp, X, Dumbbell, Activity, Droplet, Moon, Battery, Info, 
  Footprints, Scale, Target, Waves, Wind, GaugeCircle, AlertCircle 
} from 'lucide-react';
import { useTheme } from '../../hooks/useTheme';
import { createGlassCardStyle, createModalCardStyle } from '../../utils/glassCardStyle';
import { calculateLevelProgress } from '../../gamification';

interface GamificationStats {
  strength: number;
  endurance: number;
  flexibility: number;
  agility: number;
  speed: number;
  reflex: number;
  hunger: number;
  thirst: number;
  sleepiness: number;
  energy: number;
}

interface RecoveryBreakdown {
  sleep: number; // 0-100 (новая шкала)
  workload: number; // Нагрузка_вчера (штраф)
  fatigue: number; // Усталость_7дней (штраф)
  total: number; // 0-100
  status: 'recovered' | 'normal' | 'on_edge' | 'not_recovered';
}

interface GamificationBlockProps {
  level: number;
  health: number;
  maxHealth: number;
  xp: number;
  xpForNextLevel: number;
  recovery?: RecoveryBreakdown; // Восстановление (0-100)
  isLoading?: boolean;
  stats: GamificationStats;
}

export const GamificationBlock = ({
  level,
  health,
  maxHealth,
  xp,
  xpForNextLevel,
  recovery,
  isLoading = false,
  stats,
}: GamificationBlockProps) => {
  const { isDark } = useTheme();
  const [showRecoveryModal, setShowRecoveryModal] = useState(false);
  const [showGamificationModal, setShowGamificationModal] = useState(false);
  
  // Стиль карточки с фиолетовым акцентом
  const cardStyle = useMemo(() => createGlassCardStyle(isDark, '#8b5cf6'), [isDark]);
  const modalStyle = useMemo(() => createModalCardStyle(isDark, '#8b5cf6'), [isDark]);
  
  // Прогресс здоровья (0-1)
  const healthProgress = maxHealth > 0 ? Math.min(health / maxHealth, 1) : 0;
  
  // Прогресс XP до следующего уровня (0-1)
  const xpProgress = useMemo(() => {
    return calculateLevelProgress(xp, level);
  }, [xp, level]);
  
  // Цвет здоровья в зависимости от процента
  const getHealthColor = () => {
    const percent = healthProgress * 100;
    if (percent >= 70) return '#22c55e'; // зеленый
    if (percent >= 40) return '#f59e0b'; // желтый
    return '#ef4444'; // красный
  };
  
  // Расчет восстановления (0-100)
  const recoveryValue = recovery?.total ?? 0;
  const recoveryProgress = recoveryValue / 100; // 0-1 для прогресс-бара
  
  // Цвет восстановления в зависимости от статуса
  const getRecoveryColor = () => {
    if (!recovery) return '#8b5cf6';
    switch (recovery.status) {
      case 'recovered': return '#22c55e'; // зеленый
      case 'normal': return '#3b82f6'; // синий
      case 'on_edge': return '#f59e0b'; // желтый
      case 'not_recovered': return '#ef4444'; // красный
      default: return '#8b5cf6';
    }
  };
  
  // Текст статуса восстановления
  const getRecoveryStatusText = () => {
    if (!recovery) return 'Недостаточно данных';
    switch (recovery.status) {
      case 'recovered': return 'Восстановлен';
      case 'normal': return 'Нормально';
      case 'on_edge': return 'На грани';
      case 'not_recovered': return 'Не восстановлен';
      default: return '';
    }
  };
  
  const healthColor = getHealthColor();
  const recoveryColor = getRecoveryColor();
  
  // Радиус для полукруга
  const semicircleRadius = 80;
  const semicircleCircumference = Math.PI * semicircleRadius;
  
  return (
    <>
      <motion.div
        className="relative rounded-3xl p-6 overflow-hidden"
        style={cardStyle}
        initial={{ opacity: 0, y: 12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ delay: 0.05 }}
      >
        {/* ВЕРХНЯЯ ЧАСТЬ: Восстановление здоровья - полукруглый прогресс-бар (кликабельная) */}
        <div
          className="mb-6 pb-6 border-b cursor-pointer"
          style={{ 
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
          onClick={() => setShowRecoveryModal(true)}
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp size={18} style={{ color: recoveryColor }} />
              <div className="text-base font-bold text-foreground">Восстановление</div>
            </div>
            <div className="text-xs text-muted-foreground">
              {isLoading ? 'Загрузка...' : getRecoveryStatusText()}
            </div>
          </div>

        {/* Полукруглый прогресс-бар */}
        <div className="relative flex items-center justify-center" style={{ height: '100px' }}>
          <svg 
            className="absolute top-0" 
            width="200" 
            height="100" 
            viewBox="0 0 200 100"
            style={{ transform: 'scale(1)' }}
          >
            <defs>
              <linearGradient id="recoveryGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={recoveryColor} />
                <stop offset="100%" stopColor={recoveryColor} />
              </linearGradient>
            </defs>
            
            {/* Фоновый полукруг */}
            <path
              d={`M 20 100 A ${semicircleRadius} ${semicircleRadius} 0 0 1 180 100`}
              fill="none"
              stroke={isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.12)"}
              strokeWidth="12"
              strokeLinecap="round"
            />
            
            {/* Прогресс восстановления */}
            <motion.path
              d={`M 20 100 A ${semicircleRadius} ${semicircleRadius} 0 0 1 180 100`}
              fill="none"
              stroke="url(#recoveryGradient)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={`${recoveryProgress * semicircleCircumference} ${semicircleCircumference}`}
              initial={{ strokeDasharray: `0 ${semicircleCircumference}` }}
              animate={{ strokeDasharray: `${recoveryProgress * semicircleCircumference} ${semicircleCircumference}` }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          
          {/* Центральное значение восстановления */}
          <div className="relative z-10 flex flex-col items-center justify-center mt-8">
            <div 
              className="text-3xl font-bold"
              style={{ color: recoveryColor }}
            >
              {isLoading ? '—' : recoveryValue}
            </div>
            <div className="text-xs text-muted-foreground mt-1">из 100</div>
          </div>
        </div>
        </div>

        {/* НИЖНЯЯ ЧАСТЬ: Геймификация (кликабельная) */}
        <div
          className="cursor-pointer"
          onClick={() => setShowGamificationModal(true)}
        >
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-1">
              <Shield size={18} style={{ color: '#8b5cf6' }} />
              <div className="text-base font-bold text-foreground">Прогресс</div>
            </div>
            <div className="text-xs text-muted-foreground">Уровень и статы</div>
          </div>

        <div className="space-y-4">
          {/* Уровень */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield size={20} style={{ color: '#8b5cf6' }} />
              <div className="text-sm font-semibold text-foreground">Уровень</div>
            </div>
            <div className="text-2xl font-bold text-foreground">
              {isLoading ? '—' : level}
            </div>
          </div>

          {/* Здоровье */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart 
                  size={18} 
                  style={{ color: healthColor }}
                  fill={healthColor}
                />
                <div className="text-sm font-semibold text-foreground">Здоровье</div>
              </div>
              <div className="text-sm font-bold text-foreground">
                {isLoading ? '—' : `${Math.round(health)} / ${maxHealth}`}
              </div>
            </div>
            
            {/* Прогресс-бар здоровья */}
            <div 
              className="h-2.5 rounded-full overflow-hidden" 
              style={{ 
                background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' 
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  background: `linear-gradient(to right, ${healthColor}, ${healthColor}dd)` 
                }}
                initial={{ width: 0 }}
                animate={{ width: `${healthProgress * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* XP и прогресс до следующего уровня */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap 
                  size={18} 
                  style={{ color: '#f59e0b' }}
                  fill="#f59e0b"
                />
                <div className="text-sm font-semibold text-foreground">Опыт</div>
              </div>
              <div className="text-sm font-bold text-foreground">
                {isLoading ? '—' : (
                  <>
                    {xp.toLocaleString('ru-RU')} / {xpForNextLevel.toLocaleString('ru-RU')} XP
                  </>
                )}
              </div>
            </div>
            
            {/* Прогресс-бар XP */}
            <div 
              className="h-2.5 rounded-full overflow-hidden" 
              style={{ 
                background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' 
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  background: 'linear-gradient(to right, #f59e0b, #f97316)' 
                }}
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            
            {/* Процент прогресса */}
            <div className="text-xs text-muted-foreground text-right">
              {isLoading ? '—' : `${Math.round(xpProgress * 100)}% до уровня ${level + 1}`}
            </div>
          </div>
        </div>
        </div>
      </motion.div>

      {/* Модальное окно восстановления здоровья */}
      <AnimatePresence>
        {showRecoveryModal && (
          <RecoveryModal
            recovery={recovery}
            isLoading={isLoading}
            onClose={() => setShowRecoveryModal(false)}
            modalStyle={modalStyle}
            isDark={isDark}
            recoveryColor={recoveryColor}
          />
        )}
      </AnimatePresence>

      {/* Модальное окно геймификации */}
      <AnimatePresence>
        {showGamificationModal && (
          <GamificationModal
            level={level}
            health={health}
            maxHealth={maxHealth}
            xp={xp}
            xpForNextLevel={xpForNextLevel}
            healthProgress={healthProgress}
            xpProgress={xpProgress}
            isLoading={isLoading}
            onClose={() => setShowGamificationModal(false)}
            modalStyle={modalStyle}
            isDark={isDark}
            healthColor={healthColor}
            stats={stats}
          />
        )}
      </AnimatePresence>
    </>
  );
};

// Модальное окно восстановления
interface RecoveryModalProps {
  recovery?: RecoveryBreakdown;
  isLoading: boolean;
  onClose: () => void;
  modalStyle: React.CSSProperties;
  isDark: boolean;
  recoveryColor: string;
}

const RecoveryModal = ({ recovery, isLoading, onClose, modalStyle, isDark, recoveryColor }: RecoveryModalProps) => {
  const getStatusText = () => {
    if (!recovery) return 'Недостаточно данных';
    switch (recovery.status) {
      case 'recovered': return 'Восстановлен (80-100)';
      case 'normal': return 'Нормально (60-79)';
      case 'on_edge': return 'На грани (40-59)';
      case 'not_recovered': return 'Не восстановлен (<40)';
      default: return '';
    }
  };

  const getStatusColor = () => {
    if (!recovery) return '#8b5cf6';
    switch (recovery.status) {
      case 'recovered': return '#22c55e';
      case 'normal': return '#3b82f6';
      case 'on_edge': return '#f59e0b';
      case 'not_recovered': return '#ef4444';
      default: return '#8b5cf6';
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-0"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative rounded-t-[28px] w-full flex flex-col"
        style={{
          ...modalStyle,
          maxWidth: '100%',
          maxHeight: '90vh',
        }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок */}
        <div className="flex-shrink-0 flex items-center justify-between p-5 pb-3 border-b"
          style={{
            background: modalStyle.background,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <TrendingUp size={24} style={{ color: recoveryColor }} />
            <h3 className="text-xl font-bold text-foreground">Восстановление</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        {/* Контент - прокручиваемый */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
          {/* Итоговое значение */}
          <div className="text-center py-6">
            <div 
              className="text-6xl font-bold mb-2"
              style={{ color: getStatusColor() }}
            >
              {isLoading ? '—' : (recovery?.total ?? 0)}
            </div>
            <div className="text-sm text-muted-foreground mb-1">из 100</div>
            <div className="text-xs font-semibold" style={{ color: getStatusColor() }}>
              {getStatusText()}
            </div>
          </div>

          {/* Разбивка по факторам */}
          {recovery && (
            <div className="space-y-4">
              <div className="text-sm font-bold text-foreground mb-3">Разбивка по факторам:</div>
              
              {/* Сон */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Moon size={16} style={{ color: '#8b5cf6' }} />
                    <div className="text-sm font-medium text-foreground">Сон (0-100)</div>
                  </div>
                  <div className="text-sm font-bold text-foreground">{recovery.sleep}</div>
                </div>
                <div 
                  className="h-2 rounded-full overflow-hidden" 
                  style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
                >
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(to right, #8b5cf6, #673AB7)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${recovery.sleep}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>

              {/* Нагрузка вчера */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Dumbbell size={16} style={{ color: '#ef4444' }} />
                    <div className="text-sm font-medium text-foreground">Нагрузка вчера</div>
                  </div>
                  <div className="text-sm font-bold text-foreground" style={{ color: '#ef4444' }}>
                    -{recovery.workload}
                  </div>
                </div>
              </div>

              {/* Усталость (7 дней) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Battery size={16} style={{ color: '#ef4444' }} />
                    <div className="text-sm font-medium text-foreground">Усталость (7 дней)</div>
                  </div>
                  <div className="text-sm font-bold text-foreground" style={{ color: '#ef4444' }}>
                    -{recovery.fatigue}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Объяснение формулы */}
          <div className="p-4 rounded-xl mt-4"
            style={{ background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)' }}
          >
            <div className="text-xs text-muted-foreground leading-relaxed">
              <div className="font-semibold text-foreground mb-1">Как это работает?</div>
              Восстановление рассчитывается по формуле: <strong>Восстановление = Сон(0-100) - Нагрузка_вчера - Усталость_7дней</strong>. 
              Сон рассчитывается на основе длительности (плато оптимума 7:00-8:30 = 70 баллов), качества сна и субъективного восстановления. 
              Нагрузка и усталость вычитаются из сна. Итог ограничивается диапазоном 0-100.
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// Модальное окно геймификации
interface GamificationModalProps {
  level: number;
  health: number;
  maxHealth: number;
  xp: number;
  xpForNextLevel: number;
  healthProgress: number;
  xpProgress: number;
  isLoading: boolean;
  onClose: () => void;
  modalStyle: React.CSSProperties;
  isDark: boolean;
  healthColor: string;
  stats: GamificationStats;
}

const GamificationModal = ({
  level,
  health,
  maxHealth,
  xp,
  xpForNextLevel,
  healthProgress,
  xpProgress,
  isLoading,
  onClose,
  modalStyle,
  isDark,
  healthColor,
  stats,
}: GamificationModalProps) => {
  // Максимальные значения для прогресс-баров (можно настроить)
  const MAX_PHYSICAL_STAT = 1000; // Максимальное значение физического стата
  const MAX_PHYSIOLOGICAL_STAT = 100; // Максимальное значение физиологического стата

  // Физические статы с иконками и названиями
  const physicalStats = [
    { key: 'strength' as const, label: 'Сила', icon: Dumbbell, color: '#ef4444' },
    { key: 'endurance' as const, label: 'Выносливость', icon: GaugeCircle, color: '#3b82f6' },
    { key: 'flexibility' as const, label: 'Гибкость', icon: Waves, color: '#8b5cf6' },
    { key: 'agility' as const, label: 'Ловкость', icon: Wind, color: '#f59e0b' },
    { key: 'speed' as const, label: 'Скорость', icon: Zap, color: '#10b981' },
    { key: 'reflex' as const, label: 'Рефлекс', icon: Target, color: '#ec4899' },
  ];

  // Физиологические статы
  const physiologicalStats = [
    { key: 'hunger' as const, label: 'Голод', icon: AlertCircle, color: '#f59e0b' },
    { key: 'thirst' as const, label: 'Жажда', icon: Droplet, color: '#3b82f6' },
    { key: 'sleepiness' as const, label: 'Сонливость', icon: Moon, color: '#8b5cf6' },
    { key: 'energy' as const, label: 'Энергия', icon: Battery, color: '#10b981' },
  ];

  const getStatProgress = (value: number, max: number) => {
    return Math.min(value / max, 1);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-end justify-center p-0"
      style={{ background: 'rgba(0, 0, 0, 0.5)' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative rounded-t-[28px] w-full flex flex-col"
        style={{
          ...modalStyle,
          maxWidth: '100%',
          maxHeight: '90vh',
        }}
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 40, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Заголовок - фиксированный */}
        <div className="flex-shrink-0 flex items-center justify-between p-5 pb-3 border-b"
          style={{
            background: modalStyle.background,
            borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            <Shield size={24} style={{ color: '#8b5cf6' }} />
            <h3 className="text-xl font-bold text-foreground">Детали прогресса</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 transition-colors"
          >
            <X size={20} className="text-foreground" />
          </button>
        </div>

        {/* Контент - прокручиваемый */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6" style={{ paddingBottom: 'env(safe-area-inset-bottom, 20px)' }}>
          {/* Объяснение системы */}
          <div className="p-4 rounded-xl"
            style={{ background: isDark ? 'rgba(139, 92, 246, 0.15)' : 'rgba(139, 92, 246, 0.1)' }}
          >
            <div className="flex items-start gap-2 mb-2">
              <Info size={18} style={{ color: '#8b5cf6' }} className="mt-0.5" />
              <div className="flex-1">
                <div className="text-sm font-semibold text-foreground mb-1">Как это работает?</div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  Тренировки прокачивают физические статы и дают XP. Сон, питание и вода влияют на восстановление здоровья и эффективность тренировок. Чем выше уровень, тем больше максимальное здоровье.
                </div>
              </div>
            </div>
          </div>

          {/* Уровень и основные показатели */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-xl"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            >
              <div className="text-xs text-muted-foreground mb-1">Уровень</div>
              <div className="text-2xl font-bold text-foreground">
                {isLoading ? '—' : level}
              </div>
            </div>
            <div className="text-center p-3 rounded-xl"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            >
              <div className="text-xs text-muted-foreground mb-1">Здоровье</div>
              <div className="text-lg font-bold text-foreground">
                {isLoading ? '—' : `${Math.round(health)}/${maxHealth}`}
              </div>
            </div>
            <div className="text-center p-3 rounded-xl"
              style={{ background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }}
            >
              <div className="text-xs text-muted-foreground mb-1">XP</div>
              <div className="text-lg font-bold text-foreground">
                {isLoading ? '—' : xp.toLocaleString('ru-RU')}
              </div>
            </div>
          </div>

          {/* Физические статы */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Dumbbell size={18} style={{ color: '#8b5cf6' }} />
              <div className="text-base font-bold text-foreground">Физические статы</div>
            </div>
            {physicalStats.map((stat) => {
              const value = stats[stat.key];
              const progress = getStatProgress(value, MAX_PHYSICAL_STAT);
              const Icon = stat.icon;
              
              return (
                <div key={stat.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: stat.color }} />
                      <div className="text-sm font-medium text-foreground">{stat.label}</div>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {isLoading ? '—' : value.toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div 
                    className="h-2 rounded-full overflow-hidden" 
                    style={{ 
                      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                    }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ 
                        background: `linear-gradient(to right, ${stat.color}, ${stat.color}dd)` 
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Физиологические статы */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Activity size={18} style={{ color: '#8b5cf6' }} />
              <div className="text-base font-bold text-foreground">Физиологические статы</div>
            </div>
            {physiologicalStats.map((stat) => {
              const value = stats[stat.key];
              const progress = getStatProgress(value, MAX_PHYSIOLOGICAL_STAT);
              const Icon = stat.icon;
              
              return (
                <div key={stat.key} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon size={16} style={{ color: stat.color }} />
                      <div className="text-sm font-medium text-foreground">{stat.label}</div>
                    </div>
                    <div className="text-sm font-bold text-foreground">
                      {isLoading ? '—' : value.toLocaleString('ru-RU')}
                    </div>
                  </div>
                  <div 
                    className="h-2 rounded-full overflow-hidden" 
                    style={{ 
                      background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' 
                    }}
                  >
                    <motion.div
                      className="h-full rounded-full"
                      style={{ 
                        background: `linear-gradient(to right, ${stat.color}, ${stat.color}dd)` 
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress * 100}%` }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Прогресс XP */}
          <div className="space-y-3 pt-2 border-t"
            style={{ borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap size={18} style={{ color: '#f59e0b' }} fill="#f59e0b" />
                <div className="text-base font-semibold text-foreground">Прогресс до уровня {level + 1}</div>
              </div>
              <div className="text-sm font-bold text-foreground">
                {isLoading ? '—' : `${Math.round(xpProgress * 100)}%`}
              </div>
            </div>
            
            <div 
              className="h-3 rounded-full overflow-hidden" 
              style={{ 
                background: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)' 
              }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  background: 'linear-gradient(to right, #f59e0b, #f97316)' 
                }}
                initial={{ width: 0 }}
                animate={{ width: `${xpProgress * 100}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              />
            </div>
            
            <div className="text-xs text-muted-foreground text-center">
              {isLoading ? '—' : (
                <>
                  {xp.toLocaleString('ru-RU')} / {xpForNextLevel.toLocaleString('ru-RU')} XP
                </>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};
