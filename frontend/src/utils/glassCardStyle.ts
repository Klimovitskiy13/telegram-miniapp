/**
 * Единая система стилей для glassmorphism карточек
 */

import { CSSProperties } from 'react';

/**
 * Создает единый стиль glassmorphism карточки
 * Улучшенная версия с лучшей контрастностью для светлой темы
 */
export const createGlassCardStyle = (isDark: boolean, accentColor: string): CSSProperties => {
  // Поверхность карточки - более непрозрачная для лучшей читаемости
  const surface = isDark
    ? 'linear-gradient(180deg, rgba(18,18,22,0.98) 0%, rgba(12,12,16,0.99) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(250,250,252,0.98) 100%)';
  
  // Акцентные градиенты - более насыщенные для светлой темы
  const blob = isDark ? `${accentColor}40` : `${accentColor}25`;
  const blobSoft = isDark ? `${accentColor}22` : `${accentColor}15`;
  
  // Тени - более контрастные для светлой темы
  const dropShadow = isDark 
    ? 'rgba(0,0,0,0.15)' 
    : 'rgba(0,0,0,0.12)';
  
  // Границы - более заметные для светлой темы
  const borderGlow = isDark 
    ? 'rgba(255,255,255,0.18)' 
    : 'rgba(0,0,0,0.12)';
  
  // Внутренние тени для светлой темы
  const innerShadow = isDark
    ? 'inset 0 1px 0 rgba(255,255,255,0.08)'
    : 'inset 0 1px 0 rgba(255,255,255,0.8)';

  return {
    position: 'relative',
    overflow: 'hidden',
    background: `
      radial-gradient(80% 90% at 105% 35%, ${blob} 0%, transparent 60%),
      radial-gradient(90% 90% at 110% 82%, ${blobSoft} 0%, transparent 65%),
      ${surface}
    `,
    border: `1px solid ${borderGlow}`,
    boxShadow: `
      0 16px 28px -12px ${dropShadow},
      inset -8px 1px 13px ${blob},
      ${innerShadow}
    `,
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
  };
};

/**
 * Стиль для модальных окон
 */
export const createModalCardStyle = (isDark: boolean, accentColor: string): CSSProperties => {
  const surface = isDark
    ? 'linear-gradient(180deg, rgba(18,18,22,0.99) 0%, rgba(12,12,16,0.995) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.98) 0%, rgba(250,250,252,0.99) 100%)';
  
  const blob = isDark ? `${accentColor}35` : `${accentColor}20`;
  const blobSoft = isDark ? `${accentColor}20` : `${accentColor}12`;
  
  const dropShadow = isDark 
    ? 'rgba(0,0,0,0.2)' 
    : 'rgba(0,0,0,0.15)';
  
  const borderGlow = isDark 
    ? 'rgba(255,255,255,0.2)' 
    : 'rgba(0,0,0,0.15)';
  
  const innerShadow = isDark
    ? 'inset 0 1px 0 rgba(255,255,255,0.1)'
    : 'inset 0 1px 0 rgba(255,255,255,0.9)';

  return {
    position: 'relative',
    overflow: 'hidden',
    background: `
      radial-gradient(80% 90% at 105% 35%, ${blob} 0%, transparent 60%),
      radial-gradient(90% 90% at 110% 82%, ${blobSoft} 0%, transparent 65%),
      ${surface}
    `,
    border: `1px solid ${borderGlow}`,
    boxShadow: `
      0 20px 40px -12px ${dropShadow},
      inset -8px 1px 13px ${blob},
      ${innerShadow}
    `,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  };
};

/**
 * Стиль для небольших карточек (компактный)
 */
export const createCompactCardStyle = (isDark: boolean, accentColor: string): CSSProperties => {
  const surface = isDark
    ? 'linear-gradient(180deg, rgba(18,18,22,0.96) 0%, rgba(12,12,16,0.98) 100%)'
    : 'linear-gradient(180deg, rgba(255,255,255,0.94) 0%, rgba(250,250,252,0.96) 100%)';
  
  const blob = isDark ? `${accentColor}35` : `${accentColor}20`;
  const blobSoft = isDark ? `${accentColor}20` : `${accentColor}12`;
  
  const dropShadow = isDark 
    ? 'rgba(0,0,0,0.12)' 
    : 'rgba(0,0,0,0.1)';
  
  const borderGlow = isDark 
    ? 'rgba(255,255,255,0.15)' 
    : 'rgba(0,0,0,0.1)';
  
  const innerShadow = isDark
    ? 'inset 0 1px 0 rgba(255,255,255,0.06)'
    : 'inset 0 1px 0 rgba(255,255,255,0.7)';

  return {
    position: 'relative',
    overflow: 'hidden',
    background: `
      radial-gradient(80% 90% at 105% 35%, ${blob} 0%, transparent 60%),
      radial-gradient(90% 90% at 110% 82%, ${blobSoft} 0%, transparent 65%),
      ${surface}
    `,
    border: `1px solid ${borderGlow}`,
    boxShadow: `
      0 12px 24px -8px ${dropShadow},
      inset -6px 1px 10px ${blob},
      ${innerShadow}
    `,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
  };
};

