/**
 * Экран чата с AI
 */

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Image as ImageIcon, ChevronLeft } from 'lucide-react';
import { useChat } from '../hooks/useChat';
import { MessageBubble } from '../components/chat/MessageBubble';
import { useTheme } from '../hooks/useTheme';
import { SaveDateBanner } from '../components/SaveDateBanner';

interface ChatScreenProps {
  onClose: () => void;
  selectedDate?: string; // YYYY-MM-DD
  onGoToday?: () => void;
}

export const ChatScreen = ({ onClose, selectedDate, onGoToday }: ChatScreenProps) => {
  const { isDark } = useTheme();
  const {
    messages,
    inputText,
    setInputText,
    isLoading,
    errorMessage,
    sendMessage,
    analyzePhoto,
  } = useChat();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Состояние для свайпа
  const [swipeProgress, setSwipeProgress] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [isAtBottom, setIsAtBottom] = useState(true);

  const updateIsAtBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 140;
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    setIsAtBottom(distance < threshold);
  }, []);

  const scrollToBottom = useCallback((behavior: ScrollBehavior) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
  }, []);

  // На открытии: принудительно вниз (без "smooth", чтобы не выглядело как дерганье)
  useLayoutEffect(() => {
    requestAnimationFrame(() => scrollToBottom('auto'));
  }, [scrollToBottom]);

  // Новые сообщения / загрузка: докручиваем, если пользователь уже внизу
  useEffect(() => {
    if (!isAtBottom) return;
    requestAnimationFrame(() => scrollToBottom('smooth'));
  }, [messages.length, isLoading, isAtBottom, scrollToBottom]);

  // Если контент меняет высоту (например, раскрылась карточка КБЖУ) — держим низ
  useEffect(() => {
    const target = contentRef.current;
    if (!target || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => {
      if (!isAtBottom) return;
      requestAnimationFrame(() => scrollToBottom('auto'));
    });
    ro.observe(target);
    return () => ro.disconnect();
  }, [isAtBottom, scrollToBottom]);

  // iOS клавиатура меняет viewport → удерживаем низ
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const onResize = () => {
      if (!isAtBottom) return;
      requestAnimationFrame(() => scrollToBottom('auto'));
    };
    vv.addEventListener('resize', onResize);
    return () => vv.removeEventListener('resize', onResize);
  }, [isAtBottom, scrollToBottom]);

  // Фокус на поле ввода при открытии
  useEffect(() => {
    inputRef.current?.focus();
    requestAnimationFrame(() => scrollToBottom('auto'));
  }, []);

  // Обработка события analyzePhoto из MainScreen
  useEffect(() => {
    const handleAnalyzePhoto = (event: CustomEvent) => {
      const file = event.detail?.file;
      if (file) {
        analyzePhoto(file);
      }
    };

    window.addEventListener('analyzePhoto', handleAnalyzePhoto as EventListener);
    return () => {
      window.removeEventListener('analyzePhoto', handleAnalyzePhoto as EventListener);
    };
  }, [analyzePhoto]);

  // Обработчики свайпа
  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    // Проверяем, что свайп начинается от левого края (первые 20px)
    if (touch.clientX <= 20) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      setIsSwiping(false); // Начинаем без анимации
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartRef.current.x;
    const deltaY = Math.abs(touch.clientY - touchStartRef.current.y);
    
    // Проверяем, что свайп горизонтальный (больше чем вертикальный) и вправо
    // Увеличиваем минимальный порог (50px) перед началом движения
    if (Math.abs(deltaX) > deltaY && deltaX > 50) {
      e.preventDefault(); // Предотвращаем скролл
      setIsSwiping(true);
      
      // Более плавная формула: вычитаем порог и используем большее расстояние для полного прогресса
      const adjustedDeltaX = deltaX - 50; // Вычитаем порог
      const maxDistance = 400; // Увеличиваем расстояние для полного прогресса до 400px
      const rawProgress = Math.min(adjustedDeltaX / maxDistance, 1);
      
      // Применяем более сильное замедление для плавности
      // Используем кубическую функцию для еще более медленного начала
      const easedProgress = rawProgress * rawProgress * rawProgress * (rawProgress * (rawProgress * 6 - 15) + 10); // Smootherstep
      
      setSwipeProgress(easedProgress);
    } else if (deltaX < 0 || deltaX < 50) {
      // Если свайп влево или не достиг порога - сбрасываем
      setSwipeProgress(0);
      setIsSwiping(false);
      if (deltaX < 0) {
        touchStartRef.current = null;
      }
    }
  };

  const handleTouchEnd = () => {
    if (swipeProgress > 0.4) {
      // Если свайп больше 40% - закрываем чат
      onClose();
    } else {
      // Иначе возвращаем на место с плавной анимацией
      setSwipeProgress(0);
    }
    setIsSwiping(false);
    touchStartRef.current = null;
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const accentColor = isDark ? '#8B5CF6' : '#FF6B35';

  return (
    <motion.div
      ref={containerRef}
      className="fixed inset-0 z-20 bg-background relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        transform: `translateX(${swipeProgress * 60}%)`, // Уменьшаем множитель с 100% до 60% для менее резкого движения
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
        <ChevronLeft 
          size={24} 
          className="text-foreground"
        />
      </motion.div>

      {/* Заголовок */}
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
          <h2 className="text-lg font-semibold text-foreground">AI Ассистент</h2>
          <p className="text-xs text-muted-foreground">Питание и здоровье</p>
        </div>
        
        <div className="flex-1" />
      </div>

      {/* Плашка "Запись в ..." поверх чата (не сдвигает поле ввода) */}
      {onGoToday && (
        <div
          className="absolute left-0 right-0 z-20 pointer-events-auto"
          style={{
            // header: paddingTop 45 + safe-area + py-4 (~32px) + контент
            // Ставим чуть ниже хедера, чтобы не перекрывать заголовок
            top: `calc(45px + env(safe-area-inset-top) + 52px)`,
          }}
        >
          <SaveDateBanner selectedDateISO={selectedDate} onGoToday={onGoToday} />
        </div>
      )}

      {/* Список сообщений */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-5 py-4" 
        style={{ height: 'calc(100vh - 200px)' }}
        onScroll={updateIsAtBottom}
        onClick={() => {
          // Сворачиваем клавиатуру при клике на область сообщений
          inputRef.current?.blur();
        }}
      >
        <div ref={contentRef} className="space-y-4">
          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} selectedDate={selectedDate} />
          ))}
          
          {isLoading && (
            <div className="flex items-center gap-2 py-2">
              <div className="w-2 h-2 rounded-full bg-foreground opacity-60 animate-pulse" />
              <div className="w-2 h-2 rounded-full bg-foreground opacity-60 animate-pulse" style={{ animationDelay: '0.2s' }} />
              <div className="w-2 h-2 rounded-full bg-foreground opacity-60 animate-pulse" style={{ animationDelay: '0.4s' }} />
              <span className="text-sm text-muted-foreground ml-2">AI думает...</span>
            </div>
          )}
          
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
              <span className="text-sm text-red-500">{errorMessage}</span>
            </div>
          )}
        </div>
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <div
        className="px-5 py-4"
        style={{
          paddingTop: '20px',
          paddingBottom: `calc(20px + env(safe-area-inset-bottom))`,
          background: isDark ? 'rgba(44, 44, 44, 0.95)' : 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <div className="flex items-center gap-3">
          {/* Скрытый input для загрузки фото */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                analyzePhoto(file);
              }
              // Сбрасываем значение, чтобы можно было выбрать тот же файл снова
              e.target.value = '';
            }}
          />

          {/* Кнопка загрузки фото */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            aria-label="Загрузить фото"
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.6 : 1 }}
          >
            <ImageIcon size={20} style={{ color: accentColor }} />
          </button>

          {/* Поле ввода */}
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Введите текст сообщения..."
            disabled={isLoading}
            className="flex-1 px-4 py-3 rounded-full bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent"
            style={{
              fontSize: '16px', // Предотвращает зум на iOS
            }}
          />

          {/* Кнопка отправки */}
          <button
            onClick={sendMessage}
            disabled={!inputText.trim() || isLoading}
            className="p-3 rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: (!inputText.trim() || isLoading) ? 'rgba(255, 255, 255, 0.1)' : accentColor,
            }}
            aria-label="Отправить сообщение"
          >
            <Send size={18} className="text-white" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

