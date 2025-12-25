import { useTheme as useNextTheme } from 'next-themes';
import { useEffect, useState } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

export const useTheme = () => {
  const { theme, setTheme, resolvedTheme, systemTheme } = useNextTheme();
  const [mounted, setMounted] = useState(false);

  // Предотвращаем гидратацию мигания
  useEffect(() => {
    setMounted(true);
  }, []);

  // Определяем текущую активную тему (с учетом system)
  const activeTheme = resolvedTheme || systemTheme || 'light';

  // Получаем текущий режим (light/dark/system)
  const currentMode: ThemeMode = (theme as ThemeMode) || 'system';

  const toggleTheme = () => {
    if (currentMode === 'light') {
      setTheme('dark');
    } else if (currentMode === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return {
    theme: currentMode,
    activeTheme, // 'light' или 'dark' (учитывает system)
    setTheme,
    toggleTheme,
    mounted,
    isDark: activeTheme === 'dark',
    isLight: activeTheme === 'light',
    isSystem: currentMode === 'system',
  };
};

