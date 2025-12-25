/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Основные цвета
        background: 'hsl(var(--background))',
        'background-alt': 'hsl(var(--background-alt))',
        foreground: 'hsl(var(--foreground))',
        'foreground-alt': 'hsl(var(--foreground-alt))',
        
        // Карточки и поверхности
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
          alt: 'hsl(var(--card-alt))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        
        // Акценты
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          light: 'hsl(var(--accent-light))',
          lighter: 'hsl(var(--accent-lighter))',
          onboarding: 'hsl(var(--accent-onboarding))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        
        // Текст
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
          'foreground-tertiary': 'hsl(var(--muted-foreground-tertiary))',
        },
        
        // Специализированные цвета
        activity: 'hsl(var(--activity))',
        nutrition: 'hsl(var(--nutrition))',
        health: 'hsl(var(--health))',
        sleep: 'hsl(var(--sleep))',
        'sleep-dark': 'hsl(var(--sleep-dark))',
        'sleep-special': 'hsl(var(--sleep-special))',
        warning: 'hsl(var(--warning))',
        inactive: 'hsl(var(--inactive))',
        
        // Статусы
        success: 'hsl(var(--success))',
        'warning-status': 'hsl(var(--warning-status))',
        error: 'hsl(var(--error))',
        info: 'hsl(var(--info))',
        
        // Анализ питания
        protein: 'hsl(var(--protein))',
        fat: 'hsl(var(--fat))',
        carbs: 'hsl(var(--carbs))',
        
        // Системные
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
    },
  },
  plugins: [],
}
