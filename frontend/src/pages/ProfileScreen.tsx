import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Calendar, 
  Ruler, 
  Scale, 
  Target, 
  Activity,
  Sun,
  Moon,
  Monitor,
  TrendingUp,
  Camera,
  Edit
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { getTelegramUser } from '../api/telegram';
import { checkUser, saveProfile, saveGoal, saveActivityLevel, saveUserNameAndPhoto } from '../api/user';
import { Gender } from '../components/onboarding/GenderToggle';
import { GoalType, ActivityLevel } from '../types/onboarding';
import { recalculateAndSaveNutrition } from '../utils/nutritionRecalculator';
import { createGlassCardStyle } from '../utils/glassCardStyle';

type EditingField = 'name' | 'gender' | 'age' | 'height' | 'weight' | 'goal' | 'activityLevel' | null;

interface ProfileInfoBlockProps {
  icon: React.ReactNode;
  label: string;
  value: string | null | undefined;
  isEditing: boolean;
  onEdit: () => void;
  onBlur?: () => void;
  editComponent: React.ReactNode;
}

// Компактный inline InputField для редактирования в блоке
interface CompactInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  placeholder: string;
  type?: 'text' | 'number';
}

const CompactInput = ({ value, onChange, onBlur, placeholder, type = 'number' }: CompactInputProps) => {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      placeholder={placeholder}
      className="w-full bg-transparent text-[14px] font-semibold text-foreground placeholder:text-foreground/40 outline-none"
      style={{ fontSize: '16px' }}
      inputMode={type === 'number' ? 'numeric' : 'text'}
      autoCapitalize="off"
      autoCorrect="off"
      autoFocus
    />
  );
};

const ProfileInfoBlock = ({ 
  icon, 
  label, 
  value, 
  isEditing, 
  onEdit,
  onBlur,
  editComponent 
}: ProfileInfoBlockProps) => {
  const { isDark } = useTheme();
  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';
  const cardStyle = useMemo(() => createGlassCardStyle(isDark, accentColor), [isDark, accentColor]);

  return (
    <motion.div
      onClick={!isEditing ? onEdit : undefined}
      className="relative w-full rounded-[24px] overflow-hidden cursor-pointer"
      style={{
        ...cardStyle,
        borderWidth: isEditing ? '2px' : '1px',
        borderColor: isEditing ? accentColor : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'),
      }}
      whileTap={!isEditing ? { scale: 0.98 } : undefined}
    >
      
      {/* Контент */}
      <div className="relative z-10 flex items-center gap-3 px-4 py-3">
        {/* Иконка */}
        <div className="flex-shrink-0" style={{ color: accentColor }}>
          {icon}
        </div>
        
        {/* Текст или редактирование */}
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-foreground opacity-60 mb-0.5">
            {label}
          </p>
          {isEditing ? (
            <div
              onClick={(e) => e.stopPropagation()}
              onBlur={onBlur}
            >
              {editComponent}
            </div>
          ) : (
            <p className="text-[14px] font-semibold text-foreground truncate">
              {value || 'Нажмите для редактирования'}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
};

interface ThemeOptionProps {
  icon: React.ReactNode;
  label: string;
  value: 'light' | 'dark' | 'system';
  currentTheme: 'light' | 'dark' | 'system';
  onSelect: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeOption = ({ icon, label, value, currentTheme, onSelect }: ThemeOptionProps) => {
  const { isDark } = useTheme();
  const isSelected = currentTheme === value;
  
  // Фиксированные цвета для каждой темы (не зависят от текущей темы)
  const getCardStyle = () => {
    if (value === 'system') {
      if (isSelected) {
        // Когда системная тема выбрана - фон зависит от текущей системной темы устройства
        if (isDark) {
          // Темная тема системы - темный фон с фиолетовым градиентом
          const darkAccentColor = '#8B5CF6';
          return createGlassCardStyle(true, darkAccentColor);
        } else {
          // Светлая тема системы - светлый фон с оранжевым градиентом
          const lightAccentColor = '#FF6B35';
          return createGlassCardStyle(false, lightAccentColor);
        }
      } else {
        // Когда системная тема не выбрана - нейтральный серый стиль
        const neutralSurface = isDark 
          ? 'linear-gradient(180deg, rgba(60,60,70,0.98) 0%, rgba(50,50,60,0.99) 100%)'
          : 'linear-gradient(180deg, rgba(200,200,210,0.98) 0%, rgba(180,180,190,0.99) 100%)';
        const neutralBlob = isDark 
          ? 'rgba(120,120,140,0.25)' // Нейтральный серо-синий для темной темы
          : 'rgba(140,140,160,0.2)'; // Нейтральный серый для светлой темы
        
        return {
          position: 'relative' as const,
          overflow: 'hidden' as const,
          background: `
            radial-gradient(80% 90% at 105% 35%, ${neutralBlob} 0%, transparent 60%),
            radial-gradient(90% 90% at 110% 82%, ${neutralBlob} 0%, transparent 65%),
            ${neutralSurface}
          `,
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
          boxShadow: `
            0 12px 24px -8px rgba(0,0,0,0.12),
            inset -6px 1px 10px ${neutralBlob},
            inset 0 1px 0 rgba(255,255,255,0.06)
          `,
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
        };
      }
    } else if (value === 'light') {
      // Светлая тема - всегда светлый фон с оранжевым градиентом
      const lightAccentColor = '#FF6B35';
      return createGlassCardStyle(false, lightAccentColor);
    } else {
      // Темная тема - всегда темный фон с фиолетовым градиентом
      const darkAccentColor = '#8B5CF6';
      return createGlassCardStyle(true, darkAccentColor);
    }
  };

  const cardStyle = useMemo(() => {
    const style = getCardStyle();
    // Для системной темы border обрабатывается отдельно (двухцветный при выборе)
    if (value === 'system') {
      return {
        ...style,
        borderWidth: isSelected ? '2px' : '1px',
        borderColor: isSelected ? 'transparent' : style.borderColor, // Прозрачный, рисуем вручную
      };
    }
    return {
      ...style,
      borderWidth: isSelected ? '2px' : '1px',
      borderColor: isSelected 
        ? (value === 'light' ? '#FF6B35' : value === 'dark' ? '#8B5CF6' : '#8B5CF6')
        : (value === 'light' ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.18)'),
    };
  }, [isSelected, value, isDark]);

  // Цвет иконки и текста
  const getIconColor = () => {
    if (isSelected) {
      return value === 'light' ? '#FF6B35' : value === 'dark' ? '#8B5CF6' : undefined; // Для системной темы - двухцветная
    }
    if (value === 'light') return '#000000';
    if (value === 'dark') return '#ffffff';
    // Для системной темы - нейтральный серый цвет
    return isDark ? 'rgba(200,200,210,0.8)' : 'rgba(100,100,120,0.8)';
  };

  const iconColor = getIconColor();

  return (
    <motion.button
      onClick={() => onSelect(value)}
      className="flex-1 flex flex-col items-center gap-2 px-4 py-3 rounded-[20px] relative overflow-hidden"
      style={cardStyle}
      whileTap={{ scale: 0.95 }}
    >
      {/* Иконка */}
      {value === 'system' && isSelected ? (
        // Для системной темы при выборе - двухцветная иконка (оранжевая/фиолетовая), разделенная пополам
        <div className="relative flex justify-center items-center" style={{ width: '20px', height: '20px' }}>
          {/* Оранжевая часть (левая половина) */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              color: '#FF6B35',
              WebkitClipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
            }}
          >
            {icon}
          </div>
          {/* Фиолетовая часть (правая половина) */}
          <div 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              color: '#8B5CF6',
              WebkitClipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
            }}
          >
            {icon}
          </div>
          {/* Невидимая основа для правильного размера */}
          <div style={{ opacity: 0, pointerEvents: 'none' }}>
            {icon}
          </div>
        </div>
      ) : (
        <div style={{ color: iconColor }}>
          {icon}
        </div>
      )}
      
      {/* Текст */}
      {value === 'system' && isSelected ? (
        // Для системной темы при выборе - двухцветный текст (оранжевая/фиолетовая), разделенный пополам
        <span className="relative text-[12px] font-medium inline-block text-center" style={{ width: '100%', height: '14px', lineHeight: '14px' }}>
          {/* Оранжевая часть текста (левая половина) */}
          <span 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              color: '#FF6B35',
              WebkitClipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
            }}
          >
            {label}
          </span>
          {/* Фиолетовая часть текста (правая половина) */}
          <span 
            className="absolute inset-0 flex items-center justify-center"
            style={{
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              color: '#8B5CF6',
              WebkitClipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
            }}
          >
            {label}
          </span>
          {/* Невидимая основа */}
          <span style={{ opacity: 0, pointerEvents: 'none' }}>{label}</span>
        </span>
      ) : (
        <span 
          className="text-[12px] font-medium"
          style={{ color: iconColor }}
        >
          {label}
        </span>
      )}
      
      {/* Двухцветная обводка для системной темы при выборе */}
      {value === 'system' && isSelected && (
        <>
          {/* Оранжевая часть обводки (левая половина) */}
          <div 
            className="absolute inset-0 rounded-[20px]"
            style={{
              clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
              border: '2px solid #FF6B35',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          {/* Фиолетовая часть обводки (правая половина) */}
          <div 
            className="absolute inset-0 rounded-[20px]"
            style={{
              clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
              border: '2px solid #8B5CF6',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
        </>
      )}
    </motion.button>
  );
};

export const ProfileScreen = () => {
  const { theme, setTheme, isDark } = useTheme();
  const [isLoading, setIsLoading] = useState(true);
  const [editingField, setEditingField] = useState<EditingField>(null);
  
  // Данные пользователя
  const [userId, setUserId] = useState<number | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  
  // Профиль
  const [gender, setGender] = useState<Gender | null>(null);
  const [height, setHeight] = useState<string>('');
  const [weight, setWeight] = useState<string>('');
  const [age, setAge] = useState<string>('');
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [activityLevel, setActivityLevel] = useState<ActivityLevel | null>(null);

  // Временные значения для редактирования
  const [tempName, setTempName] = useState<string>('');
  
  const [tempGender, setTempGender] = useState<Gender | null>(null);
  const [tempHeight, setTempHeight] = useState<string>('');
  const [tempWeight, setTempWeight] = useState<string>('');
  const [tempAge, setTempAge] = useState<string>('');
  const [tempGoal, setTempGoal] = useState<GoalType | null>(null);
  const [tempActivityLevel, setTempActivityLevel] = useState<ActivityLevel | null>(null);

  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';

  // Загрузка данных пользователя
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const telegramUser = getTelegramUser();
        if (!telegramUser) {
          console.error('Telegram user not found');
          setIsLoading(false);
          return;
        }

        // Загружаем данные из базы
        const response = await checkUser({
          id: telegramUser.id,
          first_name: telegramUser.first_name,
          last_name: telegramUser.last_name,
          username: telegramUser.username,
        });

        if (response.success && response.user) {
          setUserId(response.user.id);
          
          // Имя и фото из базы (приоритет) или из Telegram
          const dbFirstName = response.user.firstName || telegramUser.first_name;
          const dbPhotoUrl = response.user.photoUrl || telegramUser.photo_url || null;
          
          setUserName(dbFirstName);
          setUserPhoto(dbPhotoUrl);
          
          // Инициализируем временные значения
          setTempName(dbFirstName);
          
          const onboarding = response.user.onboarding;

          if (onboarding) {
            setGender(onboarding.gender as Gender | null);
            setHeight(onboarding.height?.toString() || '');
            setWeight(onboarding.weight?.toString() || '');
            setAge(onboarding.age?.toString() || '');
            setGoal(onboarding.goal as GoalType | null);
            setActivityLevel(onboarding.activityLevel as ActivityLevel | null);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserData();
  }, []);

  // Начало редактирования поля
  const handleStartEdit = (field: EditingField) => {
    setEditingField(field);
    // Инициализируем временные значения
    switch (field) {
      case 'name':
        setTempName(userName);
        break;
      case 'gender':
        setTempGender(gender);
        break;
      case 'age':
        setTempAge(age ? age.toString() : '');
        break;
      case 'height':
        setTempHeight(height ? height.toString() : '');
        break;
      case 'weight':
        setTempWeight(weight ? weight.toString() : '');
        break;
      case 'goal':
        setTempGoal(goal);
        break;
      case 'activityLevel':
        setTempActivityLevel(activityLevel);
        break;
    }
  };

  // Сохранение поля при потере фокуса
  const handleBlurField = async (field: EditingField) => {
    if (!userId || !field) return;

    try {
      let profileChanged = false;

      switch (field) {
        case 'name':
          if (tempName !== userName) {
            await saveUserNameAndPhoto(userId, {
              firstName: tempName || null,
              lastName: null,
            });
            setUserName(tempName);
          }
          break;
        case 'age':
          if (tempAge !== (age ? age.toString() : '')) {
            const newAge = tempAge ? parseInt(tempAge) : null;
            await saveProfile(userId, { age: newAge });
            setAge(tempAge);
            profileChanged = true;
          }
          break;
        case 'height':
          if (tempHeight !== (height ? height.toString() : '')) {
            const newHeight = tempHeight ? parseInt(tempHeight) : null;
            await saveProfile(userId, { height: newHeight });
            setHeight(tempHeight);
            profileChanged = true;
          }
          break;
        case 'weight':
          if (tempWeight !== (weight ? weight.toString() : '')) {
            const newWeight = tempWeight ? parseFloat(tempWeight) : null;
            await saveProfile(userId, { weight: newWeight });
            setWeight(tempWeight);
            profileChanged = true;
          }
          break;
      }

      // Пересчитываем питание, если изменились параметры
      if (profileChanged && (field === 'age' || field === 'height' || field === 'weight')) {
        await recalculateAndSaveNutrition(userId);
      }

      setEditingField(null);
    } catch (error) {
      console.error(`Error saving ${field}:`, error);
    }
  };

  // Автосохранение для пола, цели и активности (при выборе)
  const handleGenderChange = async (newGender: Gender) => {
    if (userId) {
      try {
        await saveProfile(userId, { gender: newGender });
        setGender(newGender);
        setTempGender(newGender);
        await recalculateAndSaveNutrition(userId);
        setEditingField(null);
      } catch (error) {
        console.error('Error saving gender:', error);
      }
    }
  };

  const handleGoalChange = async (newGoal: GoalType) => {
    setTempGoal(newGoal);
    if (userId) {
      try {
        await saveGoal(userId, newGoal);
        setGoal(newGoal);
        await recalculateAndSaveNutrition(userId);
        setEditingField(null);
      } catch (error) {
        console.error('Error saving goal:', error);
      }
    }
  };

  const handleActivityLevelChange = async (newLevel: ActivityLevel) => {
    setTempActivityLevel(newLevel);
    if (userId) {
      try {
        await saveActivityLevel(userId, newLevel);
        setActivityLevel(newLevel);
        await recalculateAndSaveNutrition(userId);
        setEditingField(null);
      } catch (error) {
        console.error('Error saving activity level:', error);
      }
    }
  };

  // Форматирование значений для отображения
  const formatGoal = (goalType: GoalType | null): string => {
    if (!goalType) return 'Не указано';
    switch (goalType) {
      case GoalType.LOSE_WEIGHT:
        return 'Похудение';
      case GoalType.MAINTAIN:
        return 'Поддержание';
      case GoalType.GAIN_MUSCLE:
        return 'Набор массы';
      default:
        return 'Не указано';
    }
  };

  const formatActivityLevel = (level: ActivityLevel | null): string => {
    if (!level) return 'Не указано';
    switch (level) {
      case ActivityLevel.RARELY:
        return 'Редко';
      case ActivityLevel.SOMETIMES:
        return 'Иногда';
      case ActivityLevel.OFTEN:
        return 'Часто';
      case ActivityLevel.CONSTANT:
        return 'Постоянно';
      case ActivityLevel.INTENSIVE:
        return 'Интенсивно';
      default:
        return 'Не указано';
    }
  };

  const formatGender = (g: Gender | null): string => {
    if (!g) return 'Не указано';
    return g === Gender.MALE ? 'Мужской' : 'Женский';
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto px-6 py-6 pb-8 space-y-4">
        <div className={`h-6 w-28 rounded-lg animate-pulse ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <div className={`h-24 rounded-3xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <div className={`h-20 rounded-3xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
        <div className={`h-20 rounded-3xl animate-pulse ${isDark ? 'bg-white/10' : 'bg-black/10'}`} />
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto px-6 py-6 pb-8">
      {/* Заголовок */}
      <div className="mb-6">
        <h1 className="text-[28px] font-bold text-foreground"></h1>
      </div>

      {/* Аватар и имя */}
      <div className="flex flex-col items-center mb-8">
        {/* Скрытый input для загрузки фото */}
        <input
          type="file"
          accept="image/*"
          className="hidden"
          id="photo-upload"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (file && userId) {
              try {
                const reader = new FileReader();
                reader.onloadend = async () => {
                  try {
                    const photoUrl = reader.result as string;
                    console.log('Photo loaded, saving to DB...', { userId, photoUrlLength: photoUrl.length });
                    await saveUserNameAndPhoto(userId, { photoUrl });
                    console.log('Photo saved successfully, updating state...');
                    setUserPhoto(photoUrl);
                    console.log('Photo state updated');
                  } catch (error) {
                    console.error('Error saving photo:', error);
                  }
                };
                reader.onerror = (error) => {
                  console.error('Error reading file:', error);
                };
                reader.readAsDataURL(file);
              } catch (error) {
                console.error('Error uploading photo:', error);
              }
            }
            e.target.value = '';
          }}
        />
        
        <motion.label
          key={userPhoto ? `photo-${userPhoto.substring(0, 50)}` : 'no-photo'}
          htmlFor="photo-upload"
          className="w-24 h-24 rounded-full flex items-center justify-center mb-3 cursor-pointer relative overflow-hidden"
          style={{
            ...(userPhoto
              ? {
                  backgroundImage: `url(${userPhoto})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {
                  background: `linear-gradient(135deg, ${accentColor}, ${isDark ? '#A78BFA' : '#FF8A65'})`,
                }),
          }}
          whileTap={{ scale: 0.95 }}
        >
          {!userPhoto && (
            <User size={40} className="relative z-10" style={{ color: isDark ? '#ffffff' : '#374151' }} />
          )}
          <div className={`absolute inset-0 rounded-full flex items-center justify-center transition-colors z-20 ${isDark ? 'bg-black/0 hover:bg-black/30' : 'bg-white/0 hover:bg-white/50'}`}>
            <Camera size={24} className="opacity-0 hover:opacity-100 transition-opacity" style={{ color: isDark ? '#ffffff' : '#374151' }} />
          </div>
        </motion.label>
        
        {/* Редактирование имени */}
        {editingField === 'name' ? (
          <div className="flex items-center gap-2 mt-2 justify-center">
            <div className="relative rounded-[30px] overflow-hidden" style={{ maxWidth: '200px' }}>
              <div
                className="relative rounded-[30px] overflow-hidden"
                style={{
                  ...createGlassCardStyle(isDark, accentColor),
                  borderWidth: '1px',
                  borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
                }}
              >
                <div className="relative z-10 flex items-center gap-2 px-3 py-2">
                  <User size={18} style={{ color: accentColor }} />
                  <input
                    type="text"
                    value={tempName}
                    onChange={(e) => setTempName(e.target.value)}
                    onBlur={() => handleBlurField('name')}
                    placeholder="Имя"
                    className="flex-1 bg-transparent font-medium text-foreground placeholder:text-foreground/40 outline-none min-w-0"
                    style={{ fontSize: '16px' }}
                    autoFocus
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 mt-2">
            <motion.h2
              onClick={() => handleStartEdit('name')}
              className="text-[22px] font-semibold text-foreground cursor-pointer"
              whileTap={{ scale: 0.95 }}
            >
              {userName}
            </motion.h2>
            <motion.button
              onClick={() => handleStartEdit('name')}
              className="p-1 rounded-full"
              style={{
                backgroundColor: `${accentColor}14`,
              }}
              whileTap={{ scale: 0.9 }}
            >
              <Edit size={16} style={{ color: accentColor }} />
            </motion.button>
          </div>
        )}
      </div>

      {/* Информационные блоки */}
      <div className="space-y-4 mb-6">
        {/* Пол */}
        <ProfileInfoBlock
          icon={<User size={20} />}
          label="Пол"
          value={formatGender(gender)}
          isEditing={editingField === 'gender'}
          onEdit={() => handleStartEdit('gender')}
          editComponent={
            <div className="flex flex-col gap-1.5">
              {[
                { type: Gender.MALE, label: 'Мужской' },
                { type: Gender.FEMALE, label: 'Женский' },
              ].map((option) => (
                <motion.button
                  key={option.type}
                  onClick={() => handleGenderChange(option.type)}
                  className="px-3 py-1.5 rounded-[16px] text-left"
                  style={{
                    backgroundColor: tempGender === option.type ? `${accentColor}14` : 'transparent',
                    borderWidth: '1px',
                    borderColor: tempGender === option.type ? accentColor : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'),
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      color: tempGender === option.type ? accentColor : 'var(--foreground)',
                    }}
                  >
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          }
        />

        {/* Возраст и Рост в 2 столбца */}
        <div className="grid grid-cols-2 gap-3">
          {/* Возраст */}
          <ProfileInfoBlock
            icon={<Calendar size={20} />}
            label="Возраст"
            value={age ? `${age} лет` : null}
            isEditing={editingField === 'age'}
            onEdit={() => handleStartEdit('age')}
            onBlur={() => handleBlurField('age')}
            editComponent={
              <CompactInput
                value={tempAge}
                onChange={setTempAge}
                onBlur={() => handleBlurField('age')}
                placeholder="Возраст"
              />
            }
          />

          {/* Рост */}
          <ProfileInfoBlock
            icon={<Ruler size={20} />}
            label="Рост"
            value={height ? `${height} см` : null}
            isEditing={editingField === 'height'}
            onEdit={() => handleStartEdit('height')}
            onBlur={() => handleBlurField('height')}
            editComponent={
              <CompactInput
                value={tempHeight}
                onChange={setTempHeight}
                onBlur={() => handleBlurField('height')}
                placeholder="Рост"
              />
            }
          />
        </div>

        {/* Вес */}
        <ProfileInfoBlock
          icon={<Scale size={20} />}
          label="Вес"
          value={weight ? `${weight} кг` : null}
          isEditing={editingField === 'weight'}
          onEdit={() => handleStartEdit('weight')}
          onBlur={() => handleBlurField('weight')}
          editComponent={
            <CompactInput
              value={tempWeight}
              onChange={setTempWeight}
              onBlur={() => handleBlurField('weight')}
              placeholder="Вес"
            />
          }
        />

        {/* Цель */}
        <ProfileInfoBlock
          icon={<Target size={20} />}
          label="Цель"
          value={formatGoal(goal)}
          isEditing={editingField === 'goal'}
          onEdit={() => handleStartEdit('goal')}
          editComponent={
            <div className="flex flex-col gap-1.5">
              {[
                { type: GoalType.LOSE_WEIGHT, label: 'Похудение' },
                { type: GoalType.MAINTAIN, label: 'Поддержание' },
                { type: GoalType.GAIN_MUSCLE, label: 'Набор массы' },
              ].map((option) => (
                <motion.button
                  key={option.type}
                  onClick={() => handleGoalChange(option.type)}
                  className="px-3 py-1.5 rounded-[16px] text-left"
                  style={{
                    backgroundColor: tempGoal === option.type ? `${accentColor}14` : 'transparent',
                    borderWidth: '1px',
                    borderColor: tempGoal === option.type ? accentColor : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'),
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      color: tempGoal === option.type ? accentColor : 'var(--foreground)',
                    }}
                  >
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          }
        />

        {/* Уровень активности */}
        <ProfileInfoBlock
          icon={<Activity size={20} />}
          label="Уровень активности"
          value={formatActivityLevel(activityLevel)}
          isEditing={editingField === 'activityLevel'}
          onEdit={() => handleStartEdit('activityLevel')}
          editComponent={
            <div className="flex flex-col gap-1.5">
              {[
                { type: ActivityLevel.RARELY, label: 'Редко' },
                { type: ActivityLevel.SOMETIMES, label: 'Иногда' },
                { type: ActivityLevel.OFTEN, label: 'Часто' },
                { type: ActivityLevel.CONSTANT, label: 'Постоянно' },
                { type: ActivityLevel.INTENSIVE, label: 'Интенсивно' },
              ].map((option) => (
                <motion.button
                  key={option.type}
                  onClick={() => handleActivityLevelChange(option.type)}
                  className="px-3 py-1.5 rounded-[16px] text-left"
                  style={{
                    backgroundColor: tempActivityLevel === option.type ? `${accentColor}14` : 'transparent',
                    borderWidth: '1px',
                    borderColor: tempActivityLevel === option.type ? accentColor : (isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)'),
                  }}
                  whileTap={{ scale: 0.95 }}
                >
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      color: tempActivityLevel === option.type ? accentColor : 'var(--foreground)',
                    }}
                  >
                    {option.label}
                  </span>
                </motion.button>
              ))}
            </div>
          }
        />
      </div>

      {/* Выбор темы */}
      <div className="mb-6">
        <h3 className="text-[16px] font-semibold text-foreground mb-3">Тема оформления</h3>
        <div className="flex gap-3">
          <ThemeOption
            icon={<Sun size={20} />}
            label="Светлая"
            value="light"
            currentTheme={theme}
            onSelect={setTheme}
          />
          <ThemeOption
            icon={<Moon size={20} />}
            label="Темная"
            value="dark"
            currentTheme={theme}
            onSelect={setTheme}
          />
          <ThemeOption
            icon={<Monitor size={20} />}
            label="Системная"
            value="system"
            currentTheme={theme}
            onSelect={setTheme}
          />
        </div>
      </div>

      {/* Дополнительная информация */}
      <div className="space-y-4">
        {/* Статистика */}
        <div
          className="relative w-full rounded-[30px] overflow-hidden p-5"
          style={{
            ...createGlassCardStyle(isDark, accentColor),
            borderWidth: '1px',
            borderColor: isDark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.12)',
          }}
        >
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-3">
              <TrendingUp size={20} style={{ color: accentColor }} />
              <h3 className="text-[16px] font-semibold text-foreground">Статистика</h3>
            </div>
            <p className="text-[14px] text-foreground opacity-75">
              Здесь будет отображаться статистика использования приложения
            </p>
          </div>
        </div>

        {/* Дополнительные возможности */}
        <div className="text-center">
          <p className="text-[12px] text-foreground opacity-60">
            Дополнительные возможности появятся в следующих версиях:
          </p>
          <ul className="text-[12px] text-foreground opacity-60 mt-2 space-y-1">
            <li>• Единицы измерения (кг/фунты, см/дюймы)</li>
            <li>• Экспорт данных</li>
            <li>• Настройки уведомлений</li>
            <li>• Язык интерфейса</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
