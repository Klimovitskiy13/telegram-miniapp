import { useTheme } from '../../hooks/useTheme';

export const ThemeToggle = () => {
  const { theme, setTheme, activeTheme, mounted } = useTheme();

  // Предотвращаем рендеринг до монтирования (избегаем гидратации)
  if (!mounted) {
    return null;
  }

  const handleToggle = () => {
    if (theme === 'system') {
      setTheme('light');
    } else if (theme === 'light') {
      setTheme('dark');
    } else {
      setTheme('system');
    }
  };

  const getThemeIcon = () => {
    if (theme === 'system') {
      return '🌓'; // System
    }
    return activeTheme === 'dark' ? '🌙' : '☀️';
  };

  const getThemeLabel = () => {
    if (theme === 'system') return 'Системная';
    return activeTheme === 'dark' ? 'Темная' : 'Светлая';
  };

  return (
    <button
      onClick={handleToggle}
      className="px-4 py-2 rounded-lg bg-card border border-border hover:bg-accent/10 transition-colors"
      aria-label="Переключить тему"
    >
      <span className="text-lg mr-2">{getThemeIcon()}</span>
      <span className="text-sm font-medium text-foreground">{getThemeLabel()}</span>
    </button>
  );
};

